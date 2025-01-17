import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    ScrollView, 
    StyleSheet, 
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { getApiUrl } from '../utils/config';

export default function StoriesScreen({ navigation }) {
    const { signOut } = useAuth();
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [lastDeliveryCheck, setLastDeliveryCheck] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchStories();
        // Check for story one minute after delivery time
        const checkAfterDelivery = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                const response = await fetch(`${getApiUrl()}/user/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const user = await response.json();

                if (user?.storyDeliveryTime) {
                    const deliveryTime = new Date();
                    deliveryTime.setHours(user.storyDeliveryTime.hour);
                    deliveryTime.setMinutes(user.storyDeliveryTime.minute + 1);
                    
                    const now = new Date();
                    const timeUntilCheck = deliveryTime - now;
                    
                    if (timeUntilCheck > 0) {
                        setTimeout(() => {
                            checkForTodayStory();
                            fetchStories();
                        }, timeUntilCheck);
                    }
                }
            } catch (error) {
                console.error('Error setting up delivery check:', error);
            }
        };

        checkAfterDelivery();
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

            const response = await fetch(`${getApiUrl()}/stories/all`, {
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

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const parseStoryTitle = (content) => {
        const titleMatch = content?.match(/\*\*Chapter \d+: (.*?)\*\*/);
        return titleMatch ? titleMatch[1] : 'Untitled Chapter';
    };

    const parseStoryContent = (content) => {
        return content?.replace(/\*\*Chapter \d+: .*?\*\*\n\n/, '').trim() || '';
    };

    const checkForTodayStory = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${getApiUrl()}/stories/today`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            
            if (data.status === 'delivered' && (!lastDeliveryCheck || lastDeliveryCheck !== data.story?._id)) {
                // New story delivered since last check
                setLastDeliveryCheck(data.story._id);
                fetchStories();
                Alert.alert('New Story', 'Your daily story has arrived!');
            }
        } catch (error) {
            console.error('Error checking for today\'s story:', error);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await Promise.all([
            fetchStories(),
            checkForTodayStory()
        ]);
        setRefreshing(false);
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
            <View style={styles.refreshContainer}>
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
                style={styles.storiesList} 
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
            >
                {stories.map((story, index) => (
                    <TouchableOpacity 
                        key={story._id || index}
                        style={styles.storyCard}
                        onPress={() => navigation.navigate('StoryReading', { storyId: story._id })}
                    >
                        <View style={styles.storyHeader}>
                            <Text style={styles.storyDate}>
                                {formatDate(story.createdAt)} • Day {story.dayNumber}
                            </Text>
                            <Text style={styles.storyTitle}>{parseStoryTitle(story.content)}</Text>
                        </View>
                        <Text style={styles.storyContent} numberOfLines={3}>
                            {parseStoryContent(story.content)}
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
    },
    storyCard: {
        backgroundColor: '#fff',
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        width: '100%',
    },
    storyHeader: {
        marginBottom: 8,
    },
    storyDate: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
        fontStyle: 'italic',
    },
    storyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    storyContent: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        textAlign: 'justify',
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
    refreshContainer: {
        alignItems: 'center',
        marginBottom: 10,
    },
    refreshButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
}); 