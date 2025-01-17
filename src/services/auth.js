import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { authConfig } from '../config/auth';
import * as Linking from 'expo-linking';
import { getApiUrl } from '../utils/config';

export const googleAuth = {
    initiateLogin: async () => {
        try {
            console.log('Starting login process...');
            const apiUrl = getApiUrl();
            
            // Get the current origin
            const origin = Platform.OS === 'web' 
                ? window.location.origin 
                : Linking.createURL('');
                
            console.log('Origin:', origin);
            
            const response = await fetch(`${apiUrl}/auth/google`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Origin': origin
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
                Linking.createURL('auth/callback')
            );

            console.log('WebBrowser result:', result);

            if (result.type === 'success') {
                // Handle the successful authentication
                const { url: responseUrl } = result;
                console.log('Auth response URL:', responseUrl);
                const params = new URLSearchParams(responseUrl.split('?')[1]);
                const callbackToken = params.get('token');
                
                if (callbackToken) {
                    // Exchange the callback token
                    const exchangeResponse = await fetch(`${apiUrl}/auth/exchange-token`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ token: callbackToken })
                    });

                    if (!exchangeResponse.ok) {
                        throw new Error('Token exchange failed');
                    }

                    const { token, user } = await exchangeResponse.json();
                    console.log('Token exchange successful:', { user });
                    
                    await AsyncStorage.setItem('userToken', token);
                    await AsyncStorage.setItem('user', JSON.stringify(user));
                    return { success: true, token, user };
                }
            }

            return { success: false, error: 'Auth cancelled' };

        } catch (error) {
            console.error('Login error details:', {
                message: error.message,
                stack: error.stack,
                platform: Platform.OS,
                url: getApiUrl()
            });
            return { success: false, error };
        }
    }
};