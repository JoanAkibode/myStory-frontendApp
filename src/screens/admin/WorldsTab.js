import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
            console.log('Using token:', token);
            
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
            setWorlds(data);
        } catch (error) {
            console.error('Error fetching worlds:', error);
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
            <View style={styles.container}>
                <Text>Loading story worlds...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.addSection}>
                <Text style={styles.sectionTitle}>Create New Story World</Text>
                <TextInput
                    style={styles.input}
                    placeholder="World Name"
                    value={newWorld.name}
                    onChangeText={text => setNewWorld(prev => ({...prev, name: text}))}
                />
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Description"
                    value={newWorld.description}
                    onChangeText={text => setNewWorld(prev => ({...prev, description: text}))}
                    multiline
                />
                <TextInput
                    style={styles.input}
                    placeholder="Source"
                    value={newWorld.source}
                    onChangeText={text => setNewWorld(prev => ({...prev, source: text}))}
                />
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Main Themes (comma separated)"
                    value={newWorld.mainThemes.join(', ')}
                    onChangeText={text => setNewWorld(prev => ({...prev, mainThemes: text.split(',').map(t => t.trim())}))}
                    multiline
                />
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="World Rules (comma separated)"
                    value={newWorld.worldRules.join(', ')}
                    onChangeText={text => setNewWorld(prev => ({...prev, worldRules: text.split(',').map(r => r.trim())}))}
                    multiline
                />

                <Text style={styles.subTitle}>Key Elements</Text>
                {newWorld.keyElements.map((element, index) => (
                    <View key={index} style={styles.keyElementContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Element Name"
                            value={element.name}
                            onChangeText={text => updateKeyElement(index, 'name', text)}
                        />
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Element Description"
                            value={element.description}
                            onChangeText={text => updateKeyElement(index, 'description', text)}
                            multiline
                        />
                    </View>
                ))}
                <TouchableOpacity style={styles.addButton} onPress={addKeyElement}>
                    <Text style={styles.buttonText}>Add Key Element</Text>
                </TouchableOpacity>

                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Opening Paragraph (Template first paragraph to set the writing style)"
                    value={newWorld.openingParagraph}
                    onChangeText={text => setNewWorld(prev => ({...prev, openingParagraph: text}))}
                    multiline
                />
                
                <TouchableOpacity style={styles.button} onPress={saveWorld}>
                    <Text style={styles.buttonText}>Create World</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.listSection}>
                <Text style={styles.sectionTitle}>Story Worlds</Text>
                {worlds.map(world => (
                    <View key={world._id} style={styles.worldCard}>
                        <View style={styles.worldHeader}>
                            <Text style={styles.worldName}>{world.name}</Text>
                            <TouchableOpacity 
                                style={[styles.statusBadge, world.active ? styles.activeBadge : styles.inactiveBadge]}
                                onPress={() => toggleWorldActive(world)}
                            >
                                <Text style={styles.statusText}>
                                    {world.active ? 'Active' : 'Inactive'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.worldDescription}>{world.description}</Text>
                        <Text style={styles.worldMeta}>Source: {world.source}</Text>
                        <Text style={styles.worldMeta}>Main Themes: {world.mainThemes.join(', ')}</Text>
                        <Text style={styles.worldMeta}>World Rules: {world.worldRules.join(', ')}</Text>
                        
                        <Text style={styles.subTitle}>Key Elements:</Text>
                        {world.keyElements.map((element, index) => (
                            <View key={index} style={styles.keyElementDisplay}>
                                <Text style={styles.elementName}>{element.name}</Text>
                                <Text style={styles.elementDescription}>{element.description}</Text>
                            </View>
                        ))}

                        <Text style={styles.subTitle}>Opening Paragraph:</Text>
                        <Text style={styles.openingParagraph}>{world.openingParagraph}</Text>

                        <View style={styles.cardActions}>
                            <TouchableOpacity 
                                style={[styles.button, styles.deleteButton]}
                                onPress={() => deleteWorld(world._id)}
                            >
                                <Text style={styles.buttonText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    // ... existing styles ...
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    worldHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
    },
    activeBadge: {
        backgroundColor: '#4CAF50',
    },
    inactiveBadge: {
        backgroundColor: '#666',
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
    }
}); 