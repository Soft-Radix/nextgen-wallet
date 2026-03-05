import { IncomingIcon, OutgoingIcon } from '@/lib/svg'
import React from 'react'

interface Transaction {
    id?: string;
    status?: string;
    amount?: number;
    type?: "incoming" | "outgoing";
    created_at?: string;
    transaction_type?: "sender" | "receiver" | "withdrawal";
    sender_mobile?: string | null;
    receiver_mobile?: string | null;
    counterparty_mobile?: string | null;
    name?: string | null;
}

const formatDate = (iso?: string) => {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

const TransactionsList = ({ list, onItemClick }: { list: Transaction[]; onItemClick?: (item: Transaction) => void }) => {
    return (
        <div>
            {list.map((item: Transaction) => (
                <div
                    key={item.id}
                    className={`flex items-center justify-between bg-[#ffffff] rounded-[14px] p-4 w-full border-[0.5px] border-buttonOutlineBorder my-3 ${onItemClick ? "cursor-pointer hover:bg-[#F9FAFB]" : ""}`}
                    onClick={onItemClick ? () => onItemClick(item) : undefined}
                >
                    <div className="flex items-center justify-between gap-3">
                        <div className={`w-[40px] h-[40px] rounded-full flex items-center justify-center  ${item.type === "incoming" ? "bg-[#DCFCE7]" : "bg-[#FFE2E2]"}`}>
                            {item.type === "incoming" ? <IncomingIcon /> : <OutgoingIcon />}
                        </div>
                        <div>
                            <p className="text-text  text-[13px] font-semibold">
                                {(item.transaction_type === "sender"
                                    ? (item.name || item.receiver_mobile)
                                    : (item.name || item.sender_mobile)) ||
                                    item.counterparty_mobile?.replace("ATM Withdrawal", "Withdrawals") ||
                                    "Unknown"}
                            </p>
                            <div className="flex items-center justify-between gap-1 flex-wrap mt-2">
                                <span className="text-grey text-[11px]">{formatDate(item.created_at)}</span>
                                <div className="flex items-center justify-between gap-1">
                                    <p className="text-grey text-[11px]">•</p>
                                    <span className={`text-grey text-[11px] ${item.status === "Pending" ? "text-[#D08700]" : item.status === "Failed" ? "text-[#E7000B]" : "text-grey"}`}>{item.status}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <p className={`text-[16px] font-bold ${item.type === "incoming" ? "text-[#00A63E]" : "text-[#E7000B]"}`}>
                        {item.type === "incoming" ? "+" : "-"}${item.amount?.toFixed(2) ?? 0}
                    </p>
                </div>
            ))}
        </div>
    )
}

export default TransactionsList
