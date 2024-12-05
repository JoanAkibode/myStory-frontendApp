import { StyleSheet } from 'react-native';

export const adminStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    addSection: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    listSection: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 4,
        padding: 10,
        marginBottom: 10,
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 10,
        borderRadius: 4,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: '500',
    },
    card: {  // This replaces settingCard
        backgroundColor: '#f5f5f5',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
    },
    cardName: {  // This replaces settingName
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 5,
    },
    cardDescription: {  // This replaces settingDescription
        color: '#666',
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardValue: {
        color: '#444',
        flex: 1,
        fontSize: 14,
    },
    cardActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
    },
    editButton: {
        backgroundColor: '#4CAF50',
    },
    deleteButton: {
        backgroundColor: '#f44336',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    subTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 15,
        marginBottom: 10,
    },
    labelText: {
        fontWeight: '600',
        color: '#333',
        fontSize: 15,
        marginRight: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    activeBadge: {
        backgroundColor: '#4CAF50',
    },
    inactiveBadge: {
        backgroundColor: '#666',
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
}); 