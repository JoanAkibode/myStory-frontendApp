import React, { useEffect } from 'react';
import { View, Button, Text, StyleSheet, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';

export default function LoginScreen({ navigation, route }) {
    const { login } = useAuth();

    useEffect(() => {
        // Subscribe to deep link events
        const subscription = Linking.addEventListener('url', handleDeepLink);
        return () => {
            subscription.remove();
        };
    }, []);

    const handleDeepLink = async (event) => {
        try {
            console.log('Received deep link:', event.url);
            const { queryParams } = Linking.parse(event.url);
            
            if (queryParams.data) {
                const parsedData = JSON.parse(decodeURIComponent(queryParams.data));
                console.log('Parsed auth data:', parsedData);
                
                await login(parsedData.user, parsedData.token);
                navigation.replace('Home');
            }
        } catch (error) {
            console.error('Error handling deep link:', error);
        }
    };

    const handleLogin = async () => {
        try {
            const loginUrl = `http://192.168.1.33:8000/auth/google?platform=mobile`;
            console.log('Full login URL:', loginUrl);
            
            console.log('Making fetch request...');
            const response = await fetch(loginUrl);
            console.log('Response received:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Data from backend:', data);
            
            if (data.url) {
                console.log('Opening Google auth URL:', data.url);
                await Linking.openURL(data.url);
            } else {
                console.log('No URL received from backend');
            }
        } catch (error) {
            console.error('Login error:', error);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>MyStory</Text>
            <Button 
                title="Sign in with Google" 
                onPress={handleLogin}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
    }
});