"use client"
import { Button, PhoneInput } from "@/components/ui"
import { useState } from "react"
import { useRouter } from "next/navigation";

export default function SignUpPage() {
    const [phoneNumber, setPhoneNumber] = useState("")
    const router = useRouter();
    return (
        <>
            <div className="max-w-[524px] w-full">
                <div className="bg-white pt-[48px] p-6 rounded-[14px] flex flex-col gap-[20px] items-center border-[0.5px] border-[var(--button-outline-border)] shadow-[0_23px_50px_rgba(25,33,61,0.02)] ">
                    <p className="text-text font-semibold text-[24px] leading-[35px]"> Sign Up</p>
                    <p className="text-grey  text-[14px] text-center mb-[20px]">Enter your phone number to get started.</p>
                    <PhoneInput
                        label="Phone number"
                        placeholder="Enter phone number"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                    <Button fullWidth={true} onClick={() => router.push("/user/otp-verification")}>Sign Up</Button>



                    <p className="text-grey text-[14px] ">Already have an account? <span className="text-text font-semibold" onClick={() => router.push("/user/login")}>Log In</span> </p>



                </div >
                <div className="flex  gap-4  justify-center items-start mt-[28px]">
                    <input type="checkbox" style={{ accentColor: 'var(--button-primary-from)', borderColor: '#6F7B8F', borderWidth: "2px", width: "18px", height: "18px" }} />
                    <span className="text-grey text-[14px] font-medium">
                        By continuing, you agree to our <span className="text-text underline"> Terms & Privacy Policy</span>.
                    </span>
                </div>
            </div>
        </>)
}
