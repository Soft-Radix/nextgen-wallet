"use client";

import React, { useState } from "react";
import RecentReciptList from "./RecentReciptList";
import recentRecipts from "../dashboard/transactions.json";
import { ArrowRightBlockIcon, BackIcon, QuickSelectIcon } from "@/lib/svg";
import { useRouter } from "next/navigation";
import PhoneNumberInput from "@/components/ui/Phone";
import { Button } from "@/components/ui";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { setDraftTransfer } from "@/store/transactionSlice";
import { apiGetUserDetails } from "@/lib/api/userDetails";

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
    const [error, setError] = useState<string | null>(null);

    const handleContinue = async () => {
        if (!phoneNumber) {
            setError("Please enter a phone number.");
            return;
        }

        setLoading(true);
        setError(null);

        let receiverId: string | null = null;
        let receiverPhone: string | null = null;

        try {
            // Try to find an existing user in user_details
            const allDigits = String(phoneNumber).replace(/\D/g, "");
            const dialDigits = String(countryCode).replace(/\D/g, "");
            const nationalNumber = allDigits.startsWith(dialDigits)
                ? allDigits.slice(dialDigits.length)
                : allDigits;

            const user = await apiGetUserDetails(nationalNumber, countryCode);
            console.log("=========${formattedAmount}=", user)
            receiverId = user.id;
            receiverPhone =
                user.full_number || `${user.country_code}${user.mobile_number}`;
        } catch (err: any) {
            const status = err?.response?.status;

            if (status === 404) {
                // No user record -> send to raw number
                receiverId = null;
                receiverPhone = `${countryCode}${String(phoneNumber).replace(/\D/g, "")}`;
            } else {
                setError(
                    err?.response?.data?.error ||
                    err?.message ||
                    "Failed to search recipient"
                );
                setLoading(false);
                return;
            }
        }

        // Seed draft transfer (amount/note will be added on Enter Amount screen)
        dispatch(
            setDraftTransfer({
                receiver_id: receiverId,
                receiver_phone: receiverPhone,
                amount: 0,
                note: null,
            })
        );

        setLoading(false);
        router.push("/user/enter-amount");
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
                        if (error) setError(null);
                    }}
                    setCountry={setCountry}
                    country={country}
                    onDialCodeChange={setCountryCode}
                    shadow={false}
                />

                {error && (
                    <p className="text-red-500 text-sm mt-2">
                        {error}
                    </p>
                )}

                {/* quick select (still using dummy data for now) */}
                <div className="  mt-6">
                    <p className="text-[#1E2C44] text-[14px] font-bold  uppercase">
                        Quick Select
                    </p>
                    <div className="flex items-center justify-start gap-3 overflow-x-auto px-2 my-2">
                        <div className="flex items-center justify-center gap-1 flex-col">
                            <QuickSelectIcon />

                            <p className="text-[#1E2C44] text-[12px] font-semibold capitalize">
                                New
                            </p>
                        </div>
                        {recentRecipts?.transactions?.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-center gap-1 flex-col"
                                onClick={() => {
                                    // In future you can map these to real receiver_id/phone
                                    setPhoneNumber(String(item.full_number || "").replace(/\D/g, ""));
                                    dispatch(
                                        setDraftTransfer({
                                            receiver_id: item.id,
                                            receiver_phone: item.full_number,
                                            amount: 0,
                                            note: null,
                                        })
                                    );
                                }}
                            >
                                <div className="w-[50px] h-[50px] rounded-full bg-gray-200">
                                    <img src="/user.png" alt="user" />
                                </div>
                                <p className="text-[#1E2C44] text-[12px] font-semibold capitalize">
                                    {item?.name?.split(" ")[0]}
                                </p>
                            </div>
                        ))}
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
                <RecentReciptList list={recentRecipts.transactions} />
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