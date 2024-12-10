import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import SettingsTab from './admin/SettingsTab';
import WorldsTab from './admin/WorldsTab';
import PlotsTab from './admin/PlotsTab';
import PlaygroundTab from './admin/PlaygroundTab';

export default function AdminScreen() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('playground');

    if (Platform.OS !== 'web' || user.email !== 'akibodejoan@gmail.com') {
        return <View style={styles.container}><Text>Access Denied</Text></View>;
    }

    const renderTab = () => {
        switch(activeTab) {
            case 'settings':
                return <SettingsTab />;
            case 'worlds':
                return <WorldsTab />;
            case 'plots':
                return <PlotsTab />;
            case 'playground':
                return <PlaygroundTab />;
            default:
                return null;
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.tabBar}>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
                    onPress={() => setActiveTab('settings')}
                >
                    <Text style={styles.tabText}>Settings</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'worlds' && styles.activeTab]}
                    onPress={() => setActiveTab('worlds')}
                >
                    <Text style={styles.tabText}>Worlds</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'plots' && styles.activeTab]}
                    onPress={() => setActiveTab('plots')}
                >
                    <Text style={styles.tabText}>Plots</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'playground' && styles.activeTab]}
                    onPress={() => setActiveTab('playground')}
                >
                    <Text style={styles.tabText}>Playground</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.tabContent}>
                {renderTab()}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    tabBar: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    tab: {
        flex: 1,
        padding: 15,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#007AFF',
    },
    tabText: {
        fontSize: 16,
    },
    tabContent: {
        flex: 1,
        padding: 20,
    },
}); 