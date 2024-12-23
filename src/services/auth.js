import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { authConfig } from '../config/auth';
import * as Linking from 'expo-linking';

// Use localhost for web, IP for mobile
const BACKEND_URL = Platform.OS === 'web' 
    ? 'http://localhost:8000' 
    : 'http://192.168.1.33:8000';

export const googleAuth = {
    initiateLogin: async () => {
        try {
            console.log('Starting login process...');
            console.log('Platform:', Platform.OS);
            console.log('Backend URL:', BACKEND_URL);

            // Add platform parameter to URL
            const platform = Platform.OS === 'web' ? 'web' : 'mobile';
            const response = await fetch(`${BACKEND_URL}/auth/google?platform=${platform}`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });

            console.log('Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Response data:', data);
            const { url } = data;

            if (Platform.OS === 'web') {
                window.location.href = url;
                return { success: true };
            }
            
            // For mobile, use WebBrowser
            const result = await WebBrowser.openAuthSessionAsync(
                url,
                authConfig.redirectUri
            );

            if (result.type === 'success') {
                return { success: true };
            }

            return { success: false, error: 'Auth cancelled' };

        } catch (error) {
            console.error('Login error details:', {
                message: error.message,
                stack: error.stack,
                platform: Platform.OS,
                url: BACKEND_URL
            });
            return { success: false, error };
        }
    }
};