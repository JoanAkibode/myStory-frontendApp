import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl } from '../utils/config';
import { getFCMToken } from '../config/firebase';

// Create a Context object. This will be used to share authentication state
// across all components in our app without prop drilling
const AuthContext = createContext(null);

// AuthProvider is a component that wraps our entire app and makes the
// authentication state available to any child component that needs it
export const AuthProvider = ({ children }) => {
    // user: stores the currently authenticated user's data
    // null means no user is logged in
    const [user, setUser] = useState(null);

    // loading: indicates if we're checking for stored auth data
    // useful to show loading screens while we check if user is already logged in
    const [loading, setLoading] = useState(true);

    // isReady: indicates if the AuthProvider has finished initializing
    const [isReady, setIsReady] = useState(false);

    // When the app starts, check if we have stored authentication data
    // This allows users to stay logged in even after closing the app
    useEffect(() => {
        console.log('=== Auth Provider Mounted ===');
        checkStoredAuth();
    }, []);

    // Check AsyncStorage for saved user data and token
    // AsyncStorage is React Native's persistent storage system
    const checkStoredAuth = async () => {
        console.log('Checking stored auth...');
        try {
            const storedUser = await AsyncStorage.getItem('user');
            const storedToken = await AsyncStorage.getItem('token');
            
            console.log('Stored auth state:', {
                hasUser: !!storedUser,
                hasToken: !!storedToken
            });
            
            if (storedUser && storedToken) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    console.log('Successfully parsed user data');
                    setUser(parsedUser);
                    await updateFCMToken(storedToken);
                } catch (parseError) {
                    console.error('Error parsing stored user data:', parseError);
                    // Clear invalid data
                    await AsyncStorage.removeItem('user');
                    await AsyncStorage.removeItem('token');
                }
            }
        } catch (error) {
            console.error('Error checking stored auth:', error);
        } finally {
            console.log('Auth check complete. Setting states:', {
                loading: false,
                isReady: true,
                hasUser: !!user
            });
            setLoading(false);
            setIsReady(true);
        }
    };

    // Login function: stores user data and token in AsyncStorage
    // and updates the user state
    const login = async (userData, token) => {
        try {
            await AsyncStorage.setItem('user', JSON.stringify(userData));
            await AsyncStorage.setItem('token', token);
            setUser(userData);
            await updateFCMToken(token);
        } catch (error) {
            console.error('Error storing auth data:', error);
            throw error;
        }
    };

    // Logout function: removes stored auth data and clears user state
    const signOut = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            
            if (token) {
                try {
                    await fetch(`${getApiUrl()}/auth/logout`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                } catch (error) {
                    console.error('Error notifying backend about logout:', error);
                }
            }

            await AsyncStorage.clear();
            setUser(null);
        } catch (error) {
            console.error('Error during logout:', error);
        }
    };

    const updateFCMToken = async (token) => {
        try {
            const fcmToken = await getFCMToken();
            if (fcmToken && token) {
                const response = await fetch(`${getApiUrl()}/user/fcm-token`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ fcmToken })
                });
                
                if (!response.ok) {
                    console.error('Failed to update FCM token');
                }
            }
        } catch (error) {
            console.error('Error updating FCM token:', error);
        }
    };

    // The Provider component makes the auth context available to all child components
    // We pass down: user (current user data)
    //              loading (auth checking status)
    //              login (function to log users in)
    //              logout (function to log users out)
    return (
        <AuthContext.Provider value={{ 
            user, 
            loading, 
            login, 
            signOut,
            isReady
        }}>
            {isReady && children}
        </AuthContext.Provider>
    );
};

// Custom hook to easily access auth context in any component
// Usage: const { user, login, logout } = useAuth();
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        console.error('useAuth must be used within an AuthProvider');
        // Return default values instead of throwing
        return {
            user: null,
            loading: false,
            login: () => {},
            signOut: () => {},
            isReady: false
        };
    }
    return context;
};