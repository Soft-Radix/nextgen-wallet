"use client";
import { Button } from "@/components/ui";
import { Checkcircle, FeedNow, PoweredBy } from "@/lib/svg";
import { useRouter } from "next/navigation";

export default function WelcomePage() {
    const router = useRouter();

    return (

        <>
            <div className="max-w-[524px] w-full">
                <div className="bg-white pt-[48px] p-6 rounded-[14px] flex flex-col gap-[20px] items-center border-[0.5px] border-[var(--button-outline-border)] shadow-[0_23px_50px_rgba(25,33,61,0.02)] ">
                    <p className="text-text font-bold text-[24px] leading-[35px]">Instant Money.<br></br>
                        Real Control.</p>
                    <p className="text-grey  text-[14px] text-center mb-[20px]">Send, receive, and manage money instantly with secure digital banking.</p>

                    <Button fullWidth={true} onClick={() => router.push("/user/login")}>Login</Button>
                    <Button variant="outline" fullWidth={true} onClick={() => router.push("/user/signup")}>Register</Button>
                    <div className="flex px-4 w-full gap-2 items-center">

                        <hr className="border-[1.5px] border-[#F0F3F7] border-dashed w-full" />

                        <div className=" w-full flex-1">
                            <FeedNow className="w-full max-w-[280px] h-auto" />
                        </div>

                        <hr className="border-[1.5px] border-[#F0F3F7] border-dashed w-full" />

                    </div>

                    <div className="flex justify-between w-full items-center max-w-[372px] flex-wrap">
                        <div className="flex items-center gap-1">
                            <Checkcircle />
                            <p className="text-grey text-[14px] ">Secure</p>
                        </div>
                        <div className="w-[4px] h-[4px] rounded-full bg-[#6F7B8F]"></div>
                        <div className="flex items-center gap-1">
                            <Checkcircle />
                            <p className="text-grey text-[14px] ">Regulated</p>
                        </div>
                        <div className="w-[4px] h-[4px] rounded-full bg-[#6F7B8F]"></div>
                        <div className="flex items-center gap-1">
                            <Checkcircle />
                            <p className="text-grey text-[14px] ">Bank-backed</p>
                        </div>

                    </div>
                </div >
                <div className="flex items-center gap-2  justify-center mt-[28px]">
                    <span className="text-sm text-text font-medium">
                        Powered by -
                    </span><PoweredBy />
                </div>
            </div>
        </>)
}
