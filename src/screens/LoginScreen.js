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
                const { queryParams } = Linking.parse(event.url);
                if (queryParams.data) {
                    let authData;
                    if (typeof queryParams.data === 'string') {
                        authData = JSON.parse(decodeURIComponent(queryParams.data));
                    } else {
                        authData = queryParams.data;
                    }
                    
                    if (authData.token && authData.user) {
                        await login(authData.user, authData.token);
                        navigation.replace('Dashboard');
                    }
                }
            } catch (error) {
                console.error('Error handling deep link:', error);
            }
        };

        Linking.getInitialURL().then(url => {
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