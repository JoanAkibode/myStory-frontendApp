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
        if (!selectedUser || !selectedSettings || loading) {
            alert('Please select a user and settings first');
            return;
        }

        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            
            const response = await fetch('http://192.168.1.33:8000/api/admin/generate-stories', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: selectedUser._id,
                    settingsId: selectedSettings._id,
                    plotId: selectedPlot?._id,
                    worldId: selectedWorld?._id,
                    dayNumber: parseInt(numberOfDays),
                    eventInfluenceLevel
                })
            });

            const data = await response.json();
            if (data.stories) {
                setGeneratedStories(data.stories);
            }
        } catch (error) {
            console.error('Error generating stories:', error);
            alert('Failed to generate stories');
        } finally {
            setLoading(false);
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

    if (loading) {
        return (
            <View style={styles.container}>
                <Text>Loading...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
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

                    <TouchableOpacity 
                        style={[
                            styles.generateButton,
                            (!selectedUser || !selectedSettings) && styles.generateButtonDisabled
                        ]}
                        onPress={generateStories}
                        disabled={!selectedUser || !selectedSettings}
                    >
                        <Text style={styles.generateButtonText}>Generate Stories</Text>
                    </TouchableOpacity>
                </View>

                {/* Generated Stories */}
                {generatedStories.length > 0 && (
                    <View style={styles.storiesList}>
                        <Text style={styles.sectionTitle}>Generated Stories</Text>
                        {generatedStories.map((story, index) => (
                            <View key={story._id || index} style={styles.storyCard}>
                                <Text style={styles.storyDay}>Day {story.dayNumber}</Text>
                                <Text style={styles.storyContent}>{story.content}</Text>
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
    storiesList: {
        marginTop: 20,
    },
    storyCard: {
        padding: 10,
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 10,
    },
    storyDay: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    storyContent: {
        fontSize: 12,
        color: '#666',
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
    }
}); 