"use client"
import Topbar from '@/components/Topbar'
import { Button } from '@/components/ui';
import { ClockIcon } from '@/lib/svg'
import { getUserDetails } from '@/lib/utils/bootstrapRedirect';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useMemo } from 'react'
import QRCode from "react-qr-code";

const BarcodeContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const amountParam = searchParams.get("amount") || "";

    const MOBILE_NUMBER = "44444444"; // US number
    const COUNTRY_CODE = "+1";

    const amount = useMemo(() => {
        const value = parseFloat(amountParam);
        return Number.isFinite(value) && value > 0 ? value : 0;
    }, [amountParam]);

    const formattedAmount = amount.toFixed(2);
    // Deep link that opens PayPal with this phone as recipient and amount prefilled
    const qrValue = `https://paypal.me/${COUNTRY_CODE.replace("+", "")}${MOBILE_NUMBER}/${formattedAmount}`;
    const user = getUserDetails();
    const handleGenerateCode = async () => {
        if (!amount) return;

        try {
            const response = await fetch("/api/add-money", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    user_id: user.id,
                    amount: formattedAmount,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                console.error("Add money error:", data?.error || "Unknown error");
            }
        } catch (error) {
            console.error("Add money network error:", error);
        }
        router.push("/dashboard");

    };
    return (
        <>
            <Topbar title="Your Cash-in QR Code" />
            <div className="p-4 sm:p-5 py-[80px] overflow-y-auto flex flex-col items-center min-h-[calc(100vh-120px)]">
                <div className="w-full max-w-[420px] flex flex-col gap-6 sm:gap-8">
                    <div className="mt-4 sm:mt-6 flex flex-col items-center bg-white rounded-lg border border-[#D8EBD7] p-4">
                        <p className="text-clip text-transparent bg-gradient-to-r from-[var(--button-primary-from)] to-[var(--button-primary-to)] bg-clip-text text-[48px] font-bold text-center">
                            ${amount}
                        </p>
                        <p className="text-[#6F7B8F] text-xs text-center -mt-1">Amount to Add</p>
                        <div className='my-3 bg-[#F8FAFC] rounded-[12px] p-4 flex items-center justify-center'>
                            <QRCode
                                value={qrValue}
                                size={130}
                                fgColor="#030200"
                                bgColor="transparent"
                            />
                        </div>
                        <p className='text-[#e0ab39] text-xs text-center flex items-center gap-2'><ClockIcon color='#e0ab39' /> Valid for 24 hours</p>
                    </div>
                    <div className="bg-white border border-[#D8EBD7] rounded-lg p-4 grid gap-3">
                        <div className='flex items-center gap-2'>
                            <p className='text-[#030200] bg-[#00DE1C] text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs text-center'>1</p>
                            <p className='text-[#6F7B8F] text-xs text-center'>Visit any participating retail location</p>
                        </div>
                        <div className='flex items-center gap-2'>
                            <p className='text-[#030200] bg-[#00DE1C] text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs text-center'>2</p>
                            <p className='text-[#6F7B8F] text-xs text-center'>Scan the barcode</p>
                        </div>
                        <div className='flex items-center gap-2'>
                            <p className='text-[#030200] bg-[#00DE1C] text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs text-center'>3</p>
                            <p className='text-[#6F7B8F] text-xs text-center'>Enter the amount</p>
                        </div>
                    </div>
                    <div className='fixed bottom-0 left-0 right-0 max-w-[968px] w-full mx-auto px-5 bg-mainBackground pb-4'>
                        <Button
                            type="button"
                            variant="primary"
                            size="lg"
                            fullWidth
                            onClick={handleGenerateCode}
                            className="rounded-[10px] h-[52px] text-base font-semibold bg-[#4CCF44] from-[#4CCF44] to-[#4CCF44] hover:from-[#45b83d] hover:to-[#45b83d]"
                        >
                            Done
                        </Button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default function BarcodePage() {
    return (
        <Suspense
            fallback={
                <>
                    <Topbar title="Your Cash-in QR Code" />
                    <div className="p-4 sm:p-5 py-[80px] overflow-y-auto flex flex-col items-center min-h-[calc(100vh-120px)]">
                        <div className="w-full max-w-[420px] flex flex-col gap-6 sm:gap-8">
                            <div className="mt-4 sm:mt-6 flex flex-col items-center bg-white rounded-lg border border-[#D8EBD7] p-4 animate-pulse">
                                <div className="h-12 w-24 rounded bg-[#E5E7EB]" />
                                <div className="h-3 w-20 rounded bg-[#E5E7EB] -mt-1" />
                                <div className="my-3 bg-[#F8FAFC] rounded-[12px] p-4 w-[130px] h-[130px]" />
                            </div>
                        </div>
                    </div>
                </>
            }
        >
            <BarcodeContent />
        </Suspense>
    );
}