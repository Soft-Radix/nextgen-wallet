importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBv0ZCUEqZmBoNoXWZPHKWg8ssCwh4LWiQ",
  authDomain: "nextgen-ef808.firebaseapp.com",
  projectId: "nextgen-ef808",
  storageBucket: "nextgen-ef808.firebasestorage.app",
  messagingSenderId: "99974414865",
  appId: "1:99974414865:web:a5c680801c8524d87627b0",
  measurementId: "G-62XD8HK8ZE",
};
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();
// Customize background notification handling here
messaging.onBackgroundMessage((payload) => {
  console.log('Background Message:', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});