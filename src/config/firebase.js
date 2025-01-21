import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl } from '../utils/config';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC1i7gDkrszvD66UyUsHqMCi5kUJeAjTpc",
  authDomain: "mystory-3de1d.firebaseapp.com",
  projectId: "mystory-3de1d",
  storageBucket: "mystory-3de1d.firebasestorage.app",
  messagingSenderId: "948826044299",
  appId: "1:948826044299:web:34080993a74f62d26fa18e",
  measurementId: "G-WM5J01SZVJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get FCM token based on platform
export async function getFCMToken() {
    try {
        if (Platform.OS === 'web') {
            console.log('Getting FCM token for web platform');
            const messaging = getMessaging(app);
            
            try {
                // Check if notifications are supported
                if (!('Notification' in window)) {
                    console.log('This browser does not support notifications');
                    return null;
                }

                // Check notification permission status
                const permission = Notification.permission;
                console.log('Current notification permission status:', permission);

                if (permission === 'denied') {
                    console.log('Notifications are blocked. Please enable them in your browser settings.');
                    // You might want to show a UI element here guiding the user to enable notifications
                    return null;
                }

                // Request permission using getToken directly
                console.log('Requesting FCM token with VAPID key...');
                const currentToken = await getToken(messaging, {
                    vapidKey: "BI5-Oj9OTIpypQRxfT7zLdj_POClueYrebfzyFeqFtZDkFYg9pQfJH7E3VSoBAzF_BBZ7wDfMr3Joftu3nhkPgM"
                });
                
                if (currentToken) {
                    console.log('Web FCM Token received successfully');
                    return currentToken;
                } else {
                    console.log('No registration token available. Request permission to generate one.');
                    return null;
                }
            } catch (error) {
                if (error.code === 'messaging/permission-blocked') {
                    console.log('Notifications are blocked by the browser. To receive notifications, please:');
                    console.log('1. Click the lock icon in your browser\'s address bar');
                    console.log('2. Find "Notifications" in the permissions list');
                    console.log('3. Change the setting to "Allow"');
                } else {
                    console.error('Error getting token:', error);
                }
                return null;
            }
        } else {
            // Request permission for mobile
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            
            if (finalStatus !== 'granted') {
                throw new Error('Notification permission denied');
            }

            // Get token for mobile
            const token = await Notifications.getExpoPushTokenAsync({
                projectId: "0f8c6544-565a-49f0-aa9c-f9890a56c009"
            });
            console.log('Mobile FCM Token:', token.data);
            return token.data;
        }
    } catch (error) {
        console.error('Error getting FCM token:', error);
        return null;
    }
}

// Update FCM token on backend
export async function updateFCMToken(token) {
    try {
        console.log('Starting FCM token update with token:', token);
        const storedToken = await AsyncStorage.getItem('token');
        if (!storedToken) {
            throw new Error('No authentication token found');
        }
        console.log('Auth token found, sending request to update FCM token');

        const requestBody = { fcmToken: token };
        console.log('Request body:', requestBody);

        const response = await fetch(`${getApiUrl()}/user/fcm-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${storedToken}`
            },
            body: JSON.stringify(requestBody)
        });

        const responseText = await response.text();
        console.log('Server response:', response.status, responseText);

        if (!response.ok) {
            console.error('Failed to update FCM token:', responseText);
            throw new Error('Failed to update FCM token on server');
        }

        console.log('FCM token updated successfully on server');
        
        // Verify the token was stored
        const user = await AsyncStorage.getItem('user');
        console.log('Current user:', user ? JSON.parse(user) : null);
    } catch (error) {
        console.error('Error updating FCM token:', error);
        throw error; // Re-throw to handle in the calling code
    }
}

// Handle incoming messages based on platform
export function onMessageReceived(callback) {
    if (Platform.OS === 'web') {
        const messaging = getMessaging(app);
        return onMessage(messaging, (payload) => {
            console.log('Received web message:', payload);
            callback(payload);
        });
    } else {
        return Notifications.addNotificationReceivedListener((notification) => {
            console.log('Received mobile notification:', notification);
            callback(notification);
        });
    }
}

// Set up notification handler for mobile
if (Platform.OS !== 'web') {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
        }),
    });
}

export default app; 