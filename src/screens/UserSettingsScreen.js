import React, { useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    Image,
    Alert,
    TextInput,
    Modal 
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl } from '../utils/config';

export default function UserSettingsScreen({ navigation }) {
    const { user, signOut } = useAuth();
    const [loading, setLoading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState('');

    const handleLogout = async () => {
        try {
            setLoading(true);
            await signOut();
            navigation.replace('Login');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmation.toLowerCase() !== 'delete account') {
            Alert.alert('Error', 'Please type "delete account" to confirm');
            return;
        }

        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${getApiUrl()}/user/profile`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                await signOut();
                navigation.replace('Login');
            } else {
                Alert.alert('Error', 'Failed to delete account');
            }
        } catch (error) {
            console.error('Delete account error:', error);
            Alert.alert('Error', 'Failed to delete account');
        } finally {
            setShowDeleteModal(false);
            setDeleteConfirmation('');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Image 
                    style={styles.avatar}
                    source={{ uri: user?.picture }} 
                />
                <Text style={styles.name}>{user?.name}</Text>
                <Text style={styles.email}>{user?.email}</Text>
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity 
                    style={styles.button}
                    onPress={handleLogout}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>Sign Out</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.button, styles.deleteButton]}
                    onPress={() => setShowDeleteModal(true)}
                >
                    <Text style={styles.deleteButtonText}>Delete Account</Text>
                </TouchableOpacity>
            </View>

            <Modal
                visible={showDeleteModal}
                transparent={true}
                animationType="slide"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Delete Account</Text>
                        <Text style={styles.modalText}>
                            This action cannot be undone. Please type "delete account" to confirm.
                        </Text>
                        <TextInput
                            style={styles.confirmInput}
                            value={deleteConfirmation}
                            onChangeText={setDeleteConfirmation}
                            placeholder="Type 'delete account'"
                            autoCapitalize="none"
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => {
                                    setShowDeleteModal(false);
                                    setDeleteConfirmation('');
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={handleDeleteAccount}
                            >
                                <Text style={styles.confirmButtonText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    name: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 10,
    },
    email: {
        color: '#666',
        marginTop: 5,
    },
    buttonContainer: {
        padding: 20,
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 8,
        marginVertical: 5,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    deleteButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#FF3B30',
    },
    deleteButtonText: {
        color: '#FF3B30',
        fontSize: 16,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        width: '80%',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    modalText: {
        textAlign: 'center',
        marginBottom: 20,
        color: '#666',
    },
    confirmInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        width: '100%',
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    modalButton: {
        padding: 15,
        borderRadius: 8,
        width: '45%',
    },
    cancelButton: {
        backgroundColor: '#eee',
    },
    confirmButton: {
        backgroundColor: '#FF3B30',
    },
    cancelButtonText: {
        color: '#666',
        textAlign: 'center',
        fontWeight: '600',
    },
    confirmButtonText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: '600',
    }
}); 