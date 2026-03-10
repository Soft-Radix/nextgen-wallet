"use client";

import { Provider } from "react-redux";
import { store } from "@/store/store";
import { NotificationProvider } from "@/contexts/NotificationContext";

export default function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <NotificationProvider>{children}</NotificationProvider>
    </Provider>
  );
}

