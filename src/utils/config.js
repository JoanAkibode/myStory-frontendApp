import { API_URL } from "@env";

export const getApiUrl = () => {
    const defaultUrl = 'https://mystory-vzz6.onrender.com';
    
    if (!API_URL) {
        console.warn('API_URL not found in environment variables, using default:', defaultUrl);
        return defaultUrl;
    }
    
    return API_URL;
}; 