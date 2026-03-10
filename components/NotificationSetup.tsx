"use client";

import { useEffect, useRef } from "react";
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

      // Show notification for received money (only if app is in foreground)
      if (transaction.amount && isForeground) {
        console.log("Showing receive notification:", transaction);
        showNotification({
          type: "receive",
          amount: `$${parseFloat(transaction.amount).toFixed(2)}`,
          counterparty: senderName,
          transactionId: transactionId,
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
          console.log("Real-time transaction received:", payload);
          const newTransaction = payload.new as any;
          await showReceiveNotification(newTransaction);
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
        if (status === "SUBSCRIBED") {
          console.log("Successfully subscribed to incoming transactions");
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

  useEffect(() => {
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

      // Show notification popup if we have enough information
      if (type && amount && counterparty && isForeground) {
        showNotification({
          type,
          amount,
          counterparty,
          transactionId,
        });
      } else if (isForeground && title && body) {
        // Fallback: show native notification if we can't parse the data
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          new Notification(title, {
            body,
            icon: "/favicon.ico",
          });
        }
      } else if (!isForeground) {
        // Background: show native notification
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          new Notification(title || "New Transaction", {
            body: body || "You have a new transaction",
            icon: "/favicon.ico",
          });
        }
      }
    });
  }, [showNotification, isForeground]);

  return null;
}
