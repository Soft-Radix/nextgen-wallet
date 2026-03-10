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
      className={`fixed top-0 left-0 right-0 z-[9999] flex justify-center px-4 transition-all duration-300 ease-out ${isVisible ? "opacity-100" : "opacity-0"
        }`}
      style={{ 
        pointerEvents: isVisible ? "auto" : "none",
        paddingTop: 'max(1rem, calc(env(safe-area-inset-top, 0px) + 1rem))',
        WebkitTransform: isVisible ? 'translate3d(0, 0, 0)' : 'translate3d(0, -100%, 0)',
        transform: isVisible ? 'translate3d(0, 0, 0)' : 'translate3d(0, -100%, 0)',
        WebkitBackfaceVisibility: 'hidden',
        backfaceVisibility: 'hidden',
        willChange: 'transform, opacity',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
      }}
    >

      <div className="bg-white rounded-[20px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] w-full max-w-sm border border-gray-100 overflow-hidden  gap-3 p-4">
        <div className="flex items-start justify-center gap-3">
          <Logo />
          <div className="flex-1 ">
            {/* Header */}
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-3 ">

                <span className="text-transparent bg-gradient-to-r from-[var(--button-primary-from)] to-[var(--button-primary-to)] bg-clip-text font-bold text-[12px] uppercase tracking-wider">
                  {eventType}
                </span>
              </div>
              <span className="text-[#6F7B8F] text-[11px]">Just now</span>
            </div>

            {/* Body */}
            <div className="mb-3">
              <p className="text-[#6F7B8F] text-[14px] leading-[20px]">
                {message.split("**").map((part, index) => {
                  if (index % 2 === 1) {
                    return <strong key={index} className="font-semibold text-[#030200]">{part}</strong>;
                  }
                  return <span key={index}>{part}</span>;
                })}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mb-3 ">
              <button
                onClick={handleViewDetails}
                className="flex-1 bg-gradient-to-r from-[var(--button-primary-from)] to-[var(--button-primary-to)] text-white font-semibold py-3 px-4 rounded-xl hover:bg-buttonPrimaryFromHover active:bg-buttonPrimaryFrom transition-colors text-[14px]"
              >
                View Details
              </button>
              <button
                onClick={onDismiss}
                className=" bg-[#F0F7F0] border border-[#D8EBD7] text-[#030200] font-semibold py-3 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors text-[14px]"
              >
                Dismiss
              </button>
            </div>

          </div>
        </div>
        <div className="h-[6px] bg-[#D8EBD7] mx-auto mb-1 w-12 rounded-full"></div>
      </div >
      {/* Scroll Indicator */}

    </div >
  );
}
