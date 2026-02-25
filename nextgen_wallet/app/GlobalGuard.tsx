"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

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

      if (!hasUser && pathname !== "/user/welcome") {
        router.replace("/user/welcome");
      }
    } catch {
      if (pathname !== "/user/welcome") {
        router.replace("/user/welcome");
      }
    }
  }, [router, pathname]);

  return children;
}

