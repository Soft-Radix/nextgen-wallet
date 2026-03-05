"use client";

import React, { useEffect, useState } from "react";
import RecentReciptList from "./RecentReciptList";
import recentRecipts from "../dashboard/transactions.json";
import { ArrowRightBlockIcon, BackIcon, QuickSelectIcon } from "@/lib/svg";
import { useRouter } from "next/navigation";
import PhoneNumberInput from "@/components/ui/Phone";
import { Button } from "@/components/ui";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store/store";
import { setDraftTransfer } from "@/store/transactionSlice";
import { apiGetUserDetails } from "@/lib/api/userDetails";
import toast from "react-hot-toast";
import { getNameCapitalized, getUserDetails, getUserImage } from "@/lib/utils/bootstrapRedirect";

const SendMoneyPage = () => {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();

    const [phoneNumber, setPhoneNumber] = useState("");
    const [country, setCountry] = useState("us");
    const [countryCode, setCountryCode] = useState(
        typeof window !== "undefined"
            ? localStorage.getItem("country_code") || "+1"
            : "+1"
    );
    const [loading, setLoading] = useState(false);
    const storedUser = getUserDetails();
    const reduxUser = useSelector((state: RootState) => state.userDetails.user);
    const user = reduxUser || storedUser;
    const draft = useSelector((state: RootState) => state.transaction.draftTransfer);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loadingTransactions, setLoadingTransactions] = useState<boolean>(true);

    useEffect(() => {
        const fetchTransactions = async () => {
            if (!user?.id) return;

            try {
                setLoadingTransactions(true);
                const response = await fetch("/api/transactions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        user_id: user.id,
                        page: 1,
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    console.error("Transactions fetch error:", data?.error || "Unknown error");
                    return;
                }

                setTransactions(data.items || []);
            } catch (error) {
                console.error("Transactions network error:", error);
            } finally {
                setLoadingTransactions(false);
            }
        };

        fetchTransactions();
    }, [user?.id]);

    const quickSelectItems = React.useMemo(() => {
        const seen = new Set<string>();

        return (transactions || [])
            .filter((tx) => tx.is_contact)
            .filter((tx) => {
                const key =
                    tx.counterparty_mobile ||
                    tx.receiver_mobile ||
                    tx.sender_mobile ||
                    String(tx.id);

                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
    }, [transactions]);


    const handleContinue = async () => {
        if (!phoneNumber) {
            toast.error("Please enter a phone number.")
            return;
        }

        setLoading(true);


        let receiverId: string | null = null;
        let receiverPhone: string | null = null;
        let userbyId: any | null = null;
        try {
            // Try to find an existing user in user_details
            const allDigits = String(phoneNumber).replace(/\D/g, "");
            const dialDigits = String(countryCode).replace(/\D/g, "");
            const nationalNumber = allDigits.startsWith(dialDigits)
                ? allDigits.slice(dialDigits.length)
                : allDigits;

            userbyId = await apiGetUserDetails("", nationalNumber, countryCode);
            receiverId = userbyId.id;
            receiverPhone =
                userbyId.full_number || `${userbyId.country_code}${userbyId.mobile_number}`;


        } catch (err: any) {
            const status = err?.response?.status;

            if (status === 404) {
                // No user record -> send to raw number
                receiverId = null;
                receiverPhone = `${countryCode}${String(phoneNumber).replace(/\D/g, "")}`;
                toast.error(err?.response?.data?.error)
                setLoading(false);
                return
            } else {

                toast.error(err?.response?.data?.error ||
                    err?.message ||
                    "Failed to search recipient")
                setLoading(false);
                return;
            }
        }

        // If we found a user in user_details and we have transaction history,
        // try to reuse the latest edited name from a previous transfer
        // to this receiver (regardless of contact flag).
        let isContactFromHistory = false;
        let nameFromHistory: string | null = null;

        if (receiverId) {
            const existingTx = transactions.find(
                (tx) =>
                    tx.receiver_profile_id &&
                    String(tx.receiver_profile_id) === String(receiverId) &&
                    tx.transaction_type === "sender" &&
                    tx.name
            );

            if (existingTx) {
                isContactFromHistory = !!existingTx.is_contact;
                nameFromHistory = existingTx.name ?? null;
            }
        }

        const finalIsContact = isContactFromHistory || (userbyId?.is_contact ?? false);
        const finalName = nameFromHistory ?? userbyId?.name ?? null;

        // Seed draft transfer (amount/note will be added on Enter Amount screen)
        dispatch(
            setDraftTransfer({
                receiver_id: receiverId,
                receiver_phone: receiverPhone,
                amount: 0,
                note: null,
                is_contact: finalIsContact,
                name: finalName,
            })
        );

        setLoading(false);
        if (!finalIsContact) {
            router.push("/user/enter-name?id=" + receiverId);
        } else {
            router.push("/user/enter-amount");
        }
    };

    return (
        <>
            <div className="flex items-center   gap-2 bg-[#ffffff] p-6 border-b border-buttonOutlineBorder">
                <button onClick={() => router.push("/user/dashboard")}>
                    <BackIcon />
                </button>

                <h1 className="text-text text-lg font-bold flex-1 text-center ">
                    Send Money
                </h1>
            </div>
            <div className="p-5 max-h-[calc(100vh-140px)] h-full overflow-y-auto">
                <PhoneNumberInput
                    label=""
                    placeholder="Enter phone number"
                    value={phoneNumber}
                    onChange={(value) => {
                        setPhoneNumber(value);

                    }}
                    setCountry={setCountry}
                    country={country}
                    onDialCodeChange={setCountryCode}
                    shadow={false}
                />



                {/* quick select (still using dummy data for now) */}
                <div className="  mt-6">
                    <p className="text-[#1E2C44] text-[14px] font-bold  uppercase">
                        Quick Select
                    </p>
                    <div className="flex items-center justify-start gap-3 overflow-x-auto px-2 my-2">
                        {loadingTransactions ? (
                            <>
                                <div className="flex items-center justify-center gap-2 flex-col animate-pulse">
                                    <div className="w-[50px] h-[50px] rounded-full bg-[#E5E7EB]" />
                                    <div className="h-3 w-10 rounded bg-[#E5E7EB]" />
                                </div>
                                {Array.from({ length: 4 }).map((_, idx) => (
                                    <div key={idx} className="flex items-center justify-center gap-2 flex-col animate-pulse">
                                        <div className="w-[50px] h-[50px] rounded-full bg-[#E5E7EB]" />
                                        <div className="h-3 w-16 rounded bg-[#E5E7EB]" />
                                    </div>
                                ))}
                            </>
                        ) : (
                            <>
                                <div className="flex items-center justify-center gap-1 flex-col">
                                    <QuickSelectIcon />

                                    <p className="text-[#1E2C44] text-[12px] font-semibold capitalize">
                                        New
                                    </p>
                                </div>
                                {quickSelectItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-center gap-1 flex-col"
                                        onClick={() => {
                                            // In future you can map these to real receiver_id/phone
                                            // setPhoneNumber(String(`+1${item.counterparty_mobile}` || "").replace(/\D/g, ""));
                                            dispatch(
                                                setDraftTransfer({
                                                    receiver_id: item.id,
                                                    receiver_phone: item.counterparty_mobile,
                                                    amount: 0,
                                                    note: null,
                                                    is_contact: true,
                                                    name: item?.name ?? null,

                                                })
                                            );
                                            router.push("/user/enter-amount");
                                        }}
                                    >
                                        <div className="w-[50px] h-[50px] rounded-full bg-gray-200">
                                            {item.user_image ? <img src={item.user_image} alt="user" /> : <p className="text-[#00DE1C] text-[16px] font-semibold capitalize text-center leading-[50px]">{getUserImage(item?.name ?? "")}</p>}

                                        </div>
                                        <p className="text-[#1E2C44] text-[12px] font-semibold capitalize">
                                            {getNameCapitalized(item?.name ?? "") || item?.counterparty_mobile}
                                        </p>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>

                {/* recent */}
                <div className="flex items-center justify-between  mt-6">
                    <p className="text-text text-[14px] font-bold  uppercase">
                        Recent Recipients
                    </p>
                    <p className="text-[#030200] text-[14px] font-medium flex items-center justify-center ">
                        View All <ArrowRightBlockIcon />
                    </p>
                </div>
                {loadingTransactions ? (
                    <div className="mt-3 flex flex-col gap-3">
                        {Array.from({ length: 3 }).map((_, idx) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between bg-white rounded-[14px] p-4 w-full border border-[#E5E7EB] animate-pulse"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-[40px] h-[40px] rounded-full bg-[#E5E7EB]" />
                                    <div className="flex flex-col gap-2">
                                        <div className="h-3 w-24 rounded bg-[#E5E7EB]" />
                                        <div className="h-3 w-16 rounded bg-[#E5E7EB]" />
                                    </div>
                                </div>
                                <div className="h-4 w-10 rounded bg-[#E5E7EB]" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <RecentReciptList list={transactions} />
                )}
            </div>
            <div className="px-5 fixed bottom-4 left-0 right-0 max-w-[968px] w-full mx-auto">
                <Button fullWidth={true} onClick={handleContinue} disabled={loading}>
                    {loading ? "Searching..." : "Continue"}
                </Button>
            </div>
        </>
    );
};

export default SendMoneyPage;