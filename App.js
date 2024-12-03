import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider } from './src/context/AuthContext';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import * as Linking from 'expo-linking';

const Stack = createNativeStackNavigator();

const prefix = Linking.createURL('/');

const linking = {
    prefixes: ['mystory://', prefix],
    config: {
        screens: {
            Login: {
                path: 'auth/callback',
                parse: {
                    data: (data) => decodeURIComponent(data)
                }
            },
            Home: 'home'
        }
    }
};

export default function App() {
    return (
        <AuthProvider>
            <NavigationContainer linking={linking}>
                <Stack.Navigator initialRouteName="Login">
                    <Stack.Screen 
                        name="Login" 
                        component={LoginScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen 
                        name="Home" 
                        component={HomeScreen}
                        options={{ 
                            headerLeft: null,
                            gestureEnabled: false
                        }}
                    />
                </Stack.Navigator>
            </NavigationContainer>
        </AuthProvider>
    );
}