"use client"
import { Button } from "@/components/ui"
import Phone from "@/components/ui/Phone"
import { useState } from "react"

export default function LoginPage() {
    const [phoneNumber, setPhoneNumber] = useState("")
    return (
        <>
            <div className="max-w-[524px] w-full">
                <div className="bg-white pt-[48px] p-6 rounded-[14px] flex flex-col gap-[20px] items-center border-[0.5px] border-[var(--button-outline-border)] shadow-[0_23px_50px_rgba(25,33,61,0.02)] ">
                    <p className="text-text font-semibold text-[24px] leading-[35px]"> Welcome Back 👋</p>
                    <p className="text-grey  text-[14px] text-center mb-[20px]">Log in to access your NexGenPay wallet.</p>
                    {/* <PhoneInput
                        label="Phone number"
                        placeholder="Enter phone number"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                    /> */}
                    <Phone
                    label="Phone number"
                    placeholder="Enter phone number"
                    value={phoneNumber}
                    onChange={(value) => setPhoneNumber(value)}
                    />
                    <Button fullWidth={true} >Continue</Button>



                    <p className="text-grey text-[14px] ">Don’t have an account? <span className="text-[#4CCF44] font-semibold">Sign Up </span> </p>



                </div >

            </div>
        </>)
}
