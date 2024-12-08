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
        openingParagraph: '',
        mainThemes: [],
        worldRules: [],
        keyElements: [],
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

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create world');
            }

            const data = await response.json();
            setWorlds(prev => [...prev, data]);
            setNewWorld({
                name: '',
                description: '',
                source: '',
                openingParagraph: '',
                mainThemes: [],
                worldRules: [],
                keyElements: [],
                active: true
            });
        } catch (error) {
            console.error('Error saving world:', error);
            alert(error.message);
        }
    };

    const deleteWorld = async (id) => {
        try {
            const token = await AsyncStorage.getItem('token');
            await fetch(`http://192.168.1.33:8000/story-worlds/${id}`, {
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
            const response = await fetch(`http://192.168.1.33:8000/story-worlds/${world._id}`, {
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
                <Text style={styles.sectionTitle}>Create New World</Text>
                <TextInput
                    style={styles.input}
                    placeholder="World Name"
                    value={newWorld.name}
                    onChangeText={text => setNewWorld(prev => ({...prev, name: text}))}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Source"
                    value={newWorld.source}
                    onChangeText={text => setNewWorld(prev => ({...prev, source: text}))}
                />
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Description"
                    value={newWorld.description}
                    onChangeText={text => setNewWorld(prev => ({...prev, description: text}))}
                    multiline
                />
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Opening Paragraph"
                    value={newWorld.openingParagraph}
                    onChangeText={text => setNewWorld(prev => ({...prev, openingParagraph: text}))}
                    multiline
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
                        <Text style={styles.worldMeta}>Opening Paragraph: {world.openingParagraph}</Text>
                        <Text style={styles.worldMeta}>
                            Main Themes: {world.mainThemes.join(', ')}
                        </Text>
                        <Text style={styles.worldMeta}>
                            World Rules: {world.worldRules.join(', ')}
                        </Text>
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
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    addSection: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    listSection: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
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
        padding: 10,
        borderRadius: 4,
        alignItems: 'center',
        marginVertical: 5,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '500',
    },
    plotCard: {
        backgroundColor: '#f5f5f5',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
    },
    plotName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    plotDescription: {
        color: '#333',
        marginBottom: 10,
    },
    plotMeta: {
        color: '#666',
        fontSize: 14,
        marginBottom: 5,
    },
    cardActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
        marginTop: 10,
    },
    editButton: {
        backgroundColor: '#4CAF50',
    },
    deleteButton: {
        backgroundColor: '#f44336',
    },
    plotHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    subTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    plotPointContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    roleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 4,
        marginRight: 5,
    },
    checkboxChecked: {
        backgroundColor: '#007AFF',
    },
    addButton: {
        backgroundColor: '#4CAF50',
        padding: 10,
        borderRadius: 4,
        alignItems: 'center',
        marginVertical: 5,
    },
    statusBadge: {
        padding: 5,
        borderRadius: 4,
        color: '#fff',
    },
    activeBadge: {
        backgroundColor: '#4CAF50',
    },
    inactiveBadge: {
        backgroundColor: '#f44336',
    },
    statusText: {
        fontWeight: 'bold',
    },
}); 