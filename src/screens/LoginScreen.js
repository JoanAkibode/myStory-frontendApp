import React, { useEffect } from 'react';
import { View, Button, Text, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import * as Linking from 'expo-linking';
import { googleAuth } from '../services/auth';  // Import the auth service

export default function LoginScreen({ navigation }) {
    const { login } = useAuth();

    useEffect(() => {
        const handleDeepLink = async (event) => {
            try {
                console.log('Deep link received:', event.url);
                const { queryParams } = Linking.parse(event.url);
                
                if (queryParams.token) {
                    console.log('Token found in params');
                    const response = await fetch('http://192.168.1.33:8000/auth/exchange-token', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ token: queryParams.token })
                    });

                    if (response.ok) {
                        const { token, user } = await response.json();
                        console.log('Login successful:', { user });
                        await login(user, token);
                        navigation.replace('Dashboard');
                    } else {
                        console.error('Token exchange failed:', await response.text());
                    }
                }
            } catch (error) {
                console.error('Error handling deep link:', error);
            }
        };

        // Check initial URL
        Linking.getInitialURL().then(url => {
            console.log('Initial URL:', url);
            if (url) {
                handleDeepLink({ url });
            }
        });

        const subscription = Linking.addEventListener('url', handleDeepLink);
        return () => subscription.remove();
    }, []);

    const handleLogin = async () => {
        try {
            const result = await googleAuth.initiateLogin();
            if (!result.success) {
                console.error('Login failed:', result.error);
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