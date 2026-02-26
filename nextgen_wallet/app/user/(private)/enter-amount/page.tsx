"use client"
import Topbar from '@/components/Topbar'
import React from 'react'

const page = () => {
    return (
        <>
            <Topbar title="Enter Amount" />
            <div className="p-5 max-h-[calc(100vh-140px)] h-full overflow-y-auto flex flex-col items-center justify-center gap-2">
                <div className='w-[94px] h-[94px] rounded-full bg-gray-200 mt-[20px] border-4 border-[#dfe9f3] shadow-[0px_0px_4px_4px_rgba(17, 82, 212, 0.8)] relative'>
                    <img src="/user1.jpg" alt="user" className='w-full h-full object-cover rounded-full' />
                    <div className='absolute bottom-0 right-0 w-[20px] h-[20px] border-2 border-white rounded-full bg-green-500'>

                    </div>
                </div>
                <p className="text-text text-[20px] font-semibold"> John Doe </p>
                <p className="text-grey text-[14px] text-center ">+1 (555) 000-0000</p>
                {/* amount to send */}
                <div className='w-full flex flex-col items-center justify-between gap-2 bg-[#ffffff] rounded-[14px] p-6 mt-[20px] border-[0.5px] border-buttonOutlineBorder shadow-[0px_6px_10px_rgba(0, 0, 0, 0.2)]'>
                    <p className="text-grey text-[14px] font-semibold uppercase">Amount to send</p>

                </div>
            </div>
        </>
    )
}

export default page