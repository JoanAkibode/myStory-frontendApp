import React, { useEffect } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
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
            Dashboard: 'dashboard',
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

function AppContent() {
    const { user, isReady } = useAuth();

    useEffect(() => {
        const setupNotifications = async () => {
            try {
                // Get FCM token
                const token = await getFCMToken();
                if (token && user) {
                    // Update token on backend
                    await updateFCMToken(token);
                }

                // Set up notification listener
                const subscription = onMessageReceived(notification => {
                    console.log('Received notification:', notification);
                    // Handle the notification as needed
                });

                return () => {
                    subscription.remove();
                };
            } catch (error) {
                console.error('Error setting up notifications:', error);
            }
        };

        if (isReady && user) {
            setupNotifications();
        }
    }, [isReady, user]);

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