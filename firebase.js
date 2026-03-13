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
    // IMPORTANT: Don't initialize messaging here - it requires service worker to be registered first
    // Messaging will be initialized in setupNotifications() after service worker is ready
    if (typeof window !== "undefined") {
    }
  } else {
    console.error("❌ Firebase configuration is incomplete!");
    console.error("Missing values:", {
      apiKey: !firebaseConfig.apiKey,
      authDomain: !firebaseConfig.authDomain,
      projectId: !firebaseConfig.projectId,
      messagingSenderId: !firebaseConfig.messagingSenderId,
      appId: !firebaseConfig.appId,
    });
    console.warn(
      "Firebase configuration is incomplete. Some values are missing."
    );
  }
} catch (error) {
  console.error("❌ Error initializing Firebase:", error);
  console.error("Error details:", error.message, error.stack);
}

/**
 * Saves FCM token to Supabase fcm_tokens table
 * @param {string} token - FCM token to save
 * @param {string} userId - User ID from user_details table
 */
const saveFCMTokenToSupabase = async (token, userId) => {
  if (!token || !userId) {
    console.warn("❌ Cannot save FCM token: token or userId is missing", {
      token: !!token,
      userId,
    });
    return;
  }

  try {
    // Dynamically import supabase client to avoid SSR issues
    const { supabase } = await import("@/lib/supabase/client");

    // Get device info
    const deviceInfo = {
      language: navigator.language || "en",
      platform: navigator.platform || "Unknown",
      userAgent: navigator.userAgent || "",
      timestamp: new Date().toISOString(),
    };

    // Check if this exact token already exists for this user
    const { data: existingToken, error: checkError } = await supabase
      .from("fcm_tokens")
      .select("id")
      .eq("user_id", userId)
      .eq("token", token)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "not found" which is fine
      console.error("Error checking existing token:", checkError);
    }

    if (existingToken) {
      // Token already exists, just update device_info and timestamp
      const { error: updateError } = await supabase
        .from("fcm_tokens")
        .update({
          device_info: deviceInfo,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingToken.id);

      if (updateError) {
        console.error("Error updating FCM token:", updateError);
        console.error(
          "Update error details:",
          JSON.stringify(updateError, null, 2)
        );
      } else {
      }
    } else {
      // Insert new token   
      const { data, error: insertError } = await supabase
        .from("fcm_tokens")
        .insert({
          user_id: userId,
          token: token,
          device_info: deviceInfo,
        })
        .select();

      if (insertError) {
        console.error("❌ Error inserting FCM token:", insertError);
        console.error("Insert error code:", insertError.code);
        console.error("Insert error message:", insertError.message);
        console.error(
          "Insert error details:",
          JSON.stringify(insertError, null, 2)
        );

        // Common error: RLS policy blocking insert
        if (
          insertError.code === "42501" ||
          insertError.message?.includes("policy")
        ) {
          console.error(
            "⚠️ RLS Policy Error: Check your Row Level Security policies for fcm_tokens table"
          );
          console.error(
            "You may need to create an INSERT policy for authenticated users"
          );
        }
      } else {
      }
    }
  } catch (error) {
    console.error("Error importing supabase client or saving token:", error);
  }
};

/**
 * @param {function(Object): void} onMessageCallback - Callback function to handle incoming messages
 * @param {string} userId - Optional user ID to save FCM token
 */
const setupNotifications = async (onMessageCallback, userId = null) => {
  
  
  // Only run in browser environment
  if (typeof window === "undefined") {
    console.warn("⚠️ Not in browser environment, skipping");
    return;
  }

  // Initialize messaging if not already initialized (after service worker is ready)
  if (!messaging && firebaseApp) {
    
    // Check if service worker is supported
    if (!("serviceWorker" in navigator)) {
      console.error("❌ Service workers not supported in this browser");
      return;
    }

    try {
      // Wait for service worker to be ready (either already registered or register now)
      let registration;
      
      // Check if service worker is already registered
      const existingRegistration = await navigator.serviceWorker.getRegistration();
      if (existingRegistration) {
        registration = existingRegistration;
      } else {
        registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      }
      
      // Wait for service worker to be active
      if (registration.active) {
      } else {
        await new Promise((resolve) => {
          if (registration.installing) {
            registration.installing.addEventListener("statechange", function() {
              if (this.state === "activated") {
                resolve();
              }
            });
          } else if (registration.waiting) {
            registration.waiting.addEventListener("statechange", function() {
              if (this.state === "activated") {
                resolve();
              }
            });
          } else {
            resolve(); // Already active or ready
          }
        });
      }
      
      // Ensure service worker is ready
      await navigator.serviceWorker.ready;
      
      // Now initialize messaging
      messaging = getMessaging(firebaseApp);
    } catch (error) {
      console.error("❌ Failed to initialize messaging:", error);
      console.error("Error details:", error.message, error.stack);
      return;
    }
  }

  if (!messaging) {
    console.error("❌ Firebase messaging is not available!");
    console.error("This usually means Firebase config is missing or service worker failed");
    console.warn(
      "Firebase messaging is not available. Please check your Firebase configuration."
    );
    return;
  }

  try {
    // Check if service worker is registered (required for FCM)
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
      } else {
        console.warn(
          "⚠️ Service worker not registered! FCM requires a service worker."
        );
        try {
          const newRegistration = await navigator.serviceWorker.register(
            "/firebase-messaging-sw.js"
          );
        } catch (swError) {
          console.error("❌ Failed to register service worker:", swError);
        }
      }
    } else {
      console.error("❌ Service workers not supported in this browser");
    }

    // Request permission for notifications
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      
     

      // Wait a bit for service worker to be ready
      if ("serviceWorker" in navigator) {
        await navigator.serviceWorker.ready;
      }

      // Get the FCM token
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });

      if (token) {
        // Try to get userId from localStorage if not provided
        if (!userId && typeof window !== "undefined") {
          try {
            const userRaw = localStorage.getItem("user");
            if (userRaw) {
              const user = JSON.parse(userRaw);
              userId = user?.id;
            }
          } catch (e) {
            console.warn("Could not get userId from localStorage:", e);
          }
        }

        // Save token to Supabase
        if (userId) {
          await saveFCMTokenToSupabase(token, userId);
        } else {
          console.warn(
            "⚠️ FCM token obtained but userId not available. Token will not be saved."
          );
          console.warn(
            "This usually means user is not logged in or localStorage doesn't have user data"
          );
        }
      } else {
        console.warn(
          "No FCM token received. This might be due to missing VAPID key or service worker registration."
        );
      }
    } else {
    }

    // Handle foreground notifications
    onMessage(messaging, (payload) => {
      // Call the callback if provided
      if (onMessageCallback) {
        onMessageCallback(payload);
      }
    });
  } catch (error) {
    console.error("Error setting up notifications:", error);
  }
};

export { messaging, setupNotifications, saveFCMTokenToSupabase };
