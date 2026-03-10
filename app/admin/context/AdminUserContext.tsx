"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

const ADMIN_EMAIL = "admin@nextgenpay.com";

export interface AdminUser {
  id: string;
  email?: string;
  [key: string]: any;
}

export interface SessionData {
  access_token: string | null;
  user: AdminUser | null;
}

type AdminUserContextValue = {
  user: SessionData;
  setUserSession: (access_token: string, user: AdminUser) => void;
  logout: () => void;
};

export const AdminUserContext = createContext<AdminUserContextValue | null>(null);

function readFromStorage(): SessionData {
  if (typeof window === "undefined") {
    return { access_token: null, user: null };
  }
  try {
    const token = localStorage.getItem("access_token");
    const user = localStorage.getItem("user");
    if (token && user) {
      return {
        access_token: JSON.parse(token),
        user: JSON.parse(user),
      };
    }
  } catch {
    // ignore
  }
  return { access_token: null, user: null };
}

export function AdminUserProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<SessionData>(readFromStorage);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        router.push("/admin/login");
        return;
      }
      if (session.user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        supabase.auth.signOut();
        router.push("/admin/login");
        return;
      }
      const next = {
        access_token: session.access_token,
        user: session.user as AdminUser,
      };
      localStorage.setItem("access_token", JSON.stringify(session.access_token));
      localStorage.setItem("user", JSON.stringify(session.user));
      setUser(next);
    });
  }, [router]);

  const setUserSession = useCallback((access_token: string, userData: AdminUser) => {
    localStorage.setItem("access_token", JSON.stringify(access_token));
    localStorage.setItem("user", JSON.stringify(userData));
    setUser({ access_token, user: userData });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    setUser({ access_token: null, user: null });
  }, []);

  const value: AdminUserContextValue = {
    user,
    setUserSession,
    logout,
  };

  return (
    <AdminUserContext.Provider value={value}>
      {children}
    </AdminUserContext.Provider>
  );
}

export function useAdminUser(): AdminUserContextValue {
  const ctx = useContext(AdminUserContext);
  if (!ctx) {
    throw new Error("useAdminUser must be used within AdminUserProvider");
  }
  return ctx;
}
