"use client";

import Topbar from "@/components/Topbar";
import { Button } from "@/components/ui";
import { SendMoney } from "@/lib/svg";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store/store";
import { AddTransaction } from "@/store/transactionSlice";
import toast from "react-hot-toast";
import { setUserBalanceUpdate } from "@/store/userDetailsSlice";
import { getUserDetails } from "@/lib/utils/bootstrapRedirect";

const page = () => {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();

    const draft = useSelector((state: RootState) => state.transaction.draftTransfer);
    const user = getUserDetails();

    const [senderId, setSenderId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Redirect back if user lands here without going through Enter Amount
    useEffect(() => {
        if (!draft) {
            router.replace("/user/send-money/amount");
        }
    }, [draft, router]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user?.id) setSenderId(user.id);
            } catch {
                // ignore
            }
        }
    }, []);

    if (!draft) {
        return null; // or a simple loading/redirect message
    }
    const amount = draft.amount;
    const formattedAmount = amount.toFixed(2);

    const currentBalance = typeof user?.wallet_balance === "number" ? user.wallet_balance : 0;
    const balanceAfterTransfer = currentBalance - amount;
    const formattedCurrentBalance = balanceAfterTransfer.toFixed(2);
    const formattedBalanceAfter = currentBalance.toFixed(2);




    const handleCancel = () => {
        const updatedUser = { ...user, wallet_balance: Number(user?.wallet_balance) + draft.amount || 0 };
        dispatch(
            setUserBalanceUpdate(updatedUser)
        );
        router.push("/user/send-money");
    };
    return (

        <>
            <Topbar title="Confirm Transfer" />
            <div className="p-5  py-[77px]  overflow-y-auto flex flex-col items-center justify-center gap-2">

                <p className="text-grey text-[14px] font-medium mt-[30px] uppercase"> Sending Amount </p>
                <p className="text-clip text-transparent bg-gradient-to-r from-[var(--button-primary-from)] to-[var(--button-primary-to)] bg-clip-text text-[48px] font-bold text-center ">${formattedAmount}</p>
                {/* amount to send */}
                <div className='w-full flex flex-col  justify-between gap-2 bg-[#ffffff] rounded-[14px] p-6 mt-[20px] border-[0.5px] border-buttonOutlineBorder shadow-[0px_6px_10px_rgba(0, 0, 0, 0.2)]'>
                    <div className='flex items-start gap-5 border-b-[1.06px] border-[#F1F5F9] pb-4 mb-4'>
                        <div className='w-[52px] h-[52px] rounded-full bg-gray-200 shadow-[0px_0px_4px_4px_rgba(17, 82, 212, 0.8)] relative ' >
                            <img src="/user1.jpg" alt="user" className='w-full h-full object-cover rounded-full' />

                        </div>
                        <div>
                            <p className="text-grey text-[14px]  ">To</p>
                            <p className="text-text text-[20px] font-bold ">John Doe</p>
                            <p className="text-grey text-[14px] font-medium ">"Lunch from Friday"</p>
                        </div>
                    </div>
                    <div className='flex items-center justify-between gap-2'>
                        <p className="text-grey text-[14px]  ">Bank Name</p>
                        <p className="text-text text-[14px] font-semibold text-right ">Global Finance Bank</p>
                    </div>
                    <div className='flex items-center justify-between gap-2'>
                        <p className="text-grey text-[14px]  ">Account Number</p>
                        <p className="text-text text-[14px] font-semibold text-right ">**** 8829</p>
                    </div>
                    <div className='flex items-center justify-between gap-2'>
                        <p className="text-grey text-[14px]  ">Transfer Fee</p>
                        <p className="text-[#16A34A] text-[14px] font-semibold text-right ">Free</p>

                    </div>
                    <hr className='border-[#E2E8F0]  border-dashed  boredr-2 my-6' />
                    <div className='flex items-center justify-between gap-2'>
                        <p className="text-grey text-[14px]  ">Total Deduction</p>
                        <p className="text-text text-[14px] font-semibold text-right ">${formattedAmount}</p>
                    </div>

                </div>

                {/* balance*/}
                <div className='w-full flex flex-col  justify-between gap-2 bg-[#1BD4110D] rounded-[14px] p-6 mt-[20px] border-[0.5px] border-buttonOutlineBorder shadow-[0px_6px_10px_rgba(0, 0, 0, 0.2)] mb-20'>
                    <div className='flex items-center gap-2 border-b-[1.06px] border-[#F1F5F9] pb-4 mb-4 '>
                        <SendMoney />
                        <div >
                            <div className='flex items-center justify-between gap-2'>
                                <p className="text-grey text-[12.7px] font-semibold uppercase">
                                    Balance after transfer
                                </p>
                                <p className="text-grey text-[10.58px]  text-right uppercase ">
                                    Current Balance
                                </p>
                            </div>
                            <div className='flex items-center justify-between gap-2'>
                                <p className="text-text text-[21px] font-bold ">
                                    ${formattedCurrentBalance}
                                </p>
                                <p className="text-greyDark text-[21px] font-medium text-right ">
                                    ${formattedBalanceAfter}
                                </p>
                            </div>
                        </div>
                    </div>



                </div>

                {/* continue button */}
                <div className=" flex flex-col gap-2 items-center justify-center mt-[40px] fixed bottom-0 left-0 right-0 max-w-[968px] w-full mx-auto px-5 bg-mainBackground pb-4">
                    <Button
                        fullWidth={true}
                        onClick={() => router.push("/user/recipient-otp")}
                        disabled={submitting}
                    >
                        {submitting ? "Sending..." : "Send Money"}
                    </Button>
                    <p
                        className="text-[16px] font-medium text-[#4CCF44] text-center cursor-pointer"
                        onClick={handleCancel}
                    >
                        Cancel
                    </p>
                </div>
            </div>
        </>
    )
}

export default page