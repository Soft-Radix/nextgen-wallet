
import { createClient } from "@/lib/supabase/server";
import BottomNav from "./BottomNav";
import GlobalGuard from "@/app/GlobalGuard";

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {


  return (
    <div className="h-full relative">
      <main className="flex-1  bg-mainBackground min-h-screen h-full  ">
        <div className="max-w-[968px] w-full mx-auto">
          <GlobalGuard>{children}</GlobalGuard>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

