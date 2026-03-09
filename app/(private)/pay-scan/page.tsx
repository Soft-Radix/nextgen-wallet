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
    const lastScannedCodeRef = useRef<string>("");
    const lastScanTimeRef = useRef<number>(0);
    const processedQRCodesRef = useRef<Map<string, { type: 'valid' | 'invalid', timestamp: number }>>(new Map());

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

            // Detect iOS
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

            // Create Html5Qrcode instance optimized for instant scanning
            const html5QrCode = new Html5Qrcode(qrCodeRegionId, {
                verbose: false,
                // Use native barcode detector for faster scanning (disable on iOS as it can cause issues)
                useBarCodeDetectorIfSupported: !isIOS,
            });
            html5QrCodeRef.current = html5QrCode;

            // Optimized configuration for instant scanning from ANY angle like Google Pay
            // Use a very large qrbox number (1000) to scan entire viewport - enables detection from any angle
            // Large number ensures the entire camera view is scanned, not just a small centered box
            const config = isIOS ? {
                fps: 60, // Maximum FPS for instant scanning on iOS
                // Use very large qrbox to scan entire viewport - critical for multi-angle detection
                qrbox: 1000, // Large number ensures full viewport scanning (works like Google Pay)
                aspectRatio: 1.777778, // 16:9 aspect ratio for better coverage
                disableFlip: false, // Critical: Allow scanning from any orientation/angle
                // Optimized video constraints for faster scanning
                videoConstraints: {
                    facingMode: "environment",
                    width: { ideal: 1920, min: 1280 },
                    height: { ideal: 1080, min: 720 },
                    frameRate: { ideal: 60, min: 30 }
                },
                rememberLastUsedCamera: true,
            } : {
                fps: 60, // Maximum FPS for instant scanning
                // Use very large qrbox to scan entire viewport - critical for multi-angle detection
                qrbox: 1000, // Large number ensures full viewport scanning (works like Google Pay)
                aspectRatio: 1.777778, // 16:9 aspect ratio for better coverage
                disableFlip: false, // Critical: Allow scanning from any orientation/angle
                videoConstraints: {
                    width: { ideal: 1920, min: 1280 },
                    height: { ideal: 1080, min: 720 },
                    facingMode: "environment",
                    frameRate: { ideal: 60, min: 30 }
                },
                rememberLastUsedCamera: true,
            };

            // Try environment camera first, fallback to user camera on iOS if needed
            let cameraIdOrConfig: string | { facingMode: string } = { facingMode: "environment" };

            try {
                // Start scanning with best configuration
                await html5QrCode.start(
                    cameraIdOrConfig,
                    config,
                    (decodedText, decodedResult) => {
                        // Success callback - QR code detected
                        console.log('QR Code detected:', decodedText);
                        handleQRCodeDetected(decodedText);
                    },
                    (errorMessage) => {
                        // Error callback - ignore scanning errors, they're normal
                        // Only log if it's not a common "not found" error
                        if (!errorMessage.includes('No QR code found') &&
                            !errorMessage.includes('NotFoundException') &&
                            !errorMessage.includes('NotReadableError')) {
                            // Silent - don't spam console
                        }
                    }
                );
            } catch (startError: any) {
                // On iOS, if environment camera fails, try user camera
                if (isIOS && cameraIdOrConfig && typeof cameraIdOrConfig === 'object' &&
                    cameraIdOrConfig.facingMode === 'environment') {
                    console.log('Environment camera failed on iOS, trying user camera...');
                    try {
                        cameraIdOrConfig = { facingMode: "user" };
                        await html5QrCode.start(
                            cameraIdOrConfig,
                            config,
                            (decodedText, decodedResult) => {
                                console.log('QR Code detected:', decodedText);
                                handleQRCodeDetected(decodedText);
                            },
                            (errorMessage) => {
                                if (!errorMessage.includes('No QR code found') &&
                                    !errorMessage.includes('NotFoundException') &&
                                    !errorMessage.includes('NotReadableError')) {
                                    // Silent
                                }
                            }
                        );
                    } catch (userCameraError: any) {
                        // If user camera also fails, throw the original error
                        throw startError;
                    }
                } else {
                    throw startError;
                }
            }

            setCameraActive(true);
            console.log('Camera started successfully');
        } catch (err: any) {
            console.error('Camera access error:', err);

            // Detect iOS for better error messages
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

            let errorMsg: string;
            if (err.name === 'NotAllowedError' || err.message?.includes('Permission')) {
                errorMsg = isIOS
                    ? 'Camera access denied. Please allow camera permissions in Settings > Safari > Camera, then tap "Start Camera" again.'
                    : 'Camera access denied. Please allow camera permissions in Settings.';
            } else if (err.name === 'NotFoundError' || err.message?.includes('camera')) {
                errorMsg = 'No camera found on this device.';
            } else if (err.name === 'NotReadableError' || err.message?.includes('NotReadable')) {
                errorMsg = 'Camera is already in use by another app. Please close other apps using the camera.';
            } else if (err.message?.includes('NotSupportedError') || err.message?.includes('not supported')) {
                errorMsg = isIOS
                    ? 'Camera not supported. Please use Safari browser on iOS.'
                    : 'Camera not supported in this browser.';
            } else {
                errorMsg = err.message || 'Failed to access camera. Please check permissions.';
            }

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

    const handleQRCodeDetected = async (qrData: string) => {
        // Optimized for instant scanning like Google Pay - minimal delays
        const now = Date.now();
        const timeSinceLastScan = now - lastScanTimeRef.current;

        // Check if this QR code was already processed (reduced delay for instant scanning)
        const processedQR = processedQRCodesRef.current.get(qrData);
        if (processedQR) {
            const timeSinceProcessed = now - processedQR.timestamp;
            // If same code was processed within 500ms, ignore it (very short delay for instant feel)
            if (timeSinceProcessed < 500) {
                return;
            }
            // Remove old entries immediately to allow re-scanning
            processedQRCodesRef.current.delete(qrData);
        }

        // If same code scanned within 200ms, ignore it (very short debounce for instant detection)
        if (scanning || (qrData === lastScannedCodeRef.current && timeSinceLastScan < 200)) {
            return;
        }

        // Update last scanned code and time
        lastScannedCodeRef.current = qrData;
        lastScanTimeRef.current = now;

        setScanning(true);

        const phone = parsePhoneFromQRData(qrData);
        if (phone) {
            // Keep camera running - don't stop it after scan

            const digits = phone.replace(/\D/g, "");
            const hasPlus = phone.startsWith("+");
            let finalCountryCode = "+1";
            let finalPhoneNumber = "";

            console.log('Parsed phone:', { phone, digits, hasPlus, digitsLength: digits.length });

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
                finalCountryCode = countryCode;
                finalPhoneNumber = national;
                // Don't set phone number in input field - only use for API call
            } else if (digits.length >= 7) {
                // Handle phone numbers without country code
                finalPhoneNumber = digits;
            } else {
                // Check if we've already shown error for this invalid format
                if (!processedQRCodesRef.current.has(qrData)) {
                    processedQRCodesRef.current.set(qrData, { type: 'invalid', timestamp: Date.now() });
                    toast.error("Invalid phone number format.");
                }
                setScanning(false);
                return;
            }

            // Validate we have a phone number before continuing
            if (!finalPhoneNumber || finalPhoneNumber.length < 7) {
                // Check if we've already shown error for this invalid number
                if (!processedQRCodesRef.current.has(qrData)) {
                    processedQRCodesRef.current.set(qrData, { type: 'invalid', timestamp: Date.now() });
                    toast.error("Invalid phone number. Please try again.");
                }
                setScanning(false);
                return;
            }

            // Mark this QR code as valid and processed
            processedQRCodesRef.current.set(qrData, { type: 'valid', timestamp: now });

            // Clean up old processed QR codes (older than 10 seconds) to prevent memory buildup
            const cleanupTime = now - 10000; // 10 seconds ago
            for (const [code, data] of processedQRCodesRef.current.entries()) {
                if (data.timestamp < cleanupTime) {
                    processedQRCodesRef.current.delete(code);
                }
            }

            // Automatically call handleContinue with the values directly (don't update input field)
            console.log('Calling handleContinue with:', { phone: finalPhoneNumber, countryCode: finalCountryCode });

            // Reset scanning flag immediately for instant scanning (like Google Pay)
            setScanning(false);

            handleContinue(finalPhoneNumber, finalCountryCode, true); // Pass true to skip state update
        } else {
            // Check if we've already shown error for this invalid QR code
            if (!processedQRCodesRef.current.has(qrData)) {
                // Mark as invalid and show error only once
                processedQRCodesRef.current.set(qrData, { type: 'invalid', timestamp: now });
                toast.error("Invalid QR code. No phone number found.");
            }
            // Reset scanning flag to allow scanning other QR codes
            setScanning(false);
        }
    };


    useEffect(() => {
        // Automatically start camera when component mounts (works on all platforms including iOS)
        let mounted = true;
        let retryCount = 0;
        const maxRetries = 20; // 2 seconds max

        const initCamera = async () => {
            if (typeof window === 'undefined') return;

            // Detect iOS
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

            // On iOS, check if using Safari (only Safari supports camera on iOS)
            if (isIOS) {
                const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ||
                    (navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome') && !navigator.userAgent.includes('CriOS'));

                if (!isSafari) {
                    setCameraError('Camera access requires Safari browser on iOS. Please open this page in Safari.');
                    return;
                }
            }

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

                    if (permissionStatus.state === 'denied') {
                        const errorMsg = isIOS
                            ? 'Camera access denied. Please enable camera permissions in Settings > Safari > Camera.'
                            : 'Camera access denied. Please enable camera permissions in Settings.';
                        setCameraError(errorMsg);
                        return;
                    }
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
                let finalCountryCode = "+1";
                let finalPhoneNumber = "";

                console.log('Parsed phone from upload:', { phone, digits, hasPlus, digitsLength: digits.length });

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
                    finalCountryCode = countryCode;
                    finalPhoneNumber = national;
                    // Don't set phone number in input field - only use for API call
                } else if (digits.length >= 7) {
                    // Handle phone numbers without country code
                    finalPhoneNumber = digits;
                } else {
                    toast.error("Invalid phone number format.");
                    return;
                }

                // Validate we have a phone number before continuing
                if (!finalPhoneNumber || finalPhoneNumber.length < 7) {
                    toast.error("Invalid phone number. Please try again.");
                    return;
                }


                // Automatically call handleContinue with the values directly (don't update input field)
                console.log('Calling handleContinue from upload with:', { phone: finalPhoneNumber, countryCode: finalCountryCode });
                handleContinue(finalPhoneNumber, finalCountryCode, true); // Pass true to skip state update
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

    const handleContinue = async (phoneNumberOverride?: string, countryCodeOverride?: string, skipStateUpdate: boolean = false, fromQRScan: boolean = false) => {
        // Use override values if provided, otherwise use state, default to +1 if no country code
        const phoneToUse = phoneNumberOverride || phoneNumber;
        const countryCodeToUse = countryCodeOverride || countryCode || "+1";

        console.log('handleContinue called with:', {
            phoneNumberOverride,
            countryCodeOverride,
            phoneToUse,
            countryCodeToUse,
            statePhoneNumber: phoneNumber,
            stateCountryCode: countryCode,
            skipStateUpdate
        });

        // Only update state if not skipping (i.e., when manually clicking Continue button)
        if (!skipStateUpdate) {
            if (phoneNumberOverride) {
                setPhoneNumber(phoneNumberOverride);
            }
            if (countryCodeOverride) {
                setCountryCode(countryCodeOverride);
            }
        }

        if (!phoneToUse || phoneToUse.trim() === '') {
            toast.error("Please enter a phone number.")
            return;
        }

        setLoading(true);


        let receiverId: string | null = null;
        let receiverPhone: string | null = null;
        let userbyId: any | null = null;
        try {
            // Try to find an existing user in user_details
            const allDigits = String(phoneToUse).replace(/\D/g, "");
            const dialDigits = String(countryCodeToUse).replace(/\D/g, "");
            const nationalNumber = allDigits.startsWith(dialDigits)
                ? allDigits.slice(dialDigits.length)
                : allDigits;

            userbyId = await apiGetUserDetails("", nationalNumber, countryCodeToUse);
            receiverId = userbyId.id;
            receiverPhone =
                userbyId.full_number || `${userbyId.country_code}${userbyId.mobile_number}`;


        } catch (err: any) {
            const status = err?.response?.status;

            // Only update state on error if not skipping (for manual Continue button clicks)
            if (!skipStateUpdate) {
                if (phoneNumberOverride) {
                    setPhoneNumber(phoneNumberOverride);
                }
                if (countryCodeOverride) {
                    setCountryCode(countryCodeOverride);
                }
            }

            if (status === 404) {
                // No user record -> send to raw number
                receiverId = null;
                receiverPhone = `${countryCodeToUse}${String(phoneToUse).replace(/\D/g, "")}`;
                toast.error(err?.response?.data?.error)
                setLoading(false);

                // Camera stays running - no need to restart
                // Reset scanning flag to allow new scans
                setScanning(false);
                return
            } else {
                toast.error(err?.response?.data?.error ||
                    err?.message ||
                    "Failed to search recipient")
                setLoading(false);

                // Camera stays running - no need to restart
                // Reset scanning flag to allow new scans
                setScanning(false);
                return;
            }
        }

        // Prevent sending money to your own number/account
        if (receiverId && user?.id && String(receiverId) === String(user.id)) {
            toast.error("You cannot send money to your own number.");
            setLoading(false);

            // Camera stays running - reset scanning flag to allow new scans
            setScanning(false);
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
                    -webkit-transform: scaleX(1) !important;
                    transform: scaleX(1) !important;
                }
                #${qrCodeRegionId} {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100vw !important;
                    height: 100vh !important;
                    z-index: 1 !important;
                }
                #${qrCodeRegionId} > div {
                    border: none !important;
                    width: 100% !important;
                    height: 100% !important;
                }
                /* Hide the scanning border/box overlay - we use our own focusing frame */
                #${qrCodeRegionId} > div > div {
                    border: none !important;
                    box-shadow: none !important;
                }
                /* iOS Safari specific fixes */
                @supports (-webkit-touch-callout: none) {
                    #${qrCodeRegionId} video {
                        -webkit-transform: translateZ(0) !important;
                        transform: translateZ(0) !important;
                    }
                }
            `}</style>

            {/* Camera container - always present but conditionally visible */}
            <div
                id={qrCodeRegionId}
                className={`fixed inset-0 w-full h-full ${cameraActive ? 'z-10' : 'hidden'}`}
            />

            {cameraActive ? (
                // Full screen camera view with Google Pay-style scanning interface
                <>
                    {/* Overlay with focusing area */}
                    <div className="fixed inset-0 z-20 pointer-events-none">
                        {/* Top dark overlay */}
                        <div className="absolute top-0 left-0 right-0 h-[calc((100vh-280px)/2)] bg-black/60" />

                        {/* Bottom dark overlay - leaves space for button at bottom */}
                        <div className="absolute bottom-0 left-0 right-0 h-[calc((100vh-280px)/2)] bg-black/60" />

                        {/* Left dark overlay */}
                        <div className="absolute top-[calc((100vh-280px)/2)] bottom-[calc((100vh-280px)/2)] left-0 w-[calc((100vw-280px)/2)] bg-black/60" />

                        {/* Right dark overlay */}
                        <div className="absolute top-[calc((100vh-280px)/2)] bottom-[calc((100vh-280px)/2)] right-0 w-[calc((100vw-280px)/2)] bg-black/60" />

                        {/* Focusing area frame (square in center) */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] pointer-events-none">
                            {/* Corner indicators */}
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#00A91B] rounded-tl-lg" />
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#00A91B] rounded-tr-lg" />
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#00A91B] rounded-bl-lg" />
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#00A91B] rounded-br-lg" />
                        </div>
                    </div>

                    {/* Upload button positioned at bottom of screen */}
                    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-30 pointer-events-auto">
                        <button
                            type="button"
                            disabled={scanning}
                            className="px-6 py-3 text-sm bg-white/95 whitespace-nowrap hover:bg-white text-[#6F7B8F] font-medium rounded-full flex items-center gap-2 disabled:opacity-70 shadow-lg backdrop-blur-sm transition-all"
                            onClick={handleUploadClick}
                        >
                            <ImageIcon color='#6F7B8F' />
                            {scanning ? "Scanning…" : "Upload from gallery"}
                        </button>
                    </div>

                    {/* Error message overlay */}
                    {cameraError && (
                        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-30 bg-black/80 text-white px-4 py-3 rounded-lg max-w-[90%] pointer-events-auto">
                            <p className={`text-sm text-center ${cameraError.includes('Tap') || cameraError.includes('denied') || cameraError.includes('not supported')
                                ? 'text-yellow-400'
                                : 'text-red-400'
                                }`}>
                                {cameraError}
                            </p>
                        </div>
                    )}

                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </>
            ) : (
                // Non-camera view (original design)
                <div
                    className="p-4 sm:p-5 pt-[40px] pb-[80px] overflow-y-auto flex flex-col items-center min-h-[calc(100vh)]"
                    style={{
                        backgroundImage: 'url(/PayScanBgImage.svg)',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
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
                            <div className="w-full rounded-[18px] border-2 border-dashed border-[#68D39100] bg-[#F5FFF500] flex items-center justify-center ">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="relative w-full max-w-[280px] aspect-square flex items-center justify-center">
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
                                    </div>

                                    {/* Upload button */}
                                    {uploadedImage ? (
                                        <div className="flex gap-2 mt-10">
                                            <button
                                                type="button"
                                                className="px-6 py-2 text-sm bg-white hover:bg-gray-100 text-[#6F7B8F] font-normal rounded-[40px] flex items-center gap-2 border border-[#E5E7EB]"
                                                onClick={() => {
                                                    if (uploadedImage) {
                                                        URL.revokeObjectURL(uploadedImage);
                                                    }
                                                    setPhoneNumber("+1");
                                                }}
                                            >
                                                Clear
                                            </button>
                                            <button
                                                type="button"
                                                disabled={scanning}
                                                className="px-6 py-2 text-sm bg-white whitespace-nowrap hover:bg-[#009116] text-[#6F7B8F] font-normal rounded-[40px] flex items-center gap-2 disabled:opacity-70 border border-[#E5E7EB]"
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
                                            className="px-6 py-2 text-sm bg-white whitespace-nowrap hover:bg-[#009116] text-[#6F7B8F] mt-10 font-normal rounded-[40px] flex items-center gap-2 disabled:opacity-70"
                                            onClick={handleUploadClick}
                                        >
                                            <ImageIcon color='#6F7B8F' />
                                            {scanning ? "Scanning…" : "Upload from gallery"}
                                        </button>
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
                                <div className="flex flex-col items-center gap-3 mt-4">
                                    <p className={`text-sm text-center ${cameraError.includes('Tap') || cameraError.includes('denied') || cameraError.includes('not supported')
                                        ? 'text-yellow-500'
                                        : 'text-red-500'
                                        }`}>
                                        {cameraError}
                                    </p>
                                </div>
                            )}

                            {/* <div className="w-full flex items-center gap-2 mt-2">
                            <div className="w-full h-px border-[0.5px] border-dashed border-[#ffffff4D]" />
                            <div className="text-[14px] text-white whitespace-nowrap">Or pay via phone name</div>
                            <div />
                            <div className="w-full h-px border-[0.5px] border-dashed border-[#ffffff4D]" />
                        </div> */}

                            {/* <div className="w-full">
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
                        </div> */}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ScanPage