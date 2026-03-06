"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AdminPageHeader from "../AdminPageHeader";

const SEARCH_DEBOUNCE_MS = 350;

type TransactionType = "P2P Transfer" | "Disbursement" | "Withdrawal" | string;
type TransactionStatus = "Completed" | "Pending" | "Failed";

type Transaction = {
  id: string;
  dateLabel: string;
  timeLabel: string;
  from: string;
  to: string;
  amount: string;
  type: TransactionType;
  status: TransactionStatus;
  settlement: string;
  ts: string;
};

function mapApiRowToTransaction(row: any): Transaction {
  const dt = row.created_at ? new Date(row.created_at) : null;
  const dateLabel = dt
    ? dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";
  const timeLabel = dt
    ? dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : "";
  const normalizeStatus = (value: string): TransactionStatus => {
    const v = value.toLowerCase();
    if (v === "completed") return "Completed";
    if (v === "pending") return "Pending";
    if (v === "failed") return "Failed";
    return "Completed";
  };
  const amountNumber = typeof row.amount === "number" ? row.amount : Number(row.amount ?? 0);
  const rawType = (row.type ?? "transfer") as string;
  return {
    id: String(row.id),
    dateLabel,
    timeLabel,
    from: row.sender_name ?? "—",
    to: row.receiver_name ?? "—",
    amount: amountNumber.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }),
    type: rawType,
    status: normalizeStatus(String(row.status ?? "")),
    settlement: "",
    ts: row.created_at ?? "",
  };
}

function getTypeDisplay(typeValue: string): string {
  const v = (typeValue ?? "").toLowerCase();
  if (v === "transfer") return "P2P Transfer";
  if (v === "disburse") return "Disbursement";
  if (v === "withdrawal") return "Withdrawal";
  return typeValue || "—";
}

const transactionTableHeadings = ["DATE & TIME", "TRANSACTION ID", "FROM", "TO", "AMOUNT", "TYPE", "STATUS"];

const PAGE_SIZE = 10;

const TYPE_FILTER_OPTIONS: { label: string; value: string }[] = [
  { label: "All Type", value: "all_type" },
  { label: "P2P Transfer", value: "transfer" },
  { label: "Disbursement", value: "disburse" },
  { label: "Withdrawal", value: "withdrawal" },
];

const STATUS_FILTER_OPTIONS: { label: string; value: string }[] = [
  { label: "All Status", value: "all_status" },
  { label: "Completed", value: "completed" },
  { label: "Pending", value: "pending" },
  { label: "Failed", value: "failed" },
];

function getTypeDisplayLabel(typeValue: string): string {
  const opt = TYPE_FILTER_OPTIONS.find((o) => o.value === typeValue);
  return opt ? opt.label : typeValue;
}

function getPageButtons(current: number, total: number): (number | "dots")[] {
  const pages: (number | "dots")[] = [];
  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i);
    return pages;
  }

  if (current <= 3) {
    pages.push(1, 2, 3, "dots", total);
    return pages;
  }

  if (current >= total - 2) {
    pages.push(1, "dots", total - 2, total - 1, total);
    return pages;
  }

  pages.push(1, "dots", current - 1, current, current + 1, "dots", total);
  return pages;
}

function StatusPill({ status }: { status: TransactionStatus }) {
  const base = "inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium";
  if (status === "Completed") {
    return (
      <span className={`${base} bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]`}>Completed</span>
    );
  }
  if (status === "Pending") {
    return (
      <span className={`${base} bg-[#FEF9C3] text-[#92400E] border border-[#FDE68A]`}>Pending</span>
    );
  }
  return (
    <span className={`${base} bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA]`}>Failed</span>
  );
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all_type");
  const [statusFilter, setStatusFilter] = useState<string>("all_status");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [page, setPage] = useState(1);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fromInputRef = useRef<HTMLInputElement | null>(null);
  const toInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [search]);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      if (typeFilter && typeFilter !== "all_type") params.set("type", typeFilter);
      if (statusFilter && statusFilter !== "all_status") params.set("status", statusFilter);
      if (fromDate) params.set("from_date", fromDate);
      if (toDate) params.set("to_date", toDate);
      params.set("page", String(page));
      params.set("limit", String(PAGE_SIZE));
      const res = await fetch(`/api/admin/transactions?${params.toString()}`);
      if (!res.ok) {
        setTransactions([]);
        setTotalCount(0);
        return;
      }
      const data = await res.json();
      const list = Array.isArray(data.transactions) ? data.transactions : [];
      setTransactions(list.map(mapApiRowToTransaction));
      setTotalCount(typeof data.total === "number" ? data.total : list.length);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, typeFilter, statusFilter, fromDate, toDate, page]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    setPage(1);
  }, [typeFilter, statusFilter, fromDate, toDate]);

  const openDatePicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    const input = ref.current;
    if (!input) return;
    const anyInput = input as HTMLInputElement & { showPicker?: () => void };
    if (anyInput.showPicker) {
      anyInput.showPicker();
    } else {
      input.focus();
      input.click();
    }
  };

  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const startIndex = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + transactions.length, totalCount);
  const pageItems = transactions;
  const pageButtons = getPageButtons(currentPage, pageCount);

  const handleClearFilters = () => {
    setTypeFilter("all_type");
    setStatusFilter("all_status");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  return (
    <div className="px-4 py-4 pb-10 sm:px-8">
      <AdminPageHeader title="Transactions" />

      {/* All Transactions section */}
      <section className="max-w-[1120px]">
        <h2 className="text-lg font-semibold text-[#030200] mb-1">All Transactions</h2>
        <p className="text-sm text-[#6F7B8F] mb-6">
          Comprehensive transaction log across the entire system.
        </p>

        <div className="bg-white rounded-xl border border-[#E2F1E2] shadow-[0_23px_50px_rgba(25,33,61,0.03)]">
          {/* Search + Filters button */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-6 py-4 border-b border-[#E4E4E7]">
            <div className="flex-1 flex items-center">
              <div className="w-full flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2">
                <svg
                  className="w-4 h-4 text-[#94A3B8]"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9.167 3.333a5.833 5.833 0 015.833 5.834c0 1.53-.59 2.924-1.556 3.973l2.95 2.95a.833.833 0 11-1.178 1.178l-2.95-2.95A5.833 5.833 0 119.167 3.333zm0 1.667a4.167 4.167 0 100 8.333 4.167 4.167 0 000-8.333z"
                    fill="currentColor"
                  />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by user, transaction ID..."
                  className="w-full bg-transparent text-sm text-[#030200] placeholder:text-[#94A3B8] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className={`cursor-pointer inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow ${showFilters
                ? "text-[#4CCF44]"
                : "bg-white border-[#E2E8F0] text-[#848484]"
                }`}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.66659 13.3333C6.66653 13.4572 6.701 13.5787 6.76612 13.6841C6.83124 13.7895 6.92443 13.8746 7.03526 13.93L8.36859 14.5967C8.47025 14.6475 8.58322 14.6714 8.69675 14.6663C8.81029 14.6612 8.92062 14.6271 9.01728 14.5673C9.11393 14.5075 9.1937 14.424 9.249 14.3247C9.30431 14.2254 9.33331 14.1137 9.33326 14V9.33333C9.33341 9.00292 9.45623 8.68433 9.67792 8.43933L14.4933 3.11333C14.5796 3.01771 14.6363 2.89912 14.6567 2.77192C14.677 2.64472 14.66 2.51435 14.6079 2.39658C14.5557 2.27881 14.4705 2.17868 14.3626 2.1083C14.2547 2.03792 14.1287 2.0003 13.9999 2H1.99992C1.87099 2.00005 1.74484 2.03748 1.63676 2.10776C1.52867 2.17804 1.44328 2.27815 1.39093 2.39598C1.33858 2.5138 1.32151 2.64427 1.34181 2.77159C1.3621 2.89892 1.41887 3.01762 1.50526 3.11333L6.32192 8.43933C6.54361 8.68433 6.66644 9.00292 6.66659 9.33333V13.3333Z" stroke={showFilters ? "#4CCF44" : "#848484"} stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round" />
              </svg>

              Filters
            </button>
          </div>

          {/* Filters row */}
          {showFilters && (
            <div className="px-6 pt-3 pb-4 border-b border-[#E4E4E7]">
              <div className="flex flex-wrap items-center gap-4">
                {/* Transaction Type */}
                <div className="relative">
                  <p className="text-[11px] font-medium text-[black] mb-1">Transaction Type</p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTypeMenu((v) => !v);
                      setShowStatusMenu(false);
                    }}
                    className="cursor-pointer min-w-[160px] inline-flex items-center justify-between rounded-lg border border-[#E2E8F0] bg-[white] px-3 py-2 text-sm text-[#0F172A]"
                  >
                    <span className="text-[#030200]">
                      {getTypeDisplayLabel(typeFilter)}
                    </span>
                    <svg
                      className="w-4 h-4 text-[black]"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M5.833 7.5L10 11.667 14.167 7.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  {showTypeMenu && (
                    <div className="absolute z-10 mt-1 w-full rounded-lg border border-[#E2E8F0] bg-white shadow-lg text-sm">
                      {TYPE_FILTER_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setTypeFilter(option.value);
                            setShowTypeMenu(false);
                          }}
                          className={`cursor-pointer w-full text-left px-3 py-2 hover:bg-[#F8FAFC] ${typeFilter === option.value ? "text-[#030200] font-medium" : "text-[#6F7B8F]"}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="relative">
                  <p className="text-[11px] font-medium text-[black] mb-1">Status</p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowStatusMenu((v) => !v);
                      setShowTypeMenu(false);
                    }}
                    className="cursor-pointer min-w-[150px] inline-flex items-center justify-between rounded-lg border border-[#E2E8F0] bg-[white] px-3 py-2 text-sm text-[#0F172A]"
                  >
                    <span className="text-[#030200]">
                      {STATUS_FILTER_OPTIONS.find((o) => o.value === statusFilter)?.label ?? "All Status"}
                    </span>
                    <svg
                      className="w-4 h-4 text-[black]"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M5.833 7.5L10 11.667 14.167 7.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  {showStatusMenu && (
                    <div className="absolute z-10 mt-1 w-full rounded-lg border border-[#E2E8F0] bg-white shadow-lg text-sm">
                      {STATUS_FILTER_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setStatusFilter(option.value);
                            setShowStatusMenu(false);
                          }}
                          className={`cursor-pointer w-full text-left px-3 py-2 hover:bg-[#F8FAFC] ${statusFilter === option.value ? "text-[#030200] font-medium" : "text-[#6F7B8F]"}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Date From */}
                <div>
                  <p className="text-[11px] font-medium text-[black] mb-1">Date From</p>
                  <div
                    className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-[white] px-3 py-2 min-w-[150px] cursor-pointer"
                    onClick={() => openDatePicker(fromInputRef)}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5.33301 1.33301V3.99967" stroke="#99A1AF" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round" />
                      <path d="M10.667 1.33301V3.99967" stroke="#99A1AF" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round" />
                      <path d="M12.6667 2.66699H3.33333C2.59695 2.66699 2 3.26395 2 4.00033V13.3337C2 14.07 2.59695 14.667 3.33333 14.667H12.6667C13.403 14.667 14 14.07 14 13.3337V4.00033C14 3.26395 13.403 2.66699 12.6667 2.66699Z" stroke="#99A1AF" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round" />
                      <path d="M2 6.66699H14" stroke="#99A1AF" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>

                    <input
                      ref={fromInputRef}
                      type="date"
                      value={fromDate}
                      max={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="date-input text-[#6F7B8F] w-full bg-transparent text-sm focus:outline-none cursor-pointer"
                    />
                  </div>
                </div>

                {/* Date To */}
                <div>
                  <p className="text-[11px] font-medium text-[black] mb-1">Date To</p>
                  <div
                    className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-[white] px-3 py-2 min-w-[150px] cursor-pointer"
                    onClick={() => openDatePicker(toInputRef)}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5.33301 1.33301V3.99967" stroke="#99A1AF" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round" />
                      <path d="M10.667 1.33301V3.99967" stroke="#99A1AF" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round" />
                      <path d="M12.6667 2.66699H3.33333C2.59695 2.66699 2 3.26395 2 4.00033V13.3337C2 14.07 2.59695 14.667 3.33333 14.667H12.6667C13.403 14.667 14 14.07 14 13.3337V4.00033C14 3.26395 13.403 2.66699 12.6667 2.66699Z" stroke="#99A1AF" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round" />
                      <path d="M2 6.66699H14" stroke="#99A1AF" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>

                    <input
                      ref={toInputRef}
                      type="date"
                      value={toDate}
                      max={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setToDate(e.target.value)}
                      className="date-input w-full bg-transparent text-sm text-[#6F7B8F] focus:outline-none cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="cursor-pointer mt-6 ml-auto text-xs font-medium text-[#6F7B8F] hover:text-[#0F172A] whitespace-nowrap"
                >
                  × Clear all filters
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="mt-2 overflow-x-auto">
            <table className="min-w-full text-left text-[13px] text-nowrap">
              <thead>
                <tr className="border-b border-[#E4E4E7] text-[11px] font-semibold text-[#6F7B8F]">

                  {
                    transactionTableHeadings && transactionTableHeadings.length > 0 ?

                      transactionTableHeadings.map((heading, index) => (
                        <th className="px-4 pb-3 pt-1 font-semibold">{heading}</th>
                      ))

                      : null
                  }
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-[#6F7B8F]">
                      Loading transactions…
                    </td>
                  </tr>
                ) : (
                  pageItems.map((tx) => (
                    <tr
                      key={tx.id}
                      className="border-b border-[#E4E4E7] last:border-0 bg-white"
                    >
                      <td className="px-4 py-3 text-[#030200]">
                        <div className="flex flex-col">
                          <span className="text-[13px] font-medium">{tx.dateLabel}</span>
                          <span className="text-[11px] text-[#6F7B8F]">{tx.timeLabel}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#030200]">{tx.id}</td>
                      <td className="px-4 py-3 text-[#030200]">{(tx.type.toLowerCase() === "disburse" || tx.type.toLowerCase() === "withdrawal") ? "System" : tx.from}</td>
                      <td className="px-4 py-3 text-[#030200]">{tx.to}</td>
                      <td className="px-4 py-3 text-[#030200]">{tx.amount}</td>
                      <td className="px-4 py-3 text-[#030200]">{getTypeDisplay(tx.type)}</td>
                      <td className="px-4 py-3">
                        <StatusPill status={tx.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-[#E4E4E7] text-xs text-[#6F7B8F]">
            <p>
              {loading
                ? "Loading…"
                : totalCount === 0
                  ? "No transactions found"
                  : `Showing ${startIndex + 1} to ${endIndex} of ${totalCount} transactions`}
            </p>
            <div className="flex items-center gap-4 justify-end">
              <div className="flex items-center gap-1">
                <span>Rows per page</span>
                <span className="inline-flex items-center gap-1 rounded-md border border-[#E2E8F0] px-2 py-1 text-[#0F172A] bg-white">
                  {PAGE_SIZE}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[#0F172A]">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className={`w-7 h-7 flex items-center justify-center rounded-md border border-[#E2E8F0] text-xs ${
                    currentPage <= 1 ? "text-[#CBD5E1] cursor-not-allowed" : "cursor-pointer"
                  }`}
                >
                  {"<"}
                </button>
                {/* Desktop pagination numbers */}
                <div className="hidden sm:flex items-center gap-1">
                  {pageButtons.map((item, idx) =>
                    item === "dots" ? (
                      <span key={`dots-${idx}`} className="px-1 text-[#94A3B8]">
                        …
                      </span>
                    ) : (
                      <button
                        key={`page-${item}`}
                        type="button"
                        onClick={() => setPage(item)}
                        className={`w-7 h-7 flex items-center justify-center rounded-md text-xs ${
                          item === currentPage
                            ? "bg-[#0F172A] text-white"
                            : "border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC]"
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}
                </div>
                {/* Mobile fallback: compact label */}
                <span className="sm:hidden px-2 text-[#64748B]">
                  Page {currentPage} of {pageCount}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  disabled={currentPage >= pageCount}
                  className={`w-7 h-7 flex items-center justify-center rounded-md border border-[#E2E8F0] text-xs ${
                    currentPage >= pageCount ? "text-[#CBD5E1] cursor-not-allowed" : "cursor-pointer"
                  }`}
                >
                  {">"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
