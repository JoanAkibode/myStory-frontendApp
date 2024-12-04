import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Button } from 'react-native';
import EventsScreen from './EventsScreen';
import StoriesScreen from './StoriesScreen';
import { useAuth } from '../context/AuthContext';

const Tab = createBottomTabNavigator();

export default function DashboardScreen({ navigation }) {
    const { user } = useAuth();

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <Button
                    onPress={() => navigation.navigate('Home')}
                    title="Home"
                    color="#007AFF"
                />
            ),
        });
    }, [navigation]);

    return (
        <Tab.Navigator>
            <Tab.Screen 
                name="Events" 
                component={EventsScreen}
                options={{
                    title: 'My Events'
                }}
            />
            <Tab.Screen 
                name="Stories" 
                component={StoriesScreen}
                options={{
                    title: 'My Stories'
                }}
            />
        </Tab.Navigator>
    );
} 