"use client";

import Topbar from "@/components/Topbar";
import TransactionsList from "../dashboard/TransactionsList";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { getUserDetails } from "@/lib/utils/bootstrapRedirect";
import { SearchIcon } from "@/lib/svg";
import { useRouter } from "next/navigation";
type TransactionType = "sender" | "receiver" | "withdrawal";

interface TransactionItem {
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

export default function TransactionsPage() {
  const storedUser = getUserDetails();
  const reduxUser = useSelector((state: RootState) => state.userDetails.user);
  const user = reduxUser || storedUser;

  const [transfers, setTransfers] = useState<TransactionItem[]>([]);
  const [withdrawals, setWithdrawals] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"all" | "sent" | "received" | "withdrawals">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const router = useRouter();

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
              search: searchQuery || undefined,
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
              search: searchQuery || undefined,
            }),
          }),
        ]);

        const [txData, wdData] = await Promise.all([txRes.json(), wdRes.json()]);

        if (!txRes.ok) {
          console.error("Transactions fetch error:", txData?.error || "Unknown error");
        } else {
          setTransfers(txData.items || []);
        }

        if (!wdRes.ok) {
          console.error("Withdrawals fetch error:", wdData?.error || "Unknown error");
        } else {
          setWithdrawals(wdData.items || []);
        }
      } catch (error) {
        console.error("Transactions/Withdrawals network error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id, searchQuery]);

  const filteredItems = useMemo(() => {
    const allItems = [...transfers, ...withdrawals].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    let scoped: TransactionItem[];

    if (activeTab === "all") {
      scoped = allItems;
    } else if (activeTab === "withdrawals") {
      scoped = withdrawals;
    } else if (activeTab === "sent") {
      scoped = transfers.filter((t) => t.transaction_type === "sender");
    } else if (activeTab === "received") {
      scoped = transfers.filter((t) => t.transaction_type === "receiver");
    } else {
      scoped = allItems;
    }

    return scoped;
  }, [activeTab, transfers, withdrawals]);

  return (
    <>
      <Topbar title="Transactions" />
      <div className="p-4 sm:p-5 py-[80px] overflow-y-auto flex flex-col items-center min-h-[calc(100vh-120px)]">
        <div className="w-full max-w-[420px] flex flex-col gap-2 sm:gap-6 pb-10">
          {/* Search bar */}
          <div className="w-full mt-3.5">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transactions..."
                className="w-full pl-10 pr-3 py-3 rounded-[12px] border border-[#E2E8F0] bg-white text-sm sm:text-[14px] text-text placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
              />
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#9CA3AF]">
                <SearchIcon />
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-full p-[4px] mt-1 gap-1 -mb-1">
            {[
              { key: "all", label: "All" },
              { key: "sent", label: "Sent" },
              { key: "received", label: "Received" },
              { key: "withdrawals", label: "Withdrawals" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`flex-1 text-center text-[11px] px-2 sm:text-[12px] font-medium py-2 rounded-[100px] transition-colors ${activeTab === tab.key
                    ? "bg-gradient-to-r from-[var(--button-primary-from)] to-[var(--button-primary-to)] text-white shadow-[0_2px_3px_rgba(0,166,62,0.3)]"
                    : "text-[#6F7B8F] border border-[#D8EBD7] bg-white"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex flex-col gap-3 mt-3">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-white rounded-[14px] p-4 w-full border border-[#E5E7EB] animate-pulse"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-[40px] h-[40px] rounded-full bg-[#E5E7EB]" />
                    <div className="flex flex-col gap-2">
                      <div className="h-3 w-28 rounded bg-[#E5E7EB]" />
                      <div className="h-3 w-20 rounded bg-[#E5E7EB]" />
                    </div>
                  </div>
                  <div className="h-4 w-16 rounded bg-[#E5E7EB]" />
                </div>
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="mt-6 flex flex-col items-center justify-center gap-2 text-center text-sm text-grey">
              <p className="font-semibold text-text">No transactions found</p>
              <p className="text-[12px] text-grey">
                You don&apos;t have any {activeTab === "all" ? "" : activeTab} transactions yet.
              </p>
            </div>
          ) : (
            <TransactionsList
              list={filteredItems}
              onItemClick={(item) => {
                if (!item.id) return;
                const kind = item.transaction_type === "withdrawal" ? "withdrawal" : "transfer";
                const params = new URLSearchParams({
                  id: String(item.id),
                  kind,
                  amount: item.amount != null ? String(item.amount) : "",
                  status: item.status || "",
                  type: item.type || "",
                  date: item.created_at || "",
                  counterparty: item.counterparty_mobile || "",
                });
                router.push(`/transaction-details?${params.toString()}`);
              }}
            />
          )}
        </div>
      </div>
    </>
  );
}

