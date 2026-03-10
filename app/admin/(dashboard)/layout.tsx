"use client";

import AdminDashboardLayoutClient from "./AdminDashboardLayoutClient";
import { AdminUserProvider } from "../context/AdminUserContext";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminUserProvider>
      <AdminDashboardLayoutClient>{children}</AdminDashboardLayoutClient>
    </AdminUserProvider>
  );
}
