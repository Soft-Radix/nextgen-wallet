"use client";

import { useContext } from "react";
import { AdminUserContext } from "../context/AdminUserContext";

export const useUser = () => {
  const ctx = useContext(AdminUserContext);
  if (!ctx) {
    throw new Error("useUser must be used within AdminUserProvider (admin dashboard layout)");
  }
  return ctx;
};