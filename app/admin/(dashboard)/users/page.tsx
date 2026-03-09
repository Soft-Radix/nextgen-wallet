"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import PhoneNumberInput from "@/components/ui/Phone";
import UsersHeader from "./UsersHeader";

const SEARCH_DEBOUNCE_MS = 350;

type UserStatus = "Active" | "Suspended" | "Pending";

type UserRow = {
  id: string;
  initials: string;
  name: string;
  phone: string;
  walletBalance: string;
  status: UserStatus;
  joined: string;
};

const DEFAULT_COUNTRY_CODE = "+1";

function formatCurrency(amount: number | null | undefined): string {
  const n =
    typeof amount === "number"
      ? amount
      : typeof amount === "string"
        ? Number(amount)
        : 0;
  if (!Number.isFinite(n)) return "$0.00";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

const PAGE_SIZE = 10;

function mapRowToUserRow(row: any): UserRow {
  const rawName: string | null = row.name ?? null;
  const name =
    rawName && rawName.trim().length > 0
      ? rawName
      : row.mobile_number ?? "Unknown";

  const parts = name.trim().split(/\s+/);
  const initialsStr =
    (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");

  const createdAt = row.created_at ? new Date(row.created_at) : null;
  const joined = createdAt
    ? createdAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  const rawStatus: string = row.status ?? "";
  const statusLower = rawStatus.toLowerCase();
  const status: UserStatus =
    statusLower === "active" ? "Active" : statusLower === "suspended" ? "Suspended" : "Pending";

  return {
    id: String(row.id),
    initials: (initialsStr || name[0] || "U").toUpperCase(),
    name,
    phone: row.mobile_number ?? "—",
    walletBalance: formatCurrency(row.wallet_balance ?? 0),
    status,
    joined,
  };
}

function getPageButtons(current: number, total: number): (number | "dots")[] {
  if (total <= 0) return [];
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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"All Status" | "Active" | "Suspended" | "Pending">(
    "All Status"
  );
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [country, setCountry] = useState("us");
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      if (statusFilter !== "All Status") params.set("status", statusFilter);
      params.set("page", String(page));
      params.set("limit", String(PAGE_SIZE));
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) {
        setUsers([]);
        setTotalCount(0);
        return;
      }
      const data = await res.json();
      const list = Array.isArray(data.users) ? data.users : [];
      setUsers(list.map(mapRowToUserRow));
      setTotalCount(typeof data.total === "number" ? data.total : list.length);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const startIndex = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + users.length, totalCount);
  const pageItems = users;
  const pageButtons = getPageButtons(currentPage, pageCount);

  async function handleCreateUser(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (creating) return;

    setCreateError(null);

    const name = newName.trim();
    const email = newEmail.trim();

    if (!name || !phoneNumber.trim()) {
      setCreateError("Name and phone number are required.");
      return;
    }

    const allDigits = phoneNumber.replace(/\D/g, "");
    const dialDigits = countryCode.replace(/\D/g, "");
    const nationalNumber = allDigits.startsWith(dialDigits)
      ? allDigits.slice(dialDigits.length)
      : allDigits;

    if (!/^\d{7,15}$/.test(nationalNumber)) {
      setCreateError("Enter a valid phone number.");
      return;
    }

    try {
      setCreating(true);

      const res = await fetch("/api/user-details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mobile_number: nationalNumber,
          country_code: countryCode,
          name,
          ...(email ? { email } : {}),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setCreateError(data?.error ?? "Failed to create user.");
        return;
      }

      setShowAddModal(false);
      fetchUsers();
      setNewName("");
      setNewEmail("");
      setPhoneNumber("");
    } catch (err) {
      console.error("Error creating user from admin:", err);
      setCreateError("Something went wrong. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="px-4 py-4 pb-12 sm:px-8">
      <UsersHeader />

      {/* User Management header + Add New User — desktop: row with button on right; mobile only: stacked, button full width */}
      <section className="mb-6 flex flex-row items-center justify-between max-md:flex-col max-md:gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-[#030200]">User Management</h2>
          <p className="text-sm text-[#6F7B8F]">
            Manage and monitor all registered users in the platform.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#169D25] to-[#00DE1C] hover:bg-[#00c818] text-white text-sm font-semibold px-4 py-2 shadow-[0_8px_18px_rgba(0,166,62,0.35)] w-auto max-md:w-full shrink-0"
        >
          <svg width="17" height="12" viewBox="0 0 17 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.75 7.5V5.25H10.5V3.75H12.75V1.5H14.25V3.75H16.5V5.25H14.25V7.5H12.75ZM6 6C5.175 6 4.46875 5.70625 3.88125 5.11875C3.29375 4.53125 3 3.825 3 3C3 2.175 3.29375 1.46875 3.88125 0.88125C4.46875 0.29375 5.175 0 6 0C6.825 0 7.53125 0.29375 8.11875 0.88125C8.70625 1.46875 9 2.175 9 3C9 3.825 8.70625 4.53125 8.11875 5.11875C7.53125 5.70625 6.825 6 6 6ZM0 12V9.9C0 9.475 0.109375 9.08437 0.328125 8.72812C0.546875 8.37187 0.8375 8.1 1.2 7.9125C1.975 7.525 2.7625 7.23438 3.5625 7.04063C4.3625 6.84688 5.175 6.75 6 6.75C6.825 6.75 7.6375 6.84688 8.4375 7.04063C9.2375 7.23438 10.025 7.525 10.8 7.9125C11.1625 8.1 11.4531 8.37187 11.6719 8.72812C11.8906 9.08437 12 9.475 12 9.9V12H0ZM1.5 10.5H10.5V9.9C10.5 9.7625 10.4656 9.6375 10.3969 9.525C10.3281 9.4125 10.2375 9.325 10.125 9.2625C9.45 8.925 8.76875 8.67188 8.08125 8.50313C7.39375 8.33438 6.7 8.25 6 8.25C5.3 8.25 4.60625 8.33438 3.91875 8.50313C3.23125 8.67188 2.55 8.925 1.875 9.2625C1.7625 9.325 1.67188 9.4125 1.60312 9.525C1.53437 9.6375 1.5 9.7625 1.5 9.9V10.5ZM6 4.5C6.4125 4.5 6.76562 4.35312 7.05937 4.05937C7.35312 3.76562 7.5 3.4125 7.5 3C7.5 2.5875 7.35312 2.23438 7.05937 1.94062C6.76562 1.64687 6.4125 1.5 6 1.5C5.5875 1.5 5.23438 1.64687 4.94063 1.94062C4.64688 2.23438 4.5 2.5875 4.5 3C4.5 3.4125 4.64688 3.76562 4.94063 4.05937C5.23438 4.35312 5.5875 4.5 6 4.5Z" fill="white" />
          </svg>

          Add New User
        </button>
      </section>

      {/* Card with search, status filter, table */}
      <section className="bg-white rounded-xl border border-[#E2F1E2] shadow-[0_23px_50px_rgba(25,33,61,0.03)]">
        {/* Search + filter + Add New User */}
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
                  d="M9.167 3.333a5.833 5.833 0 104.16 9.922l2.962 2.961a.833.833 0 001.179-1.179l-2.961-2.962A5.833 5.833 0 009.167 3.333zm0 1.667a4.167 4.167 0 110 8.334 4.167 4.167 0 010-8.334z"
                  fill="#94A3B8"
                />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or phone number..."
                className="w-full bg-transparent text-sm text-[#030200] placeholder:text-[#94A3B8] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 justify-end relative">
            <button
              type="button"
              onClick={() => setShowStatusMenu((v) => !v)}
              className="inline-flex items-center justify-between gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#0F172A] min-w-[140px]"
            >
              <span>{statusFilter}</span>
              <svg
                className="w-4 h-4 text-[#64748B]"
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
              <div className="absolute right-0 top-full mt-1 w-[160px] rounded-lg border border-[#E2E8F0] bg-white shadow-lg text-sm text-[#0F172A] z-10">
                {(["All Status", "Active", "Suspended", "Pending"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setStatusFilter(option);
                      setShowStatusMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-[#F8FAFC] ${statusFilter === option ? "text-black" : "text-[#6F7B8F]"
                      }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm min">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E4E4E7]">
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#6F7B8F]">
                  <div className="inline-flex items-center gap-2">
                   <span>NAME</span> 
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8.66675 4.6665L4.66675 0.666504L0.666748 4.6665" stroke="#4CCF44" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>

                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#6F7B8F]">
                  PHONE NUMBER
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#6F7B8F]">
                  <div className="inline-flex items-center gap-2">
                    WALLET BALANCE
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8.66675 4.6665L4.66675 0.666504L0.666748 4.6665" stroke="#4CCF44" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#6F7B8F]">
                  STATUS
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#6F7B8F]">
                  <div className="inline-flex items-center gap-1">
                    DATE JOINED
                    <span className="text-[#CBD5E1] text-base leading-none">↑</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#6F7B8F]">
                    Loading users…
                  </td>
                </tr>
              ) : (
                pageItems.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-[#E4E4E7] last:border-0 hover:bg-[#F8FAFC] transition-colors"
                >
                  <td className="px-6 py-3">
                    <Link href={`/admin/users/${user.id}`} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#DCFCE7] flex items-center justify-center text-xs font-semibold text-[#008236]">
                        {user.initials}
                      </div>
                      <span className="text-[#030200] font-medium">{user.name}</span>
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-[#030200]">{user.phone}</td>
                  <td className="px-6 py-3 text-[#030200]">{user.walletBalance}</td>
                  <td className="px-6 py-3">
                    <StatusPill status={user.status} />
                  </td>
                  <td className="px-6 py-3 text-[#030200] whitespace-nowrap">{user.joined}</td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-[#E4E4E7]">
          <p className="text-xs text-[#6B7280]">
            {loading ? (
              "Loading…"
            ) : totalCount === 0 ? (
              "No users found"
            ) : (
              <span className="text-black">
                Showing <span className="font-semibold">{startIndex + 1}</span>
                {" to "}
                <span className="font-semibold text-[#1F2937]">{endIndex}</span>
                {" of "}
                <span className="font-semibold text-[#1F2937]">{totalCount.toLocaleString()}</span>
                {" users"}
              </span>
            )}
          </p>
          <div className="flex items-center gap-1 text-[#0F172A]">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={loading || currentPage <= 1}
              className={`w-7 h-7 flex items-center justify-center rounded-md border border-[#E2E8F0] text-xs ${currentPage <= 1 ? "text-[#CBD5E1] cursor-not-allowed" : "cursor-pointer"
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
                    disabled={loading}
                    className={`w-7 h-7 flex items-center justify-center rounded-md text-xs ${item === currentPage
                        ? "bg-[#0F172A] text-white"
                        : "border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC]"
                      } ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
                  >
                    {item}
                  </button>
                )
              )}
            </div>
            {/* Mobile fallback: compact label */}
            <span className="sm:hidden px-2 text-xs text-[#64748B]">
              Page {currentPage} of {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={loading || currentPage >= pageCount}
              className={`w-7 h-7 flex items-center justify-center rounded-md border border-[#E2E8F0] text-xs ${currentPage >= pageCount ? "text-[#CBD5E1] cursor-not-allowed" : "cursor-pointer"
                }`}
            >
              {">"}
            </button>
          </div>
        </div>
      </section>
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-[0_23px_50px_rgba(25,33,61,0.15)] w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-[#E4E4E7] flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#030200]">Add New User</h3>
              <button
                type="button"
                onClick={() => !creating && setShowAddModal(false)}
                className="text-[#6B7280] hover:text-[#111827]"
              >
                X
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#030200] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newName}
                  maxLength={50}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#030200] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#4ADE80]"
                />
              </div>
              <div>
                <PhoneNumberInput
                  label="Phone Number"
                  placeholder="Enter phone number"
                  value={phoneNumber}
                  onChange={setPhoneNumber}
                  country={country}
                  setCountry={setCountry}
                  onDialCodeChange={setCountryCode}
                  shadow={false}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#030200] mb-1">
                  Email <span className="text-[#94A3B8] font-normal">(optional)</span>
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  maxLength={50}
                  placeholder="Enter email address"
                  className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#030200] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#4ADE80]"
                />
              </div>
              {createError && (
                <p className="text-xs text-red-600">{createError}</p>
              )}
              <div className="mt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => !creating && setShowAddModal(false)}
                  className="inline-flex items-center justify-center rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-[#0F172A] hover:bg-[#F8FAFC]"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center justify-center rounded-lg bg-linear-to-r from-[#169D25] to-[#00DE1C] hover:bg-[#00c818] px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(0,166,62,0.35)] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {creating ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
