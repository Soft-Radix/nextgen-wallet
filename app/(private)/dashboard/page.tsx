"use client";
import { AccountSecurelyConnectedIcon, ArrowRightBlockIcon, MoneyIcon, NotificationIcon, PayScanIcon, SendIcon, WithdrawIcon } from "@/lib/svg";
import TransactionsList from "./TransactionsList";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useEffect, useState } from "react";
import { useAppDispatch } from "@/store/hooks";
import { loginUser } from "@/store/userDetailsSlice";
import { getNameCapitalized, getUserDetails, getUserImage } from "@/lib/utils/bootstrapRedirect";
import { ResetTransaction } from "@/store/transactionSlice";

interface DashboardTransaction {
    id: string;
    amount: number;
    status: string;
    created_at: string;
    transaction_type: "sender" | "receiver" | "withdrawal";
    type: "incoming" | "outgoing";
    sender_mobile?: string | null;
    receiver_mobile?: string | null;
    counterparty_mobile?: string | null;
}

export default function DashboardPage() {
    const router = useRouter();
    const storedUser = getUserDetails();
    const reduxUser = useSelector((state: RootState) => state.userDetails.user);
    const user = reduxUser || storedUser;
    const [transfers, setTransfers] = useState<DashboardTransaction[]>([]);
    const [withdrawals, setWithdrawals] = useState<DashboardTransaction[]>([]);
    const dispatch = useAppDispatch();
    useEffect(() => {
        const fetchUserDetails = async () => {
            if (storedUser?.id) {
                await dispatch(loginUser({ id: storedUser.id }));
            }
        };

        fetchUserDetails();
    }, [dispatch, storedUser?.id]);

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.id) return;

            try {
                const [txRes, wdRes] = await Promise.all([
                    fetch("/api/transactions", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            user_id: user.id,
                            page: 1,
                        }),
                    }),
                    fetch("/api/withdrawals", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            user_id: user.id,
                            page: 1,
                        }),
                    }),
                ]);

                const [txData, wdData] = await Promise.all([txRes.json(), wdRes.json()]);

                if (!txRes.ok) {
                    console.error("Transactions fetch error:", txData?.error || "Unknown error");
                } else {
                    setTransfers(txData.items || []);
                }

                if (!wdRes.ok) {
                    console.error("Withdrawals fetch error:", wdData?.error || "Unknown error");
                } else {
                    setWithdrawals(wdData.items || []);
                }
            } catch (error) {
                console.error("Dashboard transactions/withdrawals network error:", error);
            }
        };

        fetchData();
    }, [user?.id]);


    if (!user) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }
    return (
        <div className=" ">
            <div className="flex items-center justify-between  gap-2 p-5">

                {/* You can render user info here */}
                <div className="flex items-center justify-between  gap-2">
                    <div className="w-[50px] h-[50px] rounded-full bg-gray-200">
                        {user?.user_image ? <img src={user?.user_image} alt="user" /> : <p className="text-[#00DE1C] text-[16px] font-semibold capitalize text-center leading-[50px]">{getUserImage(user?.name ?? "")}</p>}
                    </div>
                    <div>
                        <p className="text-text  text-lg font-semibold">🌞 Good Morning, {getNameCapitalized(user?.name ?? "")}</p>
                        <p className="text-grey text-[12px]">Welcome to your secure dashboard.</p>
                    </div>
                </div>
                <button
                    type="button"
                    className="w-[40px] h-[40px] rounded-full bg-[#ffffff] flex items-center justify-center"
                    onClick={() => router.push("/notifications")}
                >
                    <div className="relative">
                        <NotificationIcon />
                        <div className="absolute -top-[2px] right-0 w-[7px] h-[7px] rounded-full bg-[#FF0000]"></div>
                    </div>
                </button>

            </div>
            <div className="max-h-[calc(100dvh-192px)] overflow-y-auto p-5 pb-10">
                {/* banner */}
                <div className="w-full  bg-[#0c3332] rounded-[14px] p-5  text-center bg-[url('/Background.png')] bg-cover bg-center">
                    <p className="text-[#FFFFFFB2]  text-[10px] font-semibold uppercase">Total Balance</p>
                    <p className="text-[#FFFFFF] text-[30px] font-bold">${user?.wallet_balance?.toFixed(2)}</p>
                    <p className="text-[#FFFFFFB2] text-[10px] bg-[#FFFFFF1A] w-fit mx-auto mt-[14px] rounded-[30px] px-4 py-2 flex items-center justify-center gap-1"><AccountSecurelyConnectedIcon />Account Securely Connected</p>
                </div>

                {/* Account Action */}
                <p className="text-text text-[14px] font-bold mt-6 uppercase">Quick Actions</p>
                <div className="flex items-center justify-between gap-2 mt-3">
                    <div className="flex items-center flex-col justify-center gap-2 cursor-pointer bg-[#ffffff] rounded-[14px] p-4 w-full shadow-[0_1px_2px_rgba(0, 0, 0, 0.05)]" onClick={() => router.push("/send-money")}>
                        <SendIcon />
                        <p className="text-greyDark text-[12px] font-semibold ">Send</p>
                    </div>
                    <div className="flex items-center flex-col justify-center gap-2 cursor-pointer bg-[#ffffff] rounded-[14px] p-4 w-full shadow-[0_1px_2px_rgba(0, 0, 0, 0.05)]" onClick={() => router.push("/withdraw-money")}>
                        <WithdrawIcon />
                        <p className="text-greyDark text-[12px] font-semibold">Withdraw</p>
                    </div>
                    <div className="flex items-center flex-col justify-center gap-2 cursor-pointer bg-[#ffffff] rounded-[14px] p-4 w-full shadow-[0_1px_2px_rgba(0, 0, 0, 0.05)]" onClick={() => router.push("/pay-scan")}>
                        <PayScanIcon />
                        <p className="text-greyDark text-[12px] font-semibold">Pay/Scan</p>
                    </div>
                </div>

                {/** My Money */}
                <p className="text-text text-[14px] font-bold mt-6 uppercase">My Money</p>
                <div className="flex items-center justify-between gap-2 mt-3">
                    <button onClick={() => router.push("/add-money")} className="flex items-center justify-between gap-2 cursor-pointer bg-[#ffffff] rounded-[14px] p-4 w-full shadow-[0_1px_2px_rgba(0, 0, 0, 0.05)]">
                        <p className="text-greyDark text-[13px] font-semibold flex items-center gap-2">
                            <div className="w-9 h-9 rounded-full bg-[#D1FAE5] flex items-center justify-center">
                                <MoneyIcon color="#00A91B" />
                            </div>
                            Add Cash</p>
                        <p><ArrowRightBlockIcon /></p>
                    </button>
                </div>

                {/* recent-transactions */}
                <div className="flex items-center justify-between  mt-6">
                    <p className="text-text text-[14px] font-bold  uppercase">Recent Transactions</p>
                    <button
                        type="button"
                        onClick={() => router.push("/transactions")}
                        className="text-[#030200] text-[14px] font-medium flex items-center justify-center "
                    >
                        View All <ArrowRightBlockIcon />
                    </button>
                </div>
                <TransactionsList
                    list={[...transfers, ...withdrawals].sort(
                        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    ).slice(0, 5)}
                    onItemClick={(item) => {
                        if (!item.id) return;
                        const kind = item.transaction_type === "withdrawal" ? "withdrawal" : "transfer";
                        const params = new URLSearchParams({
                            id: String(item.id),
                            kind,
                            amount: item.amount != null ? String(item.amount) : "",
                            status: item.status || "",
                            type: item.type || "",
                            date: item.created_at || "",
                            counterparty: item.counterparty_mobile || "",
                        });
                        router.push(`/transaction-details?${params.toString()}`);
                    }}
                />
            </div>
        </div>
    );
}
