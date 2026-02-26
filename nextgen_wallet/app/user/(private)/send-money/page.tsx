"use client"
import React, { useState } from 'react'
import RecentReciptList from './RecentReciptList'
import recentRecipts from '../dashboard/transactions.json'
import { ArrowRightBlockIcon, BackIcon } from '@/lib/svg'
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
                <div className="flex items-center justify-between  mt-6">
                    <p className="text-text text-[14px] font-bold  uppercase">Recent Recipients</p>
                    <p className="text-[#030200] text-[14px] font-medium flex items-center justify-center ">View All <ArrowRightBlockIcon /></p>
                </div>
                <RecentReciptList list={recentRecipts.transactions} />
            </div >
            <div className="px-5 fixed bottom-4 left-0 right-0">
                <Button fullWidth={true} onClick={() => router.push("/user/send-money/amount")}>Continue</Button>
            </div>
        </>
    )
}

export default SendMoneyPage