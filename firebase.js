// firebase.js
import { initializeApp } from "@firebase/app";
import { getMessaging, getToken, onMessage } from "@firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let firebaseApp;
let messaging;

try {
  // Check if all required config values are present
  if (
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId
  ) {
    firebaseApp = initializeApp(firebaseConfig);
    
    // Only initialize messaging in browser environment
    if (typeof window !== "undefined") {
      messaging = getMessaging(firebaseApp);
    }
  } else {
    console.warn("Firebase configuration is incomplete. Some values are missing.");
  }
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

/**
 * @param {function(Object): void} onMessageCallback - Callback function to handle incoming messages
 */
const setupNotifications = async (onMessageCallback) => {
  // Only run in browser environment
  if (typeof window === "undefined") {
    return;
  }

  if (!messaging) {
    console.warn("Firebase messaging is not available. Please check your Firebase configuration.");
    return;
  }

  try {
    // Request permission for notifications
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      console.log("Notification permission granted.");
      // Get the FCM token
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });
      console.log("FCM Token:", token);
    } else {
      console.log("Notification permission denied.");
    }
    // Handle foreground notifications
    onMessage(messaging, (payload) => {
      console.log("Foreground Message:", payload);
      // Call the callback if provided
      if (onMessageCallback) {
        onMessageCallback(payload);
      }
    });
  } catch (error) {
    console.error("Error setting up notifications:", error);
  }
};
export { messaging, setupNotifications };
