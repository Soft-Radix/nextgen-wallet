"use client";

import Topbar from "@/components/Topbar";
import Button from "@/components/ui/Button";
import { getUserDetails } from "@/lib/utils/bootstrapRedirect";
import { RootState } from "@/store/store";
import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";

const PRESET_AMOUNTS = [20, 40, 60, 100];
const MAX_DAILY_WITHDRAWAL = 500;

const WithdrawMoneyPage = () => {
  const storedUser = getUserDetails();
  const reduxUser = useSelector((state: RootState) => state.userDetails?.user);
  const user = storedUser || reduxUser;
  const router = useRouter();

  const [selectedPreset, setSelectedPreset] = useState<number | null>(20);
  const [manualAmount, setManualAmount] = useState("20");

  const balance = Number(user?.wallet_balance) || 0;

  const handlePresetClick = useCallback((amount: number) => {
    setSelectedPreset(amount);
    setManualAmount(amount.toString());
  }, []);

  const handleManualChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/[^0-9.]/g, "");
      const parts = raw.split(".");
      const valid =
        parts.length <= 2 &&
        (parts[1] === undefined || parts[1].length <= 2);
      if (valid) setManualAmount(raw);
      setSelectedPreset(null);
    },
    []
  );

  const effectiveAmount = manualAmount
    ? parseFloat(manualAmount) || 0
    : selectedPreset ?? 0;

  const canGenerate =
    effectiveAmount > 0 &&
    effectiveAmount <= balance &&
    effectiveAmount <= MAX_DAILY_WITHDRAWAL;

  const handleGenerateCode = () => {
    if (!canGenerate) return;
    const formattedAmount = effectiveAmount.toFixed(2);
    router.push(
      `/withdraw-money/atm-code?amount=${encodeURIComponent(
        formattedAmount
      )}`
    );
  };

  return (
    <>
      <Topbar title="Withdraw Money" />
      <div className="p-4 sm:p-5 py-[77px] overflow-y-auto flex flex-col items-center min-h-[calc(100vh-120px)]">
        <div className="w-full max-w-[420px] flex flex-col gap-6 sm:gap-8">
          {/* Available Balance */}
          <div className="mt-4 sm:mt-6">
            <p className="text-grey text-center mt-5 text-xs sm:text-[14px] font-medium uppercase tracking-wider">
              AVAILABLE BALANCE
            </p>
            <p className="text-clip text-transparent bg-gradient-to-r from-[var(--button-primary-from)] to-[var(--button-primary-to)] bg-clip-text text-[48px] font-bold text-center">
              ${balance.toFixed(2)}
            </p>
          </div>

          {/* Select Amount */}
          <div>
            <p className="text-[#1E2C44] text-xs sm:text-[14px] font-bold uppercase tracking-wider mb-3">
              SELECT AMOUNT
            </p>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {PRESET_AMOUNTS.map((amount) => {
                const isSelected = selectedPreset === amount;
                return (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => handlePresetClick(amount)}
                    className={`
                      cursor-pointer py-3 sm:py-4 px-4 rounded-[10px] text-base sm:text-lg font-semibold transition-colors
                      ${
                        isSelected
                          ? "bg-gradient-to-r from-[var(--button-primary-from)] to-[var(--button-primary-to)] text-white shadow-[0_2px_3px_rgba(0,166,62,0.3)]"
                          : "bg-white border border-[var(--button-outline-border)] text-[var(--button-outline-text)] hover:border-[var(--button-primary-from)]/50"
                      }
                    `}
                  >
                    ${amount}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Enter Amount Manually */}
          <div>
          <p className="text-[#1E2C44] text-xs sm:text-[14px] font-bold uppercase tracking-wider mb-3">
              ENTER AMOUNT MANUALLY
            </p>
            <div className="relative flex items-center bg-white border border-[var(--button-outline-border)] rounded-[10px] overflow-hidden focus-within:ring-2 focus-within:ring-[var(--button-primary-from)]/30 focus-within:border-[var(--button-primary-from)]">
              <span className="absolute left-4 text-transparent bg-gradient-to-r from-[var(--button-primary-from)] to-[var(--button-primary-to)] bg-clip-text  font-bold text-base sm:text-lg">
                $
              </span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={manualAmount}
                onChange={handleManualChange}
                className="w-full pl-8 pr-4 py-3 sm:py-4 text-base sm:text-lg font-medium text-[var(--button-outline-text)] placeholder:text-greyLight outline-none bg-transparent"
              />
            </div>
          </div>

          {/* Important Withdrawal Policy */}
          <div className="rounded-lg border border-[#FEF3C7] bg-[#FFFBEB] p-4 flex gap-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-full text-[#D97706] border-2 border-[#D97706] flex items-center justify-center text-xs font-bold">
              i
            </span>
            <div className="flex flex-col gap-1">
              <p className="font-semibold text-[#92400E] text-sm sm:text-base">
                Important Withdrawal Policy
              </p>
              <p className="text-[#92400E] text-xs sm:text-sm leading-relaxed">
                ATM withdrawals are limited to $500 per day. Cardless codes are
                valid for{" "}
                <span className="text-[#92400E] font-bold">15 minutes</span>{" "}
                once generated.
              </p>
            </div>
          </div>

          {/* Generate ATM Code */}
          <div className="fixed bottom-0 left-0 right-0 max-w-[968px] w-full mx-auto px-5 bg-mainBackground pb-2">
            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              disabled={!canGenerate}
              onClick={handleGenerateCode}
              className="rounded-[10px] h-[52px] text-base font-semibold"
            >
              Generate ATM Code
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default WithdrawMoneyPage;
