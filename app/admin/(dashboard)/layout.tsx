"use client"
import { redirect } from "next/navigation";
import AdminDashboardLayoutClient from "./AdminDashboardLayoutClient";
import { supabase } from "@/lib/supabase/client";
import { useEffect } from "react";

const ADMIN_EMAIL = "admin@nextgenpay.com";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const fetchSession = async  () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    localStorage.setItem("access_token", JSON.stringify(session?.access_token));
    localStorage.setItem("user", JSON.stringify(session?.user));

    if (!session?.user) {
      redirect("/admin/login");
    }

    if (session.user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
       supabase.auth.signOut();
      redirect("/admin/login");
    }
  }

  useEffect(() => {
    fetchSession();
  }, []);

  return <AdminDashboardLayoutClient>{children}</AdminDashboardLayoutClient>;
}
