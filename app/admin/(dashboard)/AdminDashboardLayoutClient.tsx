"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import AdminSidebar from "./AdminSidebar";

function getMobileHeaderTitle(pathname: string): string {
  if (pathname === "/admin/dashboard") return "Dashboard";
  if (pathname === "/admin/users") return "Users";
  if (pathname.startsWith("/admin/users/")) return "User Details";
  if (pathname === "/admin/disbursements") return "Disbursements";
  if (pathname === "/admin/transactions") return "Transactions";
  if (pathname === "/admin/settings/change-password") return "Change Password";
  if (pathname.startsWith("/admin/settings")) return "Settings";
  return "Admin";
}

export default function AdminDashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const mobileTitle = getMobileHeaderTitle(pathname ?? "");

  return (
    <div className="min-h-screen flex bg-[#f8faf8]">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <AdminSidebar />
      </div>

      {/* Mobile sidebar overlay with slide animation */}
      <div
        className={`fixed inset-0 z-40 flex md:hidden transition-opacity duration-300 ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => setMobileOpen(false)}
        />
        <div
          className={`relative h-full transform transition-transform duration-300 ease-out ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <AdminSidebar usePngLogo />
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto md:ml-0">
        {/* Mobile top bar with hamburger */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0f1419] text-white sticky top-0 z-30">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-white/20"
            aria-label="Open sidebar"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 5h14M3 10h14M3 15h10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <span className="text-sm font-semibold">{mobileTitle}</span>
          <span className="w-9" />
        </header>

        <div className="md:px-0">{children}</div>
      </main>
    </div>
  );
}
