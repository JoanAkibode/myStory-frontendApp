import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import JsonFormatModal from '../../components/JsonFormatModal';

// Helper function to split text at semicolons or return single item array
const textToArray = (text) => {
    if (!text) return [];
    return text.includes(';') ? 
        text.split(';').map(item => item.trim()).filter(item => item.length > 0) : 
        [text];
};

// Add this helper function to group worlds by category
const groupWorldsByCategory = (worlds) => {
    return worlds.reduce((groups, world) => {
        const category = world.category || 'Uncategorized';
        if (!groups[category]) {
            groups[category] = [];
        }
        groups[category].push(world);
        return groups;
    }, {});
};

export default function WorldsTab() {
    const [worlds, setWorlds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingWorld, setEditingWorld] = useState(null);
    const [editedWorld, setEditedWorld] = useState(null);
    const [newWorld, setNewWorld] = useState({
        name: '',
        category: '',
        description: '',
        keyElements: [],
        active: true
    });
    const [jsonInput, setJsonInput] = useState('');
    const [showFormat, setShowFormat] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');

    const worldFormat = `{
  "name": "World Name",
  "category": "Fantasy",
  "description": "Detailed world description",
  "keyElements": [
    {
      "description": "Element Description"
    }
  ],
  "active": true
}

// For bulk import, wrap in array:
[
  {
    "name": "First World",
    "category": "Science Fiction",
    "description": "A futuristic world...",
    "keyElements": [
      { "description": "Advanced AI exists" },
      { "description": "Space travel is common" }
    ],
    "active": true
  },
  {
    "name": "Second World",
    "category": "Fantasy",
    "description": "A magical realm...",
    "keyElements": [
      { "description": "Dragons roam freely" },
      { "description": "Magic is rare but powerful" }
    ],
    "active": true
  }
]`;

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
            // Validate required fields
            if (!newWorld.name || !newWorld.description || !newWorld.source) {
                throw new Error('Name, description and source are required');
            }

            const token = await AsyncStorage.getItem('token');
            const response = await fetch('http://192.168.1.33:8000/story-worlds', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...newWorld,
                    // Convert strings to arrays before sending
                    mainThemes: textToArray(newWorld.mainThemes),
                    worldRules: textToArray(newWorld.worldRules)
                })
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
                mainThemes: '',
                worldRules: '',
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

    // Add edit handlers
    const startEditing = (world) => {
        setEditingWorld(world._id);
        setEditedWorld({...world});
    };

    const cancelEditing = () => {
        setEditingWorld(null);
        setEditedWorld(null);
    };

    const saveEdits = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`http://192.168.1.33:8000/story-worlds/${editingWorld}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(editedWorld)
            });

            const updatedWorld = await response.json();
            setWorlds(prev => prev.map(w => w._id === editingWorld ? updatedWorld : w));
            setEditingWorld(null);
            setEditedWorld(null);
        } catch (error) {
            console.error('Error updating world:', error);
            alert('Failed to update world');
        }
    };

    // Add key element handlers
    const addKeyElement = (toWorld) => {
        if (editingWorld) {
            setEditedWorld(prev => ({
                ...prev,
                keyElements: [...prev.keyElements, { description: '' }]
            }));
        } else {
            setNewWorld(prev => ({
                ...prev,
                keyElements: [...prev.keyElements, { description: '' }]
            }));
        }
    };

    const updateKeyElement = (index, field, value, isEditing = false) => {
        if (isEditing) {
            setEditedWorld(prev => {
                const updatedElements = [...prev.keyElements];
                updatedElements[index] = {
                    ...updatedElements[index],
                    [field]: value
                };
                return { ...prev, keyElements: updatedElements };
            });
        } else {
            setNewWorld(prev => {
                const updatedElements = [...prev.keyElements];
                updatedElements[index] = {
                    ...updatedElements[index],
                    [field]: value
                };
                return { ...prev, keyElements: updatedElements };
            });
        }
    };

    const removeKeyElement = (index, isEditing = false) => {
        if (isEditing) {
            setEditedWorld(prev => ({
                ...prev,
                keyElements: prev.keyElements.filter((_, i) => i !== index)
            }));
        } else {
            setNewWorld(prev => ({
                ...prev,
                keyElements: prev.keyElements.filter((_, i) => i !== index)
            }));
        }
    };

    // Add JSON import function
    const importWorldsFromJson = async () => {
        try {
            let worldsToImport;
            try {
                worldsToImport = JSON.parse(jsonInput);
                if (!Array.isArray(worldsToImport)) {
                    worldsToImport = [worldsToImport]; // Convert single object to array
                }
            } catch (error) {
                alert('Invalid JSON format');
                return;
            }

            const token = await AsyncStorage.getItem('token');
            const response = await fetch('http://192.168.1.33:8000/story-worlds/bulk', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ worlds: worldsToImport })
            });

            const data = await response.json();
            setWorlds(prev => [...prev, ...data]);
            setJsonInput(''); // Clear input
            alert(`Successfully imported ${data.length} worlds`);
        } catch (error) {
            console.error('Error importing worlds:', error);
            alert('Error importing worlds: ' + error.message);
        }
    };

    // Get unique categories from worlds
    const categories = ['all', ...new Set(worlds.map(world => world.category))];

    // Filter worlds based on selected category
    const filteredWorlds = worlds.filter(world => 
        selectedCategory === 'all' || world.category === selectedCategory
    );

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
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Import Worlds from JSON</Text>
                    <TouchableOpacity 
                        style={styles.helpButton}
                        onPress={() => setShowFormat(true)}
                    >
                        <Text style={styles.helpButtonText}>?</Text>
                    </TouchableOpacity>
                </View>
                <TextInput
                    style={[styles.input, styles.jsonInput]}
                    placeholder="Paste JSON here"
                    value={jsonInput}
                    onChangeText={setJsonInput}
                    multiline
                    numberOfLines={6}
                />
                <TouchableOpacity 
                    style={[styles.button, styles.importButton]}
                    onPress={importWorldsFromJson}
                >
                    <Text style={styles.buttonText}>Import Worlds</Text>
                </TouchableOpacity>
            </View>

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
                    placeholder="Category"
                    value={newWorld.category}
                    onChangeText={text => setNewWorld(prev => ({...prev, category: text}))}
                />
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Description"
                    value={newWorld.description}
                    onChangeText={text => setNewWorld(prev => ({...prev, description: text}))}
                    multiline
                />

                <Text style={styles.subTitle}>Key Elements:</Text>
                {newWorld.keyElements.map((element, index) => (
                    <View key={index} style={styles.elementContainer}>
                        <TextInput
                            style={[styles.input, { flex: 1 }]}
                            value={element.description}
                            onChangeText={text => updateKeyElement(index, 'description', text)}
                            placeholder="Element Description"
                            multiline
                        />
                        <TouchableOpacity 
                            style={styles.removeButton}
                            onPress={() => removeKeyElement(index)}
                        >
                            <Text style={styles.buttonText}>Remove</Text>
                        </TouchableOpacity>
                    </View>
                ))}
                <TouchableOpacity 
                    style={styles.addButton}
                    onPress={addKeyElement}
                >
                    <Text style={styles.buttonText}>Add Element</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={saveWorld}>
                    <Text style={styles.buttonText}>Create World</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.listSection}>
                <Text style={styles.sectionTitle}>Story Worlds</Text>
                
                {/* Category filter */}
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoryScroll}
                >
                    {categories.map(category => (
                        <TouchableOpacity
                            key={category}
                            style={[
                                styles.categoryButton,
                                selectedCategory === category && styles.categoryButtonActive
                            ]}
                            onPress={() => setSelectedCategory(category)}
                        >
                            <Text style={[
                                styles.categoryButtonText,
                                selectedCategory === category && styles.categoryButtonTextActive
                            ]}>
                                {category.charAt(0).toUpperCase() + category.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Worlds list with category subtitles */}
                {selectedCategory === 'all' ? (
                    // Show all categories with subtitles
                    Object.entries(groupWorldsByCategory(worlds)).map(([category, categoryWorlds]) => (
                        <View key={category}>
                            <Text style={styles.categorySubtitle}>{category}</Text>
                            {categoryWorlds.map(world => (
                                <View key={world._id} style={styles.worldCard}>
                                    <View style={styles.worldHeader}>
                                        <View style={styles.worldTitleRow}>
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
                                    </View>
                                    <Text style={styles.worldCategory}>Category: {world.category}</Text>
                                    <Text style={styles.worldDescription}>{world.description}</Text>

                                    <Text style={styles.elementTitle}>Key Elements:</Text>
                                    {world.keyElements.map((element, index) => (
                                        <Text key={index} style={styles.elementText}>
                                            {element.description}
                                        </Text>
                                    ))}

                                    <View style={styles.cardActions}>
                                        <TouchableOpacity 
                                            style={[styles.button, styles.editButton]}
                                            onPress={() => startEditing(world)}
                                        >
                                            <Text style={styles.buttonText}>Edit</Text>
                                        </TouchableOpacity>
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
                    ))
                ) : (
                    // Show only selected category worlds
                    filteredWorlds.map(world => (
                        <View key={world._id} style={styles.worldCard}>
                            <View style={styles.worldHeader}>
                                <View style={styles.worldTitleRow}>
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
                            </View>
                            <Text style={styles.worldCategory}>Category: {world.category}</Text>
                            <Text style={styles.worldDescription}>{world.description}</Text>

                            <Text style={styles.elementTitle}>Key Elements:</Text>
                            {world.keyElements.map((element, index) => (
                                <Text key={index} style={styles.elementText}>
                                    {element.description}
                                </Text>
                            ))}

                            <View style={styles.cardActions}>
                                <TouchableOpacity 
                                    style={[styles.button, styles.editButton]}
                                    onPress={() => startEditing(world)}
                                >
                                    <Text style={styles.buttonText}>Edit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.button, styles.deleteButton]}
                                    onPress={() => deleteWorld(world._id)}
                                >
                                    <Text style={styles.buttonText}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </View>

            <JsonFormatModal
                visible={showFormat}
                onClose={() => setShowFormat(false)}
                format={worldFormat}
                title="World JSON Format"
            />
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
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 4,
        minWidth: 60,
        alignItems: 'center',
    },
    activeBadge: {
        backgroundColor: '#4CAF50',
    },
    inactiveBadge: {
        backgroundColor: '#f44336',
    },
    statusText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    helperText: {
        color: '#666',
        fontSize: 12,
        marginBottom: 10,
    },
    jsonInput: {
        height: 120,
    },
    importButton: {
        backgroundColor: '#007AFF',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    helpButton: {
        padding: 5,
        borderRadius: 4,
        backgroundColor: '#007AFF',
        marginLeft: 10,
    },
    helpButtonText: {
        color: '#fff',
        fontWeight: '500',
    },
    worldCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 15,
        marginBottom: 15,
    },
    worldHeader: {
        marginBottom: 15,
    },
    worldTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    worldName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        marginRight: 10,
    },
    worldCategory: {
        fontSize: 16,
        color: '#666',
        marginBottom: 10,
    },
    worldDescription: {
        fontSize: 16,
        color: '#666',
        marginBottom: 15,
        lineHeight: 24,
    },
    elementTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    elementText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 8,
        lineHeight: 24,
    },
    categoryScroll: {
        marginBottom: 15,
    },
    categoryButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    categoryButtonActive: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    categoryButtonText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '500',
    },
    categoryButtonTextActive: {
        color: '#fff',
    },
    categorySection: {
        marginTop: 20,
        marginBottom: 10,
    },
    categoryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        paddingBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    categorySubtitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
        marginTop: 20,
        marginBottom: 10,
        paddingLeft: 5,
        borderLeftWidth: 3,
        borderLeftColor: '#007AFF',
    }
}); 