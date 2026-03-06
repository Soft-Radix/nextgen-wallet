"use client";

import { useState, useEffect } from "react";

interface User {
  id: string;
  email?: string;
  [key: string]: any;
}

interface SessionData {
  access_token: string | null;
  user: User | null;
}

export const useUser = () => {
  const [user, setUser] = useState<SessionData>({
    access_token: null,
    user: null,
  });

  // Load from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const user = localStorage.getItem("user");

    if (token && user) {
      setUser({
        access_token: JSON.parse(token),
        user: JSON.parse(user),
      });
    }
  }, []);

  const setUserSession = (access_token: string, user: User) => {
    localStorage.setItem("access_token", JSON.stringify(access_token));
    localStorage.setItem("user", JSON.stringify(user));

    setUser({
      access_token,
      user,
    });
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    setUser({
      access_token: null,
      user: null,
    });
  };

  return {
    user,
    setUserSession,
    logout,
  };
};