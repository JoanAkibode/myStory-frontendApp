import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { getApiUrl } from '../utils/config';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

export default function EventsScreen() {
    const { user, isReady } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('current');
    const [refreshing, setRefreshing] = useState(false);
    const [syncInProgress, setSyncInProgress] = useState(false);

    // Add focus effect to refresh events when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            if (isReady && user) {
                // Always fetch fresh events when screen comes into focus
                fetchFreshEvents();
            }
        }, [isReady, user])
    );

    useEffect(() => {
        console.log('EventsScreen useEffect - Auth state:', { isReady, hasUser: !!user });
        
        if (!isReady) {
            console.log('Auth not ready yet, waiting...');
            return;
        }

        if (!user) {
            console.log('No user found, stopping events load');
            setError('Please log in to view events');
            setLoading(false);
            return;
        }

        // On initial load, try to load from cache first
        loadEvents();
    }, [isReady, user]);

    const loadEvents = async () => {
        try {
            // 1. First try to load from cache if it's valid
            const cacheValid = await isCacheValid();
            const cachedEvents = await AsyncStorage.getItem('calendar_events');
            
            if (cacheValid && cachedEvents) {
                const parsedEvents = JSON.parse(cachedEvents);
                console.log('Loaded from cache:', parsedEvents.map(event => event.summary));
                setEvents(parsedEvents);
                setLoading(false);
            } else {
                setLoading(true);
            }

            // 2. Then fetch fresh data in background
            await fetchFreshEvents();
        } catch (error) {
            console.error('Error loading events:', error);
            setError(error.message);
            setLoading(false);
        }
    };

    const fetchFreshEvents = async () => {
        try {
            setSyncInProgress(true);
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            
            if (!token) {
                throw new Error('No auth token found');
            }

            console.log('Fetching fresh events...');
            const response = await fetch(`${getApiUrl()}/calendar/events`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Calendar fetch failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorText
                });

                // Handle Google token expiration
                if (response.status === 401 || 
                    (response.status === 400 && errorText.includes('invalid_grant'))) {
                    // Clear all tokens
                    await AsyncStorage.multiRemove([
                        'token',
                        'calendar_events',
                        'calendar_last_sync',
                        'google_access_token',
                        'google_refresh_token'
                    ]);
                    
                    // Show error message and prompt for re-auth
                    Alert.alert(
                        'Session Expired',
                        'Your Google Calendar access has expired. Please log in again to reconnect.',
                        [
                            {
                                text: 'OK',
                                onPress: () => {
                                    // Navigate to Login screen
                                    navigation.reset({
                                        index: 0,
                                        routes: [{ name: 'Login' }],
                                    });
                                }
                            }
                        ]
                    );
                    throw new Error('Google Calendar access expired');
                }
                
                throw new Error(`Failed to fetch events (${response.status})`);
            }
            
            const data = await response.json();
            console.log('Received events data:', {
                eventCount: data.events ? data.events.length : 0,
                firstEvent: data.events && data.events.length > 0 ? {
                    summary: data.events[0].summary,
                    start: data.events[0].start.dateTime
                } : null
            });

            if (!data.events) {
                console.log('No events array in response:', data);
                throw new Error('Invalid response format from server');
            }
            
            // Update cache and state with fresh data
            await AsyncStorage.setItem('calendar_events', JSON.stringify(data.events));
            await AsyncStorage.setItem('calendar_last_sync', new Date().toISOString());
            setEvents(data.events);
            setError(null);
        } catch (error) {
            console.error('Error fetching fresh events:', error);
            setError(error.message || 'Failed to fetch events');
            setEvents([]);
        } finally {
            setLoading(false);
            setSyncInProgress(false);
        }
    };

    const toggleEventStatus = async (eventId) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${getApiUrl()}/calendar/events/${eventId}/toggle`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to toggle event status');
            }

            const { event } = await response.json();
            const updatedEvents = events.map(e => 
                e._id === eventId ? { ...e, active: event.active } : e
            );
            
            // Update both state and cache
            setEvents(updatedEvents);
            await AsyncStorage.setItem('calendar_events', JSON.stringify(updatedEvents));
            
        } catch (error) {
            console.error('Error toggling event:', error);
            Alert.alert('Error', 'Failed to update event status');
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filterEvents = () => {
        if (!Array.isArray(events)) {
            console.error('Events is not an array:', events);
            return { current: [], past: [] };
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const current = events.filter(event => new Date(event.start.dateTime) >= yesterday);
        const past = events.filter(event => new Date(event.start.dateTime) < yesterday);

        console.log('Filtered events:', {
            totalEvents: events.length,
            currentEvents: current.length,
            pastEvents: past.length,
            firstCurrentEvent: current.length > 0 ? {
                summary: current[0].summary,
                start: current[0].start.dateTime
            } : null
        });

        return { current, past };
    };

    const renderEventCard = (event) => (
        <View key={event._id} style={[
            styles.eventCard,
            !event.active && styles.inactiveEvent
        ]}>
            <View style={styles.eventHeader}>
                <Text style={[
                    styles.eventTitle,
                    !event.active && styles.inactiveText
                ]}>
                    {event.summary}
                </Text>
                <TouchableOpacity
                    style={[
                        styles.toggleButton,
                        event.active ? styles.activeButton : styles.inactiveButton
                    ]}
                    onPress={() => toggleEventStatus(event._id)}
                >
                    <Text style={styles.toggleButtonText}>
                        {event.active ? '✓' : '✕'}
                    </Text>
                </TouchableOpacity>
            </View>
            <Text style={[
                styles.eventTime,
                !event.active && styles.inactiveText
            ]}>
                {formatDate(event.start.dateTime)}
            </Text>
            {event.description && (
                <Text style={[
                    styles.eventDescription,
                    !event.active && styles.inactiveText
                ]}>
                    {event.description}
                </Text>
            )}
        </View>
    );

    const handleRefresh = async () => {
        try {
            console.log('Starting refresh...');
            setRefreshing(true);
            
            // Clear the cache to force a fresh fetch
            await AsyncStorage.removeItem('calendar_events');
            await AsyncStorage.removeItem('calendar_last_sync');
            
            // Fetch fresh events
            await fetchFreshEvents();
            
            console.log('Refresh completed successfully');
        } catch (error) {
            console.error('Error during refresh:', error);
            Alert.alert('Error', 'Failed to refresh events. Please try again.');
        } finally {
            setRefreshing(false);
        }
    };

    const isCacheValid = async () => {
        try {
            const lastSync = await AsyncStorage.getItem('calendar_last_sync');
            if (!lastSync) return false;

            const lastSyncTime = new Date(lastSync).getTime();
            const now = new Date().getTime();
            const daysSinceLastSync = (now - lastSyncTime) / (1000 * 60 * 60 * 24);
            
            return daysSinceLastSync < 7; // Cache valid for 1 week
        } catch (error) {
            return false;
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>
                    {error ? `Error: ${error}` : 'Loading events...'}
                </Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={handleRefresh}
                >
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const { current, past } = filterEvents();

    return (
        <View style={styles.container}>
            <View style={styles.tabBar}>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'current' && styles.activeTab]}
                    onPress={() => setActiveTab('current')}
                >
                    <Text style={[styles.tabText, activeTab === 'current' && styles.activeTabText]}>
                        Current
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'past' && styles.activeTab]}
                    onPress={() => setActiveTab('past')}
                >
                    <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>
                        Past
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.refreshButton} 
                    onPress={handleRefresh}
                    disabled={refreshing}
                >
                    {refreshing ? (
                        <ActivityIndicator color="#007AFF" size="small" />
                    ) : (
                        <Ionicons name="reload" size={20} color="#007AFF" />
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView 
                style={styles.eventsList}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                    />
                }
            >
                {activeTab === 'current' ? (
                    current.length === 0 ? (
                        <Text style={styles.noEvents}>No current events</Text>
                    ) : (
                        current.map(renderEventCard)
                    )
                ) : (
                    past.length === 0 ? (
                        <Text style={styles.noEvents}>No past events</Text>
                    ) : (
                        past.map(renderEventCard)
                    )
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    tab: {
        flex: 1,
        paddingVertical: 15,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#007AFF',
    },
    tabText: {
        fontSize: 16,
        color: '#666',
    },
    activeTabText: {
        color: '#007AFF',
        fontWeight: 'bold',
    },
    eventList: {
        flex: 1,
        padding: 15,
    },
    eventCard: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    inactiveEvent: {
        backgroundColor: '#f8f8f8',
        opacity: 0.8,
    },
    eventHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
    },
    inactiveText: {
        color: '#999',
    },
    toggleButton: {
        padding: 8,
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeButton: {
        backgroundColor: '#4CAF50',
    },
    inactiveButton: {
        backgroundColor: '#ff4444',
    },
    toggleButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    eventTime: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    eventDescription: {
        fontSize: 14,
        color: '#333',
    },
    noEvents: {
        textAlign: 'center',
        marginTop: 20,
        color: '#666',
    },
    refreshButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginRight: 10,
    },
    eventsList: {
        flex: 1,
        padding: 15,
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
        textAlign: 'center',
    },
    errorText: {
        color: '#ff4444',
        textAlign: 'center',
        marginBottom: 15,
    },
    retryButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 5,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
}); 