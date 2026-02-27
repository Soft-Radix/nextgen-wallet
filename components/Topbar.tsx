"use client"
import { BackIcon } from '@/lib/svg'
import { useRouter } from 'next/navigation';
import React from 'react'

const Topbar = ({ title }: { title: string }) => {
    const router = useRouter();
    return (
        <>
            <div className="flex items-center   gap-2 bg-[#ffffff] p-6 border-b border-buttonOutlineBorder fixed top-0 left-0 right-0 z-10">
                <button onClick={() => router.back()}> <BackIcon /></button>

                <h1 className="text-text text-lg font-bold flex-1 text-center ">{title}</h1>
            </div>
        </>
    )
}

export default Topbar