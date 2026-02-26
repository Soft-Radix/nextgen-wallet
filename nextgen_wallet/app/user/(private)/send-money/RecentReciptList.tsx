import { ArrowRightBlockIcon } from '@/lib/svg'
import { useAppDispatch } from '@/store/hooks';
import { setDraftTransfer } from '@/store/transactionSlice';
import { useRouter } from 'next/navigation';
import React from 'react'

interface Transaction {
    id?: string;
    name?: string;
    date?: string;
    status?: string;
    amount?: number;
    type?: string;
    full_number?: string;
}
const RecentReciptList = ({ list }: { list: Transaction[] }) => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    return (
        <div>
            {list.map((item: Transaction) => (
                <div key={item.id} className="flex items-center justify-between bg-[#ffffff] rounded-[14px] p-4 w-full border-[0.5px] border-buttonOutlineBorder my-3" onClick={() => {
                    router.push("/user/recipient-otp"); dispatch(
                        setDraftTransfer({
                            receiver_id: item.id,
                            receiver_phone: item.full_number,
                            amount: 0,
                            note: null,
                        }))
                }}>
                    <div className="flex items-center justify-between gap-2">
                        <div className="w-[40px] h-[40px] rounded-full bg-gray-200">
                            <img src="/user.png" alt="user" />
                        </div>
                        <div>
                            <p className="text-text  text-sm font-semibold">{item.name}</p>
                            <p className="text-grey text-[12px]">{item.full_number}</p>
                        </div>
                    </div>

                </div>
            ))}
        </div>
    )
}

export default RecentReciptList