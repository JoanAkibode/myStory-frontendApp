import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import styles from '../styles/styles';

const AdminPlaygroundScreen = () => {
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        // Implement story generation logic here
    }, []);

    return (
        <ScrollView style={styles.container}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Story Generation</Text>
                <TouchableOpacity 
                    style={styles.button}
                    onPress={generateTodayStory}
                    disabled={generating}
                >
                    <Text style={styles.buttonText}>
                        {generating ? 'Generating...' : "Write Today's Story"}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Other admin tools */}
        </ScrollView>
    );
};

export default AdminPlaygroundScreen; 