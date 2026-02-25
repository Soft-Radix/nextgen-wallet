import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "./BottomNav";

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {


  return (
    <div className="min-h-screen relative">
      <main className="flex-1 p-6 bg-mainBackground h-[calc(100vh-100px)]">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

