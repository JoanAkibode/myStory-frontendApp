import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Button, View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import EventsScreen from './EventsScreen';
import StoriesScreen from './StoriesScreen';
import { useAuth } from '../context/AuthContext';

const Tab = createBottomTabNavigator();

export default function DashboardScreen({ navigation }) {
    const { user, signOut } = useAuth();

    const handleLogout = async () => {
        await signOut();
        navigation.replace('Login');
    };

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View style={styles.headerButtons}>
                    <TouchableOpacity 
                        style={styles.settingsButton}
                        onPress={() => navigation.navigate('StorySettings')}
                    >
                        <Text style={styles.settingsButtonText}>✏️</Text>
                    </TouchableOpacity>
                    <Button
                        onPress={() => navigation.navigate('Home')}
                        title="Home"
                        color="#007AFF"
                    />
                    <Button
                        onPress={handleLogout}
                        title="Logout"
                        color="#FF3B30"
                    />
                </View>
            ),
        });
    }, [navigation]);

    return (
        <Tab.Navigator>
            <Tab.Screen 
                name="Events" 
                component={EventsScreen}
                options={{
                    title: 'My Events',
                    headerShown: false
                }}
            />
            <Tab.Screen 
                name="Stories" 
                component={StoriesScreen}
                options={{
                    title: 'My Stories',
                    headerShown: false
                }}
            />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 10,
        gap: 10
    },
    settingsButton: {
        marginRight: 5,
        padding: 5,
    },
    settingsButtonText: {
        fontSize: 24,
    }
}); 