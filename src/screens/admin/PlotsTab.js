import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import JsonFormatModal from '../../components/JsonFormatModal';
import { getApiUrl } from '../../utils/config';

const TOTAL_MILESTONES = 7;

export default function PlotsTab() {
    const [plots, setPlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newPlot, setNewPlot] = useState({
        name: '',
        CoreIdea: '',
        Themes: '',
        milestones: Array(TOTAL_MILESTONES).fill().map((_, index) => ({
            milestone: index + 1,
            description: ''
        })),
        active: true
    });
    const [jsonInput, setJsonInput] = useState('');
    const [editingPlot, setEditingPlot] = useState(null);
    const [editedPlot, setEditedPlot] = useState(null);
    const [showFormat, setShowFormat] = useState(false);

    const updateMilestone = (index, field, value) => {
        setNewPlot(prev => {
            const updatedMilestones = [...prev.milestones];
            updatedMilestones[index] = {
                ...updatedMilestones[index],
                [field]: field === 'milestone' ? parseInt(value) : value
            };
            return { ...prev, milestones: updatedMilestones };
        });
    };

    const resetMilestones = () => {
        setNewPlot(prev => ({
            ...prev,
            milestones: Array(TOTAL_MILESTONES).fill().map((_, index) => ({
                milestone: index + 1,
                description: ''
            }))
        }));
    };

    useEffect(() => {
        fetchPlots();
    }, []);

    const fetchPlots = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${getApiUrl()}/story-plots`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('Plots response:', await response.clone().json());
            const data = await response.json();
            // Sort plots by updatedAt date
            const sortedPlots = data.sort((a, b) => 
                new Date(b.updatedAt) - new Date(a.updatedAt)
            );
            setPlots(sortedPlots);
        } catch (error) {
            console.error('Error fetching plots:', error);
        } finally {
            setLoading(false);
        }
    };

    const savePlot = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${getApiUrl()}/story-plots`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...newPlot,
                    Themes: newPlot.Themes ? newPlot.Themes.split(';').map(t => t.trim()) : []
                })
            });

            const data = await response.json();
            setPlots(prev => [...prev, data]);
            setNewPlot({
                name: '',
                CoreIdea: '',
                Themes: '',
                milestones: Array(TOTAL_MILESTONES).fill().map((_, index) => ({
                    milestone: index + 1,
                    description: ''
                })),
                active: true
            });
        } catch (error) {
            console.error('Error saving plot:', error);
        }
    };

    const deletePlot = async (id) => {
        try {
            const token = await AsyncStorage.getItem('token');
            await fetch(`${getApiUrl()}/story-plots/${id}`, {
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
            const response = await fetch(`${getApiUrl()}/story-plots/${plot._id}`, {
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

    const importPlotsFromJson = async () => {
        try {
            let plotsToImport;
            try {
                plotsToImport = JSON.parse(jsonInput);
                if (!Array.isArray(plotsToImport)) {
                    plotsToImport = [plotsToImport]; // Convert single object to array
                }
            } catch (error) {
                alert('Invalid JSON format');
                return;
            }

            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${getApiUrl()}/story-plots/bulk`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ plots: plotsToImport })
            });

            const data = await response.json();
            setPlots(prev => [...prev, ...data]);
            setJsonInput(''); // Clear input
            alert(`Successfully imported ${data.length} plots`);
        } catch (error) {
            console.error('Error importing plots:', error);
            alert('Error importing plots: ' + error.message);
        }
    };

    const startEditing = (plot) => {
        setEditingPlot(plot._id);
        setEditedPlot({
            ...plot,
            Themes: Array.isArray(plot.Themes) ? plot.Themes.join(';') : ''
        });
    };

    const cancelEditing = () => {
        setEditingPlot(null);
        setEditedPlot(null);
    };

    const saveEdits = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${getApiUrl()}/story-plots/${editingPlot}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...editedPlot,
                    Themes: editedPlot.Themes ? editedPlot.Themes.split(';').map(t => t.trim()) : []
                })
            });

            const updatedPlot = await response.json();
            setPlots(prev => prev.map(p => p._id === editingPlot ? updatedPlot : p));
            setEditingPlot(null);
            setEditedPlot(null);
        } catch (error) {
            console.error('Error updating plot:', error);
            alert('Failed to update plot');
        }
    };

    const plotFormat = `{
  "name": "Plot Name",
  "CoreIdea": "Main plot concept",
  "Themes": ["Theme 1", "Theme 2"],
  "milestones": [
    {
      "milestone": 1,
      "description": "Day 1 description"
    },
    // ... add all 7 days
  ],
  "active": true
}

// For bulk import, wrap in array:
[
  {
    // ... first plot
  },
  {
    // ... second plot
  }
]`;

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
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Import Plots from JSON</Text>
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
                    onPress={importPlotsFromJson}
                >
                    <Text style={styles.buttonText}>Import Plots</Text>
                </TouchableOpacity>
            </View>

            <JsonFormatModal
                visible={showFormat}
                onClose={() => setShowFormat(false)}
                format={plotFormat}
                title="Plot JSON Format"
            />

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
                    placeholder="Core Idea"
                    value={newPlot.CoreIdea}
                    onChangeText={text => setNewPlot(prev => ({...prev, CoreIdea: text}))}
                    multiline
                />
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Themes (separate with semicolons)"
                    value={newPlot.Themes}
                    onChangeText={text => setNewPlot(prev => ({...prev, Themes: text}))}
                    multiline
                />

                <Text style={styles.subTitle}>Milestones (7 Days)</Text>
                {newPlot.milestones.map((milestone, index) => (
                    <View key={index} style={styles.milestoneContainer}>
                        <Text style={styles.milestoneNumber}>
                            Day {milestone.milestone}
                        </Text>
                        <TextInput
                            style={[styles.input, { flex: 1 }]}
                            placeholder="Milestone Description"
                            value={milestone.description}
                            onChangeText={text => updateMilestone(index, 'description', text)}
                        />
                    </View>
                ))}
                <TouchableOpacity style={styles.resetButton} onPress={resetMilestones}>
                    <Text style={styles.buttonText}>Reset Milestones</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={savePlot}>
                    <Text style={styles.buttonText}>Create Plot</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.listSection}>
                <Text style={styles.sectionTitle}>Story Plots</Text>
                {plots.map(plot => (
                    <View key={plot._id} style={styles.plotCard}>
                        {editingPlot === plot._id ? (
                            // Edit mode
                            <>
                                <TextInput
                                    style={styles.input}
                                    value={editedPlot.name}
                                    onChangeText={text => setEditedPlot(prev => ({...prev, name: text}))}
                                    placeholder="Plot Name"
                                />
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={editedPlot.CoreIdea}
                                    onChangeText={text => setEditedPlot(prev => ({...prev, CoreIdea: text}))}
                                    placeholder="Core Idea"
                                    multiline
                                />
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={editedPlot.Themes}
                                    onChangeText={text => setEditedPlot(prev => ({...prev, Themes: text}))}
                                    placeholder="Themes (separate with semicolons)"
                                    multiline
                                />
                                <Text style={styles.subTitle}>Milestones:</Text>
                                {editedPlot.milestones.map((m, index) => (
                                    <View key={index} style={styles.milestoneContainer}>
                                        <Text style={styles.milestoneNumber}>Day {m.milestone}</Text>
                                        <TextInput
                                            style={[styles.input, { flex: 1 }]}
                                            value={m.description}
                                            onChangeText={text => {
                                                const newMilestones = [...editedPlot.milestones];
                                                newMilestones[index] = { ...m, description: text };
                                                setEditedPlot(prev => ({...prev, milestones: newMilestones}));
                                            }}
                                            placeholder="Milestone Description"
                                        />
                                    </View>
                                ))}
                                <View style={styles.editActions}>
                                    <TouchableOpacity 
                                        style={[styles.button, styles.saveButton]}
                                        onPress={saveEdits}
                                    >
                                        <Text style={styles.buttonText}>Save</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.button, styles.cancelButton]}
                                        onPress={cancelEditing}
                                    >
                                        <Text style={styles.buttonText}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        ) : (
                            // View mode
                            <>
                                <View style={styles.plotHeader}>
                                    <Text style={styles.plotName}>{plot.name}</Text>
                                    <TouchableOpacity 
                                        style={[styles.statusBadge, plot.active ? styles.activeBadge : styles.inactiveBadge]}
                                        onPress={() => togglePlotActive(plot)}
                                    >
                                        <Text style={styles.statusText}>
                                            {plot.active ? 'Active' : 'Inactive'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.plotMeta}>Core Idea: {plot.CoreIdea || 'N/A'}</Text>
                                <Text style={styles.plotMeta}>
                                    Themes: {Array.isArray(plot.Themes) ? plot.Themes.join(', ') : 'None'}
                                </Text>
                                <Text style={styles.subTitle}>Milestones:</Text>
                                {Array.isArray(plot.milestones) && plot.milestones.map((m, index) => (
                                    <Text key={index} style={styles.plotMeta}>
                                        Day {m.milestone}: {m.description}
                                    </Text>
                                ))}
                                <View style={styles.datesContainer}>
                                    <Text style={styles.dateText}>
                                        Created: {new Date(plot.createdAt).toLocaleString()}
                                    </Text>
                                    <Text style={styles.dateText}>
                                        Modified: {new Date(plot.updatedAt).toLocaleString()}
                                    </Text>
                                </View>
                                <View style={styles.cardActions}>
                                    <TouchableOpacity 
                                        style={[styles.button, styles.editButton]}
                                        onPress={() => startEditing(plot)}
                                    >
                                        <Text style={styles.buttonText}>Edit</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.button, styles.deleteButton]}
                                        onPress={() => deletePlot(plot._id)}
                                    >
                                        <Text style={styles.buttonText}>Delete</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
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
    milestoneContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    milestoneNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 10,
    },
    resetButton: {
        backgroundColor: '#f44336',
        padding: 10,
        borderRadius: 4,
        alignItems: 'center',
        marginVertical: 5,
    },
    jsonInput: {
        height: 150,
        textAlignVertical: 'top',
        fontFamily: 'monospace'
    },
    importButton: {
        backgroundColor: '#007AFF'
    },
    editActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
        marginTop: 10
    },
    saveButton: {
        backgroundColor: '#4CAF50'
    },
    cancelButton: {
        backgroundColor: '#666'
    },
    editButton: {
        backgroundColor: '#2196F3'
    },
    helpButton: {
        backgroundColor: '#007AFF',
        padding: 10,
        borderRadius: 4,
        alignItems: 'center'
    },
    helpButtonText: {
        color: 'white',
        fontWeight: '500'
    },
    datesContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 15,
        marginBottom: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    dateText: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
}); 