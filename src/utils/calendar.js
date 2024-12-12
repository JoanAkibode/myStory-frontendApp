import AsyncStorage from '@react-native-async-storage/async-storage';

export const fetchCalendarEvents = async () => {
    try {
        const accessToken = await AsyncStorage.getItem('accessToken');
        if (!accessToken) {
            throw new Error('No access token found');
        }

        const response = await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events',
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch calendar events');
        }

        const data = await response.json();
        return data.items;
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        throw error;
    }
}; 