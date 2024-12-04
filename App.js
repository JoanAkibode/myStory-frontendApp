import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import * as Linking from 'expo-linking';
import DashboardScreen from './src/screens/DashboardScreen';

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
            Home: 'home'
        }
    }
};

export default function AppWrapper() {
    return (
        <AuthProvider>
            <App />
        </AuthProvider>
    );
}

function App() {
    const { user, loading } = useAuth();
    console.log('App render - User state:', !!user, 'Loading:', loading);

    if (loading) {
        return null; // or a loading screen
    }

    return (
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
                    name="Dashboard" 
                    component={DashboardScreen}
                    options={{
                        title: 'My Dashboard',
                        headerLeft: null,
                        gestureEnabled: false
                    }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}