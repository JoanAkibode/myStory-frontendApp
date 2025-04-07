# MyStory Frontend

A React Native mobile application that turns your daily calendar events into personalized stories.

## Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for Mac) or Android Studio (for Android)

## Setup

1. Install dependencies:
```bash
npm install
# or
yarn install
```

2. Create a `.env` file in the root directory with:
```
# For development
API_URL=http://localhost:3000

# For production (deployed backend)
API_URL=https://node-mystory.onrender.com

# Required for Google Calendar integration
GOOGLE_CLIENT_ID=your_google_client_id  # From Google Cloud Console
```

3. Start the development server:
```bash
npx expo start
```

4. Run on specific platform:
```bash
# For iOS
npx expo start --ios

# For Android
npx expo start --android
```

## Backend Information

The backend API is deployed at: https://node-mystory.onrender.com

Key endpoints:
- Authentication: `/api/auth/*`
- Stories: `/api/stories/*`
- Calendar: `/api/calendar/*`
- Events: `/api/events/*`

## Environment Variables

Required environment variables in `.env`:
- `API_URL`: 
  - Development: `http://localhost:3000`
  - Production: `https://node-mystory.onrender.com`
- `GOOGLE_CLIENT_ID`: Your Google OAuth client ID from Google Cloud Console

## Running in Development

1. Start the Metro bundler:
```bash
npx expo start
```


## Building for Production

1. Create a production build:
```bash
# For iOS
npx expo build:ios

# For Android
npx expo build:android
```

2. Publish updates:
```bash
npx expo publish
```

## Troubleshooting

1. If the app can't connect to the backend:
- Check if `API_URL` in `.env` is correct
- Ensure the backend server is running
- Check network connectivity
- For production, verify https://node-mystory.onrender.com is accessible

2. If Google Calendar sync isn't working:
- Verify `GOOGLE_CLIENT_ID` is correct
- Check if the client ID is properly configured in Google Cloud Console
- Ensure the redirect URI is set up correctly

3. Common issues:
- Clear cache: `npx expo start -c`
- Reset Metro bundler: `npx expo start --clear`
- Check Expo status: `npx expo doctor`

## Tech Stack

- React Native
- Expo
- React Navigation
- AsyncStorage
- Firebase Cloud Messaging (FCM)
- Google Calendar API

## Development

- **Story Screen**: `src/screens/StoryReadingScreen.js`
- **Stories List**: `src/screens/StoriesScreen.js`
- **Settings**: `src/screens/StorySettingsScreen.js`
- **Calendar Sync**: `src/screens/EventsScreen.js`



## License

MIT