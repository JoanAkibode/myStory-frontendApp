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
        numberOfWords: 250,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [selectedTime, setSelectedTime] = useState(720); // Starting at noon (12 * 60)
    const [isDragging, setIsDragging] = useState(false);
    const [showTimezoneModal, setShowTimezoneModal] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [deliveryDay, setDeliveryDay] = useState('same'); // 'same' or 'following'
    const [deliveryHour, setDeliveryHour] = useState(12);
    const [deliveryMinute, setDeliveryMinute] = useState(0);
    const [showDayPicker, setShowDayPicker] = useState(false);
    const [showHourPicker, setShowHourPicker] = useState(false);
    const [showMinutePicker, setShowMinutePicker] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const HourMarkers = () => {
        // Generate markers for every hour (24 hours)
        return Array.from({ length: 25 }, (_, i) => {
            const left = `${(i / 24) * 100}%`
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

    const showToastMessage = (message) => {
        setToastMessage(message);
        setShowToast(true);
        setTimeout(() => {
            setShowToast(false);
        }, 2000); // Hide after 2 seconds
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
            console.log('Received user data:', data);

            setSettings(prevSettings => {
                const newSettings = {
                    ...prevSettings,
                    preferredName: data.preferredName || '',
                    pronouns: data.pronouns || '',
                    eventInfluenceLevel: data.eventInfluenceLevel || 'moderate',
                    chosenStoryWorldCategory: data.chosenStoryWorldCategory || '',
                    numberOfWords: data.numberOfWords || 250,
                    timezone: data.storyDeliveryTime?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
                };
                console.log('New settings state:', newSettings);
                return newSettings;
            });

            console.log('Setting numberOfWords to:', data.numberOfWords);
            
            // Handle delivery time settings
            if (data.storyDeliveryTime) {
                const { hour, minute, isFollowingDay } = data.storyDeliveryTime;
                console.log('Setting delivery time:', { hour, minute, isFollowingDay });

                // Set the day (same or following)
                setDeliveryDay(isFollowingDay ? 'following' : 'same');
                
                // Set the minute
                setDeliveryMinute(minute);

                // Set the hour based on the day and 12-hour format
                if (isFollowingDay) {
                    // For following day (AM hours)
                    setDeliveryHour(hour);
                } else {
                    // For same day (PM hours)
                    setDeliveryHour(hour);
                }

                console.log('Delivery time set to:', {
                    day: isFollowingDay ? 'following' : 'same',
                    hour: hour,
                    minute: minute,
                    displayHour: `${hour % 12 || 12}${hour >= 12 ? 'PM' : 'AM'}`
                });
            } else {
                console.log('No delivery time found, using defaults');
                setDeliveryDay('same');
                setDeliveryHour(12); // Default to noon
                setDeliveryMinute(0);
            }
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
                    storyDeliveryTime: {
                        hour: deliveryHour,
                        minute: deliveryMinute,
                        timezone: settings.timezone,
                        isFollowingDay: deliveryDay === 'following'
                    }
                })
            });

            if (response.ok) {
                showToastMessage('Settings saved successfully!');
            } else {
                throw new Error('Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            showToastMessage('Failed to save settings');
        }
    };

    const startNewStory = async () => {
        try {
            setResetting(true);
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                console.log('No token found, redirecting to login');
                await signOut();
                navigation.replace('Login');
                return;
            }

            const response = await fetch('http://192.168.1.33:8000/stories/reset', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                console.log('Token expired or invalid, redirecting to login');
                await signOut();
                navigation.replace('Login');
                return;
            }

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to reset story');
            }

            Alert.alert('Success', 'Ready to start a new story!');
        } catch (error) {
            console.error('Error resetting story:', error);
            Alert.alert('Error', error.message);
        } finally {
            setResetting(false);
        }
    };

    // Generate hours options based on selected day
    const getHourOptions = () => {
        if (deliveryDay === 'same') {
            // For same day, show PM hours (12-23)
            return Array.from({ length: 12 }, (_, i) => i + 12);
        } else {
            // For following day, show AM hours (0-11)
            return Array.from({ length: 12 }, (_, i) => i);
        }
    };

    // Generate minutes options (0, 5, 10, ..., 55)
    const getMinuteOptions = () => {
        return Array.from({ length: 12 }, (_, i) => i * 5);
    };

    const PickerModal = ({ visible, onClose, title, options, onSelect }) => (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <ScrollView>
                        {options.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={styles.pickerOption}
                                onPress={() => {
                                    onSelect(option.value);
                                    onClose();
                                }}
                            >
                                <Text style={styles.pickerOptionText}>{option.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <TouchableOpacity 
                        style={styles.modalCloseButton}
                        onPress={onClose}
                    >
                        <Text style={styles.modalCloseButtonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <TouchableOpacity 
                style={styles.resetButton}
                onPress={startNewStory}
                disabled={resetting}
            >
                <Text style={styles.resetButtonText}>
                    {resetting ? 'Resetting...' : 'Start New Story Arc'}
                </Text>
            </TouchableOpacity>

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

                <View style={styles.deliveryTimeContainer}>
                    <Text style={styles.sectionTitle}>Story Delivery Time</Text>
                    
                    <View style={styles.dropdownRow}>
                        <View style={styles.dropdownContainer}>
                            <Text style={styles.dropdownLabel}>Delivery Day</Text>
                            <TouchableOpacity 
                                style={styles.dropdown}
                                onPress={() => setShowDayPicker(true)}
                                value={deliveryDay}
                            >
                                <Text>{deliveryDay === 'same' ? 'The day of events' : 'The following day'}</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.dropdownContainer}>
                            <Text style={styles.dropdownLabel}>Hour</Text>
                            <TouchableOpacity 
                                style={styles.dropdown}
                                onPress={() => setShowHourPicker(true)}
                                value={deliveryHour}
                            >
                                <Text>{`${deliveryHour % 12 || 12} ${deliveryHour >= 12 ? 'PM' : 'AM'}`}</Text>
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.dropdownContainer}>
                            <Text style={styles.dropdownLabel}>Minute</Text>
                            <TouchableOpacity 
                                style={styles.dropdown}
                                onPress={() => setShowMinutePicker(true)}
                                value={deliveryMinute}
                            >
                                <Text>{deliveryMinute.toString().padStart(2, '0')}</Text>
                            </TouchableOpacity>
                        </View>

                        <PickerModal
                            visible={showDayPicker}
                            onClose={() => setShowDayPicker(false)}
                            title="Select Delivery Day"
                            options={[
                                { label: 'The day of events', value: 'same' },
                                { label: 'The following day', value: 'following' }
                            ]}
                            onSelect={setDeliveryDay}
                        />

                        <PickerModal
                            visible={showHourPicker}
                            onClose={() => setShowHourPicker(false)}
                            title="Select Hour"
                            options={getHourOptions().map(hour => ({
                                label: `${hour % 12 || 12} ${hour >= 12 ? 'PM' : 'AM'}`,
                                value: hour
                            }))}
                            onSelect={setDeliveryHour}
                        />

                        <PickerModal
                            visible={showMinutePicker}
                            onClose={() => setShowMinutePicker(false)}
                            title="Select Minute"
                            options={getMinuteOptions().map(minute => ({
                                label: minute.toString().padStart(2, '0'),
                                value: minute
                            }))}
                            onSelect={setDeliveryMinute}
                        />
                    </View>

                    <Text style={styles.deliveryTimeText}>
                        Story will be delivered at {deliveryHour % 12 || 12}:{deliveryMinute.toString().padStart(2, '0')} {deliveryHour >= 12 ? 'PM' : 'AM'} {deliveryDay === 'following' ? 'the following day' : 'the day of the events'}
                    </Text>
                </View>

                <Text style={styles.label}>Story Length</Text>
                <View style={styles.buttonGroup}>
                    {[100, 250, 500, 1000].map((wordCount) => (
                        <TouchableOpacity
                            key={wordCount}
                            style={[
                                styles.wordCountButton,
                                settings.numberOfWords === wordCount && styles.selectedButton
                            ]}
                            onPress={() => setSettings(prev => ({...prev, numberOfWords: wordCount}))}
                        >
                            <Text style={[
                                styles.wordCountButtonText,
                                settings.numberOfWords === wordCount && styles.selectedButtonText
                            ]}>
                                {wordCount}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <Text style={styles.description}>
                    Choose how many words you want in your daily story.
                    Shorter stories are more concise, longer ones have more detail.
                </Text>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
                <Text style={styles.saveButtonText}>Save Settings</Text>
            </TouchableOpacity>

            {showToast && (
                <View style={styles.toastContainer}>
                    <View style={styles.toast}>
                        <Text style={styles.toastText}>{toastMessage}</Text>
                    </View>
                </View>
            )}
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
        marginVertical: 10,
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
        width: '80%',
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
    resetButton: {
        backgroundColor: '#FF3B30',
        padding: 15,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        margin: 15,
    },
    resetButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    wordCountButton: {
        flex: 1,
        padding: 10,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        marginHorizontal: 5,
        alignItems: 'center',
    },
    wordCountButtonText: {
        color: '#666',
        fontWeight: '500',
        fontSize: 14,
    },
    selectedWordCountButton: {
        backgroundColor: '#007AFF',
    },
    selectedWordCountButtonText: {
        color: '#fff',
    },
    deliveryTimeContainer: {
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 20,
    },
    dropdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 10,
    },
    dropdownContainer: {
        flex: 1,
        marginHorizontal: 5,
    },
    dropdownLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 5,
    },
    dropdown: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        backgroundColor: '#f8f8f8',
    },
    deliveryTimeText: {
        textAlign: 'center',
        marginTop: 15,
        color: '#007AFF',
        fontSize: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    pickerOption: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    pickerOptionText: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
    },
    toastContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'none',
    },
    toast: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 16,
        borderRadius: 8,
        maxWidth: '80%',
    },
    toastText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
    },
}); 