import React, { useEffect } from 'react';
import { getFCMToken, onMessageReceived } from './config/firebase';
// ... other imports ...

function App() {
    useEffect(() => {
        // Request notification permission and get FCM token
        const setupNotifications = async () => {
            const token = await getFCMToken();
            if (token) {
                // Send this token to your backend
                try {
                    const response = await fetch('/api/user/update-fcm-token', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${yourAuthToken}` // Add your auth token here
                        },
                        body: JSON.stringify({ fcmToken: token })
                    });
                    console.log('FCM token updated:', await response.json());
                } catch (error) {
                    console.error('Error updating FCM token:', error);
                }
            }
        };

        setupNotifications();

        // Listen for messages
        const unsubscribe = onMessageReceived((message) => {
            console.log('Received message:', message);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    // ... rest of your App component
}

export default App; 