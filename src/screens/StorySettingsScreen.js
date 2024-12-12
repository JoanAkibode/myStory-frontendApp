import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TextInput, 
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function StorySettingsScreen() {
    const [settings, setSettings] = useState({
        preferredName: '',
        pronouns: '',
        eventInfluenceLevel: 'moderate',
        chosenStoryWorldCategory: ''
    });
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        Promise.all([
            loadSettings(),
            fetchCategories()
        ]).finally(() => setLoading(false));
    }, []);

    const loadSettings = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch('http://192.168.1.33:8000/user/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            setSettings({
                preferredName: data.preferredName || '',
                pronouns: data.pronouns || '',
                eventInfluenceLevel: data.eventInfluenceLevel || 'moderate',
                chosenStoryWorldCategory: data.chosenStoryWorldCategory || ''
            });
        } catch (error) {
            console.error('Error loading settings:', error);
            Alert.alert('Error', 'Failed to load settings');
        }
    };

    const fetchCategories = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch('http://192.168.1.33:8000/story-worlds/categories', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch categories');
            }

            const data = await response.json();
            setCategories(data.categories || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
            Alert.alert('Error', 'Failed to load world categories');
        }
    };

    const saveSettings = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch('http://192.168.1.33:8000/user/profile', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settings)
            });

            if (response.ok) {
                Alert.alert('Success', 'Settings saved successfully');
            } else {
                throw new Error('Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            Alert.alert('Error', 'Failed to save settings');
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Story Settings</Text>
                
                <Text style={styles.label}>Preferred Name</Text>
                <TextInput
                    style={styles.input}
                    value={settings.preferredName}
                    onChangeText={(text) => setSettings(prev => ({...prev, preferredName: text}))}
                    placeholder="Enter your preferred name"
                />

                <Text style={styles.label}>Pronouns</Text>
                <TextInput
                    style={styles.input}
                    value={settings.pronouns}
                    onChangeText={(text) => setSettings(prev => ({...prev, pronouns: text}))}
                    placeholder="e.g., they/them, she/her, he/him"
                />

                <Text style={styles.label}>Event Influence Level</Text>
                <View style={styles.buttonGroup}>
                    {['minimal', 'moderate', 'strong'].map((level) => (
                        <TouchableOpacity
                            key={level}
                            style={[
                                styles.levelButton,
                                settings.eventInfluenceLevel === level && styles.selectedButton
                            ]}
                            onPress={() => setSettings(prev => ({...prev, eventInfluenceLevel: level}))}
                        >
                            <Text style={[
                                styles.levelButtonText,
                                settings.eventInfluenceLevel === level && styles.selectedButtonText
                            ]}>
                                {level.charAt(0).toUpperCase() + level.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Story World Category</Text>
                <View style={styles.categoryGrid}>
                    {categories.map((category) => (
                        <TouchableOpacity
                            key={category}
                            style={[
                                styles.categoryButton,
                                settings.chosenStoryWorldCategory === category && styles.selectedButton
                            ]}
                            onPress={() => setSettings(prev => ({...prev, chosenStoryWorldCategory: category}))}
                        >
                            <Text style={[
                                styles.categoryButtonText,
                                settings.chosenStoryWorldCategory === category && styles.selectedButtonText
                            ]}>
                                {category}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
                <Text style={styles.saveButtonText}>Save Settings</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 20,
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
        fontSize: 16,
    },
    buttonGroup: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    levelButton: {
        flex: 1,
        padding: 10,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        marginHorizontal: 5,
        alignItems: 'center',
    },
    selectedButton: {
        backgroundColor: '#007AFF',
    },
    levelButtonText: {
        color: '#666',
        fontWeight: '500',
    },
    selectedButtonText: {
        color: '#fff',
    },
    saveButton: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    categoryButton: {
        width: '48%',
        padding: 15,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        marginBottom: 10,
        alignItems: 'center',
    },
    categoryButtonText: {
        color: '#666',
        fontWeight: '500',
        textAlign: 'center',
    },
}); 