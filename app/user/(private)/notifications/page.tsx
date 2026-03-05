"use client";

import Topbar from "@/components/Topbar";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { getUserDetails } from "@/lib/utils/bootstrapRedirect";
import { ReceivedIcon, SentIcon } from "@/lib/svg";
import { useRouter } from "next/navigation";

type TransactionType = "sender" | "receiver" | "withdrawal";

interface NotificationItem {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  transaction_type: TransactionType;
  type: "incoming" | "outgoing";
  sender_mobile?: string | null;
  receiver_mobile?: string | null;
  counterparty_mobile?: string | null;
}

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} min${diffMinutes > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;

  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDayGroup(dateStr: string) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "Earlier";

  const today = new Date();
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const diffDays = Math.floor((t.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return "Earlier";
}

export default function NotificationsPage() {
  const storedUser = getUserDetails();
  const reduxUser = useSelector((state: RootState) => state.userDetails.user);
  const user = reduxUser || storedUser;

  const router = useRouter();

  const [transfers, setTransfers] = useState<NotificationItem[]>([]);
  const [withdrawals, setWithdrawals] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const [txRes, wdRes] = await Promise.all([
          fetch("/api/transactions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_id: user.id,
              page: 1,
            }),
          }),
          fetch("/api/withdrawals", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_id: user.id,
              page: 1,
            }),
          }),
        ]);

        const [txData, wdData] = await Promise.all([txRes.json(), wdRes.json()]);

        if (!txRes.ok) {
          console.error("Notifications transactions error:", txData?.error || "Unknown error");
        } else {
          setTransfers(txData.items || []);
        }

        if (!wdRes.ok) {
          console.error("Notifications withdrawals error:", wdData?.error || "Unknown error");
        } else {
          setWithdrawals(wdData.items || []);
        }
      } catch (error) {
        console.error("Notifications network error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  const groupedNotifications = useMemo(() => {
    const all: NotificationItem[] = [...transfers, ...withdrawals].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const groups: Record<string, NotificationItem[]> = {};

    all.forEach((item) => {
      const key = getDayGroup(item.created_at);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    return groups;
  }, [transfers, withdrawals]);

  const renderRow = (item: NotificationItem) => {
    const isWithdrawal = item.transaction_type === "withdrawal";
    const isIncoming = !isWithdrawal && item.type === "incoming";

    const title = isWithdrawal
      ? "Money Withdrawn"
      : isIncoming
      ? "Money Received"
      : "Money Sent";

    const subtitle = isWithdrawal
      ? "ATM Withdrawal"
      : isIncoming
      ? `From ${item.counterparty_mobile || item.sender_mobile || ""}`
      : `To ${item.counterparty_mobile || item.receiver_mobile || ""}`;

    const amountSign = isIncoming ? "+" : "-";
    const amountColor = isIncoming ? "text-[#16A34A]" : "text-[#E7000B]";

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          const kind = isWithdrawal ? "withdrawal" : "transfer";
          const params = new URLSearchParams({
            id: String(item.id),
            kind,
            amount: item.amount != null ? String(item.amount) : "",
            status: item.status || "",
            type: item.type || "",
            date: item.created_at || "",
            counterparty: item.counterparty_mobile || "",
          });
          router.push(`/user/transaction-details?${params.toString()}`);
        }}
        className="w-full text-left"
      >
        <div className="flex items-center justify-between py-3 pt-1.5 pb-3.5 w-full border-b border-[#D7E1EB99]">
          <div className="flex items-center gap-3">
            <div
              className={`w-[40px] h-[40px] rounded-xl flex items-center justify-center ${
                isIncoming ? "bg-[#DCFCE7]" : "bg-[#FFE2E2]"
              }`}
            >
              {isIncoming ? <ReceivedIcon /> : <SentIcon />}
            </div>
            <div className="flex flex-col">
              <p className="text-[13px] font-semibold text-text">{title}</p>
              <p className="text-[12px] text-grey mt-0.5">{subtitle}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[11px] text-[#6F7B8F] font-medium">
              {formatRelativeTime(item.created_at)}
            </span>
            <span className={`text-[13px] font-semibold ${amountColor}`}>
              {amountSign}${item.amount.toFixed(2)}
            </span>
          </div>
        </div>
      </button>
    );
  };

  return (
    <>
      <Topbar title="Notifications" />
      <div className="p-4 sm:p-5 pt-[95px] pb-16 overflow-y-auto flex flex-col items-center min-h-[calc(100vh-120px)]">
        <div className="w-full max-w-[420px]">
          {loading ? (
            <div className="flex flex-col gap-3 mt-2">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-white rounded-[14px] px-4 py-3 w-full border border-[#E5E7EB] animate-pulse"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-[32px] h-[32px] rounded-full bg-[#E5E7EB]" />
                    <div className="flex flex-col gap-2">
                      <div className="h-3 w-24 rounded bg-[#E5E7EB]" />
                      <div className="h-3 w-32 rounded bg-[#E5E7EB]" />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="h-3 w-16 rounded bg-[#E5E7EB]" />
                    <div className="h-3 w-20 rounded bg-[#E5E7EB]" />
                  </div>
                </div>
              ))}
            </div>
          ) : Object.keys(groupedNotifications).length === 0 ? (
            <div className="mt-10 flex flex-col items-center text-sm text-grey gap-2">
              <p className="font-semibold text-text">No notifications yet</p>
              <p className="text-[12px]">
                You&apos;ll see your payment activity here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {["Today", "Yesterday", "Earlier"].map((section) => {
                const items = groupedNotifications[section];
                if (!items || items.length === 0) return null;
                return (
                  <div key={section}>
                    <p className="text-[12px] font-bold text-[#6F7B8F] mb-2 uppercase">
                      {section}
                    </p>
                    {items.map(renderRow)}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

