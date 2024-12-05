import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { adminStyles } from '../../styles/adminStyles';

export default function WorldsTab() {
    const [worlds, setWorlds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newWorld, setNewWorld] = useState({
        name: '',
        description: '',
        source: '',
        mainThemes: [],
        worldRules: [],
        keyElements: [],
        openingParagraph: '',
        active: true
    });

    useEffect(() => {
        fetchWorlds();
    }, []);

    const fetchWorlds = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch('http://192.168.1.33:8000/story-worlds', {
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
            if (Array.isArray(data)) {
                setWorlds(data);
            } else if (data && typeof data === 'object') {
                console.log('Converting single world to array:', data);
                setWorlds([data]);
            } else {
                console.error('Invalid worlds data:', data);
                setWorlds([]);
            }
        } catch (error) {
            console.error('Error fetching worlds:', error);
            setWorlds([]);
        } finally {
            setLoading(false);
        }
    };

    const saveWorld = async () => {
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
            const data = await response.json();
            setWorlds(prev => [...prev, data]);
            setNewWorld({
                name: '',
                description: '',
                source: '',
                mainThemes: [],
                worldRules: [],
                keyElements: [],
                openingParagraph: '',
                active: true
            });
        } catch (error) {
            console.error('Error saving world:', error);
        }
    };

    const deleteWorld = async (id) => {
        try {
            const token = await AsyncStorage.getItem('token');
            await fetch(`http://192.168.1.33:8000/api/admin/worlds/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setWorlds(prev => prev.filter(world => world._id !== id));
        } catch (error) {
            console.error('Error deleting world:', error);
        }
    };

    const toggleWorldActive = async (world) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`http://192.168.1.33:8000/api/admin/worlds/${world._id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ...world, active: !world.active })
            });
            const updatedWorld = await response.json();
            setWorlds(prev => prev.map(w => w._id === world._id ? updatedWorld : w));
        } catch (error) {
            console.error('Error toggling world active state:', error);
        }
    };

    const addKeyElement = () => {
        setNewWorld(prev => ({
            ...prev,
            keyElements: [...prev.keyElements, { name: '', description: '' }]
        }));
    };

    const updateKeyElement = (index, field, value) => {
        setNewWorld(prev => {
            const updatedElements = [...prev.keyElements];
            updatedElements[index] = {
                ...updatedElements[index],
                [field]: value
            };
            return { ...prev, keyElements: updatedElements };
        });
    };

    if (loading) {
        return (
            <View style={adminStyles.container}>
                <Text>Loading story worlds...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={adminStyles.container}>
            <View style={adminStyles.addSection}>
                <Text style={adminStyles.sectionTitle}>Create New Story World</Text>
                <TextInput
                    style={adminStyles.input}
                    placeholder="World Name"
                    value={newWorld.name}
                    onChangeText={text => setNewWorld(prev => ({...prev, name: text}))}
                />
                <TextInput
                    style={[adminStyles.input, adminStyles.textArea]}
                    placeholder="Description"
                    value={newWorld.description}
                    onChangeText={text => setNewWorld(prev => ({...prev, description: text}))}
                    multiline
                />
                <TextInput
                    style={adminStyles.input}
                    placeholder="Source"
                    value={newWorld.source}
                    onChangeText={text => setNewWorld(prev => ({...prev, source: text}))}
                />
                <TextInput
                    style={[adminStyles.input, adminStyles.textArea]}
                    placeholder="Main Themes (comma separated)"
                    value={newWorld.mainThemes.join(', ')}
                    onChangeText={text => setNewWorld(prev => ({...prev, mainThemes: text.split(',').map(t => t.trim())}))}
                    multiline
                />
                <TextInput
                    style={[adminStyles.input, adminStyles.textArea]}
                    placeholder="World Rules (comma separated)"
                    value={newWorld.worldRules.join(', ')}
                    onChangeText={text => setNewWorld(prev => ({...prev, worldRules: text.split(',').map(r => r.trim())}))}
                    multiline
                />

                <Text style={adminStyles.subTitle}>Key Elements</Text>
                {newWorld.keyElements.map((element, index) => (
                    <View key={index} style={adminStyles.card}>
                        <TextInput
                            style={adminStyles.input}
                            placeholder="Element Name"
                            value={element.name}
                            onChangeText={text => updateKeyElement(index, 'name', text)}
                        />
                        <TextInput
                            style={[adminStyles.input, adminStyles.textArea]}
                            placeholder="Element Description"
                            value={element.description}
                            onChangeText={text => updateKeyElement(index, 'description', text)}
                            multiline
                        />
                    </View>
                ))}
                <TouchableOpacity style={adminStyles.button} onPress={addKeyElement}>
                    <Text style={adminStyles.buttonText}>Add Key Element</Text>
                </TouchableOpacity>

                <TouchableOpacity style={adminStyles.button} onPress={saveWorld}>
                    <Text style={adminStyles.buttonText}>Create World</Text>
                </TouchableOpacity>
            </View>

            <View style={adminStyles.listSection}>
                <Text style={adminStyles.sectionTitle}>Story Worlds</Text>
                {worlds.map(world => (
                    <View key={world._id} style={adminStyles.card}>
                        <Text style={adminStyles.cardName}>{world.name}</Text>
                        <View style={adminStyles.cardDescription}>
                            <Text style={adminStyles.labelText}>Description</Text>
                            <Text style={adminStyles.cardValue}>{world.description}</Text>
                        </View>
                        <View style={adminStyles.cardDescription}>
                            <Text style={adminStyles.labelText}>Source</Text>
                            <Text style={adminStyles.cardValue}>{world.source}</Text>
                        </View>
                        <View style={adminStyles.cardDescription}>
                            <Text style={adminStyles.labelText}>Main Themes</Text>
                            <Text style={adminStyles.cardValue}>{world.mainThemes.join(', ')}</Text>
                        </View>
                        <View style={adminStyles.cardDescription}>
                            <Text style={adminStyles.labelText}>World Rules</Text>
                            <Text style={adminStyles.cardValue}>{world.worldRules.join(', ')}</Text>
                        </View>
                        
                        <View style={adminStyles.cardActions}>
                            <TouchableOpacity 
                                style={[adminStyles.button, adminStyles.deleteButton]}
                                onPress={() => deleteWorld(world._id)}
                            >
                                <Text style={adminStyles.buttonText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
} 