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
    inputLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
        marginTop: 10,
        fontWeight: '500',
    },
    sliderContainer: {
        marginBottom: 20,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    sliderValue: {
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF',
    },
    sliderLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
    },
    sliderLabel: {
        fontSize: 12,
        color: '#666',
    },
    userList: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    userCard: {
        backgroundColor: '#f5f5f5',
        padding: 15,
        borderRadius: 8,
        marginRight: 10,
        minWidth: 150,
    },
    selectedCard: {
        backgroundColor: '#e3f2fd',
        borderColor: '#2196f3',
        borderWidth: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 5,
    },
    userEmail: {
        fontSize: 12,
        color: '#666',
    },
    settingsList: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    settingCard: {
        backgroundColor: '#f5f5f5',
        padding: 15,
        borderRadius: 8,
        marginRight: 10,
        minWidth: 150,
    },
    settingName: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 5,
    },
    settingDetail: {
        fontSize: 12,
        color: '#666',
    },
    storiesList: {
        marginTop: 20,
    },
    storyCard: {
        backgroundColor: '#f5f5f5',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
    },
    storyDay: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 5,
    },
    storyContent: {
        fontSize: 14,
        color: '#333',
    },
    headerSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    resetButton: {
        backgroundColor: '#ff6b6b',
        paddingHorizontal: 15,
    },
    eventsList: {
        maxHeight: 200,
    },
    eventCard: {
        backgroundColor: '#f5f5f5',
        padding: 10,
        borderRadius: 8,
        marginBottom: 8,
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
    },
    eventTime: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    eventLocation: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
    },
}); 