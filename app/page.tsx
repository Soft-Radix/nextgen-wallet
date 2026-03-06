"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { bootstrapRedirect } from "@/lib/utils/bootstrapRedirect";
import WelcomePage from "./(public)/page";
import PublicLayout from "./(public)/layout";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    bootstrapRedirect(router);
  }, [router]);

  return (
    <PublicLayout>
      <WelcomePage />
    </PublicLayout>
  );
}