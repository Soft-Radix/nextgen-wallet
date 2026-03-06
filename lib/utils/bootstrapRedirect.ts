"use client";

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export function bootstrapRedirect(router: AppRouterInstance) {
  if (typeof window === "undefined") return;

  try {
    const userRaw = window.localStorage.getItem("user");
    const user = userRaw ? JSON.parse(userRaw) : null;

    if (user && user.status == "active") {
      router.replace("/dashboard");
    } else if (user && user.mobile_number && user.country_code) {
      router.replace("/otp-verification");
    } else {
      router.replace("/");
    }
  } catch {
    router.replace("/");
  }
}

export function logoutUser() {
  if (typeof window === "undefined") return;

  // Clear all localStorage
  localStorage.clear();

  // Redirect to welcome page
  window.location.href = "/";
}

export function getUserDetails() {
  if (typeof window === "undefined") return null;
  const userRaw = window.localStorage.getItem("user");
  return userRaw ? JSON.parse(userRaw) : null;
}

export function getNameCapitalized(name: string) {
  if (!name) return null;
  const nameArray = name.split(" ");
  return nameArray
    .map((name) => name.charAt(0).toUpperCase() + name.slice(1))
    .join(" ");
}

export function getUserImage(name: string) {
  if (!name) return "N/A";
  const nameArray = name.split(" ").filter(word => word.trim().length > 0);
  
  // If only one word, show first letter
  if (nameArray.length === 1) {
    return nameArray[0].charAt(0).toUpperCase();
  }
  
  // If multiple words, show first letter of first word and first letter of second word
  if (nameArray.length >= 2) {
    return (
      nameArray[0].charAt(0).toUpperCase() +
      nameArray[1].charAt(0).toUpperCase()
    );
  }
  
  return "UN";
}
