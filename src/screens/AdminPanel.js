import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AdminPanel() {
  const [modalVisible, setModalVisible] = useState(false);

  const handleSeedUsers = async () => {
    try {
      const response = await fetch('http://localhost:3000/admin/seed-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await AsyncStorage.getItem('userToken')}`
        }
      });
      const data = await response.json();
      console.log('Seeded users:', data);
    } catch (error) {
      console.error('Error seeding users:', error);
    }
  };

  const handleGenerateStories = async () => {
    try {
      const response = await fetch('http://localhost:3000/admin/generate-stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await AsyncStorage.getItem('userToken')}`
        }
      });
      const data = await response.json();
      console.log('Generated stories:', data);
    } catch (error) {
      console.error('Error generating stories:', error);
    }
  };

  return (
    <>
      <TouchableOpacity 
        style={styles.adminButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.adminButtonText}>Admin Panel</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Admin Controls</Text>
          
          <TouchableOpacity 
            style={styles.button}
            onPress={handleSeedUsers}
          >
            <Text>Seed Test Users</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.button}
            onPress={handleGenerateStories}
          >
            <Text>Generate Stories</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.closeButton]}
            onPress={() => setModalVisible(false)}
          >
            <Text>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  adminButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
  },
  adminButtonText: {
    color: 'white',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#F0F0F0',
    padding: 15,
    borderRadius: 5,
    marginVertical: 5,
    width: '100%',
    alignItems: 'center',
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#FF3B30',
  }
});
