"use client";

import { LogoPublic } from "@/lib/svg";

export default function LoadingScreen() {
    return (
        <div className=" min-h-screen flex flex-col gap-[30px] items-center justify-center  px-[20px] bg-mainBackground">


            <div className="w-8 h-8 border-4 border-[#00DE1C] border-t-transparent rounded-full animate-spin"></div>


        </div>
    );
}
