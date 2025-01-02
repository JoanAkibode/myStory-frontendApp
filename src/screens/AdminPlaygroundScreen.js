import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import PlotsTab from './admin/PlotsTab';
import WorldsTab from './admin/WorldsTab';
import MonitoringTab from './admin/MonitoringTab';

const Tab = createMaterialTopTabNavigator();

const AdminPlaygroundScreen = () => {
    return (
        <Tab.Navigator>
            <Tab.Screen 
                name="Monitoring" 
                component={MonitoringTab}
                options={{ tabBarLabel: 'Stats' }}
            />
            <Tab.Screen 
                name="Plots" 
                component={PlotsTab}
                options={{ tabBarLabel: 'Plots' }}
            />
            <Tab.Screen 
                name="Worlds" 
                component={WorldsTab}
                options={{ tabBarLabel: 'Worlds' }}
            />
        </Tab.Navigator>
    );
};

export default AdminPlaygroundScreen; 