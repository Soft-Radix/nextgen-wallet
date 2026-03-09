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
import { Html5Qrcode } from "html5-qrcode";
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
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const qrCodeRegionId = "qr-reader";

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const stopCamera = async () => {
        try {
            // Stop Html5Qrcode scanner
            if (html5QrCodeRef.current) {
                await html5QrCodeRef.current.stop();
                await html5QrCodeRef.current.clear();
                html5QrCodeRef.current = null;
            }
        } catch (err) {
            console.error('Error stopping Html5Qrcode:', err);
        }
        
        // Clean up old interval-based scanning
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
        }
        
        // Clean up stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        
        setCameraActive(false);
        setCameraError(null);
    };

    const startCamera = async () => {
        // Prevent multiple simultaneous calls
        if (html5QrCodeRef.current) {
            console.log('Camera already started');
            return;
        }

        try {
            console.log('Starting camera with Html5Qrcode...');
            setCameraError(null);

            // Wait for the container element to be available
            const checkContainer = () => {
                const element = document.getElementById(qrCodeRegionId);
                if (element) {
                    return element;
                }
                return null;
            };

            let container = checkContainer();
            if (!container) {
                // Wait a bit for DOM to be ready
                await new Promise(resolve => setTimeout(resolve, 300));
                container = checkContainer();
            }

            if (!container) {
                throw new Error('QR code scanner container not found');
            }

            // Create Html5Qrcode instance
            const html5QrCode = new Html5Qrcode(qrCodeRegionId);
            html5QrCodeRef.current = html5QrCode;

            // Start scanning with best configuration
            await html5QrCode.start(
                {
                    facingMode: "environment" // Use back camera
                },
                {
                    fps: 10, // Frames per second
                    qrbox: { width: 250, height: 250 }, // Scanning area
                    aspectRatio: 1.0,
                    disableFlip: false, // Allow rotation
                    videoConstraints: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        facingMode: "environment"
                    }
                },
                (decodedText, decodedResult) => {
                    // Success callback - QR code detected
                    console.log('QR Code detected:', decodedText);
                    handleQRCodeDetected(decodedText);
                },
                (errorMessage) => {
                    // Error callback - ignore scanning errors, they're normal
                    // Only log if it's not a common "not found" error
                    if (!errorMessage.includes('No QR code found')) {
                        // Silent - don't spam console
                    }
                }
            );

            setCameraActive(true);
            console.log('Camera started successfully');
        } catch (err: any) {
            console.error('Camera access error:', err);
            const errorMsg = err.name === 'NotAllowedError' || err.message?.includes('Permission')
                ? 'Camera access denied. Please allow camera permissions.'
                : err.name === 'NotFoundError' || err.message?.includes('camera')
                ? 'No camera found on this device.'
                : err.message || 'Failed to access camera. Please check permissions.';
            setCameraError(errorMsg);
            setCameraActive(false);
            
            // Clean up on error
            if (html5QrCodeRef.current) {
                try {
                    await html5QrCodeRef.current.stop();
                    html5QrCodeRef.current = null;
                } catch (e) {
                    // Ignore cleanup errors
                }
            }
        }
    };

    const handleQRCodeDetected = (qrData: string) => {
        // Prevent duplicate processing
        if (scanning) return;
        
        setScanning(true);
        
        const phone = parsePhoneFromQRData(qrData);
        if (phone) {
            // Stop camera after successful scan
            stopCamera();
            
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
                toast.success("QR code scanned successfully!");
            } else {
                setPhoneNumber(digits);
                toast.success("QR code scanned successfully!");
            }
        } else {
            toast.error("Invalid QR code. No phone number found.");
        }
        
        setScanning(false);
    };


    useEffect(() => {
        // Automatically start camera when component mounts
        let mounted = true;
        let retryCount = 0;
        const maxRetries = 20; // 2 seconds max
        
        const initCamera = async () => {
            if (typeof window === 'undefined') return;
            
            // Check if camera API is available
            if (!('mediaDevices' in navigator) || !('getUserMedia' in navigator.mediaDevices)) {
                console.log('Camera API not available');
                setCameraError('Camera API not supported in this browser');
                return;
            }
            
            // Try to request camera permission proactively (if Permissions API is available)
            try {
                if ('permissions' in navigator) {
                    const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
                    console.log('Camera permission status:', permissionStatus.state);
                }
            } catch (e) {
                // Permissions API might not be supported, that's okay
                console.log('Permissions API not available');
            }
            
            // Wait for html5-qrcode container to be rendered and start camera immediately
            const checkAndStart = () => {
                if (!mounted) return;
                
                retryCount++;
                
                const container = document.getElementById(qrCodeRegionId);
                if (container) {
                    console.log('QR scanner container ready, starting camera immediately...');
                    startCamera();
                } else if (retryCount < maxRetries) {
                    // Retry quickly
                    setTimeout(checkAndStart, 50);
                } else {
                    console.error('QR scanner container not found after max retries');
                    setCameraError('Scanner container not ready');
                }
            };
            
            // Start checking immediately, don't wait
            checkAndStart();
        };
        
        // Start immediately when component mounts
        initCamera();
        
        return () => {
            mounted = false;
            stopCamera();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

        // Keep camera open - don't stop it when uploading

        const url = URL.createObjectURL(file);
        setScanning(true);

        // Don't set uploadedImage yet - wait for validation
        decodeQRFromImageUrl(url).then((qrData) => {
            setScanning(false);

            // Clean up the URL if QR is invalid
            if (!qrData) {
                URL.revokeObjectURL(url);
                toast.error("This QR is invalid. No QR code found in image.");
                // Reset input to allow selecting the same file again
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
                return;
            }

            const phone = parsePhoneFromQRData(qrData);
            if (phone) {
                // Only set uploadedImage if QR is valid
                setUploadedImage((prev) => {
                    if (prev) URL.revokeObjectURL(prev);
                    return url;
                });

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
                    toast.success("QR code scanned. Check the number and tap Continue.");
                } else {
                    setPhoneNumber(digits);
                    toast.success("QR code scanned. Check the number and tap Continue.");
                }
            } else {
                // Invalid QR - don't show image, just show toast
                URL.revokeObjectURL(url);
                toast.error("This QR is invalid. No phone number found in QR code.");
                // Reset input to allow selecting the same file again
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            }
        });

        // Reset input after processing
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
            router.push("/enter-name?id=" + receiverId);
        } else {
            router.push("/enter-amount");
        }
    };

    return (
        <div className='bg-black'>
            {/* <Topbar title="Pay/Scan" /> */}
            <style jsx global>{`
                #${qrCodeRegionId} video {
                    width: 100% !important;
                    height: 100% !important;
                    object-fit: cover !important;
                }
                #${qrCodeRegionId} {
                    position: relative !important;
                }
                #${qrCodeRegionId} > div {
                    border: none !important;
                }
            `}</style>
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
                        {/* Scanner area with original transparent design */}
                        <div className="w-full rounded-[18px] border-2 border-dashed border-[#68D39100] bg-[#F5FFF500] flex items-center justify-center pt-10">
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative w-full max-w-[280px] aspect-square flex items-center justify-center">
                                    {/* Html5Qrcode scanner container */}
                                    <div 
                                        id={qrCodeRegionId}
                                        className={`w-full h-full rounded-2xl overflow-hidden ${cameraActive ? 'block' : 'hidden'}`}
                                    />
                                    
                                    {/* Scan frame overlay for camera view (green corners) */}
                                    {cameraActive && (
                                        <div className="pointer-events-none absolute inset-4 z-20">
                                            <div className="absolute top-0 left-0 w-6 h-6 border-2 border-[#00A91B] border-b-0 border-r-0 rounded-tl-lg" />
                                            <div className="absolute top-0 right-0 w-6 h-6 border-2 border-[#00A91B] border-b-0 border-l-0 rounded-tr-lg" />
                                            <div className="absolute bottom-0 left-0 w-6 h-6 border-2 border-[#00A91B] border-t-0 border-r-0 rounded-bl-lg" />
                                            <div className="absolute bottom-0 right-0 w-6 h-6 border-2 border-[#00A91B] border-t-0 border-l-0 rounded-br-lg" />
                                        </div>
                                    )}
                                    
                                    {/* Show image when camera is not active */}
                                    {!cameraActive && (
                                        <>
                                            {uploadedImage ? (
                                                <div className="relative w-full max-w-[280px] aspect-square rounded-2xl overflow-hidden flex items-center justify-center">
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
                                            ) : (
                                                <div className="relative w-full max-w-[280px] aspect-square flex items-center justify-center">
                                                    <img src="/qrcode.svg" alt="qr-code" className='min-w-[200px]' />
                                                    {/* Scan frame overlay (green corners) */}
                                                    <div className="pointer-events-none absolute inset-4">
                                                        <div className="absolute top-0 left-0 w-6 h-6 border-2 border-[#00A91B] border-b-0 border-r-0 rounded-tl-lg" />
                                                        <div className="absolute top-0 right-0 w-6 h-6 border-2 border-[#00A91B] border-b-0 border-l-0 rounded-tr-lg" />
                                                        <div className="absolute bottom-0 left-0 w-6 h-6 border-2 border-[#00A91B] border-t-0 border-r-0 rounded-bl-lg" />
                                                        <div className="absolute bottom-0 right-0 w-6 h-6 border-2 border-[#00A91B] border-t-0 border-l-0 rounded-br-lg" />
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Upload button */}
                                {cameraActive ? (
                                    <button
                                        type="button"
                                        disabled={scanning}
                                        className="px-6 py-2 text-sm bg-white hover:bg-[#009116] text-[#6F7B8F] mt-10 font-normal rounded-[40px] flex items-center gap-2 disabled:opacity-70"
                                        onClick={handleUploadClick}
                                    >
                                        <ImageIcon color='#6F7B8F' />
                                        Upload from gallery
                                    </button>
                                ) : (
                                    <>
                                        {uploadedImage ? (
                                            <div className="flex gap-2 mt-10">
                                                <button
                                                    type="button"
                                                    className="px-6 py-2 text-sm bg-white hover:bg-gray-100 text-[#6F7B8F] font-normal rounded-[40px] flex items-center gap-2 border border-[#E5E7EB]"
                                                    onClick={() => {
                                                        if (uploadedImage) {
                                                            URL.revokeObjectURL(uploadedImage);
                                                        }
                                                        setUploadedImage(null);
                                                    }}
                                                >
                                                    Clear
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={scanning}
                                                    className="px-6 py-2 text-sm bg-white hover:bg-[#009116] text-[#6F7B8F] font-normal rounded-[40px] flex items-center gap-2 disabled:opacity-70 border border-[#E5E7EB]"
                                                    onClick={handleUploadClick}
                                                >
                                                    <ImageIcon color='#6F7B8F' />
                                                    {scanning ? "Scanning…" : "Upload from gallery"}
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                disabled={scanning}
                                                className="px-6 py-2 text-sm bg-white hover:bg-[#009116] text-[#6F7B8F] mt-10 font-normal rounded-[40px] flex items-center gap-2 disabled:opacity-70"
                                                onClick={handleUploadClick}
                                            >
                                                <ImageIcon color='#6F7B8F' />
                                                {scanning ? "Scanning…" : "Upload from gallery"}
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>

                        {cameraError && (
                            <p className="text-red-500 text-sm text-center">{cameraError}</p>
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