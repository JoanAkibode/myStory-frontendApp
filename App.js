import React, { useEffect } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import AdminScreen from './src/screens/AdminScreen';
import StorySettingsScreen from './src/screens/StorySettingsScreen';
import StoryReadingScreen from './src/screens/StoryReadingScreen';
import UserSettingsScreen from './src/screens/UserSettingsScreen';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { getFCMToken, updateFCMToken, onMessageReceived } from './src/config/firebase';
import { Notifications } from 'react-native';

const Stack = createNativeStackNavigator();

const prefix = Linking.createURL('/');

const linking = {
    prefixes: ['mystory://', prefix, 'exp://'],
    config: {
        screens: {
            Login: {
                path: 'auth/callback',
                parse: {
                    data: (data) => {
                        try {
                            return JSON.parse(decodeURIComponent(data));
                        } catch (error) {
                            console.error('Error parsing callback data:', error);
                            return null;
                        }
                    }
                }
            },
            Home: 'home',
            Dashboard: {
                screens: {
                    Stories: {
                        screens: {
                            StoryReading: 'story/:storyId',
                        }
                    }
                }
            },
            Admin: 'admin-panel-secret',
            StorySettings: 'story-settings'
        }
    }
};

// Custom header button component
function HeaderSettingsButton({ onPress }) {
    return (
        <Pressable 
            onPress={onPress}
            style={({ pressed }) => ({
                marginRight: 15,
                opacity: pressed ? 0.5 : 1
            })}
        >
            {Platform.select({
                web: <Text style={{ fontSize: 24 }}>⚙️</Text>,
                default: <Ionicons name="settings-outline" size={24} color="black" />
            })}
        </Pressable>
    );
}

// Main navigation stack
function MainNavigator() {
    const { user } = useAuth();
    const navigation = useNavigation();

    // Notification setup effect
    useEffect(() => {
        const setupNotifications = async () => {
            try {
                // Get FCM token
                const token = await getFCMToken();
                if (token && user) {
                    // Update token on backend
                    await updateFCMToken(token);
                }

                // Set up notification received listener
                const receivedSubscription = onMessageReceived(notification => {
                    console.log('Received notification:', notification);
                });

                // Set up notification response listener (when user clicks the notification)
                const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
                    const data = response.notification.request.content.data;
                    console.log('Notification clicked:', data);

                    if (data.type === 'story' && data.storyId) {
                        // Navigate to the specific story
                        navigation.navigate('Dashboard', {
                            screen: 'Stories',
                            params: {
                                screen: 'StoryReading',
                                params: { storyId: data.storyId }
                            }
                        });
                    }
                });

                return () => {
                    receivedSubscription.remove();
                    responseSubscription.remove();
                };
            } catch (error) {
                console.error('Error setting up notifications:', error);
            }
        };

        if (user) {
            setupNotifications();
        }
    }, [user, navigation]);

    return (
        <Stack.Navigator 
            initialRouteName={user ? "Dashboard" : "Login"}
            screenListeners={{
                state: (e) => {
                    console.log('Screen state changed:', e.data);
                }
            }}
        >
            <Stack.Screen 
                name="Login" 
                component={LoginScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen 
                name="Home" 
                component={HomeScreen}
                options={{ 
                    headerLeft: null,
                    gestureEnabled: false
                }}
            />
            <Stack.Screen 
                name="Settings" 
                component={UserSettingsScreen}
                options={{
                    title: 'Settings',
                    headerBackTitle: 'Back'
                }}
            />
            <Stack.Screen 
                name="Dashboard" 
                component={DashboardScreen}
                options={({ navigation }) => ({
                    title: 'My Dashboard',
                    headerLeft: null,
                    gestureEnabled: false,
                    headerRight: () => (
                        <HeaderSettingsButton 
                            onPress={() => navigation.navigate('Settings')}
                        />
                    )
                })}
            />
            <Stack.Screen 
                name="Admin" 
                component={AdminScreen}
                options={{
                    title: 'Admin Panel',
                    headerLeft: null,
                    gestureEnabled: false
                }}
            />
            <Stack.Screen 
                name="StorySettings" 
                component={StorySettingsScreen}
                options={{
                    title: 'Story Settings',
                    headerBackTitle: 'Back'
                }}
            />
            <Stack.Screen 
                name="StoryReading" 
                component={StoryReadingScreen}
                options={{
                    title: 'Story',
                    headerBackTitle: 'Back'
                }}
            />
        </Stack.Navigator>
    );
}

function AppContent() {
    const { isReady } = useAuth();

    if (!isReady) {
        return null;
    }

    return (
        <View style={{ flex: 1 }}>
            <NavigationContainer 
                linking={linking}
                onStateChange={(state) => {
                    console.log('Navigation state changed:', state);
                }}
            >
                <MainNavigator />
            </NavigationContainer>
        </View>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}