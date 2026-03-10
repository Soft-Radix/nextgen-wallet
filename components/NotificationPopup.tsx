"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo, LogoPublic } from "@/lib/svg";

interface NotificationPopupProps {
  type: "send" | "receive";
  amount: string;
  counterparty: string;
  transactionId?: string;
  onDismiss: () => void;
  onViewDetails?: () => void;
}

export default function NotificationPopup({
  type,
  amount,
  counterparty,
  transactionId,
  onDismiss,
  onViewDetails,
}: NotificationPopupProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation on mount
    setIsVisible(true);
  }, []);

  useEffect(() => {
    if (isVisible) {
      setTimeout(() => {
        setIsVisible(false);
      }, 15000);
    }
  }, [isVisible]);

  const handleViewDetails = () => {
    if (transactionId) {
      const params = new URLSearchParams({
        id: transactionId,
        kind: "transfer",
        amount: amount.replace("$", "").replace(/,/g, ""),
        type: type === "receive" ? "incoming" : "outgoing",
        counterparty: counterparty,
      });
      router.push(`/transaction-details?${params.toString()}`);
    } else {
      // Navigate to transactions page if no transaction ID
      router.push("/transactions");
    }
    onViewDetails?.();
    onDismiss();
  };

  const eventType = type === "receive" ? "PAYMENT RECEIVED" : "PAYMENT SENT";
  const message = type === "receive"
    ? `You received **${amount}** from **${counterparty}**`
    : `You sent **${amount}** to **${counterparty}**`;

  return (
    <div
      className={`fixed inset-x-0 top-4 z-[9999] flex justify-center px-4 transition-all duration-300 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10"
        }`}
    >
      <div className="bg-white rounded-[20px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] w-full max-w-sm border border-gray-100 overflow-hidden p-4">

        <div className="flex items-start gap-3">
          <Logo />

          <div className="flex-1">

            {/* Header */}
            <div className="flex items-center justify-between pb-2">
              <span className="text-transparent bg-gradient-to-r from-[var(--button-primary-from)] to-[var(--button-primary-to)] bg-clip-text font-bold text-[12px] uppercase tracking-wider">
                {eventType}
              </span>

              <span className="text-[#6F7B8F] text-[11px]">Just now</span>
            </div>

            {/* Body */}
            <p className="text-[#6F7B8F] text-[14px] leading-[20px] mb-3">
              {message.split("**").map((part, index) =>
                index % 2 ? (
                  <strong key={index} className="font-semibold text-[#030200]">
                    {part}
                  </strong>
                ) : (
                  <span key={index}>{part}</span>
                )
              )}
            </p>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleViewDetails}
                className="flex-1 bg-gradient-to-r from-[var(--button-primary-from)] to-[var(--button-primary-to)] text-white font-semibold py-3 px-4 rounded-xl text-[14px]"
              >
                View Details
              </button>

              <button
                onClick={onDismiss}
                className="bg-[#F0F7F0] border border-[#D8EBD7] text-[#030200] font-semibold py-3 px-4 rounded-xl text-[14px]"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>

        <div className="h-[6px] bg-[#D8EBD7] mx-auto mt-3 w-12 rounded-full"></div>
      </div>
    </div>
  );
}
