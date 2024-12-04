import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PlotsTab() {
    const [plots, setPlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newPlot, setNewPlot] = useState({
        name: '',
        description: '',
        source: '',
        mainThemes: [],
        plotPoints: [],
        characterRoles: [],
        active: true
    });

    const addPlotPoint = () => {
        setNewPlot(prev => ({
            ...prev,
            plotPoints: [...prev.plotPoints, { name: '', description: '', order: prev.plotPoints.length + 1 }]
        }));
    };

    const updatePlotPoint = (index, field, value) => {
        setNewPlot(prev => {
            const updatedPoints = [...prev.plotPoints];
            updatedPoints[index] = {
                ...updatedPoints[index],
                [field]: value
            };
            return { ...prev, plotPoints: updatedPoints };
        });
    };

    const addCharacterRole = () => {
        setNewPlot(prev => ({
            ...prev,
            characterRoles: [...prev.characterRoles, { name: '', description: '', isRequired: false }]
        }));
    };

    const updateCharacterRole = (index, field, value) => {
        setNewPlot(prev => {
            const updatedRoles = [...prev.characterRoles];
            updatedRoles[index] = {
                ...updatedRoles[index],
                [field]: field === 'isRequired' ? Boolean(value) : value
            };
            return { ...prev, characterRoles: updatedRoles };
        });
    };

    useEffect(() => {
        fetchPlots();
    }, []);

    const fetchPlots = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch('http://192.168.1.33:8000/story-plots', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('Plots response:', await response.clone().json());
            const data = await response.json();
            setPlots(data);
        } catch (error) {
            console.error('Error fetching plots:', error);
        } finally {
            setLoading(false);
        }
    };

    const savePlot = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch('http://192.168.1.33:8000/story-plots', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newPlot)
            });
            const data = await response.json();
            setPlots(prev => [...prev, data]);
            setNewPlot({
                name: '',
                description: '',
                source: '',
                mainThemes: [],
                plotPoints: [],
                characterRoles: [],
                active: true
            });
        } catch (error) {
            console.error('Error saving plot:', error);
        }
    };

    const deletePlot = async (id) => {
        try {
            const token = await AsyncStorage.getItem('token');
            await fetch(`http://192.168.1.33:8000/story-plots/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setPlots(prev => prev.filter(plot => plot._id !== id));
        } catch (error) {
            console.error('Error deleting plot:', error);
        }
    };

    const togglePlotActive = async (plot) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`http://192.168.1.33:8000/story-plots/${plot._id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ...plot, active: !plot.active })
            });
            const updatedPlot = await response.json();
            setPlots(prev => prev.map(p => p._id === plot._id ? updatedPlot : p));
        } catch (error) {
            console.error('Error toggling plot active state:', error);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <Text>Loading story plots...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.addSection}>
                <Text style={styles.sectionTitle}>Create New Plot Structure</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Plot Name"
                    value={newPlot.name}
                    onChangeText={text => setNewPlot(prev => ({...prev, name: text}))}
                />
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Description"
                    value={newPlot.description}
                    onChangeText={text => setNewPlot(prev => ({...prev, description: text}))}
                    multiline
                />
                <TextInput
                    style={styles.input}
                    placeholder="Source"
                    value={newPlot.source}
                    onChangeText={text => setNewPlot(prev => ({...prev, source: text}))}
                />
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Main Themes (comma separated)"
                    value={newPlot.mainThemes.join(', ')}
                    onChangeText={text => setNewPlot(prev => ({...prev, mainThemes: text.split(',').map(t => t.trim())}))}
                    multiline
                />

                <Text style={styles.subTitle}>Plot Points</Text>
                {newPlot.plotPoints.map((point, index) => (
                    <View key={index} style={styles.plotPointContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Point Name"
                            value={point.name}
                            onChangeText={text => updatePlotPoint(index, 'name', text)}
                        />
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Point Description"
                            value={point.description}
                            onChangeText={text => updatePlotPoint(index, 'description', text)}
                            multiline
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Order"
                            value={point.order.toString()}
                            onChangeText={text => updatePlotPoint(index, 'order', parseInt(text) || index + 1)}
                            keyboardType="numeric"
                        />
                    </View>
                ))}
                <TouchableOpacity style={styles.addButton} onPress={addPlotPoint}>
                    <Text style={styles.buttonText}>Add Plot Point</Text>
                </TouchableOpacity>

                <Text style={styles.subTitle}>Character Roles</Text>
                {newPlot.characterRoles.map((role, index) => (
                    <View key={index} style={styles.roleContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Role Name"
                            value={role.name}
                            onChangeText={text => updateCharacterRole(index, 'name', text)}
                        />
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Role Description"
                            value={role.description}
                            onChangeText={text => updateCharacterRole(index, 'description', text)}
                            multiline
                        />
                        <View style={styles.checkboxContainer}>
                            <Text>Required: </Text>
                            <TouchableOpacity
                                style={[styles.checkbox, role.isRequired && styles.checkboxChecked]}
                                onPress={() => updateCharacterRole(index, 'isRequired', !role.isRequired)}
                            />
                        </View>
                    </View>
                ))}
                <TouchableOpacity style={styles.addButton} onPress={addCharacterRole}>
                    <Text style={styles.buttonText}>Add Character Role</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={savePlot}>
                    <Text style={styles.buttonText}>Create Plot</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.listSection}>
                <Text style={styles.sectionTitle}>Story Plots</Text>
                {plots.map(plot => (
                    <View key={plot._id} style={styles.plotCard}>
                        <View style={styles.plotHeader}>
                            <Text style={styles.plotName}>{plot.name || 'Untitled'}</Text>
                            <TouchableOpacity 
                                style={[styles.statusBadge, plot.active ? styles.activeBadge : styles.inactiveBadge]}
                                onPress={() => togglePlotActive(plot)}
                            >
                                <Text style={styles.statusText}>
                                    {plot.active ? 'Active' : 'Inactive'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.plotDescription}>{plot.description || 'No description'}</Text>
                        <Text style={styles.plotMeta}>Source: {plot.source || 'N/A'}</Text>
                        <Text style={styles.plotMeta}>
                            Main Themes: {(plot.mainThemes || []).join(', ') || 'None'}
                        </Text>
                        <Text style={styles.plotMeta}>
                            Plot Points: {(plot.plotPoints || []).map(p => 
                                `${p?.name || 'Unnamed'}: ${p?.description || 'No description'}`
                            ).join(', ') || 'None'}
                        </Text>
                        <Text style={styles.plotMeta}>
                            Character Roles: {(plot.characterRoles || []).map(r => 
                                `${r?.name || 'Unnamed'}: ${r?.description || 'No description'}`
                            ).join(', ') || 'None'}
                        </Text>
                        <View style={styles.cardActions}>
                            <TouchableOpacity 
                                style={[styles.button, styles.deleteButton]}
                                onPress={() => deletePlot(plot._id)}
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