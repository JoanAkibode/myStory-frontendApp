import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function EventsScreen() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('current'); // 'current' or 'past'

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch('http://192.168.1.33:8000/calendar/events', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            setEvents(data.events || []);
        } catch (error) {
            console.error('Error fetching events:', error);
            setError('Failed to load events');
        } finally {
            setLoading(false);
        }
    };

    const toggleEventStatus = async (eventId) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`http://192.168.1.33:8000/calendar/events/${eventId}/toggle`, {
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
            setEvents(prevEvents => 
                prevEvents.map(e => 
                    e._id === eventId ? { ...e, active: event.active } : e
                )
            );
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
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        return {
            current: events.filter(event => new Date(event.start.dateTime) >= yesterday),
            past: events.filter(event => new Date(event.start.dateTime) < yesterday)
        };
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

    if (loading) {
        return (
            <View style={styles.container}>
                <Text>Loading events...</Text>
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
                    <Text style={[
                        styles.tabText,
                        activeTab === 'current' && styles.activeTabText
                    ]}>
                        Current
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'past' && styles.activeTab]}
                    onPress={() => setActiveTab('past')}
                >
                    <Text style={[
                        styles.tabText,
                        activeTab === 'past' && styles.activeTabText
                    ]}>
                        Past
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.eventList}>
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
    }
}); 