"use client";
import { Button } from "@/components/ui";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PhoneNumberInput from "@/components/ui/Phone";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { EmptyError, loginUser } from "@/store/userDetailsSlice";
import { RootState } from "@/store/store";

export default function LoginPage() {
    const savedNumber =
        typeof window !== "undefined"
            ? localStorage.getItem("mobile_number")
            : null;
    const savedCountryCode =
        typeof window !== "undefined"
            ? localStorage.getItem("country_code")
            : null;

    const initialDialCode = savedCountryCode || "+91";
    const initialNationalNumber = savedNumber || "";
    const initialPhoneValue =
        initialNationalNumber ? `${initialDialCode}${initialNationalNumber}` : "";

    const [phoneNumber, setPhoneNumber] = useState(initialPhoneValue);
    const [country, setCountry] = useState("us"); // ISO code for UI
    const [countryCode, setCountryCode] = useState(initialDialCode); // dial code for API
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { loading, error } = useAppSelector((state: any) => state.userDetails);

    const handleLogin = async () => {
        if (!phoneNumber) {
            // local validation error
            return;
        }

        // Strip country dial code from the full phone value for API
        const allDigits = phoneNumber.replace(/\D/g, "");
        const dialDigits = countryCode.replace(/\D/g, "");
        const nationalNumber = allDigits.startsWith(dialDigits)
            ? allDigits.slice(dialDigits.length)
            : allDigits;

        const resultAction: any = await dispatch(
            loginUser({
                mobile_number: nationalNumber,
                country: countryCode,
            })
        );

        if (resultAction.meta?.requestStatus === "fulfilled") {
            router.push("/user/otp-verification");
        }
    };
    return (
        <>
            <div className="max-w-[524px] w-full">
                <div className="bg-white pt-[48px] p-6 rounded-[14px] flex flex-col gap-[20px] items-center border-[0.5px] border-[var(--button-outline-border)] shadow-[0_23px_50px_rgba(25,33,61,0.02)] ">
                    <p className="text-text font-semibold text-[24px] leading-[35px]"> Welcome Back 👋</p>
                    <p className="text-grey  text-[14px] text-center mb-[3px]">Log in to access your NexGenPay wallet.</p>
                    <PhoneNumberInput
                        label="Phone number"
                        placeholder="Enter phone number"
                        value={phoneNumber}
                        onChange={(value) => setPhoneNumber(value)}
                        setCountry={setCountry}
                        country={country}
                        onDialCodeChange={setCountryCode}
                    />
                    {error && (
                        <p className="text-red-500 text-xs w-full text-left">{error}</p>
                    )}
                    <Button fullWidth={true} onClick={handleLogin} disabled={loading}>
                        {loading ? "Logging In..." : "Log In"}
                    </Button>



                    <p className="text-grey text-[14px] ">Don't have an account? <span className="text-text font-semibold pointer" onClick={() => { dispatch(EmptyError()); router.push("/user/signup") }}>Sign Up</span> </p>



                </div >

            </div>
        </>)
}
