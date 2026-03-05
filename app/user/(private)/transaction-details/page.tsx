"use client";

import Topbar from "@/components/Topbar";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowRightBlockIcon, CalenderIcon, CheckCircleIcon, ReceivedIcon, SentIcon } from "@/lib/svg";
import { getNameCapitalized } from "@/lib/utils/bootstrapRedirect";

interface TransactionDetails {
  id: string;
  kind: "transfer" | "withdrawal";
  amount: number;
  status: string;
  created_at: string;
  sender_phone: string | null;
  receiver_phone: string | null;
  counterparty_phone: string | null;
  note: string | null;
  reference: string | number | null;
  sender_name: string | null;
  receiver_name: string | null;
}

export default function TransactionDetailsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const id = searchParams.get("id");
  const kindParam = searchParams.get("kind");
  const prefetchedAmount = searchParams.get("amount");
  const prefetchedStatus = searchParams.get("status");
  const prefetchedType = searchParams.get("type"); // "incoming" | "outgoing"
  const prefetchedDate = searchParams.get("date");
  const prefetchedCounterparty = searchParams.get("counterparty");

  const [details, setDetails] = useState<TransactionDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await fetch("/api/transaction-details", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id,
            kind: kindParam === "withdrawal" ? "withdrawal" : "transfer",
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error("Transaction details error:", data?.error || "Unknown error");
          setLoading(false);
          return;
        }

        setDetails(data);
      } catch (error) {
        console.error("Transaction details network error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id, kindParam]);

  const effective = useMemo(() => {
    if (!details) {
      if (!id) return null;
      // Fallback using query string when API not yet loaded
      return {
        id,
        kind: (kindParam === "withdrawal" ? "withdrawal" : "transfer") as
          | "withdrawal"
          | "transfer",
        amount: prefetchedAmount ? Number(prefetchedAmount) || 0 : 0,
        status: prefetchedStatus || "Completed",
        created_at: prefetchedDate || new Date().toISOString(),
        sender_phone: null,
        receiver_phone: null,
        counterparty_phone: prefetchedCounterparty || null,
        note: null,
        reference: id,
      } as TransactionDetails;
    }
    return details;
  }, [
    details,
    id,
    kindParam,
    prefetchedAmount,
    prefetchedCounterparty,
    prefetchedDate,
    prefetchedStatus,
  ]);

  if (!id) {
    return null;
  }

  const amount = effective?.amount ?? 0;
  const isWithdrawal = effective?.kind === "withdrawal";

  // Direction based on list item we clicked
  const direction =
    prefetchedType === "incoming" || prefetchedType === "outgoing"
      ? prefetchedType
      : isWithdrawal
        ? "outgoing"
        : "incoming";

  const isIncoming = !isWithdrawal && direction === "incoming";

  const kindLabel = isWithdrawal
    ? "Withdrawals"
    : isIncoming
      ? "Received"
      : "Sent";

  const createdDate = effective?.created_at
    ? new Date(effective.created_at)
    : new Date();

  const dateLabel = createdDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const timeLabel = createdDate.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <Topbar title="Transaction Details" />
      <div className="p-4 sm:p-5 pt-[80px] pb-20 overflow-y-auto flex flex-col items-center min-h-[calc(100vh-120px)]">
        <div className="w-full max-w-[420px] flex flex-col gap-6 sm:gap-8">
          {/* Amount + status */}
          {loading || !effective ? (
            <div className="mt-5 flex flex-col items-center gap-3 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-[#E5E7EB]" />
              <div className="h-3 w-24 rounded bg-[#E5E7EB]" />
              <div className="h-6 w-32 rounded-full bg-[#E5E7EB]" />
              <div className="h-9 w-40 rounded bg-[#E5E7EB]" />
            </div>
          ) : (
            <div className="mt-5 flex flex-col items-center gap-3">
              {isWithdrawal ? (
                <SentIcon />
              ) : direction === "incoming" ? (
                <ReceivedIcon />
              ) : (
                <SentIcon />
              )}
              <p className="text-[13px] text-grey font-medium">
                {isWithdrawal ? "Withdrawal" : kindLabel}
              </p>
              <span className="px-3 py-2 text-white rounded-full text-[11px] font-medium flex items-center gap-2 bg-[#00A63E]">
                <CheckCircleIcon width="15" height="15" color="#fff" /> Completed
              </span>
              <p
                className={`text-[40px] sm:text-[40px] font-bold ${isIncoming
                  ? "text-clip text-transparent bg-gradient-to-r from-[var(--button-primary-from)] to-[var(--button-primary-to)] bg-clip-text"
                  : "text-[#E7000B]"
                  }`}
              >
                {isIncoming ? "+" : "-"}${amount.toFixed(2)}
              </p>
            </div>
          )}

          {/* Details card */}
          <div className="bg-white border border-[#D8EBD7] rounded-[14px] shadow-[0_10px_30px_rgba(25,33,61,0.06)] p-5 flex flex-col gap-4">
            {loading || !effective ? (
              <>
                <div className="flex items-center justify-between text-[13px]">
                  <div className="h-3 w-20 rounded bg-[#E5E7EB]" />
                  <div className="h-3 w-28 rounded bg-[#E5E7EB]" />
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <div className="h-3 w-16 rounded bg-[#E5E7EB]" />
                  <div className="h-3 w-24 rounded bg-[#E5E7EB]" />
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <div className="h-3 w-16 rounded bg-[#E5E7EB]" />
                  <div className="h-3 w-24 rounded bg-[#E5E7EB]" />
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <div className="h-3 w-16 rounded bg-[#E5E7EB]" />
                  <div className="h-3 w-24 rounded bg-[#E5E7EB]" />
                </div>
                <div className="border-t border-[#E5E7EB] pt-4 mt-2">
                  <div className="h-3 w-16 rounded bg-[#E5E7EB] mb-2" />
                  <div className="h-3 w-32 rounded bg-[#E5E7EB]" />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between text-[13px] text-grey">
                  <span>Reference ID</span>
                  <span className="text-text font-semibold">
                    {effective?.reference?.toString()?.slice(0, 20) ?? "-"}
                  </span>
                </div>

                {!isWithdrawal && (
                  <>
                    <div className="flex items-center justify-between text-[13px] text-grey">
                      <span>From</span>
                      <div className="flex items-end flex-col justify-between gap-1">
                        <span className="text-text font-semibold text-right">
                          {getNameCapitalized(effective?.sender_name ?? "") || "-"}
                        </span>
                        <span className="text-grey  text-right">
                          {effective?.sender_phone || "-"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[13px] text-grey">
                      <span>To</span>
                      <div className="flex items-end flex-col justify-between gap-1">
                        <span className="text-text font-semibold text-right">
                          {getNameCapitalized(effective?.receiver_name ?? "") ||

                            "-"}
                        </span>
                        <span className="text-grey  text-right">
                          {effective?.receiver_phone ||
                            effective?.counterparty_phone ||
                            "-"}
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {isWithdrawal && (
                  <div className="flex items-center justify-between text-[13px] text-grey">
                    <span>Method</span>
                    <span className="text-text font-semibold text-right">
                      ATM Withdrawal
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-[13px] text-grey">
                  <span>Date</span>
                  <span className="text-text font-semibold text-right flex items-center gap-2">
                    <CalenderIcon /> {dateLabel}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[13px] text-grey">
                  <span>Time</span>
                  <span className="text-text font-semibold text-right">
                    {timeLabel}
                  </span>
                </div>

                <div className="flex flex-col gap-1 text-[13px] text-grey border-t border-[#E5E7EB] pt-4 mt-2">
                  <span>Note</span>
                  <p className="text-text font-semibold">
                    {effective?.note || "---"}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Back to transactions */}
          {/* <button
            type="button"
            onClick={() => router.push("/user/transactions")}
            className="mt-2 text-text text-[14px] font-medium flex items-center justify-center gap-2"
          >
            Back to Transactions <ArrowRightBlockIcon />
          </button> */}
        </div>
      </div>
    </>
  );
}

