"use client"
import { Button, PhoneInput } from "@/components/ui"
import { ArrowRightIcon, SuccessIcon, WalletIdIcon } from "@/lib/svg"
import { useState } from "react"

export default function SuccessPage() {

    return (
        <>
            <div className="max-w-[524px] w-full">
                <div className=" flex flex-col gap-[20px] items-center">
                    <SuccessIcon />
                    <p className="text-text font-semibold text-[24px] leading-[35px] text-center"> Your NexGenPay wallet is ready</p>
                    <p className="text-grey  text-[14px] text-center mb-[20px] ">You can now send, receive, and manage your money instantly.</p>


                    <div className="bg-[#ffffff]  pt-5  rounded-[14px] flex flex-col gap-[20px] items-center border-[0.5px] border-[#F1F2F9] shadow-[0_23px_50px_rgba(25,33,61,0.02)] w-full">




                        <p className="bg-gradient-to-r from-[var(--button-primary-from)] to-[var(--button-primary-to)] bg-clip-text text-transparent text-[40px] font-bold leading-[40px]">
                            $0.00
                        </p>
                        <p className="text-grey text-[14px] font-medium  text-center">Current Balance</p>

                        <p className="bg-gradient-to-r from-[var(--button-primary-from)] to-[var(--button-primary-to)]  text-[#ffffff] text-[12px] font-medium  text-center w-full rounded-b-[14px] h-[28px] leading-[28px] flex items-center justify-center gap-[5px]"><WalletIdIcon /> Wallet ID : 123453434 </p>
                    </div>
                </div >

                <p className="text-text  text-[16px] text-center mt-[28px] flex items-center justify-center gap-[5px]">
                    Go to Wallet <ArrowRightIcon />
                </p>
            </div>
        </>)
}
