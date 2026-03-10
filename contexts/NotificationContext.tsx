"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import NotificationPopup from "@/components/NotificationPopup";

interface NotificationData {
  type: "send" | "receive";
  amount: string;
  counterparty: string;
  transactionId?: string;
}

interface NotificationContextType {
  showNotification: (data: NotificationData) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notification, setNotification] = useState<NotificationData | null>(null);

  const showNotification = useCallback((data: NotificationData) => {
    setNotification(data);
  }, []);

  const handleDismiss = useCallback(() => {
    setNotification(null);
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {notification && (
        <NotificationPopup
          type={notification.type}
          amount={notification.amount}
          counterparty={notification.counterparty}
          transactionId={notification.transactionId}
          onDismiss={handleDismiss}
        />
      )}

    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
}
