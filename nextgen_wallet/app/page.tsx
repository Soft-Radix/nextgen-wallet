"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { bootstrapRedirect } from "@/lib/utils/bootstrapRedirect";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    bootstrapRedirect(router);
  }, [router]);

  return null;
}