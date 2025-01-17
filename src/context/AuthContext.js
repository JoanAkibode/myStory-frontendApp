import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl } from '../utils/config';

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

    // When the app starts, check if we have stored authentication data
    // This allows users to stay logged in even after closing the app
    useEffect(() => {
        checkStoredAuth();
    }, []);

    // Check AsyncStorage for saved user data and token
    // AsyncStorage is React Native's persistent storage system
    const checkStoredAuth = async () => {
        try {
            const storedUser = await AsyncStorage.getItem('user');
            const storedToken = await AsyncStorage.getItem('token');
            
            if (storedUser && storedToken) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error('Error checking stored auth:', error);
        } finally {
            setLoading(false);
        }
    };

    // Login function: stores user data and token in AsyncStorage
    // and updates the user state
    const login = async (userData, token) => {
        try {
            await AsyncStorage.setItem('user', JSON.stringify(userData));
            await AsyncStorage.setItem('token', token);
            setUser(userData);
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

    // The Provider component makes the auth context available to all child components
    // We pass down: user (current user data)
    //              loading (auth checking status)
    //              login (function to log users in)
    //              logout (function to log users out)
    return (
        <AuthContext.Provider value={{ user, loading, login, signOut }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

// Custom hook to easily access auth context in any component
// Usage: const { user, login, logout } = useAuth();
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};