import AsyncStorage from '@react-native-async-storage/async-storage';

export const handleAuthError = async (response, navigation, signOut) => {
    if (response.status === 401) {
        console.log('Token expired or invalid, redirecting to login');
        await signOut();
        navigation.replace('Login');
        return true;
    }
    return false;
};

export const getAuthToken = async (navigation, signOut) => {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
        console.log('No token found, redirecting to login');
        await signOut();
        navigation.replace('Login');
        return null;
    }
    return token;
}; 