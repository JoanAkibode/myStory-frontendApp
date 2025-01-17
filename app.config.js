const ENV = process.env.NODE_ENV || 'development';

export default {
    expo: {
        name: "MyStory",
        slug: "mystory",
        version: "1.0.0",
        scheme: "mystory",
        newArchEnabled: true,
        ios: {
            supportsTablet: true,
            bundleIdentifier: "com.joanakibode.mystory",
            config: {
                usesNonExemptEncryption: false
            }
        },
        android: {
            package: "com.joanakibode.mystory"
        },
        web: {
            bundler: "metro"
        },
        extra: {
            apiUrl: process.env.API_URL
        }
    }
}; 