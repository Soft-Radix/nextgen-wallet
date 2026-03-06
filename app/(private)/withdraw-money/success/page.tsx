"use client";

import Topbar from "@/components/Topbar";
import Button from "@/components/ui/Button";
import { CopyIcon, SuccessIcon } from "@/lib/svg";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useMemo, useCallback, useState, useEffect } from "react";

const SuccessContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const amountParam = searchParams.get("amount") ?? "";
  const balanceParam = searchParams.get("balance");
  const refParam = searchParams.get("ref");
  const [isCopied, setIsCopied] = useState(false);

  // Clear withdrawal_amount from localStorage when success page loads
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("withdrawal_amount");
    }
  }, []);

  // Handle browser back button - redirect to dashboard
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Add a history entry so back button can be intercepted
    // This creates an entry that when popped will trigger our handler
    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      // When user clicks back, redirect to dashboard
      router.replace("/withdraw-money");
    };

    // Listen for popstate event (browser back/forward)
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [router]);


  const amount = useMemo(() => {
    const value = parseFloat(amountParam);
    return Number.isFinite(value) && value > 0 ? value : 0;
  }, [amountParam]);

  const updatedBalance = useMemo(() => {
    if (!balanceParam) return null;
    const value = parseFloat(balanceParam);
    if (!Number.isFinite(value)) return null;
    return value;
  }, [balanceParam]);

  const transactionRef = useMemo(() => {
    if (refParam) {
      return `${refParam}`;
    }
    return `#WDL-${Math.floor(100000 + Math.random() * 900000)}`;
  }, [refParam]);

  const timeStr = useMemo(() => {
    const d = new Date();
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }, []);

  const copyRef = useCallback(() => {
    navigator.clipboard?.writeText(transactionRef);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  }, [transactionRef]);

  const SuccessIconComponent = SuccessIcon;

  return (
    <>
      <Topbar title="Withdraw Success" />
      <div className="p-4 sm:p-5 py-[77px] overflow-y-auto flex flex-col items-center min-h-[calc(100vh-120px)]">
        <div className="w-full max-w-[420px] flex flex-col gap-6 sm:gap-8">
          {/* Success icon and message */}
          <div className="mt-4 sm:mt-6 flex flex-col items-center gap-3 text-center">
            <div className="flex justify-center [&_svg]:max-w-[180px] [&_svg]:h-auto">
              <SuccessIconComponent />
            </div>
            <h1 className="text-[#030200] text-2xl font-semibold leading-[135%]">
              ${amount > 0 ? amount.toFixed(2) : "0.00"} withdrawn successfully
            </h1>
            <p className="text-[#6F7B8F] text-sm sm:text-base">
              Your cash has been successfully dispensed from the ATM.
            </p>
          </div>

          {/* Withdrawal details card */}
          <div className="bg-white rounded-[14px] border border-[#D8EBD7] shadow-[0_10px_30px_rgba(25,33,61,0.06)] p-5 sm:p-6 flex flex-col gap-4 mb-10">
            <div className="flex items-center justify-between">
              <span className="text-[#6F7B8F] text-sm sm:text-base">Updated Balance</span>
              <span className="text-[#030200] text-sm sm:text-base font-bold">
                {updatedBalance != null ? `$${updatedBalance.toFixed(2)}` : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[#6F7B8F] text-sm sm:text-base">Transaction Reference</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[#030200] text-sm sm:text-base font-medium">
                  {transactionRef}
                </span>
                <button
                  type="button"
                  onClick={copyRef}
                  className={`text-[#6F7B8F] hover:text-[#4CCF44] p-0.5 rounded cursor-pointer ${isCopied ? "text-[#4CCF44]" : ""}`}
                  aria-label="Copy reference"
                >
                  <CopyIcon color={isCopied ? "#4CCF44" : "#6F7B8F"} />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6F7B8F] text-sm sm:text-base">Time</span>
              <span className="text-[#030200] text-sm sm:text-base font-medium">
                {timeStr}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="fixed bottom-0 left-0 right-0 max-w-[968px] flex flex-col justify-center gap-1 w-full mx-auto px-5 bg-mainBackground pb-1 pt-2">
            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => router.push("/dashboard")}
              className="rounded-[10px] h-[52px] text-base font-semibold bg-[#4CCF44] from-[#4CCF44] to-[#4CCF44] hover:from-[#45b83d] hover:to-[#45b83d]"
            >
              Done
            </Button>
            <button
              type="button"
              onClick={() => router.push("/transactions")}
              className="text-[#4CCF44] text-sm sm:text-base font-medium py-2 text-center underline-offset-4 hover:no-underline"
            >
              View Transaction History
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <>
          <Topbar title="Withdraw Success" />
          <div className="p-4 sm:p-5 py-[77px] overflow-y-auto flex flex-col items-center min-h-[calc(100vh-120px)]">
            <div className="w-full max-w-[420px] flex flex-col gap-6 sm:gap-8">
              <div className="mt-4 sm:mt-6 flex flex-col items-center gap-3 animate-pulse">
                <div className="w-[180px] h-[180px] rounded-full bg-[#E5E7EB]" />
                <div className="h-8 w-64 rounded bg-[#E5E7EB]" />
                <div className="h-4 w-48 rounded bg-[#E5E7EB]" />
              </div>
            </div>
          </div>
        </>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
