"use client";

import Topbar from "@/components/Topbar";
import Button from "@/components/ui/Button";
import { getUserDetails } from "@/lib/utils/bootstrapRedirect";
import { RootState } from "@/store/store";
import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { MoneyIcon } from "@/lib/svg";

const PRESET_AMOUNTS = [20, 50, 100, 200, 500];
const MAX_DAILY_WITHDRAWAL = 2000;

const AddMoneyPage = () => {
    const storedUser = getUserDetails();
    const reduxUser = useSelector((state: RootState) => state.userDetails.user);
    const user = storedUser || reduxUser;
    const router = useRouter();

    const [selectedPreset, setSelectedPreset] = useState<number | null>(20);
    const [manualAmount, setManualAmount] = useState("20");
    const [loading, setLoading] = useState(false);

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
        effectiveAmount <= MAX_DAILY_WITHDRAWAL;



    return (
        <>
            <Topbar title="Add Money" />
            <div className="p-4 sm:p-5 py-[80px]  flex flex-col items-center min-h-[calc(100vh-120px)]">
                <div className="w-full max-w-[420px] flex flex-col gap-6 sm:gap-8">
                    {/* Available Balance */}
                    <div className="mt-4 sm:mt-6 flex flex-col items-center gap-2">
                        <div className="w-14 h-14 rounded-full bg-[#D1FAE5] flex items-center justify-center">
                            <MoneyIcon width="30" height="30" color="#00DE1C" />
                        </div>
                        <p className="text-[#030200] text-xl font-bold text-center">
                            Add Cash to Your Wallet
                        </p>
                        <p className="text-[#6F7B8F] text-xs text-center">
                            Generate a barcode and add cash at any paticipating retail location. No bank account needed.
                        </p>
                    </div>

                    {/* Select Amount */}
                    <div>
                        <p className="text-[#1E2C44] text-xs sm:text-[14px] font-bold uppercase tracking-wider mb-3 mt-1">
                            SELECT AMOUNT
                        </p>
                        <div className="grid grid-cols-5 gap-4 sm:gap-4 justify-center items-center w-full">
                            {PRESET_AMOUNTS.map((amount) => {
                                const isSelected = selectedPreset === amount;
                                return (
                                    <button
                                        key={amount}
                                        type="button"
                                        onClick={() => handlePresetClick(amount)}
                                        className={`
                                        cursor-pointer py-3 sm:py-4 rounded-[10px] text-sm sm:text-lg font-semibold transition-colors
                                        ${isSelected
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
                        <p className="text-[#1E2C44] text-xs sm:text-[14px] font-bold tracking-wider mb-3">
                            Or ENTER AMOUNT MANUALLY
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
                        {!canGenerate && (
                            <p className="text-red-500 text-xs sm:text-sm mt-2">
                                Maximum  deposit is $2000.
                            </p>
                        )}
                    </div>

                    {/* Important Withdrawal Policy */}
                    <div className="rounded-lg border border-[#FEF3C7] bg-[#FFFBEB] p-4 flex gap-2">
                        <span className="flex-shrink-0 w-4 h-4 rounded-full text-[#D97706] border-2 border-[#D97706] flex items-center justify-center text-[10px] font-bold mt-0.5">
                            i
                        </span>
                        <div className="flex flex-col gap-1">
                            <p className="text-[#92400E] text-xs sm:text-sm leading-relaxed">
                                Cash deposits are processed instantly. A small service fee may apply at some locations.
                            </p>
                        </div>
                    </div>

                    {/* Generate ATM Code */}
                    <div className="sm:mt-4 fixed bottom-0 left-0 right-0 max-w-[968px] w-full mx-auto px-5 bg-mainBackground pb-4">
                        <Button
                            type="button"
                            variant="primary"
                            size="lg"
                            fullWidth
                            isLoading={loading}
                            disabled={loading || !canGenerate || !manualAmount || effectiveAmount <= 0 || effectiveAmount > MAX_DAILY_WITHDRAWAL}
                            onClick={async () => {
                                if (!canGenerate) { return; }
                                setLoading(true);
                                try {
                                    router.push(
                                        `/add-money/barcode?amount=${encodeURIComponent(
                                            effectiveAmount.toFixed(2)
                                        )}`
                                    );
                                } catch (error) {
                                    console.error("Error navigating to barcode page:", error);
                                    setLoading(false);
                                }
                            }}
                            className="rounded-[10px] h-[52px] text-base font-semibold"
                        >
                            Generate QR Code
                        </Button>
                    </div>
                </div>
            </div >
        </>
    );
};

export default AddMoneyPage;
