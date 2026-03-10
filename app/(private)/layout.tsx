"use client";

import BottomNav from "./BottomNav";
import GlobalGuard from "@/app/GlobalGuard";

export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GlobalGuard>
      <div className="h-full relative">
        <main className="flex-1  bg-mainBackground min-h-screen h-full  ">
          <div className="max-w-[968px] w-full mx-auto">
            {children}
          </div>
        </main>
        <BottomNav />
      </div>
    </GlobalGuard>
  );
}

