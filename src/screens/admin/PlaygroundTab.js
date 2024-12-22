import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Picker, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';


const groupByCategory = (items) => {
    return items.reduce((groups, item) => {
        const category = item.category || 'Uncategorized';
        if (!groups[category]) {
            groups[category] = [];
        }
        groups[category].push(item);
        return groups;
    }, {});
};

export default function PlaygroundTab() {
    const [testUsers, setTestUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState([]);
    const [wordCount, setWordCount] = useState('250');
    const [selectedSettings, setSelectedSettings] = useState(null);
    const [numberOfDays, setNumberOfDays] = useState('7');
    const [generatedStories, setGeneratedStories] = useState([]);
    const [userEvents, setUserEvents] = useState([]);
    const [plots, setPlots] = useState([]);
    const [worlds, setWorlds] = useState([]);
    const [selectedPlot, setSelectedPlot] = useState(null);
    const [selectedWorld, setSelectedWorld] = useState(null);
    const [eventInfluenceLevel, setEventInfluenceLevel] = useState('moderate');
    const [pollingInterval, setPollingInterval] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [generatingAdmin, setGeneratingAdmin] = useState(false);
    const [newWorld, setNewWorld] = useState({
        name: '',
        source: '',
        description: '',
        openingParagraph: '',
        mainThemes: [],
        worldRules: [],
        keyElements: []
    });

    useEffect(() => {
        fetchTestUsers();
        fetchAvailableParameters();
    }, []);

    const fetchTestUsers = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch('http://192.168.1.33:8000/api/admin/test-users/', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            
            if (Array.isArray(data)) {
                setTestUsers(data);
            } else if (data && typeof data === 'object') {
                setTestUsers([data]);
            } else {
                console.error('Invalid test users data:', data);
                setTestUsers([]);
            }
        } catch (error) {
            console.error('Error fetching test users:', error);
            setTestUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableParameters = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            
            // Fetch settings
            const settingsResponse = await fetch('http://192.168.1.33:8000/story-settings', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const settings = await settingsResponse.json();
            setSettings(settings);

            // Fetch plots
            const plotsResponse = await fetch('http://192.168.1.33:8000/story-plots', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const plots = await plotsResponse.json();
            setPlots(plots);

            // Fetch worlds
            const worldsResponse = await fetch('http://192.168.1.33:8000/story-worlds', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const worlds = await worldsResponse.json();
            setWorlds(worlds);

        } catch (error) {
            console.error('Error fetching parameters:', error);
        }
    };

    const fetchUserEvents = async (userId) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`http://192.168.1.33:8000/api/admin/test-users/${userId}/events`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (Array.isArray(data)) {
                setUserEvents(data);
            } else {
                console.error('Invalid events data:', data);
                setUserEvents([]);
            }
        } catch (error) {
            console.error('Error fetching user events:', error);
            setUserEvents([]);
        }
    };

    const handleUserSelect = (user) => {
        if (selectedUser?._id === user._id) {
            setSelectedUser(null);
            setUserEvents([]);
        } else {
            setSelectedUser(user);
            setEventInfluenceLevel(user.eventInfluenceLevel);
            fetchUserEvents(user._id);
        }
    };

    const handleInfluenceLevelChange = async (itemValue) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`http://192.168.1.33:8000/api/admin/test-users/${selectedUser._id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ eventInfluenceLevel: itemValue })
            });

            if (!response.ok) {
                throw new Error('Failed to update event influence level');
            }

            const data = await response.json();
            setSelectedUser(data);
            setEventInfluenceLevel(itemValue);
        } catch (error) {
            alert(`Error updating event influence level: ${error.message}`);
        }
    };

    // Function to fetch story updates
    const fetchStoryUpdates = async (threadId) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`http://192.168.1.33:8000/api/stories/thread/${threadId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const stories = await response.json();
            
            // Update stories only when all are generated
            const allGenerated = stories.every(story => story.status === 'generated');
            if (allGenerated) {
                setGeneratedStories(stories);
                // Stop polling when all stories are generated
                if (pollingInterval) {
                    clearInterval(pollingInterval);
                    setPollingInterval(null);
                }
            }
        } catch (error) {
            console.error('Error fetching story updates:', error);
        }
    };

    const generateStories = async () => {
        try {
            setGenerating(true);
            setGeneratedStories([]);
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`http://192.168.1.33:8000/api/admin/generate-stories`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: selectedUser._id,
                    numberOfDays: parseInt(numberOfDays),
                    storySettingsId: selectedSettings,
                    storyWorldId: selectedWorld,
                    eventInfluenceLevel
                })
            });

            if (!response.ok) {
                throw new Error('Failed to generate stories');
            }

            const data = await response.json();
            setGeneratedStories(data.stories);
        } catch (error) {
            console.error('Error generating stories:', error);
            Alert.alert('Error', error.message);
        } finally {
            setGenerating(false);
        }
    };

    const resetTestUsers = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            const response = await fetch('http://192.168.1.33:8000/api/admin/test-users/reset', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            setTestUsers(data);
            setSelectedUser(null); // Reset selection
        } catch (error) {
            console.error('Error resetting test users:', error);
            alert('Failed to reset test users');
        } finally {
            setLoading(false);
        }
    };

    // Clean up polling on unmount
    useEffect(() => {
        return () => {
            if (pollingInterval) {
                clearInterval(pollingInterval);
            }
        };
    }, [pollingInterval]);

    const createWorld = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch('http://192.168.1.33:8000/story-worlds', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newWorld)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create world');
            }

            const world = await response.json();
            setWorlds([...worlds, world]);
            setNewWorld({
                name: '',
                source: '',
                description: '',
                openingParagraph: '',
                mainThemes: [],
                worldRules: [],
                keyElements: []
            });
        } catch (error) {
            console.error('Error creating world:', error);
            alert(error.message);
        }
    };

    const updateTestUser = async (updates) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`http://192.168.1.33:8000/api/admin/test-users/${selectedUser._id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...updates,
                    numberOfWords: parseInt(wordCount) || 250
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update test user');
            }

            const updatedUser = await response.json();
            setSelectedUser(updatedUser);
        } catch (error) {
            console.error('Error updating test user:', error);
            Alert.alert('Error', error.message);
        }
    };

    const generateAdminStory = async () => {
        try {
            console.log('Starting admin story generation...');
            setGeneratingAdmin(true);
            const token = await AsyncStorage.getItem('token');
            console.log('Got token, making API request...');
            const response = await fetch(`http://192.168.1.33:8000/api/admin/generate-admin-daily-story`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('API Response status:', response.status);
            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Error:', errorData);
                throw new Error('Failed to generate admin story');
            }

            const data = await response.json();
            console.log('Received story data:', data);
            setGeneratedStories([data.story]); // Show the single generated story
        } catch (error) {
            console.error('Error generating admin story:', error);
            Alert.alert('Error', error.message);
        } finally {
            setGeneratingAdmin(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <Text>Loading...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                {/* Admin Story Generation */}
                <View style={styles.adminSection}>
                    <Text style={styles.sectionTitle}>Admin Story Generation</Text>
                    <TouchableOpacity
                        style={[
                            styles.adminButton,
                            generatingAdmin && styles.generateButtonDisabled
                        ]}
                        onPress={generateAdminStory}
                        disabled={generatingAdmin}
                    >
                        <Text style={styles.adminButtonText}>
                            {generatingAdmin ? 'Generating Admin Story...' : 'Generate Admin Story'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>Story Generation</Text>
                <View style={styles.section}>
                    <View style={styles.headerSection}>
                        <Text style={styles.sectionTitle}>Story Generation</Text>
                        <TouchableOpacity 
                            style={[styles.button, styles.resetButton]}
                            onPress={resetTestUsers}
                        >
                            <Text style={styles.buttonText}>Reset Users</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Filter chips section */}
                    <View style={styles.filterSection}>
                        <Text style={styles.filterTitle}>Test Users</Text>
                        <View style={styles.chipContainer}>
                            {testUsers.map(user => (
                                <TouchableOpacity
                                    key={user._id}
                                    style={[styles.chip, selectedUser?._id === user._id && styles.chipActive]}
                                    onPress={() => handleUserSelect(user)}
                                >
                                    <Text style={[styles.chipText, selectedUser?._id === user._id && styles.chipTextActive]}>
                                        {user.name.split(' ')[0]}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.filterTitle}>Story Plots</Text>
                        <View style={styles.chipContainer}>
                            {plots.map(plot => (
                                <TouchableOpacity
                                    key={plot._id}
                                    style={[styles.chip, selectedPlot?._id === plot._id && styles.chipActive]}
                                    onPress={() => setSelectedPlot(selectedPlot?._id === plot._id ? null : plot)}
                                >
                                    <Text style={[styles.chipText, selectedPlot?._id === plot._id && styles.chipTextActive]}>
                                        {plot.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.filterTitle}>Story Worlds</Text>
                        {Object.entries(groupByCategory(worlds)).map(([category, categoryWorlds]) => (
                            <View key={category}>
                                <Text style={styles.categorySubtitle}>{category}</Text>
                                <View style={styles.chipContainer}>
                                    {categoryWorlds.map(world => (
                                        <TouchableOpacity
                                            key={world._id}
                                            style={[styles.chip, selectedWorld?._id === world._id && styles.chipActive]}
                                            onPress={() => setSelectedWorld(selectedWorld?._id === world._id ? null : world)}
                                        >
                                            <Text style={[styles.chipText, selectedWorld?._id === world._id && styles.chipTextActive]}>
                                                {world.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        ))}

                        <Text style={styles.filterTitle}>Story Settings</Text>
                        <View style={styles.chipContainer}>
                            {settings.map(setting => (
                                <TouchableOpacity
                                    key={setting._id}
                                    style={[styles.chip, selectedSettings?._id === setting._id && styles.chipActive]}
                                    onPress={() => setSelectedSettings(selectedSettings?._id === setting._id ? null : setting)}
                                >
                                    <Text style={[styles.chipText, selectedSettings?._id === setting._id && styles.chipTextActive]}>
                                        {setting.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* User Events Section */}
                    {selectedUser && (
                        <View style={styles.eventsSection}>
                            <Text style={styles.sectionTitle}>User Events</Text>
                            <ScrollView style={styles.eventsList}>
                                {userEvents.map(event => (
                                    <View key={event._id} style={styles.eventCard}>
                                        <Text style={styles.eventTitle}>{event.summary}</Text>
                                        <Text style={styles.eventTime}>
                                            {new Date(event.start.dateTime).toLocaleTimeString()} - 
                                            {new Date(event.end.dateTime).toLocaleTimeString()}
                                        </Text>
                                        {event.location && (
                                            <Text style={styles.eventLocation}>📍 {event.location}</Text>
                                        )}
                                        {event.description && (
                                            <Text style={styles.eventDescription}>{event.description}</Text>
                                        )}
                                    </View>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Story Generation Controls */}
                    <View style={styles.generationControls}>
                        <TextInput
                            style={styles.input}
                            placeholder="Number of days"
                            value={numberOfDays}
                            onChangeText={setNumberOfDays}
                            keyboardType="numeric"
                        />

                        {/* Story Length Selection */}
                        <View style={styles.influenceSelector}>
                            <Text style={styles.influenceLabel}>Story Length:</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Number of words (e.g., 250)"
                                value={wordCount}
                                onChangeText={setWordCount}
                                keyboardType="numeric"
                            />
                        </View>

                        {/* Event Influence Level */}
                        <View style={styles.influenceSelector}>
                            <Text style={styles.influenceLabel}>Event Influence:</Text>
                            <View style={styles.chipContainer}>
                                {['minimal', 'moderate', 'strong'].map(level => (
                                    <TouchableOpacity
                                        key={level}
                                        style={[
                                            styles.chip,
                                            eventInfluenceLevel === level && styles.chipActive
                                        ]}
                                        onPress={() => {
                                            setEventInfluenceLevel(level);
                                            if (selectedUser) {
                                                handleInfluenceLevelChange(level);
                                            }
                                        }}
                                    >
                                        <Text style={[
                                            styles.chipText,
                                            eventInfluenceLevel === level && styles.chipTextActive
                                        ]}>
                                            {level.charAt(0).toUpperCase() + level.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>



                        {/* Generate Stories Button */}
                        <TouchableOpacity
                            style={[
                                styles.generateButton,
                                (!selectedUser || generating) && styles.generateButtonDisabled
                            ]}
                            onPress={generateStories}
                            disabled={!selectedUser || generating}
                        >
                            <Text style={styles.generateButtonText}>
                                {generating ? 'Generating...' : 'Generate Stories'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Generated Stories */}
                    {generatedStories.length > 0 && (
                        <View style={styles.storiesContainer}>
                            <Text style={styles.sectionTitle}>Generated Stories</Text>
                            {generatedStories.map((story, index) => (
                                <View key={story._id} style={styles.storyCard}>
                                    <View style={styles.storyHeader}>
                                        <Text style={styles.dayNumber}>Day {story.dayNumber}</Text>
                                        <Text style={styles.worldName}>
                                            {story.storyWorldId?.name || 'Unknown World'}
                                        </Text>
                                    </View>
                                    <Text style={styles.plotName}>
                                        Plot: {story.storyPlotId?.name || 'Unknown Plot'}
                                    </Text>
                                    <Text style={styles.storyContent}>{story.content}</Text>
                                    {story.events?.length > 0 && (
                                        <View style={styles.eventsContainer}>
                                            <Text style={styles.eventsTitle}>Events:</Text>
                                            {story.events.map((event, i) => (
                                                <Text key={i} style={styles.eventItem}>
                                                    • {event.summary}
                                                </Text>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            ))}
                        </View>
                    )}

                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    filterSection: {
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 15,
    },
    filterTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#666',
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 10,
    },
    chip: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 16,
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 4,
    },
    chipActive: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    chipText: {
        fontSize: 12,
        color: '#666',
    },
    chipTextActive: {
        color: '#fff',
    },
    eventsSection: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    eventsList: {
        maxHeight: 200,
    },
    eventCard: {
        padding: 10,
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 10,
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    eventTime: {
        fontSize: 12,
        color: '#666',
    },
    eventLocation: {
        fontSize: 12,
        color: '#666',
        marginBottom: 5,
    },
    eventDescription: {
        fontSize: 12,
        color: '#666',
    },
    generationControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    input: {
        width: '40%',
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        marginRight: 10,
    },
    generateButton: {
        padding: 10,
        borderRadius: 8,
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
    },
    generateButtonDisabled: {
        backgroundColor: '#ccc',
    },
    generateButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    storiesContainer: {
        marginTop: 20,
        padding: 15,
    },
    storyCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    storyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    dayNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    worldName: {
        fontSize: 16,
        color: '#666',
        fontStyle: 'italic',
    },
    plotName: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
    },
    storyContent: {
        fontSize: 16,
        lineHeight: 24,
        color: '#333',
        marginBottom: 15,
    },
    eventsContainer: {
        backgroundColor: '#f5f5f5',
        padding: 10,
        borderRadius: 8,
    },
    eventsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#444',
    },
    eventItem: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    categorySubtitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginTop: 10,
        marginBottom: 5,
        paddingLeft: 5,
        borderLeftWidth: 3,
        borderLeftColor: '#007AFF',
    },
    influenceSelector: {
        marginBottom: 10,
    },
    influenceLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#666',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
        fontSize: 16,
    },
    description: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    adminSection: {
        marginBottom: 20,
        padding: 15,
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    adminButton: {
        backgroundColor: '#28a745',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    adminButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
}); 