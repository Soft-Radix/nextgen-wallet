"use client";

import { usePathname } from "next/navigation";
import {
  HomeIcon,
  HomeIconActive,
  ProfileIcon,
  ProfileIconAction,
  TransactionIcon,
  TransactionIconActive,
} from "@/lib/svg";
import { useRouter } from "next/navigation";

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const menuItems = [
    {
      label: "Dashboard",
      icon: <HomeIcon />,
      activeIcon: <HomeIconActive />,
      path: "/user/dashboard",
    },
    {
      label: "Transactions",
      icon: <TransactionIcon />,
      activeIcon: <TransactionIconActive />,
      path: "/user/transactions",
    },
    {
      label: "Profile",
      icon: <ProfileIcon />,
      activeIcon: <ProfileIconAction />,
      path: "/user/profile",
    },
  ];

  const shouldShowNav =
    pathname.startsWith("/user/dashboard") ||
    pathname.startsWith("/user/transactions") ||
    pathname.startsWith("/user/profile");

  const activePath =
    pathname.startsWith("/user/transactions")
      ? "/user/transactions"
      : pathname.startsWith("/user/profile")
        ? "/user/profile"
        : "/user/dashboard";

  return shouldShowNav && (
    <div className="w-full h-[100px] bg-[#ffffff] p-6 fixed bottom-0 left-0 right-0 border-t border-[#E2E8F0] ">
      <div className="flex items-center justify-between">
        {menuItems.map((item) => (
          <button
            key={item.path}
            type="button"
            onClick={() => {
              router.push(item.path);
            }}
            className="flex flex-col items-center gap-[5px]"
          >
            {activePath === item.path ? item.activeIcon : item.icon}
            <p className={`text-greyLight text-[12px] ${activePath === item.path ? "bg-gradient-to-r from-[var(--button-primary-from)] to-[var(--button-primary-to)] bg-clip-text text-transparent font-bold" : "text-greyLight font-medium"}`}>{item.label}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

