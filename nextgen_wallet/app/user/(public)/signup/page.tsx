"use client";
import { Button } from "@/components/ui";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PhoneNumberInput from "@/components/ui/Phone";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createUserDetails, EmptyError } from "@/store/userDetailsSlice";
import { RootState } from "@/store/store";
import { bootstrapRedirect } from "@/lib/utils/bootstrapRedirect";

export default function SignUpPage() {
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
    const [isChecked, setIsChecked] = useState(false);
    const [country, setCountry] = useState("us"); // ISO code for UI
    const [countryCode, setCountryCode] = useState(initialDialCode); // dial code for API
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { loading, error } = useAppSelector((state: any) => state.userDetails);

    const handleSignUp = async () => {
        if (!phoneNumber) {
            // local validation error
            return;
        }
        if (savedNumber && savedNumber.length > 0) {
            router.push("/user/otp-verification");
            return;
        }

        // Strip country dial code from the full phone value for API
        const allDigits = phoneNumber.replace(/\D/g, "");
        const dialDigits = countryCode.replace(/\D/g, "");
        const nationalNumber = allDigits.startsWith(dialDigits)
            ? allDigits.slice(dialDigits.length)
            : allDigits;

        const resultAction: any = await dispatch(
            createUserDetails({
                mobile_number: nationalNumber,
                country: countryCode,

            })
        );
        if (resultAction.meta?.requestStatus == "fulfilled") {
            router.push("/user/otp-verification");
        }
    };
    useEffect(() => {
        bootstrapRedirect(router);
    }, [router]);
    return (
        <>
            <div className="max-w-[524px] w-full">
                <div className="bg-white pt-[48px] p-6 rounded-[14px] flex flex-col gap-[20px] items-center border-[0.5px] border-[var(--button-outline-border)] shadow-[0_23px_50px_rgba(25,33,61,0.02)] ">
                    <p className="text-text font-semibold text-[24px] leading-[35px]"> Sign Up</p>
                    <p className="text-grey  text-[14px] text-center mb-[20px]">Enter your phone number to get started.</p>
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
                    <Button fullWidth={true} onClick={handleSignUp} disabled={loading || !isChecked}>
                        {loading ? "Signing Up..." : "Sign Up"}
                    </Button>
                    <p className="text-grey text-[14px] ">Already have an account? <span className="text-text font-semibold" onClick={() => { dispatch(EmptyError()); router.push("/user/login") }}>Log In</span> </p>
                </div >
                <div className="flex  gap-4  justify-center items-start mt-[28px]">
                    <input type="checkbox"
                        style={{ accentColor: 'var(--button-primary-from)', borderColor: '#6F7B8F', borderWidth: "2px", width: "18px", height: "18px" }}
                        checked={isChecked}
                        onChange={() => setIsChecked(!isChecked)}
                    />
                    <span className="text-grey text-[14px] font-medium">
                        By continuing, you agree to our <span className="text-text underline"> Terms & Privacy Policy</span>.
                    </span>
                </div>
            </div>
        </>)
}
