import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { adminStyles } from '../../styles/adminStyles';

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
        setSelectedUser(user);
        fetchUserEvents(user._id);
    };

    const generateStories = async () => {
        if (!selectedUser || !selectedSettings) {
            alert('Please select a user and settings first');
            return;
        }

        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            const stories = [];

            // Generate stories one by one
            for (let i = 0; i < parseInt(numberOfDays); i++) {
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
                        dayNumber: i + 1
                    })
                });
                const data = await response.json();
                if (data.story) {
                    stories.push({ ...data.story, dayNumber: i + 1 });
                }
            }
            setGeneratedStories(stories);
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

    if (loading) {
        return (
            <View style={adminStyles.container}>
                <Text>Loading...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={adminStyles.container}>
            <View style={adminStyles.section}>
                <View style={adminStyles.headerSection}>
                    <Text style={adminStyles.sectionTitle}>Test Users</Text>
                    <TouchableOpacity 
                        style={[adminStyles.button, adminStyles.resetButton]}
                        onPress={resetTestUsers}
                    >
                        <Text style={adminStyles.buttonText}>Reset Test Users</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView horizontal style={adminStyles.userList}>
                    {Array.isArray(testUsers) && testUsers.map(user => (
                        <TouchableOpacity
                            key={user._id}
                            style={[
                                adminStyles.userCard,
                                selectedUser?._id === user._id && adminStyles.selectedCard
                            ]}
                            onPress={() => handleUserSelect(user)}
                        >
                            <Text style={adminStyles.userName}>{user.name}</Text>
                            <Text style={adminStyles.userEmail}>{user.email}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {selectedUser && userEvents.length > 0 && (
                    <View style={adminStyles.section}>
                        <Text style={adminStyles.sectionTitle}>User Events</Text>
                        <ScrollView style={adminStyles.eventsList}>
                            {userEvents.map(event => (
                                <View key={event._id} style={adminStyles.eventCard}>
                                    <Text style={adminStyles.eventTitle}>{event.summary}</Text>
                                    <Text style={adminStyles.eventTime}>
                                        {new Date(event.start.dateTime).toLocaleString()}
                                    </Text>
                                    <Text style={adminStyles.eventLocation}>{event.location}</Text>
                                    <Text style={adminStyles.eventDescription}>{event.description}</Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                <Text style={adminStyles.sectionTitle}>Story World</Text>
                <ScrollView horizontal style={adminStyles.settingsList}>
                    {worlds.map(world => (
                        <TouchableOpacity
                            key={world._id}
                            style={[
                                adminStyles.settingCard,
                                selectedWorld?._id === world._id && adminStyles.selectedCard
                            ]}
                            onPress={() => setSelectedWorld(world)}
                        >
                            <Text style={adminStyles.settingName}>{world.name}</Text>
                            <Text style={adminStyles.settingDetail}>{world.description}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <Text style={adminStyles.sectionTitle}>Story Plot</Text>
                <ScrollView horizontal style={adminStyles.settingsList}>
                    {plots.map(plot => (
                        <TouchableOpacity
                            key={plot._id}
                            style={[
                                adminStyles.settingCard,
                                selectedPlot?._id === plot._id && adminStyles.selectedCard
                            ]}
                            onPress={() => setSelectedPlot(plot)}
                        >
                            <Text style={adminStyles.settingName}>{plot.name}</Text>
                            <Text style={adminStyles.settingDetail}>{plot.description}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <Text style={adminStyles.sectionTitle}>Story Settings</Text>
                <ScrollView horizontal style={adminStyles.settingsList}>
                    {settings.map(setting => (
                        <TouchableOpacity
                            key={setting._id}
                            style={[
                                adminStyles.settingCard,
                                selectedSettings?._id === setting._id && adminStyles.selectedCard
                            ]}
                            onPress={() => setSelectedSettings(setting)}
                        >
                            <Text style={adminStyles.settingName}>{setting.name}</Text>
                            <Text style={adminStyles.settingDetail}>
                                Model: {setting.model}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <Text style={adminStyles.sectionTitle}>Generate Stories</Text>
                <TextInput
                    style={adminStyles.input}
                    placeholder="Number of days"
                    value={numberOfDays}
                    onChangeText={setNumberOfDays}
                    keyboardType="numeric"
                />

                <TouchableOpacity 
                    style={adminStyles.button}
                    onPress={generateStories}
                    disabled={!selectedUser || !selectedSettings}
                >
                    <Text style={adminStyles.buttonText}>Generate Stories</Text>
                </TouchableOpacity>

                {generatedStories.length > 0 && (
                    <View style={adminStyles.storiesList}>
                        <Text style={adminStyles.sectionTitle}>Generated Stories</Text>
                        {generatedStories.map((story, index) => (
                            <View key={story._id || index} style={adminStyles.storyCard}>
                                <Text style={adminStyles.storyDay}>Day {story.dayNumber}</Text>
                                <Text style={adminStyles.storyContent}>{story.content}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        </ScrollView>
    );
} 