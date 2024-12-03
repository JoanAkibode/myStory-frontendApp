import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';

// Use localhost for web, IP for mobile
const BACKEND_URL = Platform.OS === 'web' 
    ? 'http://localhost:8000' 
    : 'https://8958-2a01-cb04-65e-8c00-7c0b-8b47-d97d-9fc4.ngrok-free.app';

export const googleAuth = {
    initiateLogin: async () => {
        try {
            console.log('Starting login process...');
            console.log('Platform:', Platform.OS);
            console.log('Backend URL:', BACKEND_URL);

            // Add headers and specify method
            const response = await fetch(`${BACKEND_URL}/auth/google`, {
                method: 'GET',
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
            
            console.log('Opening URL:', url);
            await Linking.openURL(url);
            return { success: true };

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