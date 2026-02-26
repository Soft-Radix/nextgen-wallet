"use client"
import Topbar from '@/components/Topbar'
import { Button } from '@/components/ui'
import { AccountSecurelyConnectedIcon, AmountSent } from '@/lib/svg'
import { useRouter } from 'next/navigation'
import React from 'react'

const page = () => {
    const router = useRouter();
    return (
        <>
            <Topbar title="Enter Amount" />
            <div className="p-5  py-[77px]  overflow-y-auto flex flex-col items-center justify-center gap-2">
                <div className='w-[94px] h-[94px] rounded-full bg-gray-200 mt-[20px] border-4 border-[#dfe9f3] shadow-[0px_0px_4px_4px_rgba(17, 82, 212, 0.8)] relative ' >
                    <img src="/user1.jpg" alt="user" className='w-full h-full object-cover rounded-full' />
                    <div className='absolute bottom-0 right-0 w-[20px] h-[20px] border-2 border-white rounded-full bg-green-500'>

                    </div>
                </div>
                <p className="text-text text-[20px] font-semibold"> John Doe </p>
                <p className="text-grey text-[14px] text-center ">+1 (555) 000-0000</p>
                {/* amount to send */}
                <div className='w-full flex flex-col items-center justify-between gap-2 bg-[#ffffff] rounded-[14px] p-6 mt-[20px] border-[0.5px] border-buttonOutlineBorder shadow-[0px_6px_10px_rgba(0, 0, 0, 0.2)]'>
                    <p className="text-grey text-[14px] font-semibold uppercase">Amount to send</p>
                    <input type="number" placeholder='0.00' className='w-full text-[#6F7B8FB2] text-[48px] font-bold outline-none text-center' />
                    <p className="text-greyDark text-[14px] bg-[#F0F7F0] w-fit mx-auto  rounded-[30px] px-4 py-2 flex items-center justify-center gap-2"><AmountSent />Available:<span className="text-text font-medium">$2,450.00</span></p>
                </div>
                {/* note */}
                <div className='w-full mt-6 pb-20'>
                    <p className="text-text text-[14px] font-semibold "> Note <span className="text-grey text-[14px] font-normal">(Optional)</span></p>
                    <textarea rows={3} placeholder='What&apos;s it for?' className='w-full flex flex-col mt-1 items-center justify-between gap-2 bg-[#ffffff] rounded-[14px] p-4  border-[0.5px] border-buttonOutlineBorder shadow-[0px_6px_10px_rgba(0, 0, 0, 0.2)] focus:outline-none focus:ring-1 focus:ring-[#D8EBD7] focus:border-[#D8EBD7]' />
                </div>
                {/* continue button */}
                <div className=' flex items-center justify-center mt-[40px] fixed bottom-0 left-0 right-0 max-w-[968px] w-full mx-auto px-5 bg-mainBackground pb-4'>
                    <Button fullWidth={true} onClick={() => router.push("/user/confirm-transfer")}>Continue</Button>
                </div>
            </div>
        </>
    )
}

export default page