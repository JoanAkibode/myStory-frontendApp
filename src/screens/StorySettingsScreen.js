import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TextInput, 
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Common timezones list
const TIMEZONES = [
    { label: 'Pacific Time (PT)', value: 'America/Los_Angeles' },
    { label: 'Mountain Time (MT)', value: 'America/Denver' },
    { label: 'Central Time (CT)', value: 'America/Chicago' },
    { label: 'Eastern Time (ET)', value: 'America/New_York' },
    { label: 'Greenwich Mean Time (GMT)', value: 'GMT' },
    { label: 'Central European Time (CET)', value: 'Europe/Paris' },
    { label: 'Eastern European Time (EET)', value: 'Europe/Helsinki' },
    // Add more as needed
];

export default function StorySettingsScreen() {
    const [settings, setSettings] = useState({
        preferredName: '',
        pronouns: '',
        eventInfluenceLevel: 'moderate',
        chosenStoryWorldCategory: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [selectedTime, setSelectedTime] = useState(720); // Starting at noon (12 * 60)
    const [isDragging, setIsDragging] = useState(false);
    const [showTimezoneModal, setShowTimezoneModal] = useState(false);

    const HourMarkers = () => {
        // Generate markers for every hour (24 hours)
        return Array.from({ length: 25 }, (_, i) => {
            const left = `${(i / 24) * 100}%`;
            return (
                <View 
                    key={i} 
                    style={[
                        styles.hourMarker,
                        { left },
                        // Make noon and midnight markers taller
                        (i === 0 || i === 12 || i === 24) && styles.majorHourMarker
                    ]}
                />
            );
        });
    };

    const formatTimePoint = (minutes) => {
        const hour = Math.floor(minutes / 60);
        const minute = minutes % 60;
        // First determine if it's the following day
        const isFollowingDay = hour >= 24 || (hour >= 0 && hour < 12);
        
        // Adjust hour for display
        let displayHour;
        let period;
        
        if (hour >= 24) {
            // After midnight on following day
            displayHour = hour - 24;
            period = displayHour >= 12 ? 'PM' : 'AM';
            displayHour = displayHour > 12 ? displayHour - 12 : displayHour || 12;
        } else {
            // Same day
            displayHour = hour > 12 ? hour - 12 : hour || 12;
            period = hour >= 12 ? 'PM' : 'AM';
        }
        
        return `${displayHour}:${minute.toString().padStart(2, '0')} ${period} ${
            isFollowingDay ? 'the following day' : 'the day of the events'
        }`;
    };

    const handleTimelineTouch = (event) => {
        const { locationX } = event.nativeEvent;
        const timelineWidth = event.currentTarget.offsetWidth;
        
        // Convert position to minutes (24 hours from noon to noon)
        const totalMinutes = (locationX / timelineWidth) * 1440 + 720; // Start from noon (720)
        
        // Only allow selection between noon (720) and next noon (2160)
        if (totalMinutes >= 720 && totalMinutes <= 2160) {
            // Round to nearest 5 minutes
            const roundedMinutes = Math.round(totalMinutes / 5) * 5;
            setSelectedTime(roundedMinutes);
        }
    };

    const handleTouchMove = (event) => {
        if (isDragging) {
            handleTimelineTouch(event);
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    const handleTimezoneSelect = (timezone) => {
        setSettings(prev => ({ ...prev, timezone }));
        setShowTimezoneModal(false);
    };

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
                chosenStoryWorldCategory: data.chosenStoryWorldCategory || '',
                timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
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
                body: JSON.stringify({
                    ...settings,
                    deliveryTime: new Date(2023, 0, 1, Math.floor(selectedTime / 60), selectedTime % 60).toISOString(),
                    timezone: settings.timezone
                })
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

                <Text style={styles.label}>Timezone</Text>
                <TouchableOpacity 
                    style={styles.timezoneButton}
                    onPress={() => setShowTimezoneModal(true)}
                >
                    <Text style={styles.timezoneButtonText}>
                        {TIMEZONES.find(tz => tz.value === settings.timezone)?.label || settings.timezone}
                    </Text>
                </TouchableOpacity>

                <Modal
                    visible={showTimezoneModal}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowTimezoneModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Select Timezone</Text>
                            <ScrollView>
                                {TIMEZONES.map((tz) => (
                                    <TouchableOpacity
                                        key={tz.value}
                                        style={[
                                            styles.timezoneOption,
                                            settings.timezone === tz.value && styles.selectedTimezone
                                        ]}
                                        onPress={() => handleTimezoneSelect(tz.value)}
                                    >
                                        <Text style={[
                                            styles.timezoneOptionText,
                                            settings.timezone === tz.value && styles.selectedTimezoneText
                                        ]}>
                                            {tz.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <TouchableOpacity 
                                style={styles.modalCloseButton}
                                onPress={() => setShowTimezoneModal(false)}
                            >
                                <Text style={styles.modalCloseButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                <Text style={styles.label}>Story Delivery Time</Text>
                <Text style={styles.description}>
                    Choose when you want to receive your daily story.
                    Select a time between noon today and noon tomorrow.
                </Text>

                <View style={styles.timelineContainer}>
                    {/* Time markers */}
                    <View style={styles.timeMarkers}>
                        <View style={styles.timeMarkerColumn}>
                            <Text style={styles.timeMarker}>Noon</Text>
                        </View>
                        <View style={styles.timeMarkerColumn}>
                            <Text style={styles.dayMarker}>Day of events</Text>
                        </View>
                        <View style={styles.timeMarkerColumn}>
                            <Text style={styles.timeMarker}>Midnight</Text>
                        </View>
                        <View style={styles.timeMarkerColumn}>
                            <Text style={styles.dayMarker}>Following day</Text>
                        </View>
                        <View style={styles.timeMarkerColumn}>
                            <Text style={styles.timeMarker}>Noon</Text>
                        </View>
                    </View>
                    
                    {/* Timeline */}
                    <View style={styles.timeline}>
                        <View style={styles.timelineTrack} />
                        <HourMarkers />
                        
                        {/* Interactive timeline area */}
                        <View 
                            style={styles.timelineInteractive}
                            onStartShouldSetResponder={() => true}
                            onMoveShouldSetResponder={() => true}
                            onResponderGrant={handleTimelineTouch}
                            onResponderMove={handleTimelineTouch}
                        >
                            {/* Cursor */}
                            <View 
                                style={[
                                    styles.timeCursor,
                                    {
                                        left: `${((selectedTime - 720) / 1440 * 100)}%`
                                    }
                                ]} 
                            />
                        </View>
                    </View>
                    
                    {/* Selected time display */}
                    <Text style={styles.selectedTimeText}>
                        Story will be delivered at {formatTimePoint(selectedTime)}
                    </Text>
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
    description: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    timelineContainer: {
        marginVertical: 20,
        height: 120,
        overflow: 'hidden',
    },
    timeMarkers: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        alignItems: 'center',
    },
    timeMarkerColumn: {
        alignItems: 'center',
    },
    timeMarker: {
        color: '#666',
        fontSize: 14,
        fontWeight: '500',
    },
    dayMarker: {
        color: '#666',
        fontSize: 12,
    },
    timeline: {
        marginTop: 20,
        height: 40,
        position: 'relative',
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 8,
    },
    timelineTrack: {
        position: 'absolute',
        top: 19,
        left: 8,
        right: 8,
        height: 2,
        backgroundColor: '#007AFF',
        zIndex: 1,
    },
    timelineInteractive: {
        position: 'absolute',
        top: 0,
        left: 8,
        right: 8,
        bottom: 0,
        backgroundColor: 'transparent',
        zIndex: 2,
    },
    timeCursor: {
        position: 'absolute',
        top: 0,
        width: 16,
        height: 40,
        backgroundColor: '#007AFF',
        borderRadius: 8,
        marginLeft: -8,
        zIndex: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    selectedTimeText: {
        textAlign: 'center',
        marginTop: 10,
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '500',
    },
    hourMarkers: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 0,
    },
    hourMarker: {
        width: 1,
        height: 10,
        backgroundColor: '#ccc',
        position: 'absolute',
        top: 15,
        transform: [{ translateX: 8 }],
    },
    majorHourMarker: {
        height: 15,
        width: 2,
        backgroundColor: '#999',
        top: 12,
    },
    timezoneButton: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
    },
    timezoneButtonText: {
        fontSize: 16,
        color: '#333',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    timezoneOption: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    selectedTimezone: {
        backgroundColor: '#007AFF',
    },
    timezoneOptionText: {
        fontSize: 16,
        color: '#333',
    },
    selectedTimezoneText: {
        color: '#fff',
    },
    modalCloseButton: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        alignItems: 'center',
    },
    modalCloseButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '500',
    },
}); 