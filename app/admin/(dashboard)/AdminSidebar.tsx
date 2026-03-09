"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  AdminDashboardIcon,
  AdminUsersIcon,
  AdminDisbursementsIcon,
  AdminTransactionsIcon,
  AdminSettingsIcon,
  AdminLogOutIcon,
  LogoPublic,
} from "@/lib/svg";
import { supabase } from "@/lib/supabase/client";
import { Modal } from "@/components/ui";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", Icon: AdminDashboardIcon },
  { href: "/admin/users", label: "Users", Icon: AdminUsersIcon },
  { href: "/admin/disbursements", label: "Disbursements", Icon: AdminDisbursementsIcon },
  { href: "/admin/transactions", label: "Transactions", Icon: AdminTransactionsIcon },
  { href: "/admin/settings", label: "Settings", Icon: AdminSettingsIcon },
] as const;

export default function AdminSidebar({ usePngLogo = false }: { usePngLogo?: boolean } = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);

  const handleLogout = async () => {
    setShowLogoutPopup(false);
    await supabase.auth.signOut();
    router.push("/admin/login");
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    router.refresh();
  };

  const handleLogoutClick = () => setShowLogoutPopup(true);
  const handleCancelLogout = () => setShowLogoutPopup(false);

  return (
    <aside className="w-[240px] h-screen bg-[#0f1419] flex flex-col py-6 px-4 shrink-0 sticky top-0">
      <div className="flex items-center gap-3 mb-10 px-2">
        {usePngLogo ? (
          <img
            src="/102c37625366380a9c57fd7eda519abb27d273ef.png"
            alt="NewGenPay eWallet"
            className="h-14 w-auto"
          />
        ) : (
          <LogoPublic className="w-[140px] h-auto" />
        )}
        <div className="flex flex-col leading-tight">
          <span className="text-white font-semibold text-[15px]">NewGenPay</span>
          <span className="text-white font-semibold text-[13px]">eWallet</span>
        </div>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                active
                  ? "bg-[#4CCF44] text-black"
                  : "text-white hover:bg-white/10"
              }`}
            >
              <span className={`text-black flex items-center justify-center w-5 h-5 shrink-0`}>
                <Icon active={active} />
              </span>
              <span className="text-[14px] font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={handleLogoutClick}
          className="cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#00DE1C] hover:bg-white/5 transition-colors w-full text-left"
        >
          <AdminLogOutIcon />
          <span className="text-[14px] font-medium">Log Out</span>
        </button>
      </div>

      <Modal
        isOpen={showLogoutPopup}
        onClose={handleCancelLogout}
        title="Confirm Logout"
        message="Are you sure you want to logout? You will need to login again to access your account."
        confirmText="Logout"
        variant="danger"
        onConfirm={handleLogout}
      />
    </aside>
  );
}
