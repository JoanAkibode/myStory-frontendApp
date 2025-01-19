import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart } from 'react-native-chart-kit';
import { getApiUrl } from '../../utils/config';

// Update chart config with web-specific props
const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    style: {
        borderRadius: 16
    },
    propsForDots: {
        r: '6',
        strokeWidth: '2',
        stroke: '#ffa726',
        // Add empty event handlers for web
        onClick: () => {},
        onMouseEnter: () => {},
        onMouseLeave: () => {},
        // Disable responder events on web
        pointerEvents: Platform.OS === 'web' ? 'none' : 'auto'
    },
    propsForBackgroundLines: {
        strokeDasharray: ''
    },
    propsForLabels: {
        fontSize: 12,
        // Disable responder events on web
        pointerEvents: Platform.OS === 'web' ? 'none' : 'auto'
    },
    // Add web-specific touch handling
    useTouchEvents: false,
    formatTopLabelValue: value => `${value}`,
    formatYLabel: value => `${value}`,
    formatXLabel: value => value
};

export default function MonitoringTab() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        storiesGenerated: 0,
        errorRate: 0,
        dailyStats: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStats = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            console.log('Token for admin stats:', token ? 'exists' : 'missing');
            
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${getApiUrl()}/api/admin/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Stats response error:', response.status, errorText);
                throw new Error(`Failed to fetch stats: ${response.status} ${errorText}`);
            }
            
            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error('Error fetching stats:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 300000);
        return () => clearInterval(interval);
    }, []);

    const prepareChartData = () => {
        // Get last 7 days of data
        const last7Days = stats.dailyStats.slice(0, 7).reverse();
        
        return {
            labels: last7Days.map(stat => {
                const date = new Date(stat.date);
                return `${date.getDate()}/${date.getMonth() + 1}`;
            }),
            datasets: [
                {
                    data: last7Days.map(stat => stat.count),
                    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                    strokeWidth: 2
                },
                {
                    data: last7Days.map(stat => stat.errors),
                    color: (opacity = 1) => `rgba(255, 59, 48, ${opacity})`,
                    strokeWidth: 2
                }
            ],
            legend: ['Stories', 'Errors']
        };
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <Text>Loading stats...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Error: {error}</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.statsCard}>
                <Text style={styles.cardTitle}>Users</Text>
                <Text style={styles.statNumber}>{stats.totalUsers}</Text>
            </View>

            <View style={styles.statsCard}>
                <Text style={styles.cardTitle}>Stories Generated Today</Text>
                <Text style={styles.statNumber}>{stats.storiesGenerated}</Text>
            </View>

            <View style={styles.statsCard}>
                <Text style={styles.cardTitle}>Error Rate</Text>
                <Text style={[
                    styles.statNumber,
                    stats.errorRate > 5 ? styles.errorText : styles.successText
                ]}>
                    {stats.errorRate}%
                </Text>
            </View>

            <View style={styles.graphCard}>
                <Text style={styles.cardTitle}>Generation History</Text>
                {stats.dailyStats && stats.dailyStats.length > 0 ? (
                    <>
                        <View style={styles.chartContainer}>
                            <LineChart
                                data={prepareChartData()}
                                width={Dimensions.get('window').width - 40}
                                height={220}
                                chartConfig={chartConfig}
                                bezier
                                style={{
                                    marginVertical: 8,
                                    borderRadius: 16,
                                    // Disable responder events at the root level for web
                                    ...(Platform.OS === 'web' && { pointerEvents: 'none' })
                                }}
                                fromZero
                                withInnerLines={true}
                                withOuterLines={true}
                                withVerticalLines={true}
                                withHorizontalLines={true}
                                withDots={true}
                                withShadow={false}
                                // Remove web-specific event handlers that aren't needed
                                enableResponsive={true}
                                segments={5}
                            />
                        </View>
                        <View style={styles.legend}>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: '#007AFF' }]} />
                                <Text>Stories</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: '#FF3B30' }]} />
                                <Text>Errors</Text>
                            </View>
                        </View>
                        {/* Keep the detailed list below the graph */}
                        {stats.dailyStats.map((stat, index) => (
                            <View key={index} style={styles.historyRow}>
                                <Text>{new Date(stat.date).toLocaleDateString()}</Text>
                                <Text>Stories: {stat.count}</Text>
                                <Text>Errors: {stat.errors}</Text>
                            </View>
                        ))}
                    </>
                ) : (
                    <Text style={styles.noDataText}>No history data available</Text>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f5f5f5'
    },
    statsCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
    },
    graphCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
        minHeight: 200
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333'
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold'
    },
    errorText: {
        color: '#ff3b30'
    },
    successText: {
        color: '#34c759'
    },
    historyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    noDataText: {
        color: '#666',
        textAlign: 'center',
        marginTop: 20
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginVertical: 10,
        gap: 20
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5
    },
    chartContainer: {
        marginVertical: 8,
        borderRadius: 16
    }
}); 