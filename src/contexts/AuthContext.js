const updateFCMToken = async (token) => {
    console.log('Starting FCM token update process...');
    try {
        console.log('Requesting FCM token from Firebase...');
        const fcmToken = await getFCMToken();
        console.log('FCM token received:', fcmToken ? 'Token present' : 'No token');
        
        if (fcmToken && token) {
            console.log('Sending FCM token to backend...');
            const response = await fetch(`${getApiUrl()}/user/fcm-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ fcmToken })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Failed to update FCM token:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorText
                });
                throw new Error('Failed to update FCM token on server');
            }

            console.log('FCM token successfully updated on server');
        } else {
            console.log('Skipping FCM token update:', {
                hasFcmToken: !!fcmToken,
                hasAuthToken: !!token
            });
        }
    } catch (error) {
        console.error('Error in updateFCMToken:', error.message, error.stack);
    }
}; 