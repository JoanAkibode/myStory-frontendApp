importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyCciXLhRfSltkmGxEcBod2h43V",
    authDomain: "mystory-3de1d.firebaseapp.com",
    projectId: "mystory-3de1d",
    storageBucket: "mystory-3de1d.appspot.com",
    messagingSenderId: "948826044299",
    appId: "1:948826044299:ios:d39b8703fbbd26c56fa18e",
    measurementId: "G-WM5J01SZVJ"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
    console.log('Received background message:', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/icon.png'
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
}); 