import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function StoriesScreen() {
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStories();
    }, []);

    const fetchStories = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch('http://192.168.1.33:8000/stories/all', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            setStories(data);
        } catch (error) {
            console.error('Error fetching stories:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <Text>Loading stories...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {stories.map((story, index) => (
                <View key={story._id || index} style={styles.storyCard}>
                    <Text style={styles.storyDate}>
                        Day {story.dayNumber} - {formatDate(story.createdAt)}
                    </Text>
                    <Text style={styles.storyContent}>
                        {story.content?.substring(0, 150)}...
                    </Text>
                </View>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 15,
    },
    storyCard: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    storyDate: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    storyContent: {
        fontSize: 16,
        color: '#333',
    },
}); 