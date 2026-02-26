"use client"
import { Button } from '@/components/ui';
import { BackIcon, VerifyOtpIcon } from '@/lib/svg';
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState, type KeyboardEvent, type ChangeEvent } from 'react'

const page = () => {
    const router = useRouter();
    const [otp, setOtp] = useState(["", "", "", ""]);
    const [timer, setTimer] = useState(80);
    const [error, setError] = useState<string | null>(null);
    const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

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
    useEffect(() => {
        if (timer <= 0) return;
        const id = setTimeout(() => {
            setTimer((prev) => Math.max(prev - 1, 0));
        }, 1000);
        return () => clearTimeout(id);
    }, [timer]);

    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    const formattedTimer = `${minutes.toString().padStart(2, "0")} : ${seconds
        .toString()
        .padStart(2, "0")}`;

    const handleVerify = () => {
        if (otp.every(value => value == "")) {
            setError("Please enter the OTP");
            return;

        } else if (otp.join("") != "1234") {
            setError("Invalid OTP");
            return;
        }

        else {
            router.push("/user/enter-amount");
            return;
        }
    }
    return (
        <>
            <div className="flex items-center   gap-2 bg-[#ffffff] p-6 border-b border-buttonOutlineBorder">
                <button onClick={() => router.back()}> <BackIcon /></button>

                <h1 className="text-text text-lg font-bold flex-1 text-center ">Recipient OTP Verification</h1>
            </div>
            <div className="p-5 max-h-[calc(100vh-140px)] h-full overflow-y-auto flex flex-col items-center justify-center gap-2">
                <VerifyOtpIcon />
                <p className="text-text text-[24px] font-semibold mt-[30px]"> Verify Recipient </p>
                <p className="text-grey text-[12px] text-center max-w-[270px]">We’ve sent a verification code
                    to the recipient’s mobile number.  </p>
                <div className="flex flex-col gap-1 mb-[30px]">
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

                <Button fullWidth={true} onClick={() => handleVerify()}>Verify</Button>

                {timer > 0 ? (
                    <p className="text-[#4CCF44] font-medium text-[16px]">
                        {formattedTimer}
                    </p>
                ) : (
                    <button
                        type="button"
                        className="text-[#00A63E] font-medium text-[16px]"
                        onClick={() => setTimer(80)}
                    >
                        Resend Code
                    </button>
                )}
            </div>
        </>
    )
}

export default page