import Constants from 'expo-constants';

const isProd = Constants.appOwnership === 'standalone';

export const authConfig = {
    redirectUri: isProd ? 'mystory://' : 'https://auth.expo.io/@joanakibode/mystory',
    useProxy: !isProd,
    androidClientId: "YOUR_ANDROID_CLIENT_ID",
    iosClientId: "YOUR_IOS_CLIENT_ID",
    webClientId: "YOUR_WEB_CLIENT_ID",
    expoClientId: "YOUR_WEB_CLIENT_ID"
}; 