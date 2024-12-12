import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const formatEventTime = (event) => {
    if (!event || !event.start) return 'Time not available';
    
    const eventTime = event.start.dateTime || event.start.date;
    if (!eventTime) return 'Time not available';
    
    return new Date(eventTime).toLocaleString();
};

export default function StoryReadingScreen({ route, navigation }) {
    const { storyId } = route.params;
    const [story, setStory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStory();
    }, [storyId]);

    const fetchStory = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`http://192.168.1.33:8000/stories/${storyId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch story');
            }

            const data = await response.json();
            setStory(data);
        } catch (error) {
            console.error('Error fetching story:', error);
            setError('Failed to load story');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.storyContainer}>
                <Text style={styles.title}>{story.title || 'Untitled Story'}</Text>
                <Text style={styles.date}>
                    {story.createdAt ? new Date(story.createdAt).toLocaleDateString() : 'Date not available'}
                </Text>
                
                <View style={styles.worldInfo}>
                    <Text style={styles.worldTitle}>
                        World: {story.world?.name || 'Unknown'}
                    </Text>
                    <Text style={styles.worldCategory}>
                        Category: {story.world?.category || 'Unknown'}
                    </Text>
                </View>

                <Text style={styles.content}>{story.content || 'No content available'}</Text>

                {story.events && story.events.length > 0 && (
                    <View style={styles.eventsSection}>
                        <Text style={styles.eventsSectionTitle}>Events that inspired this story:</Text>
                        {story.events.map((event, index) => (
                            <View key={index} style={styles.eventCard}>
                                <Text style={styles.eventTitle}>
                                    {event.summary || 'Untitled Event'}
                                </Text>
                                <Text style={styles.eventTime}>
                                    {formatEventTime(event)}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        color: 'red',
        fontSize: 16,
        textAlign: 'center',
    },
    storyContainer: {
        padding: 20,
        backgroundColor: '#fff',
        margin: 10,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    date: {
        fontSize: 14,
        color: '#666',
        marginBottom: 15,
    },
    worldInfo: {
        backgroundColor: '#f8f8f8',
        padding: 15,
        borderRadius: 8,
        marginBottom: 20,
    },
    worldTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#444',
    },
    worldCategory: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
    content: {
        fontSize: 16,
        lineHeight: 24,
        color: '#333',
        marginBottom: 20,
    },
    eventsSection: {
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 20,
    },
    eventsSectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 15,
        color: '#333',
    },
    eventCard: {
        backgroundColor: '#f8f8f8',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#444',
    },
    eventTime: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
}); 