const ENV = process.env.NODE_ENV || 'development';

export default {
    expo: {
        name: "MyStory",
        slug: "mystory",
        version: "1.0.0",
        scheme: "mystory",
        owner: "supermegajojo",
        // newArchEnabled: true,  // Temporarily disabled for testing
        icon: "./assets/icon.png",
        splash: {
            image: "./assets/splash.png",
            resizeMode: "contain",
            backgroundColor: "#ffffff"
        },
        ios: {
            supportsTablet: true,
            bundleIdentifier: "com.joanakibode.mystory",
            config: {
                usesNonExemptEncryption: false
            }
        },
        android: {
            package: "com.joanakibode.mystory",
            adaptiveIcon: {
                foregroundImage: "./assets/adaptive-icon.png",
                backgroundColor: "#ffffff"
            }
        },
        web: {
            bundler: "metro"
        },
        extra: {
            apiUrl: process.env.API_URL,
            eas: {
                projectId: "0f8c6544-565a-49f0-aa9c-f9890a56c009"
            }
        }
    }
}; 