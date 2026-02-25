"use client";
import { AccountSecurelyConnectedIcon, ArrowRightBlockIcon, NotificationIcon, PayScanIcon, SendIcon, WithdrawIcon } from "@/lib/svg";

export default function DashboardPage() {
    return (
        <>
            <div className="flex items-center justify-between  gap-2">

                {/* You can render user info here */}
                <div className="flex items-center justify-between  gap-2">
                    <div className="w-[50px] h-[50px] rounded-full bg-gray-200">
                        <img src="/user.png" alt="user" />
                    </div>
                    <div>
                        <p className="text-text  text-lg font-semibold">🌞 Good Morning, Alex</p>
                        <p className="text-grey text-[12px]">Welcome to your secure dashboard.</p>
                    </div>
                </div>
                <div className="w-[40px] h-[40px] rounded-full bg-[#ffffff] flex items-center justify-center">
                    <div className="relative">
                        <NotificationIcon />
                        <div className="absolute -top-[2px] right-[0px] w-[7px] h-[7px] rounded-full bg-[#FF0000]"></div>
                    </div>
                </div>

            </div>
            {/* banner */}
            <div className="w-full  bg-[#0c3332] rounded-[14px] p-6 mt-6 text-center bg-[url('/Background.png')] bg-cover bg-center">
                <p className="text-[#FFFFFFB2]  text-[10px] font-semibold uppercase">Total Balance</p>
                <p className="text-[#FFFFFF] text-[30px] font-bold">$2,450.00</p>
                <p className="text-[#FFFFFFB2] text-[10px] bg-[#FFFFFF1A] w-fit mx-auto mt-[14px] rounded-[30px] px-4 py-2 flex items-center justify-center gap-1"><AccountSecurelyConnectedIcon />Account Securely Connected</p>
            </div>

            {/* Account Action */}
            <p className="text-text text-[14px] font-bold mt-6 uppercase">Quick Actions</p>
            <div className="flex items-center justify-between gap-2 mt-3">
                <div className="flex items-center flex-col justify-center gap-2 bg-[#ffffff] rounded-[14px] p-4 w-full shadow-[0_1px_2px_rgba(0, 0, 0, 0.05)]">
                    <SendIcon />
                    <p className="text-greyDark text-[12px] font-semibold ">Send</p>
                </div>
                <div className="flex items-center flex-col justify-center gap-2 bg-[#ffffff] rounded-[14px] p-4 w-full shadow-[0_1px_2px_rgba(0, 0, 0, 0.05)]">
                    <WithdrawIcon />
                    <p className="text-greyDark text-[12px] font-semibold">Withdraw</p>
                </div>
                <div className="flex items-center flex-col justify-center gap-2 bg-[#ffffff] rounded-[14px] p-4 w-full shadow-[0_1px_2px_rgba(0, 0, 0, 0.05)]">
                    <PayScanIcon />
                    <p className="text-greyDark text-[12px] font-semibold">Pay/Scan</p>
                </div>
            </div>

            {/* recent-transactions */}
            <div className="flex items-center justify-between  mt-6">
                <p className="text-text text-[14px] font-bold  uppercase">Recent Transactions</p>
                <p className="text-[#030200] text-[14px] font-medium flex items-center justify-center ">View All <ArrowRightBlockIcon /></p>
            </div>
        </>
    );
}
