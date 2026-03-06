"use client";

import Topbar from '@/components/Topbar';
import { Button } from "@/components/ui";
import PhoneNumberInput from "@/components/ui/Phone";
import { ImageIcon } from '@/lib/svg';
import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { setDraftTransfer } from "@/store/transactionSlice";
import { apiGetUserDetails } from "@/lib/api/userDetails";
import toast from "react-hot-toast";

const ScanPage = () => {
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();

    const [phoneNumber, setPhoneNumber] = useState("");
    const [country, setCountry] = useState("us");
    const [countryCode, setCountryCode] = useState(
        typeof window !== "undefined"
            ? localStorage.getItem("country_code") || "+1"
            : "+1"
    );
    const [loading, setLoading] = useState(false);
    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const url = URL.createObjectURL(file);
        setUploadedImage((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return url;
        });
    };

    const handleContinue = async () => {
        if (!phoneNumber) {
            toast.error("Please enter a phone number.");
            return;
        }

        setLoading(true);

        let receiverId: string | null = null;
        let receiverPhone: string | null = null;

        try {
            const allDigits = String(phoneNumber).replace(/\D/g, "");
            const dialDigits = String(countryCode).replace(/\D/g, "");
            const nationalNumber = allDigits.startsWith(dialDigits)
                ? allDigits.slice(dialDigits.length)
                : allDigits;

            const user = await apiGetUserDetails("", nationalNumber, countryCode);
            receiverId = user.id;
            receiverPhone =
                user.full_number || `${user.country_code}${user.mobile_number}`;
        } catch (err: any) {
            const status = err?.response?.status;

            if (status === 404) {
                receiverId = null;
                receiverPhone = `${countryCode}${String(phoneNumber).replace(/\D/g, "")}`;
                toast.error(err?.response?.data?.error);
                setLoading(false);
                return;
            } else {
                toast.error(
                    err?.response?.data?.error ||
                    err?.message ||
                    "Failed to search recipient"
                );
                setLoading(false);
                return;
            }
        }

        dispatch(
            setDraftTransfer({
                receiver_id: receiverId,
                receiver_phone: receiverPhone,
                amount: 0,
                note: null,
            })
        );

        setLoading(false);
        router.push("/user/enter-amount");
    };

    return (
        <div className='bg-black'>
            {/* <Topbar title="Pay/Scan" /> */}
            <div className="p-4 sm:p-5 py-[80px] overflow-y-auto flex flex-col items-center min-h-[calc(100vh)] bg-[url('/PayScanBgImage.svg')] bg-no-repeat bg-cover">
                <div className="w-full max-w-[420px] flex flex-col gap-6 sm:gap-8">
                    {/* <div className="mt-4 sm:mt-6 flex flex-col items-center gap-2">
                        <p className="text-[24px] text-[#030200] font-semibold mt-2">
                            Scan To Pay
                        </p>
                        <p className="text-[14px] text-grey text-center">
                            Scan the QR or upload the QR from file and pay
                        </p>
                    </div> */}

                    <div className="bg-[#ffffff00] rounded-[18px] border-none border-[#E3F3E2] shadow-[0_23px_50px_rgba(25,33,61,0.02)] p-4 sm:p-6 flex flex-col gap-5 items-center">
                        {!uploadedImage ? (
                            <>
                                <div className="w-full rounded-[18px] border-2 border-dashed border-[#68D39100] bg-[#F5FFF500] flex items-center justify-center pt-10">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-[140px] h-[140px] flex items-center justify-center">
                                            <img src="/qrcode.svg" alt="qr-code" className='min-w-[200px]' />
                                        </div>
                                        {/* <Button
                                            type="button"
                                            className="px-6 bg-[#00A91B] hover:bg-[#009116] text-white font-normal rounded-[10px] flex items-center gap-2"
                                            onClick={handleUploadClick}
                                        >
                                            <ImageIcon />
                                            Upload from Computer
                                        </Button> */}
                                        <button
                                            type="button"
                                            className="px-6 py-2 text-sm bg-white hover:bg-[#009116] text-[#6F7B8F] mt-10 font-normal rounded-[40px] flex items-center gap-2"
                                            onClick={handleUploadClick}
                                        >
                                            <ImageIcon color='#6F7B8F' />
                                            Upload from gallery
                                        </button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-full rounded-[18px] bg-[#F5FFF5] flex items-center justify-center">
                                    <div className="relative w-full max-w-[320px] rounded-[24px] overflow-hidden bg-[#EBF0FF]">
                                        {/* Uploaded image preview */}
                                        <img
                                            src={uploadedImage}
                                            alt="Uploaded QR"
                                            className="w-full h-[220px] object-cover"
                                        />

                                        {/* Scan frame overlay (green corners) */}
                                        <div className="pointer-events-none absolute inset-6">
                                            <div className="absolute top-0 left-0 w-8 h-8 border-[3px] border-[#00A91B] border-b-0 border-r-0 rounded-tl-[12px]" />
                                            <div className="absolute top-0 right-0 w-8 h-8 border-[3px] border-[#00A91B] border-b-0 border-l-0 rounded-tr-[12px]" />
                                            <div className="absolute bottom-0 left-0 w-8 h-8 border-[3px] border-[#00A91B] border-t-0 border-r-0 rounded-bl-[12px]" />
                                            <div className="absolute bottom-0 right-0 w-8 h-8 border-[3px] border-[#00A91B] border-t-0 border-l-0 rounded-br-[12px]" />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="w-full flex items-center gap-2 mt-2">
                            <div className="w-full h-px border-[0.5px] border-dashed border-[#ffffff4D]" />
                            <div className="text-[14px] text-white whitespace-nowrap">Or pay via phone name</div>
                            <div />
                            <div className="w-full h-px border-[0.5px] border-dashed border-[#ffffff4D]" />
                        </div>

                        <div className="w-full">
                            <PhoneNumberInput
                                label=""
                                placeholder="Enter phone number"
                                value={phoneNumber}
                                onChange={(value) => {
                                    setPhoneNumber(value);
                                }}
                                setCountry={setCountry}
                                country={country}
                                onDialCodeChange={setCountryCode}
                                shadow={false}
                            />
                        </div>
                    </div>
                </div>
                <Button
                    type="button"
                    className="px-6 w-full bg-[#00A91B] hover:bg-[#009116] text-white font-normal rounded-[10px] flex items-center gap-2"
                    onClick={handleContinue}
                    disabled={loading}
                >
                    {loading ? "Searching..." : "Continue"}
                </Button>
            </div>
        </div>
    )
}

export default ScanPage