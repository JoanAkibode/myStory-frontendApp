import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const [_, response, promptAsync] = Google.useAuthRequest({
        webClientId: '506954391533-ka7n9dl5q7gsps63plbp88snejhjnsrc.apps.googleusercontent.com',
        scopes: [
            'profile', 
            'email',
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events'
        ],
        // androidClientId: 'GOOGLE_GUID.apps.googleusercontent.com',
        // iosClientId: 'GOOGLE_GUID.apps.googleusercontent.com',
    });

    useEffect(() => {
        checkExistingToken();
    }, []);

    useEffect(() => {
        if (response?.type === 'success') {
            exchangeToken(response.authentication.accessToken);
        }
    }, [response]);

    const exchangeToken = async (googleToken) => {
        try {
            const response = await fetch('${getApiUrl()}/auth/google-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token: googleToken })
            });

            const data = await response.json();
            if (response.ok) {
                await login(data.token, data.user);
            } else {
                throw new Error(data.error || 'Auth failed');
            }
        } catch (error) {
            console.error('Token exchange failed:', error);
        }
    };

    const checkExistingToken = async () => {
        try {
            const savedToken = await AsyncStorage.getItem('token');
            if (savedToken) {
                const response = await fetch('${getApiUrl()}/auth/google/verify', {
                    headers: {
                        'Authorization': `Bearer ${savedToken}`
                    }
                });
                
                if (response.ok) {
                    const userData = await response.json();
                    setToken(savedToken);
                    setUser(userData);
                } else {
                    await AsyncStorage.removeItem('token');
                }
            }
        } catch (error) {
            console.error('Error checking token:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (token, userData) => {
        try {
            await AsyncStorage.setItem('token', token);
            setToken(token);
            setUser(userData);
        } catch (error) {
            console.error('Login error:', error);
        }
    };

    const startLogin = async () => {
        try {
            await promptAsync();
        } catch (error) {
            console.error('Google auth error:', error);
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.removeItem('token');
            setToken(null);
            setUser(null);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const isAdmin = () => {
        return user?.email === 'akibodejoan@gmail.com';
    };

    if (loading) {
        return null;
    }

    return (
        <AuthContext.Provider value={{ 
            token, 
            user, 
            login: startLogin, 
            logout,
            isAdmin,
            isAuthenticated: !!token 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext); 