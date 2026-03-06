"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

// Routes that require active user status
const ACTIVE_USER_ROUTES = ["/dashboard", "/send-money", "/add-money", "/withdraw-money", "/pay-scan", "/transactions", "/notifications", "/profile", "/change-pin", "/transaction-details"];

export default function GlobalGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const userRaw = window.localStorage.getItem("user");
      const user = userRaw ? JSON.parse(userRaw) : null;

      const hasUser = user && Object.keys(user).length > 0;

      // If no user exists, redirect to home
      if (!hasUser && pathname !== "/") {
        router.replace("/");
        return;
      }

      // Check if current route requires active status
      const requiresActiveStatus = ACTIVE_USER_ROUTES.some(route => pathname.startsWith(route));
      
      if (requiresActiveStatus && user && user.status !== "active") {
        // User exists but status is not active, redirect based on user state
        if (!user.name) {
          router.replace("/create-profile");
        } else if (user.mobile_number && user.country_code) {
          router.replace("/create-pin");
        } else {
          router.replace("/otp-verification");
        }
        return;
      }
    } catch {
      if (pathname !== "/") {
        router.replace("/");
      }
    }
  }, [router, pathname]);

  return children;
}

