"use client";

import { useEffect, useRef, useState } from "react";
import { setupNotifications } from "@/firebase";
import { useNotification } from "@/contexts/NotificationContext";
import useVisibilityChange from "@/lib/useVisibilityChange";
import { supabase } from "@/lib/supabase/client";
import { getUserDetails, getNameCapitalized } from "@/lib/utils/bootstrapRedirect";

export default function NotificationSetup() {
  const { showNotification } = useNotification();
  const isForeground = useVisibilityChange();
  const subscriptionRef = useRef<any>(null);
  const lastTransactionIdRef = useRef<string | null>(null);
  const recentSystemNotificationsRef = useRef<Map<string, number>>(new Map());

  const showSystemNotification = (
    title: string,
    body: string,
    options?: { tag?: string }
  ) => {
    if (
      typeof window === "undefined" ||
      !("Notification" in window) ||
      Notification.permission !== "granted" ||
      !title ||
      !body
    ) {
      return;
    }

    const notificationKey = options?.tag || `${title}:${body}`;
    const now = Date.now();
    const lastShownAt =
      recentSystemNotificationsRef.current.get(notificationKey) || 0;

    // Suppress duplicates when the same event arrives via FCM and realtime.
    if (now - lastShownAt < 5000) {
      return;
    }

    recentSystemNotificationsRef.current.set(notificationKey, now);

    const notification = new Notification(title, {
      body,
      icon: "/favicon.ico",
      tag: options?.tag,
    });

    notification.onclick = () => {
      window.focus();
      sessionStorage.setItem("openedFromNotification", "1");
      window.location.href = "/dashboard?fromNotification=1";
      notification.close();
    };
  };

  const getFallbackPopupData = (
    title: string,
    body: string,
    type: "send" | "receive" | null,
    amount: string,
    counterparty: string
  ) => {
    const inferredType =
      type ||
      (/sent|send/i.test(title) || /sent|send/i.test(body)
        ? "send"
        : "receive");

    const inferredAmount =
      amount ||
      (() => {
        const amountMatch = body.match(/\$?([\d,]+\.?\d*)/) || title.match(/\$?([\d,]+\.?\d*)/);
        if (!amountMatch) return "$0.00";
        const amountValue = amountMatch[1].replace(/,/g, "");
        return `$${parseFloat(amountValue).toFixed(2)}`;
      })();

    const inferredCounterparty =
      counterparty ||
      (() => {
        const match =
          body.match(/(?:from|to)\s+(.+?)(?:\.|$)/i) ||
          title.match(/(?:from|to)\s+(.+?)(?:\.|$)/i);
        return match?.[1]?.trim() || "Unknown";
      })();

    return {
      type: inferredType,
      amount: inferredAmount,
      counterparty: inferredCounterparty,
    };
  };

  // Set up Supabase real-time subscription and polling for incoming transactions
  useEffect(() => {
    if (typeof window === "undefined") return;

    const user = getUserDetails();
    if (!user?.id) return;

    const componentMountTime = new Date().getTime();
    const STORAGE_KEY = `lastShownTransaction_${user.id}`;

    // Get the last shown transaction ID from localStorage
    const getLastShownTransactionId = (): string | null => {
      try {
        return localStorage.getItem(STORAGE_KEY);
      } catch {
        return null;
      }
    };

    // Save the last shown transaction ID to localStorage
    const saveLastShownTransactionId = (transactionId: string) => {
      try {
        localStorage.setItem(STORAGE_KEY, transactionId);
      } catch {
        // Ignore localStorage errors
      }
    };

    // Initialize: Get the latest transaction ID and mark it as seen (so we don't show it on reload)
    const initializeLastTransaction = async () => {
      try {
        const { data: transactions } = await supabase
          .from("transactions")
          .select("id, created_at")
          .eq("receiver_profile_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (transactions && transactions.length > 0) {
          const latestTransaction = transactions[0];
          // Only update if the transaction is older than 10 seconds (to avoid hiding very recent ones)
          const transactionTime = new Date(latestTransaction.created_at).getTime();
          const timeDiff = componentMountTime - transactionTime;

          if (timeDiff > 10000) {
            // Transaction is older than 10 seconds, mark it as seen
            saveLastShownTransactionId(latestTransaction.id);
            lastTransactionIdRef.current = latestTransaction.id;
          }
        }
      } catch (error) {
        console.error("Error initializing last transaction:", error);
      }
    };

    // Initialize on mount
    initializeLastTransaction();

    let lastCheckedTransactionId: string | null = null;
    let pollingInterval: NodeJS.Timeout | null = null;

    // Function to show receive notification
    const showReceiveNotification = async (transaction: any) => {
      const transactionId = transaction.id?.toString();

      // Skip if this is the same transaction we just processed
      if (lastTransactionIdRef.current === transactionId) {
        return;
      }

      // Skip if we've already shown this transaction (check localStorage)
      const lastShownId = getLastShownTransactionId();
      if (lastShownId === transactionId) {
        return;
      }

      // Skip self-transactions (add-money)
      if (String(transaction.sender_profile_id) === String(transaction.receiver_profile_id)) {
        return;
      }

      // Check if transaction was created after component mount (for real-time) or is very recent (within 30 seconds)
      const transactionTime = transaction.created_at ? new Date(transaction.created_at).getTime() : componentMountTime;
      const timeDiff = componentMountTime - transactionTime;

      // Only show if transaction is very recent (created within last 30 seconds) OR was created after mount
      if (timeDiff > 30000 && timeDiff > 0) {
        // Transaction is older than 30 seconds and was created before mount, skip it
        return;
      }

      lastTransactionIdRef.current = transactionId;
      saveLastShownTransactionId(transactionId);

      // Get sender name - try sender_name first, then fetch from user_details
      let senderName = transaction.sender_name || null;

      if (!senderName && transaction.sender_profile_id) {
        try {
          const { data: senderData } = await supabase
            .from("user_details")
            .select("name")
            .eq("id", transaction.sender_profile_id)
            .single();

          if (senderData?.name) {
            senderName = getNameCapitalized(senderData.name);
          } else {
            senderName = "Unknown";
          }
        } catch (error) {
          console.error("Error fetching sender name:", error);
          senderName = "Unknown";
        }
      } else if (senderName) {
        senderName = getNameCapitalized(senderName);
      } else {
        senderName = "Unknown";
      }

      // Show the in-app popup whenever this page receives a realtime event.
      if (transaction.amount) {
        const amount = `$${parseFloat(transaction.amount).toFixed(2)}`;
        const notificationTitle = "Payment Received";
        const notificationBody = `You received ${amount} from ${senderName}`;

        showNotification({
          type: "receive",
          amount,
          counterparty: senderName,
          transactionId: transactionId,
        });

        showSystemNotification(notificationTitle, notificationBody, {
          tag: transactionId,
        });
      }
    };

    // Polling fallback - check for new transactions every 3 seconds
    const checkForNewTransactions = async () => {
      try {
        const { data: transactions, error } = await supabase
          .from("transactions")
          .select("id, sender_profile_id, receiver_profile_id, amount, status, sender_name, created_at")
          .eq("receiver_profile_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (error) {
          console.error("Error polling transactions:", error);
          return;
        }

        if (transactions && transactions.length > 0) {
          const latestTransaction = transactions[0];

          // Only process if it's a new transaction and wasn't shown before
          const lastShownId = getLastShownTransactionId();
          if (latestTransaction.id !== lastCheckedTransactionId &&
            latestTransaction.id !== lastTransactionIdRef.current &&
            latestTransaction.id !== lastShownId) {
            lastCheckedTransactionId = latestTransaction.id;
            await showReceiveNotification(latestTransaction);
          }
        }
      } catch (error) {
        console.error("Error in polling:", error);
      }
    };

    // Set up Supabase real-time subscription
    const channel = supabase
      .channel(`incoming-transactions-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "transactions",
          filter: `receiver_profile_id=eq.${user.id}`,
        },
        async (payload) => {
          const newTransaction = payload.new as any;
          await showReceiveNotification(newTransaction);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
        } else if (status === "CHANNEL_ERROR") {
          console.warn("Channel error - falling back to polling");
        }
      });

    subscriptionRef.current = channel;

    // Start polling as fallback (works even if real-time is not enabled)
    pollingInterval = setInterval(checkForNewTransactions, 3000);

    // Also check immediately
    checkForNewTransactions();

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [showNotification, isForeground]);

  // Track current userId to detect changes
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const userIdRef = useRef<string | null>(null);

  // Watch for user changes and update currentUserId
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkUser = () => {
      const user = getUserDetails();
      const userId = user?.id || null;

      if (userId !== userIdRef.current) {
        userIdRef.current = userId;
        setCurrentUserId(userId);
      }
    };

    // Check immediately
    checkUser();

    // Set up interval to check for user changes (e.g., on login/logout)
    const interval = setInterval(checkUser, 2000); // Check every 2 seconds

    // Also listen to storage events (for cross-tab login/logout)
    window.addEventListener("storage", checkUser);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", checkUser);
    };
  }, []); // Empty deps - only run once on mount

  // Setup notifications when userId is available or changes
  useEffect(() => {
    if (typeof window === "undefined") {
      console.log("⚠️ NotificationSetup: Not in browser, skipping");
      return;
    }

    if (!currentUserId) {
      console.warn("⚠️ No userId available, skipping notification setup");
      console.warn("User needs to be logged in for FCM token to be saved");
      return;
    }

    setupNotifications((message: any) => {
      // Parse Firebase message payload
      const notification = message.notification || {};
      const data = message.data || {};

      // Extract notification data
      const title = notification.title || data.title || "";
      const body = notification.body || data.body || "";

      // Try to parse transaction details from the message
      // Expected format: "You received $50.00 from John Doe" or "You sent $50.00 to John Doe"
      // Or check data payload for structured data
      let type: "send" | "receive" | null = null;
      let amount = "";
      let counterparty = "";
      let transactionId = data.transactionId || data.transaction_id || data.id || "";

      // Check if data payload has structured information (preferred method)
      if (data.type || data.transaction_type) {
        const transactionType = data.type || data.transaction_type;
        type = transactionType === "send" || transactionType === "outgoing" || transactionType === "sent" ? "send" : "receive";
        amount = data.amount ? `$${parseFloat(data.amount).toFixed(2)}` : "";
        counterparty = data.counterparty || data.counterparty_name || data.counterparty_mobile || data.sender || data.receiver || data.sender_name || data.receiver_name || "";
      } else {
        // Parse from title/body text
        const receiveMatch = title.match(/received|receive/i) || body.match(/received|receive/i);
        const sendMatch = title.match(/sent|send/i) || body.match(/sent|send/i);

        if (receiveMatch) {
          type = "receive";
        } else if (sendMatch) {
          type = "send";
        }

        // Extract amount (format: $50.00 or 50.00)
        const amountMatch = body.match(/\$?([\d,]+\.?\d*)/) || title.match(/\$?([\d,]+\.?\d*)/);
        if (amountMatch) {
          const amountValue = amountMatch[1].replace(/,/g, "");
          amount = `$${parseFloat(amountValue).toFixed(2)}`;
        }

        // Extract counterparty name (usually after "from" or "to")
        const fromMatch = body.match(/(?:from|to)\s+([A-Za-z\s]+?)(?:\s|$|\.)/i) || title.match(/(?:from|to)\s+([A-Za-z\s]+?)(?:\s|$|\.)/i);
        if (fromMatch) {
          counterparty = fromMatch[1].trim();
        }
      }

      // If the page receives the FCM event, show the in-app popup regardless of visibility state.
      if (type && amount && counterparty) {
        showNotification({
          type,
          amount,
          counterparty,
          transactionId,
        });

        showSystemNotification(
          title || "New Transaction",
          body || `${amount} ${type === "receive" ? "received" : "sent"}`,
          { tag: transactionId || undefined }
        );
      } else if (title && body) {
        const fallbackPopup = getFallbackPopupData(
          title,
          body,
          type,
          amount,
          counterparty
        );

        showNotification({
          type: fallbackPopup.type,
          amount: fallbackPopup.amount,
          counterparty: fallbackPopup.counterparty,
          transactionId,
        });

        // Foreground fallback: also show a native system notification.
        showSystemNotification(title, body, {
          tag: transactionId || undefined,
        });
      } else if (!isForeground) {
        // Background: onMessage may still fire in some browsers, so keep native fallback.
        showSystemNotification(
          title || "New Transaction",
          body || "You have a new transaction",
          { tag: transactionId || undefined }
        );
      }
    }, currentUserId);
  }, [showNotification, isForeground, currentUserId]);

  return null;
}
