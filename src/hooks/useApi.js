import { useAuth } from '../contexts/AuthContext';

export const useApi = () => {
    const { token, logout } = useAuth();
    const baseUrl = '${getApiUrl()}';

    const fetchWithAuth = async (endpoint, options = {}) => {
        if (!token) {
            throw new Error('No auth token');
        }

        try {
            const response = await fetch(`${baseUrl}${endpoint}`, {
                ...options,
                headers: {
                    ...options.headers,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401) {
                await logout();
                throw new Error('Session expired');
            }

            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    };

    return { fetchWithAuth };
}; 