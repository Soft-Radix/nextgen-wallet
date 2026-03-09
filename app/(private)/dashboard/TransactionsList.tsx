import { IncomingIcon, OutgoingIcon } from '@/lib/svg'
import { getNameCapitalized } from '@/lib/utils/bootstrapRedirect';
import React from 'react'

interface Transaction {
    id?: string;
    status?: string;
    amount?: number;
    type?: "incoming" | "outgoing";
    created_at?: string;
    transaction_type?: "sender" | "receiver" | "withdrawal" | "add-money";
    sender_mobile?: string | null;
    receiver_mobile?: string | null;
    counterparty_mobile?: string | null;
    name?: string | null;
    sender_name?: string | null;
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

const TransactionsList = ({ list, onItemClick, loading }: { list: Transaction[]; onItemClick?: (item: Transaction) => void; loading?: boolean }) => {

    if (loading) {
        return (
            <div>
                {Array.from({ length: 5 }).map((_, idx) => (
                    <div
                        key={idx}
                        className="flex items-center justify-between bg-[#ffffff] rounded-[14px] p-4 w-full border-[0.5px] border-buttonOutlineBorder my-3 animate-pulse"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div className="w-[40px] h-[40px] rounded-full bg-[#E5E7EB]" />
                            <div>
                                <div className="h-3 w-28 rounded bg-[#E5E7EB] mb-2" />
                                <div className="flex items-center justify-between gap-1 flex-wrap mt-2">
                                    <div className="h-3 w-20 rounded bg-[#E5E7EB]" />
                                    <div className="h-3 w-16 rounded bg-[#E5E7EB]" />
                                </div>
                            </div>
                        </div>
                        <div className="h-4 w-16 rounded bg-[#E5E7EB]" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div>
            {list.map((item: Transaction) => (
                <div
                    key={item.id}
                    className={`flex items-center justify-between bg-[#ffffff] rounded-[14px] p-4 w-full border-[0.5px] border-buttonOutlineBorder my-3 ${onItemClick ? "cursor-pointer hover:bg-[#F9FAFB]" : ""}`}
                    onClick={onItemClick ? () => onItemClick(item) : undefined}
                >
                    <div className="flex items-center justify-between gap-3">
                        <div className={`w-[40px] h-[40px] rounded-full flex items-center justify-center  ${item.transaction_type === "add-money" || item.type === "incoming" ? "bg-[#DCFCE7]" : "bg-[#FFE2E2]"}`}>
                            {item.transaction_type === "add-money" || item.type === "incoming" ? <IncomingIcon /> : <OutgoingIcon />}
                        </div>
                        <div>
                            <p className="text-text  text-[13px] font-semibold">
                                {(item.type === "incoming"
                                    ? item.transaction_type === "add-money" ? "Added Cash" : (getNameCapitalized(item.sender_name ?? "") || item.sender_mobile || "")
                                    : (getNameCapitalized(item.name ?? "") || item.receiver_mobile)) ||
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
                    <p className={`text-[16px] font-bold ${item.transaction_type === "add-money" || item.type === "incoming" ? "text-[#00A63E]" : "text-[#E7000B]"}`}>
                        {item.transaction_type === "add-money" || item.type === "incoming" ? "+" : "-"}${item.amount?.toFixed(2) ?? 0}
                    </p>
                </div>
            ))}
        </div>
    )
}

export default TransactionsList
