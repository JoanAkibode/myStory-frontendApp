import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Button, View, TouchableOpacity, Text, StyleSheet, Platform, Pressable } from 'react-native';
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

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View style={styles.headerButtons}>
                    <TouchableOpacity 
                        style={styles.settingsButton}
                        onPress={() => navigation.navigate('StorySettings')}
                    >
                        <Text style={styles.settingsButtonText}>✏️</Text>
                    </TouchableOpacity>
                    <Pressable 
                        onPress={() => navigation.navigate('Settings')}
                        style={({ pressed }) => ({
                            marginRight: 15,
                            opacity: pressed ? 0.5 : 1
                        })}
                    >
                        {Platform.select({
                            web: <span style={{ fontSize: 24 }}>⚙️</span>,
                            default: <Text style={{ fontSize: 24 }}>⚙️</Text>
                        })}
                    </Pressable>
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