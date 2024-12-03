import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen({ navigation }) {
    // Get user data and logout function from AuthContext
    const { user, logout } = useAuth();

    // Handler for logout button press
    const handleLogout = async () => {
        // Clear auth data from context
        await logout();
        // Navigate back to login screen
        // Using replace instead of navigate to prevent going back
        navigation.replace('Login');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome to MyStory</Text>
            {/* Only show user info and logout button if user is logged in */}
            {user && (
                <>
                    <Text style={styles.text}>Logged in as: {user.name}</Text>
                    <Text style={styles.text}>Email: {user.email}</Text>
                    <Button title="Logout" onPress={handleLogout} />
                </>
            )}
        </View>
    );
}

// Styles for the home screen
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
    },
    text: {
        fontSize: 16,
        marginBottom: 10,
    },
});
