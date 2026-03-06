"use client";

import { logoutUser } from "./bootstrapRedirect";

/**
 * Wrapper around fetch that handles 401 Unauthorized responses
 * by logging out the user automatically
 */
export async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const response = await fetch(input, init);

  // If unauthorized, logout and redirect
  if (response.status === 401) {
    logoutUser();
  }

  return response;
}
