import { ArrowRightBlockIcon } from '@/lib/svg'
import React from 'react'

interface Transaction {
    id?: string;
    name?: string;
    date?: string;
    status?: string;
    amount?: number;
    type?: string;
}
const RecentReciptList = ({ list }: { list: Transaction[] }) => {
    console.log(list);
    return (
        <div>
            {list.map((item: Transaction) => (
                <div key={item.id} className="flex items-center justify-between bg-[#ffffff] rounded-[14px] p-4 w-full border-[0.5px] border-buttonOutlineBorder my-3">
                    <div className="flex items-center justify-between gap-2">
                        <div className="w-[50px] h-[50px] rounded-full bg-gray-200">
                            <img src="/user.png" alt="user" />
                        </div>
                        <div>
                            <p className="text-text  text-lg font-semibold">{item.name}</p>
                            <p className="text-grey text-[12px]">{item.date}</p>
                        </div>
                    </div>

                </div>
            ))}
        </div>
    )
}

export default RecentReciptList