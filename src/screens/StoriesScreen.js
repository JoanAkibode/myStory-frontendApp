import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    ScrollView, 
    StyleSheet, 
    TouchableOpacity,
    ActivityIndicator,
    Alert 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';

export default function StoriesScreen({ navigation }) {
    const { signOut } = useAuth();
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [resetting, setResetting] = useState(false);

    useEffect(() => {
        fetchStories();
    }, []);

    const fetchStories = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                console.log('No token found, redirecting to login');
                await signOut();
                navigation.replace('Login');
                return;
            }

            const response = await fetch('http://192.168.1.33:8000/stories/all', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                console.log('Token expired or invalid, redirecting to login');
                await signOut();
                navigation.replace('Login');
                return;
            }

            const data = await response.json();
            setStories(data);
        } catch (error) {
            console.error('Error fetching stories:', error);
            Alert.alert('Error', 'Failed to load stories');
        } finally {
            setLoading(false);
        }
    };

    const generateTodayStory = async () => {
        try {
            setGenerating(true);
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                console.log('No token found, redirecting to login');
                await signOut();
                navigation.replace('Login');
                return;
            }

            const response = await fetch('http://192.168.1.33:8000/stories/generate/daily', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                console.log('Token expired or invalid, redirecting to login');
                await signOut();
                navigation.replace('Login');
                return;
            }

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to generate story');
            }

            const data = await response.json();
            await fetchStories(); // Refresh stories list
            
            // Navigate to the new story
            if (data.story && data.story._id) {
                navigation.navigate('StoryReading', { storyId: data.story._id });
            }
        } catch (error) {
            console.error('Error generating story:', error);
            Alert.alert('Error', error.message);
        } finally {
            setGenerating(false);
        }
    };

    const startNewStory = async () => {
        try {
            setResetting(true);
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                console.log('No token found, redirecting to login');
                await signOut();
                navigation.replace('Login');
                return;
            }

            const response = await fetch('http://192.168.1.33:8000/stories/reset', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                console.log('Token expired or invalid, redirecting to login');
                await signOut();
                navigation.replace('Login');
                return;
            }

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to reset story');
            }

            await fetchStories();
            Alert.alert('Success', 'Ready to start a new story!');
        } catch (error) {
            console.error('Error resetting story:', error);
            Alert.alert('Error', error.message);
        } finally {
            setResetting(false);
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
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.buttonContainer}>
                <TouchableOpacity 
                    style={styles.generateButton}
                    onPress={generateTodayStory}
                    disabled={generating}
                >
                    <Text style={styles.generateButtonText}>
                        {generating ? 'Generating Story...' : "Write Today's Story"}
                    </Text>
                    {generating && (
                        <ActivityIndicator 
                            size="small" 
                            color="#fff" 
                            style={styles.buttonLoader}
                        />
                    )}
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.resetButton, resetting && styles.disabledButton]}
                    onPress={startNewStory}
                    disabled={resetting}
                >
                    <Text style={styles.resetButtonText}>
                        {resetting ? 'Resetting...' : 'Start New Story'}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.storiesList}>
                {stories.map((story, index) => (
                    <TouchableOpacity 
                        key={story._id || index}
                        style={styles.storyCard}
                        onPress={() => navigation.navigate('StoryReading', { storyId: story._id })}
                    >
                        <Text style={styles.storyDate}>
                            Day {story.dayNumber} - {formatDate(story.createdAt)}
                        </Text>
                        <Text style={styles.storyContent}>
                            {story.content?.substring(0, 150)}...
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    generateButton: {
        backgroundColor: '#007AFF',
        margin: 15,
        padding: 15,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    generateButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    buttonLoader: {
        marginLeft: 10,
    },
    storiesList: {
        flex: 1,
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
    buttonContainer: {
        padding: 15,
        gap: 10,
    },
    resetButton: {
        backgroundColor: '#FF3B30',
        padding: 15,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    resetButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    disabledButton: {
        opacity: 0.5,
    },
}); 