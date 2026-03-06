"use client";

import Topbar from '@/components/Topbar';
import { Button } from "@/components/ui";
import PhoneNumberInput from "@/components/ui/Phone";
import { ImageIcon } from '@/lib/svg';
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from "react-redux";
import type { AppDispatch, RootState } from "@/store/store";
import { setDraftTransfer } from "@/store/transactionSlice";
import { apiGetUserDetails } from "@/lib/api/userDetails";
import toast from "react-hot-toast";
import jsQR from "jsqr";
import { getUserDetails } from '@/lib/utils/bootstrapRedirect';
import { useSelector } from 'react-redux';

/** Decode QR code from an image URL (object URL or data URL). Returns decoded text or null. */
function decodeQRFromImageUrl(url: string): Promise<string | null> {
    return new Promise((resolve) => {
        const img = new Image();
        if (!url.startsWith("blob:")) img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
                resolve(null);
                return;
            }
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            resolve(code ? code.data : null);
        };
        img.onerror = () => resolve(null);
        img.src = url;
    });
}

/** Extract phone number from QR payload (e.g. "tel:+1234567890", "+1234567890", or plain digits). */
function parsePhoneFromQRData(data: string): string | null {
    const trimmed = data.trim();
    if (!trimmed) return null;
    const telMatch = trimmed.match(/^tel:(.+)$/i);
    const str = telMatch ? telMatch[1].trim() : trimmed;
    const digits = str.replace(/\D/g, "");
    if (digits.length < 7) return null;
    if (str.startsWith("+")) return `+${digits}`;
    return digits;
}

const ScanPage = () => {
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loadingTransactions, setLoadingTransactions] = useState<boolean>(true);
    const storedUser = getUserDetails();
    const reduxUser = useSelector((state: RootState) => state.userDetails.user);
    const user = reduxUser || storedUser;
    const [phoneNumber, setPhoneNumber] = useState("");
    const [country, setCountry] = useState("us");
    const [countryCode, setCountryCode] = useState(
        typeof window !== "undefined"
            ? localStorage.getItem("country_code") || "+1"
            : "+1"
    );
    const [loading, setLoading] = useState(false);
    const [scanning, setScanning] = useState(false);
    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    useEffect(() => {
        const fetchTransactions = async () => {
            if (!user?.id) return;

            try {
                setLoadingTransactions(true);
                const response = await fetch("/api/transactions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        user_id: user.id,
                        page: 1,
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    console.error("Transactions fetch error:", data?.error || "Unknown error");
                    return;
                }

                setTransactions(data.items || []);
            } catch (error) {
                console.error("Transactions network error:", error);
            } finally {
                setLoadingTransactions(false);
            }
        };

        fetchTransactions();
    }, [user?.id]);
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const url = URL.createObjectURL(file);
        setUploadedImage((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return url;
        });
        setScanning(true);
        decodeQRFromImageUrl(url).then((qrData) => {
            setScanning(false);
            if (!qrData) {
                toast.error("No QR code found in image. Try another image or enter phone number.");
                return;
            }
            const phone = parsePhoneFromQRData(qrData);
            if (phone) {
                const digits = phone.replace(/\D/g, "");
                const hasPlus = phone.startsWith("+");
                if (hasPlus && digits.length >= 10) {
                    let countryCode = "+1";
                    let national = digits;
                    if (digits.startsWith("1") && digits.length === 11) {
                        countryCode = "+1";
                        national = digits.slice(1);
                    } else if (digits.startsWith("44") && digits.length >= 10) {
                        countryCode = "+44";
                        national = digits.slice(2);
                    } else if (digits.startsWith("91") && digits.length >= 12) {
                        countryCode = "+91";
                        national = digits.slice(2);
                    } else {
                        const len = digits.length - 10;
                        if (len >= 1) {
                            countryCode = "+" + digits.slice(0, len);
                            national = digits.slice(len);
                        }
                    }
                    setCountryCode(countryCode);
                    setCountry(countryCode === "+44" ? "gb" : countryCode === "+91" ? "in" : "us");
                    setPhoneNumber(national);
                } else {
                    setPhoneNumber(digits);
                }
                toast.success("QR code scanned. Check the number and tap Continue.");
            } else {
                toast.error("Invalid QR. No phone number found. Try another image or enter phone number.");
            }
        });
        event.target.value = "";
    };

    const handleContinue = async () => {
        if (!phoneNumber) {
            toast.error("Please enter a phone number.")
            return;
        }

        setLoading(true);


        let receiverId: string | null = null;
        let receiverPhone: string | null = null;
        let userbyId: any | null = null;
        try {
            // Try to find an existing user in user_details
            const allDigits = String(phoneNumber).replace(/\D/g, "");
            const dialDigits = String(countryCode).replace(/\D/g, "");
            const nationalNumber = allDigits.startsWith(dialDigits)
                ? allDigits.slice(dialDigits.length)
                : allDigits;

            userbyId = await apiGetUserDetails("", nationalNumber, countryCode);
            receiverId = userbyId.id;
            receiverPhone =
                userbyId.full_number || `${userbyId.country_code}${userbyId.mobile_number}`;


        } catch (err: any) {
            const status = err?.response?.status;

            if (status === 404) {
                // No user record -> send to raw number
                receiverId = null;
                receiverPhone = `${countryCode}${String(phoneNumber).replace(/\D/g, "")}`;
                toast.error(err?.response?.data?.error)
                setLoading(false);
                return
            } else {

                toast.error(err?.response?.data?.error ||
                    err?.message ||
                    "Failed to search recipient")
                setLoading(false);
                return;
            }
        }

        // Prevent sending money to your own number/account
        if (receiverId && user?.id && String(receiverId) === String(user.id)) {
            toast.error("You cannot send money to your own number.");
            setLoading(false);
            return;
        }

        // If we found a user in user_details and we have transaction history,
        // try to reuse the latest edited name from a previous transfer
        // to this receiver (regardless of contact flag).
        let isContactFromHistory = false;
        let nameFromHistory: string | null = null;

        if (receiverId) {
            const existingTx = transactions.find(
                (tx) =>
                    tx.receiver_profile_id &&
                    String(tx.receiver_profile_id) === String(receiverId) &&
                    tx.transaction_type === "sender" &&
                    tx.name
            );

            if (existingTx) {
                isContactFromHistory = !!existingTx.is_contact;
                nameFromHistory = existingTx.name ?? null;
            }
        }

        const finalIsContact = isContactFromHistory || (userbyId?.is_contact ?? false);
        const finalName = nameFromHistory ?? userbyId?.name ?? null;

        // Seed draft transfer (amount/note will be added on Enter Amount screen)
        dispatch(
            setDraftTransfer({
                receiver_id: receiverId,
                receiver_phone: receiverPhone,
                amount: 0,
                note: null,
                is_contact: finalIsContact,
                name: finalName,
            })
        );

        setLoading(false);
        if (!finalIsContact) {
            router.push("/user/enter-name?id=" + receiverId);
        } else {
            router.push("/user/enter-amount");
        }
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
                                            disabled={scanning}
                                            className="px-6 py-2 text-sm bg-white hover:bg-[#009116] text-[#6F7B8F] mt-10 font-normal rounded-[40px] flex items-center gap-2 disabled:opacity-70"
                                            onClick={handleUploadClick}
                                        >
                                            <ImageIcon color='#6F7B8F' />
                                            {scanning ? "Scanning…" : "Upload from gallery"}
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
                                <div className="w-full rounded-[18px] bg-[#F5FFF5] flex flex-col items-center justify-center gap-4 p-4">
                                    <div className="relative w-full max-w-[280px] aspect-square rounded-2xl overflow-hidden bg-[#1a1a1a] flex items-center justify-center">
                                        <img
                                            src={uploadedImage}
                                            alt="Uploaded QR"
                                            className="w-full h-full object-contain"
                                        />
                                        {/* Scan frame overlay (green corners) */}
                                        <div className="pointer-events-none absolute inset-4">
                                            <div className="absolute top-0 left-0 w-6 h-6 border-2 border-[#00A91B] border-b-0 border-r-0 rounded-tl-lg" />
                                            <div className="absolute top-0 right-0 w-6 h-6 border-2 border-[#00A91B] border-b-0 border-l-0 rounded-tr-lg" />
                                            <div className="absolute bottom-0 left-0 w-6 h-6 border-2 border-[#00A91B] border-t-0 border-r-0 rounded-bl-lg" />
                                            <div className="absolute bottom-0 right-0 w-6 h-6 border-2 border-[#00A91B] border-t-0 border-l-0 rounded-br-lg" />
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        disabled={scanning}
                                        className="px-6 py-2 text-sm bg-white hover:bg-[#009116] text-[#6F7B8F] font-normal rounded-[40px] flex items-center gap-2 disabled:opacity-70 border border-[#E5E7EB]"
                                        onClick={handleUploadClick}
                                    >
                                        <ImageIcon color='#6F7B8F' />
                                        {scanning ? "Scanning…" : "Upload from gallery"}
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
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