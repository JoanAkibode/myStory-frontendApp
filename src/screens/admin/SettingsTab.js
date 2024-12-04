import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsTab() {
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newSetting, setNewSetting] = useState({
        name: '',
        systemRole: '',
        contextTemplate: {
            withPrevious: '',
            withoutPrevious: ''
        },
        model: '',
        temperature: 0.9,
        minWords: 200,
        maxWords: 400,
        style: '',
        active: false
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch('http://192.168.1.33:8000/stories/settings', {
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
                setSettings(data);
            } else if (data && typeof data === 'object') {
                console.log('Converting single setting to array:', data);
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
            const token = await AsyncStorage.getItem('token');
            const response = await fetch('http://192.168.1.33:8000/stories/settings', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newSetting)
            });
            const data = await response.json();
            
            if (Array.isArray(data)) {
                setSettings(data);
            } else if (data && typeof data === 'object') {
                setSettings(prev => [...prev, data]);
            }

            setNewSetting({
                name: '',
                systemRole: '',
                contextTemplate: {
                    withPrevious: '',
                    withoutPrevious: ''
                },
                model: '',
                temperature: 0.9,
                minWords: 200,
                maxWords: 400,
                style: '',
                active: false
            });
        } catch (error) {
            console.error('Error saving setting:', error);
        }
    };

    const deleteSetting = async (id) => {
        try {
            const token = await AsyncStorage.getItem('token');
            await fetch(`http://192.168.1.33:8000/api/admin/settings/${id}`, {
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
            const response = await fetch(`http://192.168.1.33:8000/api/admin/settings/${setting._id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ...setting, active: !setting.active })
            });
            const updatedSetting = await response.json();
            setSettings(prev => prev.map(s => s._id === setting._id ? updatedSetting : s));
        } catch (error) {
            console.error('Error toggling setting active state:', error);
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
                <Text style={styles.sectionTitle}>Create New Story Setting</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Setting Name"
                    value={newSetting.name}
                    onChangeText={text => setNewSetting(prev => ({...prev, name: text}))}
                />
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="System Role"
                    value={newSetting.systemRole}
                    onChangeText={text => setNewSetting(prev => ({...prev, systemRole: text}))}
                    multiline
                />

                <Text style={styles.subTitle}>Context Templates</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="With Previous Context"
                    value={newSetting.contextTemplate.withPrevious}
                    onChangeText={text => setNewSetting(prev => ({
                        ...prev,
                        contextTemplate: { ...prev.contextTemplate, withPrevious: text }
                    }))}
                    multiline
                />
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Without Previous Context"
                    value={newSetting.contextTemplate.withoutPrevious}
                    onChangeText={text => setNewSetting(prev => ({
                        ...prev,
                        contextTemplate: { ...prev.contextTemplate, withoutPrevious: text }
                    }))}
                    multiline
                />

                <Text style={styles.subTitle}>Model Settings</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Model (e.g., gpt-4)"
                    value={newSetting.model}
                    onChangeText={text => setNewSetting(prev => ({...prev, model: text}))}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Temperature (0-2)"
                    value={newSetting.temperature.toString()}
                    onChangeText={text => setNewSetting(prev => ({...prev, temperature: parseFloat(text) || 0.9}))}
                    keyboardType="numeric"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Min Words"
                    value={newSetting.minWords.toString()}
                    onChangeText={text => setNewSetting(prev => ({...prev, minWords: parseInt(text) || 200}))}
                    keyboardType="numeric"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Max Words"
                    value={newSetting.maxWords.toString()}
                    onChangeText={text => setNewSetting(prev => ({...prev, maxWords: parseInt(text) || 400}))}
                    keyboardType="numeric"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Style"
                    value={newSetting.style}
                    onChangeText={text => setNewSetting(prev => ({...prev, style: text}))}
                />
                
                <TouchableOpacity style={styles.button} onPress={saveSetting}>
                    <Text style={styles.buttonText}>Create Setting</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.listSection}>
                <Text style={styles.sectionTitle}>Story Settings</Text>
                {Array.isArray(settings) && settings.map(setting => (
                    <View key={setting._id} style={styles.settingCard}>
                        <View style={styles.settingHeader}>
                            <Text style={styles.settingName}>{setting.name}</Text>
                            <TouchableOpacity 
                                style={[styles.statusBadge, setting.active ? styles.activeBadge : styles.inactiveBadge]}
                                onPress={() => toggleSettingActive(setting)}
                            >
                                <Text style={styles.statusText}>
                                    {setting.active ? 'Active' : 'Inactive'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.settingMeta}>System Role: {setting.systemRole}</Text>
                        <Text style={styles.settingMeta}>Model: {setting.model}</Text>
                        <Text style={styles.settingMeta}>Temperature: {setting.temperature}</Text>
                        <Text style={styles.settingMeta}>Words: {setting.minWords}-{setting.maxWords}</Text>
                        <Text style={styles.settingMeta}>Style: {setting.style}</Text>
                        
                        <Text style={styles.subTitle}>Context Templates:</Text>
                        <Text style={styles.settingMeta}>With Previous:</Text>
                        <Text style={styles.templateText}>{setting.contextTemplate.withPrevious}</Text>
                        <Text style={styles.settingMeta}>Without Previous:</Text>
                        <Text style={styles.templateText}>{setting.contextTemplate.withoutPrevious}</Text>

                        <View style={styles.cardActions}>
                            <TouchableOpacity 
                                style={[styles.button, styles.deleteButton]}
                                onPress={() => deleteSetting(setting._id)}
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
    },
    buttonText: {
        color: '#fff',
        fontWeight: '500',
    },
    settingCard: {
        backgroundColor: '#f5f5f5',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
    },
    settingName: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 5,
    },
    settingDescription: {
        color: '#666',
        marginBottom: 10,
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
}); 