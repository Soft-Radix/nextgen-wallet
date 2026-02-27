"use client";

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export function bootstrapRedirect(router: AppRouterInstance) {
  if (typeof window === "undefined") return;

  try {
    const userRaw = window.localStorage.getItem("user");
    const user = userRaw ? JSON.parse(userRaw) : null;

    if (user && user.status == "active") {
      router.replace("/user/dashboard");
    } else if (user && user.mobile_number && user.country_code) {
      router.replace("/user/otp-verification");
    } else {
      router.replace("/user/welcome");
    }
  } catch {
    router.replace("/user/welcome");
  }
}

export function getUserDetails() {
  if (typeof window === "undefined") return null;
  const userRaw = window.localStorage.getItem("user");
  return userRaw ? JSON.parse(userRaw) : null;
}
