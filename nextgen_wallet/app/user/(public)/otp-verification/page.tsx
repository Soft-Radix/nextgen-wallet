"use client";
import { useRef, useState, type KeyboardEvent, type ChangeEvent, useEffect } from "react";
import { Button } from "@/components/ui";
import { useRouter } from "next/navigation";
export default function OtpVerificationPage() {
    const [otp, setOtp] = useState(["", "", "", ""]);
    const [timer, setTimer] = useState(80);
    const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
    const router = useRouter();
    const handleChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
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

    return (
        <>
            <div className="max-w-[524px] w-full">
                <div className="bg-white pt-[48px] p-6 rounded-[14px] flex flex-col gap-[20px] items-center border-[0.5px] border-[var(--button-outline-border)] shadow-[0_23px_50px_rgba(25,33,61,0.02)] ">
                    <p className="text-text font-semibold text-[24px] leading-[35px]">
                        OTP Verification
                    </p>
                    <p className="text-grey text-[14px] text-center mb-[12px]">
                        We sent a code to +1 XXX-XXX-XXXX
                    </p>

                    <div className="flex items-center justify-center gap-3 mb-[16px]">
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

                    <Button fullWidth={true} onClick={() => router.push("/user/create-pin")}>Verify</Button>

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
            </div>
        </>
    );
}

