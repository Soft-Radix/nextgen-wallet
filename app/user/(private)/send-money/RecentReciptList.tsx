import { ArrowRightBlockIcon } from '@/lib/svg'
import { getNameCapitalized, getUserImage } from '@/lib/utils/bootstrapRedirect';
import { useAppDispatch } from '@/store/hooks';
import { setDraftTransfer } from '@/store/transactionSlice';
import { useRouter } from 'next/navigation';
import React from 'react'

interface Transaction {
    id?: string;
    amount?: number;
    counterparty_mobile?: string;
    name?: string;
    is_contact?: boolean;
    user_image?: string;
    receiver_profile_id?: string | null;
}
const RecentReciptList = ({ list }: { list: Transaction[] }) => {
    const router = useRouter();
    const dispatch = useAppDispatch();

    const uniqueList = React.useMemo(() => {
        const seen = new Set<string>();
        return list.filter((item) => {
            const key =
                item.receiver_profile_id && String(item.receiver_profile_id).trim().length > 0
                    ? String(item.receiver_profile_id)
                    : String(item.id);
            if (!key) return false;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }, [list]);

    return (
        <div>
            {uniqueList.map((item: Transaction) => (
                <div key={item.id} className="flex items-center justify-between bg-[#ffffff] rounded-[14px] p-4 w-full border-[0.5px] border-buttonOutlineBorder my-3" onClick={() => {
                    router.push("/user/enter-amount"); dispatch(
                        setDraftTransfer({
                            receiver_id: item.id,
                            receiver_phone: item.counterparty_mobile,
                            amount: item?.amount || 0,
                            note: null,
                            is_contact: true,
                            name: item?.name ?? null,
                        }))
                }}>
                    <div className="flex items-center justify-between gap-4">
                        <div className="w-[40px] h-[40px] rounded-full bg-gray-200">
                            {item.user_image ? <img src={item.user_image} alt="user" /> : <p className="text-[#00DE1C] text-[16px] font-semibold capitalize text-center leading-[40px]">{getUserImage(item?.name ?? "")}</p>}
                        </div>
                        <div>
                            <p className="text-text  text-sm font-semibold">{getNameCapitalized(item?.name ?? "") || item?.counterparty_mobile}</p>
                            <p className="text-grey text-[12px]">{item.counterparty_mobile}</p>
                            {/* <p className="text-grey text-[12px]">{item.full_number}</p> */}
                        </div>
                    </div>

                </div>
            ))}
        </div>
    )
}

export default RecentReciptList