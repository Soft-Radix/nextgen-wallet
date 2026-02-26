"use client"
import Topbar from "@/components/Topbar";
import { Button } from "@/components/ui";
import { ArrowRightIcon, SuccessIcon, WalletIdIcon } from "@/lib/svg"
import { useRouter } from "next/navigation";
import { useState } from "react"

export default function TransferSuccessPage() {
    const router = useRouter();
    return (
        <>
            <Topbar title="Transfer Success" />
            <div className="p-5  py-[77px]  overflow-y-auto flex flex-col items-center justify-center gap-2">
                <div className="max-w-[524px] w-full py-6">
                    <div className=" flex flex-col gap-[20px] items-center">
                        <SuccessIcon />
                        <p className="text-text font-semibold text-[24px] leading-[35px] text-center"> $50.00 sent to
                            John Doe!</p>
                        <p className="text-grey  text-[14px] text-center mb-[20px] ">Your transfer has been processed successfully.</p>


                        <div className='w-full flex flex-col  justify-between gap-2 bg-[#ffffff] rounded-[14px] mb-8 p-6 mt-[20px] border-[0.5px] border-buttonOutlineBorder shadow-[0px_6px_10px_rgba(0, 0, 0, 0.2)]'>
                            <p className="text-[17px] font-semibold text-text">Transaction Details</p>
                            <div className='flex items-center justify-between gap-2'>
                                <p className="text-grey text-[14px]  ">Date</p>
                                <p className="text-text text-[14px] font-semibold text-right ">Oct 24, 2023</p>
                            </div>
                            <div className='flex items-center justify-between gap-2'>
                                <p className="text-grey text-[14px]  ">Time</p>
                                <p className="text-text text-[14px] font-semibold text-right ">10:45 AM</p>
                            </div>
                            <div className='flex items-center justify-between gap-2'>
                                <p className="text-grey text-[14px]  ">Reference Number</p>
                                <p className="text-text text-[14px] font-semibold text-right ">#TRX-9928347</p>
                            </div>
                            <hr className="border-[#E2E8F0] my-4"></hr>
                            <div className='flex items-center justify-between gap-2'>
                                <p className="text-grey text-[14px]  ">Fee</p>
                                <p className="text-[#16A34A] text-[14px] font-semibold text-right ">Free</p>

                            </div>
                        </div>
                    </div>



                </div>

                {/* continue button */}
                <div className=' flex flex-col gap-2 items-center justify-center mt-[40px] fixed bottom-0 left-0 right-0 max-w-[968px] w-full mx-auto px-5 bg-mainBackground pb-4'>
                    <Button fullWidth={true} onClick={() => router.push("/user/dashboard")}>Done</Button>
                    <p className="text-[16px] font-medium text-[#4CCF44] text-center" onClick={() => router.push('/user/send-money')}>Send Money Again</p>
                </div>

            </div >
        </>)
}
