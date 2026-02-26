"use client"
import Topbar from "@/components/Topbar";
import { Button } from "@/components/ui";
import { ArrowRightIcon, SuccessIcon, WalletIdIcon } from "@/lib/svg"
import { useAppDispatch } from "@/store/hooks";
import { RootState } from "@/store/store";
import { AddTransaction, clearDraftTransfer, ResetTransaction } from "@/store/transactionSlice";
import moment from "moment";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react"
import toast from "react-hot-toast";
import { useSelector } from "react-redux";

export default function TransferSuccessPage() {
    const router = useRouter();
    const date = new Date()
    const [senderId, setSenderId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const draft = useSelector((state: RootState) => state.transaction.draftTransfer);
    const dispatch = useAppDispatch()
    useEffect(() => {
        if (typeof window === "undefined") return;
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user?.id) setSenderId(user.id);
            } catch {
                // ignore
            }
        }
    }, []);
    const handleSendMoney = async () => {
        if (!senderId) {
            toast.error("Unable to find logged-in user.")
            return;
        }

        setSubmitting(true);


        const result = await dispatch(
            AddTransaction({
                sender_id: senderId,
                receiver_id: draft?.receiver_id ?? null,
                receiver_phone: draft?.receiver_phone ?? null,
                amount: draft?.amount || 0,
                note: draft?.note ?? null,
            })
        );

        if (AddTransaction.fulfilled.match(result)) {
            router.push("/user/transfer-success");
        } else {

            toast.error((result.payload as string) || "Transfer failed. Please try again.")
        }

        setSubmitting(false);
    };
    return (
        <>
            <Topbar title="Transfer Success" />
            <div className="p-5  py-[77px]  overflow-y-auto flex flex-col items-center justify-center gap-2">
                <div className="max-w-[524px] w-full py-6">
                    <div className=" flex flex-col gap-[20px] items-center">
                        <SuccessIcon />
                        <p className="text-text font-semibold text-[24px] leading-[35px] text-center"> ${draft?.amount} sent to
                            John Doe!</p>
                        <p className="text-grey  text-[14px] text-center mb-[20px] ">Your transfer has been processed successfully.</p>


                        <div className='w-full flex flex-col  justify-between gap-2 bg-[#ffffff] rounded-[14px] mb-8 p-6 mt-[20px] border-[0.5px] border-buttonOutlineBorder shadow-[0px_6px_10px_rgba(0, 0, 0, 0.2)]'>
                            <p className="text-[17px] font-semibold text-text">Transaction Details</p>
                            <div className='flex items-center justify-between gap-2'>
                                <p className="text-grey text-[14px]  ">Date</p>
                                <p className="text-text text-[14px] font-semibold text-right ">{moment(date).format("ll")}</p>
                            </div>
                            <div className='flex items-center justify-between gap-2'>
                                <p className="text-grey text-[14px]  ">Time</p>
                                <p className="text-text text-[14px] font-semibold text-right ">{moment(date).format("hh:mm A")}</p>
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
                    <Button fullWidth={true} onClick={() => { dispatch(ResetTransaction()); router.push("/user/dashboard") }}>Done</Button>
                    <p className="text-[16px] font-medium text-[#4CCF44] text-center" onClick={() => { submitting ? "" : handleSendMoney() }}>   {submitting ? "Sending..." : "Send Money Again"}</p>
                </div>

            </div >
        </>)
}
