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

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    data: {
      url: "/dashboard?fromNotification=1",
    },
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification?.data?.url || "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        const clientUrl = new URL(client.url);
        const destinationUrl = new URL(targetUrl, self.location.origin);

        if (clientUrl.origin === destinationUrl.origin) {
          client.navigate(destinationUrl.href);
          return client.focus();
        }
      }

      return clients.openWindow(targetUrl);
    })
  );
});