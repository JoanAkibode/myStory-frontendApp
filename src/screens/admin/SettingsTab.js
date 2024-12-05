import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { adminStyles } from '../../styles/adminStyles';
import Slider from '@react-native-community/slider';

export default function SettingsTab() {
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newSetting, setNewSetting] = useState({
        name: '',
        systemRole: '',
        model: '',
        temperature: 0,
        minWords: 0,
        maxWords: 0,
        active: false
    });

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
            const response = await fetch('http://192.168.1.33:8000/story-settings', {
                method: 'POST',
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
                model: '',
                temperature: 0,
                minWords: 0,
                maxWords: 0,
                active: false
            });
        } catch (error) {
            console.error('Error saving setting:', error);
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

            // The response now contains all updated settings
            const updatedSettings = await response.json();
            setSettings(updatedSettings);
        } catch (error) {
            console.error('Error toggling setting active state:', error);
        }
    };

    if (loading) {
        return (
            <View style={adminStyles.container}>
                <Text>Loading story settings...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={adminStyles.container}>
            <View style={adminStyles.addSection}>
                <Text style={adminStyles.sectionTitle}>Create New Story Setting</Text>
                
                <Text style={adminStyles.inputLabel}>Name your setting configuration:</Text>
                <TextInput
                    style={adminStyles.input}
                    placeholder="e.g., 'Creative Mode' or 'Professional Style'"
                    value={newSetting.name}
                    onChangeText={text => setNewSetting(prev => ({...prev, name: text}))}
                />

                <Text style={adminStyles.inputLabel}>Define how the AI should behave:</Text>
                <TextInput
                    style={[adminStyles.input, adminStyles.textArea]}
                    placeholder="e.g., 'You are a creative storyteller. Write engaging stories in a casual, friendly tone.'"
                    value={newSetting.systemRole}
                    onChangeText={text => setNewSetting(prev => ({...prev, systemRole: text}))}
                    multiline
                />

                <Text style={adminStyles.subTitle}>Model Settings</Text>
                
                <Text style={adminStyles.inputLabel}>Choose AI Model:</Text>
                <TextInput
                    style={adminStyles.input}
                    placeholder="gpt-3.5-turbo (faster/cheaper) or gpt-4 (smarter/better)"
                    value={newSetting.model}
                    onChangeText={text => setNewSetting(prev => ({...prev, model: text}))}
                />

                <Text style={adminStyles.inputLabel}>Set AI Creativity Level:</Text>
                <View style={adminStyles.sliderContainer}>
                    <Text style={adminStyles.sliderValue}>{newSetting.temperature.toFixed(2)}</Text>
                    <Slider
                        style={adminStyles.slider}
                        minimumValue={0}
                        maximumValue={1}
                        step={0.1}
                        value={newSetting.temperature}
                        onValueChange={(value) => setNewSetting(prev => ({...prev, temperature: value}))}
                        minimumTrackTintColor="#007AFF"
                        maximumTrackTintColor="#ddd"
                    />
                    <View style={adminStyles.sliderLabels}>
                        <Text style={adminStyles.sliderLabel}>Focused</Text>
                        <Text style={adminStyles.sliderLabel}>Creative</Text>
                    </View>
                </View>

                <Text style={adminStyles.inputLabel}>Set Story Length:</Text>
                <TextInput
                    style={adminStyles.input}
                    placeholder="Minimum words (200 for short, 500 for detailed)"
                    value={newSetting.minWords.toString()}
                    onChangeText={(text) => setNewSetting(prev => ({...prev, minWords: parseInt(text) || 0}))}
                    keyboardType="numeric"
                />
                <TextInput
                    style={adminStyles.input}
                    placeholder="Maximum words (400 for short, 1000 for detailed)"
                    value={newSetting.maxWords.toString()}
                    onChangeText={(text) => setNewSetting(prev => ({...prev, maxWords: parseInt(text) || 0}))}
                    keyboardType="numeric"
                />
                
                <TouchableOpacity style={adminStyles.button} onPress={saveSetting}>
                    <Text style={adminStyles.buttonText}>Create Setting</Text>
                </TouchableOpacity>
            </View>

            <View style={adminStyles.listSection}>
                <Text style={adminStyles.sectionTitle}>Story Settings</Text>
                {Array.isArray(settings) && settings.map(setting => (
                    <View key={setting._id} style={adminStyles.card}>
                        <View style={adminStyles.cardHeader}>
                            <Text style={adminStyles.cardName}>{setting.name}</Text>
                            <TouchableOpacity 
                                style={[
                                    adminStyles.statusBadge, 
                                    setting.active ? adminStyles.activeBadge : adminStyles.inactiveBadge
                                ]}
                                onPress={() => toggleSettingActive(setting)}
                            >
                                <Text style={adminStyles.statusText}>
                                    {setting.active ? 'Active' : 'Inactive'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        
                        <View style={adminStyles.cardDescription}>
                            <Text style={adminStyles.labelText}>System Role</Text>
                            <Text style={adminStyles.cardValue}>{setting.systemRole}</Text>
                        </View>

                        <View style={adminStyles.cardDescription}>
                            <Text style={adminStyles.labelText}>Model</Text>
                            <Text style={adminStyles.cardValue}>{setting.model}</Text>
                        </View>

                        <View style={adminStyles.cardDescription}>
                            <Text style={adminStyles.labelText}>Temperature</Text>
                            <Text style={adminStyles.cardValue}>{setting.temperature}</Text>
                        </View>

                        <View style={adminStyles.cardDescription}>
                            <Text style={adminStyles.labelText}>Word Range</Text>
                            <Text style={adminStyles.cardValue}>{setting.minWords}-{setting.maxWords}</Text>
                        </View>

                        <View style={adminStyles.cardActions}>
                            <TouchableOpacity 
                                style={[adminStyles.button, adminStyles.deleteButton]}
                                onPress={() => deleteSetting(setting._id)}
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