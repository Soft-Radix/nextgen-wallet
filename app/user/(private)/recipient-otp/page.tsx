"use client"
import { Button } from '@/components/ui';
import { BackIcon, VerifyOtpIcon } from '@/lib/svg';
import { getUserDetails } from '@/lib/utils/bootstrapRedirect';
import { useAppDispatch } from '@/store/hooks';
import { RootState } from '@/store/store';
import { AddTransaction } from '@/store/transactionSlice';
import { setUserBalanceUpdate } from '@/store/userDetailsSlice';
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState, type KeyboardEvent, type ChangeEvent } from 'react'
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';

const page = () => {
    const router = useRouter();
    const [otp, setOtp] = useState(["", "", "", ""]);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
    const draft = useSelector((state: RootState) => state.transaction.draftTransfer);
    const user = getUserDetails();
    const handleChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
        setError(null);
        const value = e.target.value;
        if (!/^\d?$/.test(value)) return; // allow only single digit

        const next = [...otp];
        next[index] = value;
        setOtp(next);

        if (value && index < inputsRef.current.length - 1) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        setError(null);
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputsRef.current[index - 1]?.focus();
        }
    };





    const dispatch = useAppDispatch();

    const handleVerify = async () => {
        const pin = otp.join("");

        if (!pin || otp.some((value) => value === "")) {
            setError("Please enter your full PIN");
            return;
        }
        if (!user?.id) {
            toast.error("Unable to find logged-in user.")
            return;
        }

        setSubmitting(true);


        const result = await dispatch(
            AddTransaction({
                sender_id: user.id,
                receiver_id: draft?.receiver_id ?? null,
                receiver_phone: draft?.receiver_phone ?? null,
                amount: draft?.amount ?? 0,
                note: draft?.note ?? null,
                pin,
            })
        );


        if (AddTransaction.fulfilled.match(result)) {
            const updatedUser = { ...user, wallet_balance: Number(user?.wallet_balance) - (draft?.amount ?? 0) };
            dispatch(setUserBalanceUpdate(updatedUser));
            router.push("/user/transfer-success");
        } else {

            toast.error((result.payload as string) || "Transfer failed. Please try again.")
        }

        setSubmitting(false);
    };


    return (
        <>
            <div className="flex items-center   gap-2 bg-[#ffffff] p-6 border-b border-buttonOutlineBorder">
                <button onClick={() => router.back()}> <BackIcon /></button>

                <h1 className="text-text text-lg font-bold flex-1 text-center ">Enter Your Pin</h1>
            </div>
            <div className="p-5 max-h-[calc(100vh-140px)] h-full overflow-y-auto flex flex-col items-center justify-center gap-2">
                <div className='w-[94px] h-[94px] rounded-full bg-gray-200 mt-[20px] border-4 border-[#dfe9f3] shadow-[0px_0px_4px_4px_rgba(17, 82, 212, 0.8)] relative ' >
                    <img src="/user1.jpg" alt="user" className='w-full h-full object-cover rounded-full' />
                    <div className='absolute bottom-0 right-0 w-[20px] h-[20px] border-2 border-white rounded-full bg-green-500'>

                    </div>
                </div>
                <p className="text-text text-[20px] font-semibold"> Pay ${draft?.amount || 0} </p>
                <p className="text-grey text-[14px] text-center ">To {draft?.receiver_phone || "N/A"}</p>
                <div className="flex flex-col gap-1 mb-[30px] mt-[20px]">
                    <p className="text-grey text-[14px] text-center uppercase mb-[10px]">Enter your pin</p>
                    <div className="flex items-center justify-center gap-3 ">
                        {otp.map((value, index) => (
                            <input
                                key={index}
                                ref={(el) => {
                                    inputsRef.current[index] = el;
                                }}
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                maxLength={1}
                                value={value}
                                onChange={(e) => handleChange(index, e)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className="w-[56px] h-[56px] rounded-[14px] border border-[#D8EBD7] bg-white text-center text-[24px] font-semibold text-text shadow-[0_2px_6px_rgba(0, 166, 62, 0.1)] focus:outline-none focus:ring-2 focus:ring-[#D8EBD7] focus:border-[#D8EBD7]"
                            />
                        ))}
                    </div>
                    {error && <p className="text-red-500 text-[14px] text-left ">{error}</p>}
                </div>

                <Button fullWidth={true} onClick={() => handleVerify()} disabled={submitting}>{submitting ? "Verifying..." : "Done"}</Button>


            </div>
        </>
    )
}

export default page