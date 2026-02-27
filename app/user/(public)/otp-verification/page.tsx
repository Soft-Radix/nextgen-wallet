"use client";
import { useRef, useState, type KeyboardEvent, type ChangeEvent, useEffect } from "react";
import { Button } from "@/components/ui";
import { useRouter } from "next/navigation";
import { bootstrapRedirect } from "@/lib/utils/bootstrapRedirect";
export default function OtpVerificationPage() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const [otp, setOtp] = useState(["", "", "", ""]);
    const [timer, setTimer] = useState(80);
    const [error, setError] = useState<string | null>(null);
    const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
    const router = useRouter();
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
        else if (user?.status == "active") {
            router.push("/user/dashboard");
            return;
        }
        else {
            router.push("/user/create-pin");
            return;
        }
    }

    useEffect(() => {
        if (typeof window === "undefined") return;
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (!user?.id) {
            router.push("/user/welcome");
        }

    }, [])
    return (
        <>
            <div className="max-w-[524px] w-full">
                <div className="bg-white pt-[48px] p-6 rounded-[14px] flex flex-col gap-[20px] items-center border-[0.5px] border-[var(--button-outline-border)] shadow-[0_23px_50px_rgba(25,33,61,0.02)] ">
                    <p className="text-text font-semibold text-[24px] leading-[35px]">
                        OTP Verification
                    </p>
                    <p className="text-grey text-[14px] text-center mb-[12px]">
                        We sent a code to {user?.country_code} {user?.mobile_number}
                    </p>
                    <div className="flex flex-col gap-1 mb-[16px]">
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
                        {error && <p className="text-red-500 text-[14px] text-left">{error}</p>}
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
            </div>
        </>
    );
}

