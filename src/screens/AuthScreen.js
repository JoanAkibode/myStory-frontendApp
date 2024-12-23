import { useAuth } from '../context/AuthContext';

const AuthScreen = () => {
    const { handleAuthCallback } = useAuth();

    useEffect(() => {
        // Get callback token from URL params
        const params = new URLSearchParams(window.location.search);
        const callbackToken = params.get('token');
        
        if (callbackToken) {
            handleAuthCallback(callbackToken);
        }
    }, []);

    // ... rest of your component
};

export default AuthScreen; 