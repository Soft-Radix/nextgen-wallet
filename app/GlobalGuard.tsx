"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import LoadingScreen from "@/components/LoadingScreen";

// Routes that require active user status
const ACTIVE_USER_ROUTES = ["/dashboard", "/send-money", "/add-money", "/withdraw-money", "/pay-scan", "/transactions", "/notifications", "/profile", "/change-pin", "/transaction-details"];

// Public routes that logged-in users should not access
const PUBLIC_ROUTES = ["/", "/login", "/signup"];

export default function GlobalGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") {
      setIsChecking(false);
      return;
    }

    try {
      const userRaw = window.localStorage.getItem("user");
      const user = userRaw ? JSON.parse(userRaw) : null;

      const hasUser = user && Object.keys(user).length > 0;

      // If user is logged in and trying to access public routes, redirect to dashboard
      if (hasUser && user.status === "active") {
        const isPublicRoute = PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + "/"));
        if (isPublicRoute) {
          router.replace("/dashboard");
          // Keep loading screen visible during redirect
          return;
        }
      }

      // Check if current route requires active status
      const requiresActiveStatus = ACTIVE_USER_ROUTES.some(route => pathname.startsWith(route));

      if (requiresActiveStatus) {
        // Private route - check authentication
        if (!hasUser) {
          // No user, redirect to home
          router.replace("/");
          return;
        }

        if (user.status !== "active") {
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
      }

      // If no user exists on non-private routes, allow access (public routes)
      // All checks passed, allow rendering
      setIsChecking(false);
    } catch {
      // On error, redirect to home if not already there
      if (pathname !== "/") {
        router.replace("/");
      } else {
        setIsChecking(false);
      }
    }
  }, [router, pathname]);

  // Show loading screen while checking authentication
  // This will replace everything including BottomNav
  if (isChecking) {
    return <div className="h-full relative">
      <LoadingScreen />
    </div>;
  }

  return <>{children}</>;
}

