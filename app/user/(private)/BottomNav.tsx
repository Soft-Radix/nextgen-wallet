"use client";

import { useState } from "react";
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
  const [activeItem, setActiveItem] = useState(0);
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

  return pathname == "/user/dashboard" && (
    <div className="w-full h-[100px] bg-[#ffffff] p-6 fixed bottom-0 left-0 right-0 border-t border-[#E2E8F0] ">
      <div className="flex items-center justify-between">
        {menuItems.map((item, index) => (
          <button
            key={index}
            type="button"
            onClick={() => {
              setActiveItem(index);
              router.push(item.path);
            }}
            className="flex flex-col items-center gap-[5px]"
          >
            {activeItem == index ? item.activeIcon : item.icon}
            <p className={`text-greyLight text-[12px] ${activeItem == index ? "bg-gradient-to-r from-[var(--button-primary-from)] to-[var(--button-primary-to)] bg-clip-text text-transparent font-bold" : "text-greyLight font-medium"}`}>{item.label}</p>
          </button>
        ))}

      </div>
    </div>
  );
}

