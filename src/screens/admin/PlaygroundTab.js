import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PlaygroundTab() {
    const [fakeUsers, setFakeUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [settings, setSettings] = useState([]);
    const [worlds, setWorlds] = useState([]);
    const [plots, setPlots] = useState([]);
    const [numberOfDays, setNumberOfDays] = useState('1');
    const [selectedSettings, setSelectedSettings] = useState({
        world: null,
        plot: null,
        setting: null
    });
    const [generatedStories, setGeneratedStories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedWorld, setSelectedWorld] = useState(null);
    const [selectedPlot, setSelectedPlot] = useState(null);
    const [selectedSetting, setSelectedSetting] = useState(null);

    useEffect(() => {
        fetchFakeUsers();
        fetchAvailableParameters();
    }, []);

    const fetchFakeUsers = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch('http://192.168.1.33:8000/story-plots', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                console.error('Response status:', response.status);
                const text = await response.text();
                console.error('Response body:', text);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            setFakeUsers(data);
        } catch (error) {
            console.error('Error fetching fake users:', error);
        }
    };

    const seedNewPersonas = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            const response = await fetch('http://192.168.1.33:8000/api/admin/reset-test-users', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            console.log('New personas created:', data);
            // Refresh fake users list
            await fetchFakeUsers();
        } catch (error) {
            console.error('Error seeding personas:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateStoriesForDays = async () => {
        if (!selectedUser) {
            console.error('No user selected');
            return;
        }

        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`http://192.168.1.33:8000/api/admin/generate-stories/${selectedUser._id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    days: parseInt(numberOfDays),
                    settings: selectedSettings
                })
            });
            const data = await response.json();
            setGeneratedStories(data.stories);
        } catch (error) {
            console.error('Error generating stories:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableParameters = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            
            // Updated settings fetch
            const response = await fetch('http://192.168.1.33:8000/story-settings', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                console.error('Settings response:', await response.text());
                throw new Error('Settings fetch failed: ' + response.status);
            }
            
            const settings = await response.json();
            if (!Array.isArray(settings)) {
                console.error('Settings is not an array:', settings);
                setSettings([]);
            } else {
                setSettings(settings);
            }
            
            // Keep the rest of the function the same (worlds and plots fetch)
            const worldsResponse = await fetch('http://192.168.1.33:8000/story-worlds', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const worlds = await worldsResponse.json();
            
            const plotsResponse = await fetch('http://192.168.1.33:8000/story-plots', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const plots = await plotsResponse.json();
            
            setWorlds(worlds);
            setPlots(plots);
        } catch (error) {
            console.error('Error fetching parameters:', error);
            setSettings([]);
            setWorlds([]);
            setPlots([]);
        }
    };

    const ParameterSelection = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Story Parameters</Text>
            
            {/* World Selection */}
            <View style={styles.parameterGroup}>
                <Text style={styles.parameterLabel}>Story World</Text>
                <ScrollView horizontal style={styles.optionsList}>
                    {Array.isArray(worlds) && worlds.map(world => (
                        <TouchableOpacity 
                            key={world._id}
                            style={[
                                styles.optionCard,
                                selectedWorld?._id === world._id && styles.selectedOption
                            ]}
                            onPress={() => {
                                setSelectedWorld(world);
                                setSelectedSettings(prev => ({...prev, world: world._id}));
                            }}
                        >
                            <Text style={styles.optionTitle}>{world.name}</Text>
                            <Text style={styles.optionDetail}>Genre: {world.genre}</Text>
                            <Text style={styles.optionDetail}>
                                Themes: {world.themes?.join(', ')}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Settings Selection */}
            <View style={styles.parameterGroup}>
                <Text style={styles.parameterLabel}>Story Settings</Text>
                <ScrollView horizontal style={styles.optionsList}>
                    {Array.isArray(settings) && settings.map(setting => (
                        <TouchableOpacity 
                            key={setting._id}
                            style={[
                                styles.optionCard,
                                selectedSetting?._id === setting._id && styles.selectedOption
                            ]}
                            onPress={() => {
                                setSelectedSetting(setting);
                                setSelectedSettings(prev => ({...prev, setting: setting._id}));
                            }}
                        >
                            <Text style={styles.optionTitle}>{setting.name}</Text>
                            <Text style={styles.optionDetail}>{setting.description}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Plot Selection */}
            <View style={styles.parameterGroup}>
                <Text style={styles.parameterLabel}>Story Plot</Text>
                <ScrollView horizontal style={styles.optionsList}>
                    {Array.isArray(plots) && plots.map(plot => (
                        <TouchableOpacity 
                            key={plot._id}
                            style={[
                                styles.optionCard,
                                selectedPlot?._id === plot._id && styles.selectedOption
                            ]}
                            onPress={() => {
                                setSelectedPlot(plot);
                                setSelectedSettings(prev => ({...prev, plot: plot._id}));
                            }}
                        >
                            <Text style={styles.optionTitle}>{plot.name}</Text>
                            <Text style={styles.optionDetail}>Type: {plot.type}</Text>
                            <Text style={styles.optionDetail}>
                                Conflict: {plot.mainConflict}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </View>
    );

    return (
        <ScrollView style={styles.container}>
            {/* Persona Management */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Persona Management</Text>
                <TouchableOpacity 
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={seedNewPersonas}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>
                        {loading ? 'Creating Personas...' : 'Generate New Personas'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* User Selection */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Select Test User</Text>
                <ScrollView horizontal style={styles.usersList}>
                    {fakeUsers.map(user => (
                        <TouchableOpacity 
                            key={user._id}
                            style={[
                                styles.userCard,
                                selectedUser?._id === user._id && styles.selectedUser
                            ]}
                            onPress={() => setSelectedUser(user)}
                        >
                            <Text style={styles.userName}>{user.name}</Text>
                            <Text style={styles.userEmail}>{user.email}</Text>
                            <Text style={styles.userPersona}>{user.persona}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Add Parameter Selection */}
            <ParameterSelection />

            {/* Story Generation */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Story Generation</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Number of days to generate"
                    value={numberOfDays}
                    onChangeText={setNumberOfDays}
                    keyboardType="numeric"
                />
                <TouchableOpacity 
                    style={[
                        styles.button, 
                        (!selectedUser || !selectedWorld || !selectedPlot || loading) && styles.buttonDisabled
                    ]}
                    onPress={generateStoriesForDays}
                    disabled={!selectedUser || !selectedWorld || !selectedPlot || loading}
                >
                    <Text style={styles.buttonText}>
                        {loading ? 'Generating...' : `Generate ${numberOfDays} Days of Stories`}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Generated Stories */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Generated Stories</Text>
                {generatedStories.map((story, index) => (
                    <View key={index} style={styles.storyCard}>
                        <Text style={styles.storyDay}>Day {story.dayNumber}</Text>
                        <Text style={styles.storyContent}>{story.content}</Text>
                        <Text style={styles.storyMeta}>
                            Generated: {new Date(story.createdAt).toLocaleString()}
                        </Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    section: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    usersList: {
        flexDirection: 'row',
        marginBottom: 15,
    },
    userCard: {
        backgroundColor: '#f5f5f5',
        padding: 15,
        borderRadius: 8,
        marginRight: 10,
        minWidth: 200,
    },
    selectedUser: {
        backgroundColor: '#e3f2fd',
        borderWidth: 2,
        borderColor: '#2196f3',
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    userEmail: {
        color: '#666',
        marginBottom: 5,
    },
    userPersona: {
        fontStyle: 'italic',
        color: '#444',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 4,
        padding: 10,
        marginBottom: 10,
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 4,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
    },
    buttonText: {
        color: '#fff',
        fontWeight: '500',
    },
    storyCard: {
        backgroundColor: '#f5f5f5',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
    },
    storyDay: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    storyContent: {
        color: '#333',
        marginBottom: 10,
    },
    storyMeta: {
        color: '#666',
        fontSize: 12,
        fontStyle: 'italic',
    },
    parameterGroup: {
        marginBottom: 20,
    },
    parameterLabel: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 10,
    },
    optionsList: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    optionCard: {
        backgroundColor: '#f5f5f5',
        padding: 15,
        borderRadius: 8,
        marginRight: 10,
        minWidth: 200,
        maxWidth: 300,
    },
    selectedOption: {
        backgroundColor: '#e3f2fd',
        borderWidth: 2,
        borderColor: '#2196f3',
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    optionDetail: {
        color: '#666',
        fontSize: 14,
        marginBottom: 3,
    },
}); 