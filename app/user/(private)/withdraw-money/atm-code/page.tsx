"use client";

import Topbar from "@/components/Topbar";
import Button from "@/components/ui/Button";
import { CheckCircleIcon, ClockIcon } from "@/lib/svg";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useMemo, useState } from "react";
import { getUserDetails } from "@/lib/utils/bootstrapRedirect";

const TOTAL_SECONDS = 10 * 60; // 10 minutes

const AtmCodeContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const amountParam = searchParams.get("amount") || "";
  const user = getUserDetails();

  const confirmedAmount = useMemo(() => {
    const value = parseFloat(amountParam);
    return Number.isFinite(value) && value > 0 ? value : 0;
  }, [amountParam]);

  const [timeLeft, setTimeLeft] = useState<number>(TOTAL_SECONDS);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const seconds = String(timeLeft % 60).padStart(2, "0");

  const progressPercent =
    ((TOTAL_SECONDS - timeLeft) / TOTAL_SECONDS) * 100;

  const code = useMemo(() => {
    const raw = Math.floor(100000 + Math.random() * 900000).toString();
    return `${raw.slice(0, 3)} ${raw.slice(3)}`;
  }, []);

  const [submitting, setSubmitting] = useState(false);

  const handleDone = async () => {
    if (!user?.id || submitting) {
      router.push(`/user/withdraw-money/success?amount=${encodeURIComponent(confirmedAmount)}`);
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          amount: confirmedAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Withdraw error:", data?.error || "Unknown error");
        router.push(`/user/withdraw-money/success?amount=${encodeURIComponent(confirmedAmount)}`);
        return;
      }

      const updatedBalance = data.wallet_balance;
      const referenceId = data.withdrawal?.id;

      const params = new URLSearchParams({
        amount: String(confirmedAmount),
      });

      if (typeof updatedBalance === "number") {
        params.set("balance", String(updatedBalance));
      }
      if (referenceId != null) {
        params.set("ref", String(referenceId));
      }

      router.push(`/user/withdraw-money/success?${params.toString()}`);
    } catch (error) {
      console.error("Withdraw network error:", error);
      router.push(`/user/withdraw-money/success?amount=${encodeURIComponent(confirmedAmount)}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/user/withdraw-money");
  };

  return (
    <>
      <Topbar title="ATM Code Generated" />
      <div className="p-4 sm:p-5 py-[77px] overflow-y-auto flex flex-col items-center min-h-[calc(100vh-120px)]">
        <div className="w-full max-w-[420px] flex flex-col gap-6 sm:gap-8">
          {/* Header */}
          <div className="mt-6 sm:mt-6 flex flex-col items-center gap-1">
            <div className="w-14 h-14 rounded-full bg-[#D1FAE5] flex items-center justify-center mb-3">
                <CheckCircleIcon />
            </div>
            <h1 className="text-text text-xl text-[#030200] font-semibold text-center">
              Your Withdrawal Code is Ready
            </h1>
            <p className="text-[#6F7B8F] text-basetext-center">
              Confirmed Amount:{" "}
              <span className="font-bold text-[#030200] text-base">
                ${confirmedAmount.toFixed(2)}
              </span>
            </p>
          </div>

          {/* ATM Code card */}
          <div className="bg-white rounded-[14px] shadow-[0_10px_30px_rgba(25,33,61,0.06)] p-6 flex flex-col items-center gap-4">
            <p className="text-[40px] font-bold tracking-[0.2em] text-clip text-transparent bg-gradient-to-r from-[var(--button-primary-from)] to-[var(--button-primary-to)] bg-clip-text">
              {code}
            </p>

            <div className="w-full flex items-center justify-center text-xs sm:text-sm text-grey-dark -mt-3">
              <p className="flex items-center gap-2">
                <ClockIcon color="#6F7B8F" />
                <span className="text-[#6F7B8F]">
                  Expires in {minutes}:{seconds}
                </span>
              </p>
            </div>

            <div className="w-full h-2 rounded-full bg-[#E2F6E3] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[var(--button-primary-from)] to-[var(--button-primary-to)] transition-[width] duration-300 ease-out"
                style={{
                  width: `${Math.min(100, Math.max(0, progressPercent))}%`,
                }}
              />
            </div>
          </div>

          {/* Next steps card */}
          <div className="bg-[#1BD4110D] border border-[#4CCF4450] rounded-[14px] p-4 flex gap-3 mb-10">
            <div className="mt-1">
            <span className="flex-shrink-0 w-4 h-4 rounded-full text-[#030200] border-2 border-[#030200] flex items-center justify-center text-[10px] font-bold">
              i
            </span>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[#030200] text-sm sm:text-base font-semibold">
                Next Steps:
              </p>
              <p className="text-[#6F7B8F] text-xs sm:text-sm leading-relaxed">
                Go to any{" "}
                <span className="font-semibold">partner ATM location</span>,
                select <span className="font-semibold text-[#030200]">Cardless Withdrawal</span>
                , and enter the 6-digit code shown above.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="fixed bottom-0 left-0 right-0 max-w-[968px] flex flex-col justify-center gap-1 w-full mx-auto px-5 bg-mainBackground pb-1 pt-2">
            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleDone}
              className="rounded-[10px] h-[52px] text-base font-semibold"
            >
              Done
            </Button>
            <button
              type="button"
              onClick={handleCancel}
              className="text-[#4CCF44] text-sm sm:text-base font-medium py-2 text-center hover:underline underline-offset-4"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default function AtmCode() {
  return (
    <Suspense
      fallback={
        <>
          <Topbar title="ATM Code Generated" />
          <div className="p-4 sm:p-5 py-[77px] overflow-y-auto flex flex-col items-center min-h-[calc(100vh-120px)]">
            <div className="w-full max-w-[420px] flex flex-col gap-6 sm:gap-8">
              <div className="mt-6 sm:mt-6 flex flex-col items-center gap-3 animate-pulse">
                <div className="w-14 h-14 rounded-full bg-[#E5E7EB]" />
                <div className="h-6 w-48 rounded bg-[#E5E7EB]" />
                <div className="h-4 w-32 rounded bg-[#E5E7EB]" />
              </div>
            </div>
          </div>
        </>
      }
    >
      <AtmCodeContent />
    </Suspense>
  );
}