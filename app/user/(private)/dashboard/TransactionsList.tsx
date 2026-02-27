import { ArrowRightBlockIcon, IncomingIcon, OutgoingIcon } from '@/lib/svg'
import React from 'react'

interface Transaction {
    id?: string;
    name?: string;
    date?: string;
    status?: string;
    amount?: number;
    type?: string;
}
const TransactionsList = ({ list }: { list: Transaction[] }) => {
    console.log(list);
    return (
        <div>
            {list.map((item: Transaction) => (
                <div key={item.id} className="flex items-center justify-between bg-[#ffffff] rounded-[14px] p-4 w-full border-[0.5px] border-buttonOutlineBorder my-3">
                    <div className="flex items-center justify-between gap-3">
                        <div className={`w-[40px] h-[40px] rounded-full flex items-center justify-center  ${item.type == "incoming" ? "bg-[#DCFCE7]" : "bg-[#FFE2E2]"}`}>
                            {item.type == "incoming" ? <IncomingIcon /> : <OutgoingIcon />}
                        </div>
                        <div>
                            <p className="text-text  text-[14px] font-semibold">{item.name}</p>
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="text-grey text-[12px]">{item.date}</span>
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-grey text-[12px]">•</p>
                                    <span className={`text-grey text-[12px] ${item.status == "Pending" ? "text-[#D08700]!" : item.status == "Failed" ? "text-[#E7000B]!" : "text-grey"}`}>{item.status}</span>
                                </div>
                            </div>

                        </div>
                    </div>
                    <p className={`text-[16px] font-bold ${item.type == "incoming" ? "text-[#00A63E]" : "text-[#E7000B]"}`}>{item.type == "incoming" ? "+" : "-"}${item.amount?.toFixed(2) ?? 0}</p>
                </div>
            ))}
        </div>
    )
}

export default TransactionsList