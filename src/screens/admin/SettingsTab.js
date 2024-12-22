import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import JsonFormatModal from '../../components/JsonFormatModal';

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date) 
        ? date.toLocaleString()
        : 'N/A';
};

export default function SettingsTab() {
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newSetting, setNewSetting] = useState({
        name: '',
        systemRole: '',
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        active: false,
        minimal: "Events have a subtle impact on the story, appearing as minor background elements.",
        moderate: "Events play a supporting role in the story, influencing but not dominating the narrative.",
        strong: "Events are central to the story, directly driving the plot and character actions."
    });
    const [jsonInput, setJsonInput] = useState('');
    const [showFormat, setShowFormat] = useState(false);
    const [editingSetting, setEditingSetting] = useState(null);
    const [editedSetting, setEditedSetting] = useState(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch('http://192.168.1.33:8000/story-settings/', {
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
                // Sort settings: active first, then by updatedAt date
                const sortedSettings = data.sort((a, b) => {
                    if (a.active && !b.active) return -1;
                    if (!a.active && b.active) return 1;
                    return new Date(b.updatedAt) - new Date(a.updatedAt); // Most recent first
                });
                setSettings(sortedSettings);
            } else if (data && typeof data === 'object') {
                setSettings([data]);
            } else {
                console.error('Invalid settings data:', data);
                setSettings([]);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            setSettings([]);
        } finally {
            setLoading(false);
        }
    };

    const saveSetting = async () => {
        try {
            // Validate required fields
            if (!newSetting.name.trim()) {
                Alert.alert('Error', 'Setting name is required');
                return;
            }
            if (!newSetting.systemRole.trim()) {
                Alert.alert('Error', 'System role is required');
                return;
            }
            if (!newSetting.model.trim()) {
                Alert.alert('Error', 'Model is required');
                return;
            }

            const token = await AsyncStorage.getItem('token');
            const response = await fetch('http://192.168.1.33:8000/story-settings', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...newSetting,
                    // Ensure model is not empty
                    model: newSetting.model.trim() || 'gpt-3.5-turbo'
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create setting');
            }

            const data = await response.json();
            
            if (Array.isArray(data)) {
                setSettings(data);
            } else if (data && typeof data === 'object') {
                setSettings(prev => [...prev, data]);
            }

            // Reset form
            setNewSetting({
                name: '',
                systemRole: '',
                model: 'gpt-3.5-turbo',
                temperature: 0.7,
                active: false,
                minimal: "Events have a subtle impact on the story, appearing as minor background elements.",
                moderate: "Events play a supporting role in the story, influencing but not dominating the narrative.",
                strong: "Events are central to the story, directly driving the plot and character actions."
            });
        } catch (error) {
            console.error('Error saving setting:', error);
            Alert.alert('Error', error.message);
        }
    };

    const deleteSetting = async (id) => {
        try {
            const token = await AsyncStorage.getItem('token');
            await fetch(`http://192.168.1.33:8000/story-settings/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setSettings(prev => prev.filter(setting => setting._id !== id));
        } catch (error) {
            console.error('Error deleting setting:', error);
        }
    };

    const toggleSettingActive = async (setting) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`http://192.168.1.33:8000/story-settings/${setting._id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ...setting, active: !setting.active })
            });
            
            if (!response.ok) {
                throw new Error('Failed to update setting');
            }

            // The response contains all updated settings
            const updatedSettings = await response.json();
            // Sort settings: active first, then by updatedAt date
            const sortedSettings = updatedSettings.sort((a, b) => {
                if (a.active && !b.active) return -1;
                if (!a.active && b.active) return 1;
                return new Date(b.updatedAt) - new Date(a.updatedAt);
            });
            setSettings(sortedSettings);
        } catch (error) {
            console.error('Error toggling setting active state:', error);
        }
    };

    const importSettingsFromJson = async () => {
        try {
            let settingsToImport;
            try {
                settingsToImport = JSON.parse(jsonInput);
                if (!Array.isArray(settingsToImport)) {
                    settingsToImport = [settingsToImport];
                }
            } catch (error) {
                alert('Invalid JSON format');
                return;
            }

            const token = await AsyncStorage.getItem('token');
            const response = await fetch('http://192.168.1.33:8000/story-settings/bulk', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ settings: settingsToImport })
            });

            const data = await response.json();
            
            // Add successful imports to the list
            if (data.success?.length > 0) {
                setSettings(prev => [...prev, ...data.success]);
            }

            // Show detailed message about results
            let message = `Successfully imported ${data.success?.length || 0} settings.`;
            if (data.failed?.length > 0) {
                message += `\n\nFailed imports:\n${data.failed.map(f => 
                    `- ${f.setting.name}: ${f.error}`
                ).join('\n')}`;
            }
            
            alert(message);
            setJsonInput('');
        } catch (error) {
            alert('Error importing settings: ' + error.message);
        }
    };

    const settingFormat = `{
  "name": "The Narrative Weaver V3",
  "model": "gpt-4o-mini",
  "temperature": 0.8,
  "maxTokens": 1000,
  "minWords": 200,
  "maxWords": 400,
  "systemRole": "You are a storytelling master who crafts compelling stories...",
  "active": true
}`;

    const startEditing = (setting) => {
        setEditingSetting(setting._id);
        const defaultLevels = [
            {
                level: 'minimal',
                description: "Events have a subtle impact on the story, appearing as minor background elements."
            },
            {
                level: 'moderate',
                description: "Events play a supporting role in the story, influencing but not dominating the narrative."
            },
            {
                level: 'strong',
                description: "Events are central to the story, directly driving the plot and character actions."
            }
        ];

        // Merge existing descriptions with default structure
        const mergedLevels = defaultLevels.map(defaultLevel => {
            const existingLevel = setting.influenceLevels?.find(l => l.level === defaultLevel.level);
            return {
                ...defaultLevel,
                description: existingLevel?.description || defaultLevel.description
            };
        });

        setEditedSetting({
            ...setting,
            influenceLevels: mergedLevels
        });
    };

    const cancelEditing = () => {
        setEditingSetting(null);
        setEditedSetting(null);
    };

    const saveEdits = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`http://192.168.1.33:8000/story-settings/${editingSetting}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(editedSetting)
            });

            const updatedSettings = await response.json();
            setSettings(updatedSettings);
            setEditingSetting(null);
            setEditedSetting(null);
        } catch (error) {
            alert('Failed to update setting');
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <Text>Loading story settings...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.addSection}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Import Settings from JSON</Text>
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
                    onPress={importSettingsFromJson}
                >
                    <Text style={styles.buttonText}>Import Settings</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.addSection}>
                <Text style={styles.sectionTitle}>Create New Story Setting</Text>
                
                <Text style={styles.inputLabel}>Name your setting configuration:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g., 'Creative Mode' or 'Professional Style'"
                    value={newSetting.name}
                    onChangeText={text => setNewSetting(prev => ({...prev, name: text}))}
                />

                <Text style={styles.inputLabel}>Define how the AI should behave:</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="e.g., 'You are a creative storyteller. Write engaging stories in a casual, friendly tone.'"
                    value={newSetting.systemRole}
                    onChangeText={text => setNewSetting(prev => ({...prev, systemRole: text}))}
                    multiline
                />

                <Text style={styles.subTitle}>Model Settings</Text>
                
                <Text style={styles.inputLabel}>Choose AI Model:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="gpt-3.5-turbo (faster/cheaper) or gpt-4 (smarter/better)"
                    value={newSetting.model}
                    onChangeText={text => setNewSetting(prev => ({...prev, model: text}))}
                />

                <Text style={styles.inputLabel}>Set AI Creativity Level:</Text>
                <View style={styles.sliderContainer}>
                    <Text style={styles.sliderValue}>{newSetting.temperature.toFixed(2)}</Text>
                    <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={1}
                        step={0.1}
                        value={newSetting.temperature}
                        onValueChange={(value) => setNewSetting(prev => ({...prev, temperature: value}))}
                        minimumTrackTintColor="#007AFF"
                        maximumTrackTintColor="#ddd"
                    />
                    <View style={styles.sliderLabels}>
                        <Text style={styles.sliderLabel}>Focused</Text>
                        <Text style={styles.sliderLabel}>Creative</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.subTitle}>Event Influence Levels</Text>
                    
                    {['minimal', 'moderate', 'strong'].map(level => (
                        <View key={level} style={styles.influenceLevelInput}>
                            <Text style={styles.inputLabel}>
                                {level.charAt(0).toUpperCase() + level.slice(1)} Impact
                            </Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                multiline
                                numberOfLines={4}
                                value={newSetting[level] || ''}
                                onChangeText={(text) => {
                                    setNewSetting(prev => ({
                                        ...prev,
                                        [level]: text
                                    }));
                                }}
                                placeholder="Description"
                            />
                        </View>
                    ))}
                </View>

                <TouchableOpacity style={styles.button} onPress={saveSetting}>
                    <Text style={styles.buttonText}>Create Setting</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.listSection}>
                <Text style={styles.sectionTitle}>Story Settings</Text>
                {Array.isArray(settings) && settings.map(setting => (
                    <View key={setting._id} style={styles.card}>
                        {editingSetting === setting._id ? (
                            <>
                                <TextInput
                                    style={styles.input}
                                    value={editedSetting.name}
                                    onChangeText={text => setEditedSetting(prev => ({...prev, name: text}))}
                                    placeholder="Setting Name"
                                />
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={editedSetting.systemRole}
                                    onChangeText={text => setEditedSetting(prev => ({...prev, systemRole: text}))}
                                    placeholder="System Role"
                                    multiline
                                />
                                <TextInput
                                    style={styles.input}
                                    value={editedSetting.model}
                                    onChangeText={text => setEditedSetting(prev => ({...prev, model: text}))}
                                    placeholder="Model"
                                />

                                <Text style={styles.inputLabel}>AI Creativity Level:</Text>
                                <View style={styles.sliderContainer}>
                                    <Text style={styles.sliderValue}>{editedSetting.temperature.toFixed(2)}</Text>
                                    <Slider
                                        style={styles.slider}
                                        minimumValue={0}
                                        maximumValue={1}
                                        step={0.1}
                                        value={editedSetting.temperature}
                                        onValueChange={(value) => setEditedSetting(prev => ({...prev, temperature: value}))}
                                        minimumTrackTintColor="#007AFF"
                                        maximumTrackTintColor="#ddd"
                                    />
                                    <View style={styles.sliderLabels}>
                                        <Text style={styles.sliderLabel}>Focused</Text>
                                        <Text style={styles.sliderLabel}>Creative</Text>
                                    </View>
                                </View>

                                <View style={styles.section}>
                                    <Text style={styles.subTitle}>Event Influence Levels</Text>
                                    
                                    {['minimal', 'moderate', 'strong'].map(level => (
                                        <View key={level} style={styles.influenceLevelInput}>
                                            <Text style={styles.inputLabel}>
                                                {level.charAt(0).toUpperCase() + level.slice(1)} Impact
                                            </Text>
                                            <TextInput
                                                style={[styles.input, styles.textArea]}
                                                multiline
                                                numberOfLines={4}
                                                value={editedSetting?.[level] || ''}
                                                onChangeText={(text) => {
                                                    setEditedSetting(prev => ({
                                                        ...prev,
                                                        [level]: text
                                                    }));
                                                }}
                                                placeholder="Description"
                                            />
                                        </View>
                                    ))}
                                </View>

                                <View style={styles.cardActions}>
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
                            <>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.cardName}>{setting.name}</Text>
                                    <TouchableOpacity 
                                        style={[
                                            styles.statusBadge, 
                                            setting.active ? styles.activeBadge : styles.inactiveBadge
                                        ]}
                                        onPress={() => toggleSettingActive(setting)}
                                    >
                                        <Text style={styles.statusText}>
                                            {setting.active ? 'Active' : 'Inactive'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                
                                <View style={styles.cardDescription}>
                                    <Text style={styles.labelText}>System Role</Text>
                                    <Text style={styles.cardValue}>{setting.systemRole}</Text>
                                </View>

                                <View style={styles.cardDescription}>
                                    <Text style={styles.labelText}>Model</Text>
                                    <Text style={styles.cardValue}>{setting.model}</Text>
                                </View>

                                <View style={styles.cardDescription}>
                                    <Text style={styles.labelText}>Temperature</Text>
                                    <Text style={styles.cardValue}>{setting.temperature}</Text>
                                </View>

                                <View style={styles.cardDescription}>
                                    <Text style={styles.labelText}>Word Range</Text>
                                    <Text style={styles.cardValue}>{setting.minWords}-{setting.maxWords}</Text>
                                </View>

                                
                                <View style={styles.influenceLevels}>
                                    <Text style={styles.influenceTitle}>Event Influence Levels:</Text>
                                    
                                    {['minimal', 'moderate', 'strong'].map(level => (
                                        <View key={level} style={styles.influenceLevel}>
                                            <Text style={styles.influenceLevelTitle}>
                                                {level.charAt(0).toUpperCase() + level.slice(1)}:
                                            </Text>
                                            <Text style={styles.influenceLevelDesc}>
                                                {setting[level] || 'No description'}
                                            </Text>
                                        </View>
                                    ))}
                                </View>

                                                                    <View style={styles.datesContainer}>
                                        <Text style={styles.dateText}>
                                            Created: {formatDate(setting.createdAt)}
                                        </Text>
                                        <Text style={styles.dateText}>
                                            Modified: {formatDate(setting.updatedAt)}
                                        </Text>
                                    </View>

                                <View style={styles.cardActions}>
                                    <TouchableOpacity 
                                        style={[styles.button, styles.editButton]}
                                        onPress={() => startEditing(setting)}
                                    >
                                        <Text style={styles.buttonText}>Edit</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.button, styles.deleteButton]}
                                        onPress={() => deleteSetting(setting._id)}
                                    >
                                        <Text style={styles.buttonText}>Delete</Text>
                                    </TouchableOpacity>
                                </View>

                            </>
                        )}
                    </View>
                ))}
            </View>

            <JsonFormatModal
                visible={showFormat}
                onClose={() => setShowFormat(false)}
                format={settingFormat}
                title="Setting JSON Format"
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
        padding: 10,
        marginVertical: 5,
        borderRadius: 5,
        backgroundColor: '#fff'
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 10,
        borderRadius: 4,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: '500',
    },
    card: {
        backgroundColor: '#f5f5f5',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
    },
    cardName: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 5,
    },
    cardDescription: {
        color: '#666',
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardValue: {
        color: '#444',
        flex: 1,
        fontSize: 14,
    },
    cardActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
    },
    editButton: {
        backgroundColor: '#4CAF50',
    },
    deleteButton: {
        backgroundColor: '#f44336',
    },
    textArea: {
        minHeight: 100,
        maxHeight: 200,
        textAlignVertical: 'top',
        paddingTop: 10,
    },
    helpButton: {
        backgroundColor: '#007AFF',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    helpButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
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
    subTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 15,
        marginBottom: 10,
    },
    labelText: {
        fontWeight: '600',
        color: '#333',
        fontSize: 15,
        marginRight: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
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
        fontWeight: '600',
    },
    inputLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
        marginTop: 10,
        fontWeight: '500',
    },
    sliderContainer: {
        marginBottom: 20,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    sliderValue: {
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF',
    },
    sliderLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
    },
    sliderLabel: {
        fontSize: 12,
        color: '#666',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    jsonInput: {
        height: 150,
        textAlignVertical: 'top',
        fontFamily: 'monospace'
    },
    importButton: {
        backgroundColor: '#007AFF'
    },
    saveButton: {
        backgroundColor: '#4CAF50'
    },
    cancelButton: {
        backgroundColor: '#666'
    },
    section: {
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    influenceLevels: {
        marginTop: 15,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    influenceTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    influenceLevel: {
        marginBottom: 8,
    },
    influenceLevelTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    influenceLevelDesc: {
        fontSize: 14,
        color: '#333',
        marginTop: 2,
    },
    influenceLevelInput: {
        marginBottom: 15,
    },
    addButton: {
        backgroundColor: '#2196F3',
        marginTop: 10,
    },
    levelHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    levelInput: {
        flex: 1,
    },
    removeButton: {
        backgroundColor: '#f44336',
        paddingHorizontal: 10,
    },
}); 