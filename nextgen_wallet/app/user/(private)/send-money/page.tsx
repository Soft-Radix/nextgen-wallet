"use client"
import React, { useState } from 'react'
import RecentReciptList from './RecentReciptList'
import recentRecipts from '../dashboard/transactions.json'
import { ArrowRightBlockIcon, BackIcon, QuickSelectIcon } from '@/lib/svg'
import { useRouter } from 'next/navigation'
import PhoneNumberInput from '@/components/ui/Phone'
import { Button } from '@/components/ui'

const SendMoneyPage = () => {
    const router = useRouter();
    const [phoneNumber, setPhoneNumber] = useState("");
    const [country, setCountry] = useState("us");
    return (
        <>
            <div className="flex items-center   gap-2 bg-[#ffffff] p-6 border-b border-buttonOutlineBorder">
                <button onClick={() => router.push("/user/dashboard")}> <BackIcon /></button>

                <h1 className="text-text text-lg font-bold flex-1 text-center ">Send Money</h1>
            </div>
            <div className="p-5 max-h-[calc(100vh-140px)] h-full overflow-y-auto">
                <PhoneNumberInput label="" placeholder="Enter phone number" value={phoneNumber} onChange={(value) => setPhoneNumber(value)} setCountry={setCountry} country={country} shadow={false} />
                {/* quick select */}
                <div className="  mt-6">
                    <p className="text-[#1E2C44] text-[14px] font-bold  uppercase">Quick Select</p>
                    <div className="flex items-center justify-start gap-3 overflow-x-auto px-2 my-2">
                        <div className="flex items-center justify-center gap-1 flex-col">
                            <QuickSelectIcon />

                            <p className="text-[#1E2C44] text-[12px] font-semibold capitalize">New</p>
                        </div>
                        {recentRecipts?.transactions?.map((item) => (
                            <div className="flex items-center justify-center gap-1 flex-col" onClick={() => router.push("/user/recipient-otp")}>
                                <div key={item.id} className="w-[50px] h-[50px] rounded-full bg-gray-200">
                                    <img src="/user.png" alt="user" />
                                    </div>
                                    <p className="text-[#1E2C44] text-[12px] font-semibold capitalize">{item?.name?.split(" ")[0]}</p>
                                </div>
                            ))}
                    </div>
                </div>
                {/* recent */}
                <div className="flex items-center justify-between  mt-6">
                    <p className="text-text text-[14px] font-bold  uppercase">Recent Recipients</p>
                    <p className="text-[#030200] text-[14px] font-medium flex items-center justify-center ">View All <ArrowRightBlockIcon /></p>
                </div>
                <RecentReciptList list={recentRecipts.transactions} />
            </div >
            <div className="px-5 fixed bottom-4 left-0 right-0 max-w-[968px] w-full mx-auto">
                <Button fullWidth={true} onClick={() => router.push("/user/send-money/amount")}>Continue</Button>
            </div>
        </>
    )
}

export default SendMoneyPage