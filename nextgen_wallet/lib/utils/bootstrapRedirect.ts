"use client";

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export function bootstrapRedirect(router: AppRouterInstance) {
  if (typeof window === "undefined") return;

  try {
    const userRaw = window.localStorage.getItem("user");
    const mobile = window.localStorage.getItem("mobile_number");
    const user = userRaw ? JSON.parse(userRaw) : null;

    if (user && Object.keys(user).length > 0) {
      router.replace("/user/dashboard");
    } else if (mobile && mobile.length > 0) {
      router.replace("/user/otp-verification");
    } else {
      router.replace("/user/welcome");
    }
  } catch {
    router.replace("/user/welcome");
  }
}

