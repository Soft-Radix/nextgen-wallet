"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import UsersHeader from "../UsersHeader";

type AdminUserDetailTransaction = {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  type: "Debit" | "Credit";
  sender_profile_id: string | null;
  receiver_profile_id: string | null;
  sender_name: string | null;
  receiver_name: string | null;
  note: string | null;
};

type AdminUserDetailResponse = {
  user: {
    id: string;
    created_at: string | null;
    full_number: string | null;
    name: string | null;
    status: string | null;
  };
  balance: number | null;
  currency: string | null;
  transactions: AdminUserDetailTransaction[];
};

type UserStatus = "Active" | "Suspended" | "Pending";

function formatCurrency(amount: number | null | undefined): string {
  const n = typeof amount === "number" ? amount : 0;
  if (!Number.isFinite(n)) return "$0.00";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(name: string | null | undefined, fullNumber: string | null | undefined): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    const a = parts[0]?.[0] ?? "";
    const b = parts[1]?.[0] ?? "";
    if (a || b) return (a + b).toUpperCase().slice(0, 2);
  }
  if (fullNumber && fullNumber.length >= 2) return fullNumber.slice(-2);
  return "U";
}

function normalizeStatus(raw: string | null | undefined): UserStatus {
  const v = (raw ?? "").toLowerCase();
  return v === "active" ? "Active" : "Pending";
}

function StatusPill({ status }: { status: UserStatus }) {
  const classes =
    status === "Active"
    && "bg-[#F0FDF4] text-[#008236]" ||
    status === "Pending" && "bg-[#FEF9C2] text-[#A65F00]" ||
    status === "Suspended" && "bg-[#FEF2F2] text-[#DC2626]";
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${classes}`}>
      {status}
    </span>
  );
}

function TxStatus({ status }: { status: string }) {
  const classes =
    status === "Completed"
      ? "bg-[#F0FDF4] text-[#008236] border border-[#B9F8CF]"
      : "bg-[#FEFCE8] text-[#92400E] border border-[#FDE68A]";
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${classes}`}>
      {status}
    </span>
  );
}

function TypeChip({ type }: { type: "Credit" | "Debit" }) {
  const isCredit = type === "Credit";
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${isCredit ? "text-[#16A34A]" : "text-[#DC2626]"
        }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${isCredit ? "bg-[#16A34A]" : "bg-[#DC2626]"}`}
      />
      {type}
    </span>
  );
}

function txDescription(tx: AdminUserDetailTransaction): string {
  if (tx.note && tx.note.trim()) return tx.note.trim();
  else return "---";
}

function txAmountDisplay(tx: AdminUserDetailTransaction): string {
  const amt = formatCurrency(tx.amount);
  return tx.type === "Credit" ? `+${amt}` : `-${amt}`;
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showDisburseModal, setShowDisburseModal] = useState(false);
  const [disburseAmount, setDisburseAmount] = useState("");
  const [disburseSubmitting, setDisburseSubmitting] = useState(false);
  const [disburseError, setDisburseError] = useState<string | null>(null);
  const [data, setData] = useState<AdminUserDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleDisburseConfirm = async () => {
    if (!id || !data) return;
    const num = parseFloat(disburseAmount.replace(/,/g, ""));
    if (!Number.isFinite(num) || num <= 0) {
      setDisburseError("Enter a valid amount greater than 0.");
      return;
    }
    setDisburseError(null);
    setDisburseSubmitting(true);
    try {
      const res = await fetch("/api/admin/disbursements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, amount: num }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDisburseError(body?.error ?? "Failed to disburse");
        return;
      }
      setData((prev) =>
        prev
          ? { ...prev, balance: body.wallet_balance ?? (prev.balance ?? 0) + num }
          : prev
      );
      setShowDisburseModal(false);
      setDisburseAmount("");
    } catch (e) {
      setDisburseError("Something went wrong. Please try again.");
    } finally {
      setDisburseSubmitting(false);
    }
  };

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError("Invalid user id");
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/users/${encodeURIComponent(id)}`);
        if (cancelled) return;
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body?.error ?? "Failed to load user");
          setData(null);
          return;
        }
        const json: AdminUserDetailResponse = await res.json();
        setData(json);
      } catch (e) {
        if (!cancelled) {
          setError("Something went wrong");
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="px-4 py-4 pb-12 sm:px-8">
        <UsersHeader />
        <Link href="/admin/users" className="inline-flex items-center text-sm text-[#64748B] hover:text-[#030200] mb-4">
          <span className="mr-1 text-lg">←</span> Go back
        </Link>
        <div className="flex items-center justify-center py-16 text-[#6F7B8F]">Loading user...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="px-4 py-4 pb-12 sm:px-8">
        <UsersHeader />
        <Link href="/admin/users" className="inline-flex items-center text-sm text-[#64748B] hover:text-[#030200] mb-4">
          <span className="mr-1 text-lg">←</span> Go back
        </Link>
        <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-6 text-[#DC2626]">
          {error ?? "User not found"}
        </div>
      </div>
    );
  }

  const { user, balance, transactions } = data;
  const displayName = user.name && user.name.trim() ? user.name : user.full_number ?? "Unknown";
  const status = normalizeStatus(user.status);
  const joined = formatDate(user.created_at);
  const balanceFormatted = formatCurrency(balance);
  const initials = getInitials(user.name, user.full_number);

  return (
    <div className="px-4 py-4 pb-12 sm:px-8">
      <UsersHeader />

      <Link
        href="/admin/users"
        className="inline-flex items-center text-sm text-[#64748B] hover:text-[#030200] mb-4"
      >
        <span className="mr-1 text-lg">←</span>
        Go back
      </Link>

      <section className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#030200]">User Detail</h1>
          <p className="text-sm text-[#6F7B8F]">
            Complete wallet and transaction information.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowDisburseModal(true);
            setDisburseAmount("");
            setDisburseError(null);
          }}
          className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-[#169D25] to-[#00DE1C] hover:bg-[#00c818] text-white text-sm font-semibold px-5 py-2.5 shadow-[0_8px_18px_rgba(0,166,62,0.35)]"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4.167 10H15.833M10 4.167V15.833" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Disburse
        </button>
      </section>

      <section className="bg-white rounded-xl border border-[#E2F1E2] shadow-[0_23px_50px_rgba(25,33,61,0.03)] mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-5 border-b border-[#E4E4E7]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#16A34A] flex items-center justify-center text-lg font-semibold text-white">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-lg font-semibold text-[#030200]">{displayName}</h2>
                <StatusPill status={status} />
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-[#6F7B8F]">
                {user.full_number && <span>📞 {user.full_number}</span>}
                <span>📅 Joined {joined}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setShowSuspendModal(true)}
              className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-[#FEE2E2] text-[#DC2626] hover:bg-[#fecaca] text-sm font-semibold px-4 py-2 border border-[#FECACA]"
            >
              Suspend
            </button>
          </div>
        </div>
        <div className="px-6 py-5">
          <p className="text-3xl font-bold text-[#16A34A]">
            {balanceFormatted}
            <span className="ml-2 text-sm font-medium text-[#6F7B8F] align-middle">
              Current Wallet Balance
            </span>
          </p>
        </div>
      </section>

      <section className="bg-white rounded-xl border border-[#E2F1E2] shadow-[0_23px_50px_rgba(25,33,61,0.03)]">
        <div className="px-6 py-4 border-b border-[#E4E4E7]">
          <h2 className="text-base font-semibold text-[#030200]">Transaction History</h2>
          <p className="text-xs text-[#6F7B8F]">Complete transaction log for this wallet.</p>
        </div>
        <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0">
              <tr className="bg-[#F8FAFC] border-b border-[#E4E4E7]">
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#6F7B8F]">TRANSACTION ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#6F7B8F]">TYPE</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#6F7B8F]">DESCRIPTION</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#6F7B8F]">AMOUNT</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#6F7B8F]">DATE</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#6F7B8F]">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-left text-[#6F7B8F]">
                    No transactions yet.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-[#E4E4E7] last:border-0 hover:bg-[#F8FAFC] transition-colors"
                  >
                    <td className="px-6 py-3 text-[#030200] font-medium">{tx.id}</td>
                    <td className="px-6 py-3">
                      <TypeChip type={tx.type} />
                    </td>
                    <td className="px-6 py-3 text-[#030200]">{txDescription(tx)}</td>
                    <td
                      className={`px-6 py-3 font-medium ${tx.type === "Credit" ? "text-[#16A34A]" : "text-[#DC2626]"
                        }`}
                    >
                      {txAmountDisplay(tx)}
                    </td>
                    <td className="px-6 py-3 text-[#030200] whitespace-nowrap">{formatDate(tx.created_at)}</td>
                    <td className="px-6 py-3">
                      <TxStatus status={tx.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showDisburseModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#030200]">Disburse to wallet</h3>
                <button
                  type="button"
                  onClick={() => !disburseSubmitting && setShowDisburseModal(false)}
                  className="text-[#6B7280] hover:text-[#111827] p-1"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-[#6F7B8F]">
                Add funds to {displayName}&apos;s wallet. The amount will be credited to the balance.
              </p>
              <div>
                <label className="block text-sm font-medium text-[#030200] mb-1">Amount</label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={disburseAmount}  
                  onChange={(e) => setDisburseAmount(e.target.value)}
                  className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#030200] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#4ADE80]"
                  disabled={disburseSubmitting}
                />
              </div>
              {disburseError && (
                <p className="text-sm text-red-600">{disburseError}</p>
              )}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => !disburseSubmitting && setShowDisburseModal(false)}
                  className="cursor-pointer px-4 py-2 rounded-lg border border-[#E2E8F0] text-sm font-medium text-[#0F172A] bg-white hover:bg-[#F8FAFC] disabled:opacity-70"
                  disabled={disburseSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDisburseConfirm}
                  disabled={disburseSubmitting}
                  className="cursor-pointer px-4 py-2 rounded-lg bg-linear-to-r from-[#169D25] to-[#00DE1C] hover:bg-[#00c818] text-sm font-semibold text-white shadow-[0_8px_18px_rgba(0,166,62,0.35)] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {disburseSubmitting ? "Adding…" : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSuspendModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#FFE2E2] flex items-center justify-center">
                <svg width="44" height="28" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21.7812 26.7728C21.0371 26.7728 20.4199 26.1557 20.4199 25.4115V16.3359C20.4199 15.5917 21.0371 14.9746 21.7812 14.9746C22.5254 14.9746 23.1426 15.5917 23.1426 16.3359V25.4115C23.1426 26.1557 22.5254 26.7728 21.7812 26.7728Z" fill="#C10007" />
                  <path d="M21.7814 32.6719C21.6725 32.6719 21.5454 32.6537 21.4184 32.6356C21.3095 32.6174 21.2006 32.5811 21.0917 32.5266C20.9828 32.4903 20.8739 32.4359 20.765 32.3633C20.6742 32.2907 20.5834 32.2181 20.4927 32.1455C20.166 31.8006 19.9663 31.3287 19.9663 30.8568C19.9663 30.3848 20.166 29.9129 20.4927 29.568C20.5834 29.4954 20.6742 29.4228 20.765 29.3502C20.8739 29.2776 20.9828 29.2232 21.0917 29.1869C21.2006 29.1324 21.3095 29.0961 21.4184 29.0779C21.6544 29.0235 21.9085 29.0235 22.1263 29.0779C22.2533 29.0961 22.3622 29.1324 22.4712 29.1869C22.5801 29.2232 22.689 29.2776 22.7979 29.3502C22.8886 29.4228 22.9794 29.4954 23.0701 29.568C23.3969 29.9129 23.5965 30.3848 23.5965 30.8568C23.5965 31.3287 23.3969 31.8006 23.0701 32.1455C22.9794 32.2181 22.8886 32.2907 22.7979 32.3633C22.689 32.4359 22.5801 32.4903 22.4712 32.5266C22.3622 32.5811 22.2533 32.6174 22.1263 32.6356C22.0174 32.6537 21.8903 32.6719 21.7814 32.6719Z" fill="#C10007" />
                  <path d="M32.7807 40.2228H10.7816C7.24219 40.2228 4.53768 38.934 3.1582 36.6107C1.79688 34.2874 1.97839 31.2924 3.70273 28.1886L14.7023 8.40398C16.5174 5.1368 19.0222 3.33984 21.7812 3.33984C24.5401 3.33984 27.045 5.1368 28.8601 8.40398L39.8596 28.2068C41.584 31.3106 41.7836 34.2874 40.4041 36.6289C39.0247 38.934 36.3202 40.2228 32.7807 40.2228ZM21.7812 6.0625C20.075 6.0625 18.4051 7.36937 17.0801 9.72901L6.09867 29.5318C4.8644 31.7462 4.66474 33.7791 5.51784 35.2494C6.37094 36.7196 8.25865 37.5183 10.7998 37.5183H32.7989C35.34 37.5183 37.2096 36.7196 38.0808 35.2494C38.9521 33.7791 38.7342 31.7644 37.5 29.5318L26.4823 9.72901C25.1573 7.36937 23.4874 6.0625 21.7812 6.0625Z" fill="#C10007" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#030200] mb-1">Suspend Wallet?</h3>
                <p className="text-sm text-[#6F7B8F]">
                  Are you sure you want to suspend {displayName}&apos;s wallet? This will prevent them
                  from making any new transactions until the wallet is reactivated.
                </p>
              </div>
              <div className="flex items-center justify-end gap-3 w-full mt-2">
                <button
                  type="button"
                  onClick={() => setShowSuspendModal(false)}
                  className="cursor-pointer px-4 py-2 rounded-lg border border-[#E2E8F0] text-sm font-medium text-[#0F172A] bg-white hover:bg-[#F8FAFC]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="cursor-pointer px-4 py-2 rounded-lg bg-[#DC2626] text-sm font-semibold text-white hover:bg-[#b91c1c] shadow-[0_8px_18px_rgba(220,38,38,0.35)]"
                >
                  Suspend Wallet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
