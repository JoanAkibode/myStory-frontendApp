import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
            // Try to get stored user data and token
            const storedUser = await AsyncStorage.getItem('user');
            const storedToken = await AsyncStorage.getItem('token');
            
            // If both exist, we can restore the user's session
            if (storedUser && storedToken) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error('Error checking stored auth:', error);
        } finally {
            // Whether successful or not, we're done loading
            setLoading(false);
        }
    };

    // Login function: stores user data and token in AsyncStorage
    // and updates the user state
    const login = async (userData, token) => {
        try {
            // Store auth data persistently
            await AsyncStorage.setItem('user', JSON.stringify(userData));
            await AsyncStorage.setItem('token', token);
            // Update current user state
            setUser(userData);
        } catch (error) {
            console.error('Error storing auth data:', error);
        }
    };

    // Logout function: removes stored auth data and clears user state
    const logout = async () => {
        try {
            // Remove stored auth data
            await AsyncStorage.removeItem('user');
            await AsyncStorage.removeItem('token');
            // Clear current user state
            setUser(null);
        } catch (error) {
            console.error('Error removing auth data:', error);
        }
    };

    // The Provider component makes the auth context available to all child components
    // We pass down: user (current user data)
    //              loading (auth checking status)
    //              login (function to log users in)
    //              logout (function to log users out)
    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {/* Only render children when we're done checking stored auth */}
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