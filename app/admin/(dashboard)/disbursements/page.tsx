"use client";

import { useEffect, useMemo, useState } from "react";
import AdminPageHeader from "../AdminPageHeader";

type DisbursementType = "Payroll" | "Insurance" | "Government" | "Loan";

type RecipientUser = {
  id: string;
  name: string | null;
  mobile_number: string | null;
};

export default function AdminDisbursementsPage() {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [disbursementType, setDisbursementType] = useState<DisbursementType | "">("");
  const [note, setNote] = useState("");
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");

  const [users, setUsers] = useState<RecipientUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatedBalance, setUpdatedBalance] = useState<number | null>(null);

  const parsedAmount = parseFloat(amount.replace(/[^0-9.]/g, "") || "0");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/admin/users?limit=500");
        if (!res.ok) return;
        const data = (await res.json()) as { users?: RecipientUser[] };
        setUsers(Array.isArray(data.users) ? data.users : []);
      } catch (e) {
        console.error("Failed to load users for disbursements", e);
      }
    };
    fetchUsers();
  }, []);

  const recipientSuggestions = useMemo(() => {
    const term = recipient.trim().toLowerCase();
    if (!term) return [];
    return users
      .filter((u) => {
        const name = (u.name ?? "").toLowerCase();
        const mobile = (u.mobile_number ?? "").toLowerCase();
        return name.includes(term) || mobile.includes(term);
      })
      .slice(0, 8);
  }, [recipient, users]);

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId) ?? null,
    [users, selectedUserId]
  );

  const handleSendClick = () => {
    if (!selectedUserId) {
      setError("Please select a recipient from the list.");
      return;
    }
    if (!amount.trim() || !disbursementType || parsedAmount <= 0) {
      setError("Please fill in amount and disbursement type to continue.");
      return;
    }
    setError("");
    setShowConfirm(true);
  };

  const resetForm = () => {
    setRecipient("");
    setAmount("");
    setDisbursementType("");
    setNote("");
    setError("");
    setSelectedUserId(null);
    setUpdatedBalance(null);
  };

  const handleConfirmAndSend = async () => {
    if (!selectedUserId || parsedAmount <= 0) return;
    try {
      setIsSubmitting(true);
      setError("");
      const res = await fetch("/api/admin/disbursements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedUserId,
          amount: parsedAmount,
          // note and type are optional for backend
          note,
          disbursementType,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Failed to send disbursement. Please try again.");
        setIsSubmitting(false);
        return;
      }

      const data = await res.json().catch(() => null);
      if (data && typeof data.wallet_balance === "number") {
        setUpdatedBalance(data.wallet_balance);
      } else {
        setUpdatedBalance(null);
      }

      setIsSubmitting(false);
      setShowConfirm(false);
      setShowSuccess(true);
    } catch (e) {
      console.error("Confirm disbursement error", e);
      setError("Failed to send disbursement. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-4 py-4 sm:px-8">
      <AdminPageHeader title="Disbursements" />

      {/* New Disbursement section */}
      <section className="max-w-[720px]">
        <h2 className="text-lg font-semibold text-[#030200] mb-1">New Disbursement</h2>
        <p className="text-sm text-[#6F7B8F] mb-6">
          Send money to user wallets via FedNow instant payment.
        </p>

        <div className="bg-white rounded-xl border border-[#E2F1E2] shadow-[0_23px_50px_rgba(25,33,61,0.03)] px-8 py-7 flex flex-col gap-5">
          {/* Recipient */}
          <div className="relative">
            <label className="block text-sm font-semibold text-[#030200] mb-1">Recipient</label>
            <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2">
              <input
                type="text"
                value={recipient}
                onChange={(e) => {
                  setRecipient(e.target.value);
                  setSelectedUserId(null);
                  setShowRecipientDropdown(true);
                }}
                placeholder="Search by name or phone number..."
                className="w-full bg-transparent text-sm text-[#030200] placeholder:text-[#94A3B8] focus:outline-none"
                onFocus={() => {
                  if (recipientSuggestions.length > 0) {
                    setShowRecipientDropdown(true);
                  }
                }}
              />
            </div>
            {showRecipientDropdown && recipientSuggestions.length > 0 && (
              <div className="absolute z-50 mt-1 w-full rounded-lg border border-[#E2E8F0] bg-white shadow-lg max-h-60 overflow-auto">
                {recipientSuggestions.map((u) => {
                  const labelName = u.name || "Unnamed user";
                  const labelPhone = u.mobile_number || "No phone";
                  return (
                    <button
                      key={u.id}
                      type="button"
                      className="cursor-pointer w-full text-left px-3 py-2 hover:bg-[#F8FAFC] text-sm text-[#030200] flex flex-col"
                      onClick={() => {
                        setSelectedUserId(u.id);
                        setRecipient(`${labelName} (${labelPhone})`);
                        setShowRecipientDropdown(false);
                        setError("");
                      }}
                    >
                      <span className="font-medium">{labelName}</span>
                      <span className="text-xs text-[#6F7B8F]">{labelPhone}</span>
                    </button>
                  );
                })}
              </div>
            )}
            <p className="text-[11px] text-[#94A3B8] mt-1">
              Connected to global verified identity network.
            </p>
          </div>

          {/* Amount + Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#030200] mb-1">Amount</label>
              <div className="flex items-center rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2">
                <span className="text-sm text-[#6F7B8F] mr-2">$</span>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="00.00"
                  className="w-full bg-transparent text-sm text-[#030200] placeholder:text-[#94A3B8] focus:outline-none"
                />
              </div>
            </div>
            <div className="">
              <label className="block text-sm font-semibold text-[#030200] mb-1">
                Disbursement Type
              </label>
              <button
                type="button"
                onClick={() => setShowTypeMenu((v) => !v)}
                className="cursor-pointer w-full flex items-center justify-between rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-sm text-[#030200]"
              >
                <span className={disbursementType ? "" : "text-[#94A3B8]"}>
                  {disbursementType || "Select type..."}
                </span>
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
              {showTypeMenu && (
                <div className="absolute z-10 mt-1 rounded-lg border border-[#E2E8F0] bg-white shadow-lg text-sm text-[#030200]">
                  {(["Payroll", "Insurance", "Government", "Loan"] as DisbursementType[]).map(
                    (t) => (
                      <button
                        type="button"
                        key={t}
                        onClick={() => {
                          setDisbursementType(t);
                          setShowTypeMenu(false);
                        }}
                        className="cursor-pointer w-full text-left px-3 py-2 hover:bg-[#F8FAFC]"
                      >
                        {t}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-semibold text-[#030200] mb-1">
              Note / Reference (Optional)
            </label>
            <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={350}
                placeholder="Add a transaction memo or internal reference..."
                className="w-full bg-transparent text-sm text-[#030200] placeholder:text-[#94A3B8] focus:outline-none resize-none h-20"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-[#DC2626]">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleSendClick}
            className="cursor-pointer mt-2 inline-flex w-full items-center justify-center rounded-lg bg-linear-to-r from-[#169D25] to-[#00DE1C] hover:bg-[#00c818] text-white text-sm font-semibold h-[52px] shadow-[0_10px_30px_rgba(0,166,62,0.35)]"
          >
            Send via FedNow
          </button>
        </div>
      </section>

      {/* Confirm Disbursement Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-95 mx-4 pt-7 pb-6 px-8">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#DDFEDB] flex items-center justify-center">
                <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21.0945 25.8118H8.64202C7.90535 25.8118 7.21117 25.741 6.58783 25.5993C6.262 25.5568 5.86535 25.4434 5.45452 25.2876C3.57035 24.5793 1.34619 22.8368 1.34619 18.5018V11.2059C1.34619 6.57344 4.00952 3.91016 8.64202 3.91016H21.0945C25.0045 3.91016 27.5262 5.78011 28.2062 9.18011C28.3337 9.80345 28.3904 10.4693 28.3904 11.2059V18.5018C28.3904 23.1626 25.7412 25.8118 21.0945 25.8118ZM8.65615 6.06352C5.17115 6.06352 3.48533 7.7493 3.48533 11.2343V18.5302C3.48533 21.066 4.37785 22.6243 6.20535 23.3185C6.48868 23.4177 6.75786 23.4885 7.01286 23.531C7.55119 23.6443 8.07532 23.7009 8.65615 23.7009H21.1087C24.5937 23.7009 26.2795 22.0152 26.2795 18.5302V11.2343C26.2795 10.6393 26.237 10.1151 26.1379 9.63346C25.6562 7.22512 24.0128 6.06352 21.1087 6.06352H8.65615Z" fill="#1A9B12" />
                  <path d="M25.3442 30.0618H12.8917C11.6875 30.0618 10.6109 29.8918 9.69003 29.5376C7.60753 28.7585 6.24752 27.1151 5.78002 24.7635C5.70919 24.4093 5.82255 24.041 6.07755 23.8002C6.33255 23.5452 6.70089 23.446 7.05505 23.531C7.52255 23.6301 8.04671 23.6868 8.64171 23.6868H21.0942C24.5792 23.6868 26.2651 22.001 26.2651 18.516V11.2201C26.2651 10.6251 26.2225 10.101 26.1234 9.6193C26.0525 9.26514 26.1659 8.91098 26.4067 8.65598C26.6617 8.40098 27.0159 8.28763 27.37 8.37263C30.77 9.0668 32.64 11.5885 32.64 15.4701V22.766C32.64 27.4127 29.9909 30.0618 25.3442 30.0618ZM8.38672 25.8118C8.84006 26.6335 9.52005 27.2144 10.455 27.5544C11.135 27.8094 11.9567 27.9368 12.9059 27.9368H25.3584C28.8434 27.9368 30.5292 26.251 30.5292 22.766V15.4701C30.5292 13.2318 29.835 11.7443 28.4042 10.9652C28.4042 11.0502 28.4042 11.1351 28.4042 11.2201V18.516C28.4042 23.1485 25.7409 25.8118 21.1084 25.8118H8.65585C8.55668 25.8118 8.47172 25.8118 8.38672 25.8118Z" fill="#1A9B12" />
                  <path d="M14.8748 19.6773C12.2256 19.6773 10.0723 17.524 10.0723 14.8748C10.0723 12.2256 12.2256 10.0723 14.8748 10.0723C17.524 10.0723 19.6773 12.2256 19.6773 14.8748C19.6773 17.524 17.524 19.6773 14.8748 19.6773ZM14.8748 12.1973C13.4015 12.1973 12.1973 13.4015 12.1973 14.8748C12.1973 16.3481 13.4015 17.5523 14.8748 17.5523C16.3481 17.5523 17.5523 16.3481 17.5523 14.8748C17.5523 13.4015 16.3481 12.1973 14.8748 12.1973Z" fill="#1A9B12" />
                  <path d="M6.77197 19.0547C6.19114 19.0547 5.70947 18.573 5.70947 17.9922V11.7588C5.70947 11.178 6.19114 10.6963 6.77197 10.6963C7.35281 10.6963 7.83447 11.178 7.83447 11.7588V17.9922C7.83447 18.573 7.36697 19.0547 6.77197 19.0547Z" fill="#1A9B12" />
                  <path d="M22.9639 19.0547C22.383 19.0547 21.9014 18.573 21.9014 17.9922V11.7588C21.9014 11.178 22.383 10.6963 22.9639 10.6963C23.5447 10.6963 24.0264 11.178 24.0264 11.7588V17.9922C24.0264 18.573 23.5589 19.0547 22.9639 19.0547Z" fill="#1A9B12" />
                </svg>

              </div>
              <div className="w-full">
                <h3 className="text-lg font-semibold text-[#030200] mb-1">Confirm Disbursement</h3>
                <p className="text-sm text-[#6F7B8F]">
                  Sending{" "}
                  <span className="font-bold text-[#128f20]">${parsedAmount.toFixed(2)}</span>{" "}
                  to{" "}
                  <span className="text-[#6F7B8F]">
                    {selectedUser?.name || recipient || "Recipient"}
                  </span>{" "}
                  via FedNow.
                </p>
              </div>
              <div className="w-full text-sm text-left mt-2 space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#6F7B8F]">Recipient</span>
                  <span className="text-[#030200]">{selectedUser?.name || recipient}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6F7B8F]">Phone</span>
                  <span className="text-[#030200]">
                    {selectedUser?.mobile_number || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6F7B8F]">Type</span>
                  <span className="text-[#030200]">
                    {disbursementType || "Payroll"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6F7B8F]">Amount</span>
                  <span className="font-bold bg-linear-to-r from-[#169D25] to-[#00DE1C] bg-clip-text text-transparent">
                    ${parsedAmount.toFixed(2)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleConfirmAndSend}
                disabled={isSubmitting}
                className="cursor-pointer mt-4 inline-flex w-full items-center justify-center rounded-lg bg-linear-to-r from-[#169D25] to-[#00DE1C] text-sm font-semibold text-white h-11 hover:bg-[#00c818] shadow-[0_8px_18px_rgba(0,166,62,0.35)]"
              >
                {isSubmitting ? "Sending..." : "Confirm & Send"}
              </button>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="cursor-pointer text-sm font-medium text-[#4B5563] hover:text-[#111827] mt-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 pt-7 pb-6 px-8">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-22 h-22 rounded-full bg-[#ffffff] flex items-center justify-center tick-pop">
                <svg
                  className="text-[#00A91B] w-full h-full"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="0.8" />
                  <path
                    d="M6.5 10.25L8.667 12.5L13.5 7.5"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="w-full">
                <h3 className="text-lg font-semibold text-[#030200] mb-1">
                  Disbursement Sent!
                </h3>
                <p className="text-sm text-[#6F7B8F]">
                  <span className="text-[#16A34A] font-semibold">
                    ${parsedAmount.toFixed(2)}
                  </span>{" "}
                  has been successfully sent to{" "}
                  <span className="text-[#6F7B8F]">
                    {recipient || "Emily Rodriguez"}
                  </span>
                  .
                </p>
              </div>
              <div className="w-full text-sm text-left mt-2 space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#6F7B8F]">Updated Wallet Balance</span>
                  <span className="text-[#030200]">
                    {updatedBalance != null ? `$${updatedBalance.toFixed(2)}` : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6F7B8F]">Type</span>
                  <span className="text-[#030200]">
                    {disbursementType || "Government"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6F7B8F]">Completed</span>
                  <span className="text-[#030200]">Feb 20, 2026, 11:50 AM</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowSuccess(false);
                  resetForm();
                }}
                className="cursor-pointer mt-4 inline-flex w-full items-center justify-center rounded-lg bg-linear-to-r from-[#169D25] to-[#00DE1C] text-sm font-semibold text-white h-11 hover:bg-[#00c818] shadow-[0_8px_18px_rgba(0,166,62,0.35)]"
              >
                Send Another Disbursement
              </button>
              <button
                type="button"
                onClick={() => { setShowSuccess(false); resetForm(); }}
                className="cursor-pointer text-sm font-medium text-[#4CCF44] hover:text-[#4CCF44] mt-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
