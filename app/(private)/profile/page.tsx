"use client"
import Topbar from '@/components/Topbar'
import { Button, Modal } from '@/components/ui';
import { CopyIcon, CopyIconOutline, EditIcon, ForwardIcon, LogoutIcon, NotificationIconOutline, SecurityPinIcon, WalletIcon } from '@/lib/svg'
import { getNameCapitalized, getUserDetails, getUserImage, logoutUser } from '@/lib/utils/bootstrapRedirect';
import { ResetTransaction } from '@/store/transactionSlice';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux';
import QRCode from "react-qr-code";
import { createPortal } from "react-dom";

const Page = () => {
    const user = getUserDetails();
    const [isCopied, setIsCopied] = useState(false);
    const [showLogoutPopup, setShowLogoutPopup] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const dispatch = useDispatch();
    const router = useRouter();
    const transactionRef = "NXG-9823-4410"

    const fullNumber = user?.full_number || "";

    const copyRef = useCallback(() => {
        navigator.clipboard?.writeText(transactionRef);
        setIsCopied(true);
        setTimeout(() => {
            setIsCopied(false);
        }, 2000);
    }, [transactionRef]);

    const handleLogout = () => {
        dispatch(ResetTransaction());
        logoutUser();
    }

    const handleLogoutClick = () => {
        setShowLogoutPopup(true);
    }

    const handleCancelLogout = () => {
        setShowLogoutPopup(false);
    }

    // Handle Escape key and body scroll for QR modal
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && showQRModal) {
                setShowQRModal(false);
            }
        };

        if (showQRModal) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "unset";
        };
    }, [showQRModal]);

    return (
        <>
            <Topbar title="Profile" />
            <div className="min-h-[calc(100vh-177px)] max-h-[calc(100vh-100px)] bg-gradient-to-b from-[#f4fbff] to-[#e9f0f7] px-5 pt-[88px] pb-6 overflow-y-auto flex flex-col items-center">
                {/* Avatar + edit */}
                <div className="relative">
                    <div className="w-[94px] h-[94px] rounded-full bg-gray-200 border-[4px] border-[#1152D41A]  overflow-hidden">
                        {/* <img
                            src="/user1.jpg"
                            alt="user avatar"
                            className="w-full h-full rounded-full object-cover"
                        /> */}
                        {user?.user_image ? <img src={user?.user_image} alt="user" className='w-full h-full object-cover rounded-full' /> : <p className="text-[#00DE1C] text-[30px] font-semibold capitalize text-center leading-[94px]">{getUserImage(user?.name ?? "")}</p>}
                    </div>
                    <div className="absolute -right-1 bottom-1 border-2 border-[#ffffff] flex h-8 w-8 items-center justify-center rounded-full bg-[#000000] text-white shadow-lg">
                        <EditIcon />
                    </div>
                </div>

                {/* Name + phone + id */}
                <div className="mt-4 flex flex-col items-center gap-1">
                    <p className="text-[24px] font-bold text-clip bg-gradient-to-r from-[var(--button-primary-from)] to-[var(--button-primary-to)] bg-clip-text text-transparent">{getNameCapitalized(user?.name ?? "") || "N/A"}</p>
                    <p className="text-sm font-medium text-grey">
                        {user?.country_code}{' '}
                        {user?.mobile_number
                            ?.replace(/\d/g, 'X')               // digits → X
                            ?.replace(/(X{3})(?=X)/g, '$1-')}
                    </p>
                    <div className="mt-2 inline-flex gap-3 items-center rounded-[8px] bg-[#D8EBD780] px-4 py-2 text-[14px]  text-text  ">
                        <WalletIcon />
                        {user?.wallet_id || "NXG-9823-4410"}
                        <button
                            type="button"
                            onClick={copyRef}
                            className={`text-[#6F7B8F] hover:text-[#4CCF44] p-0.5 rounded cursor-pointer ${isCopied ? "text-[#4CCF44]" : ""}`}
                            aria-label="Copy reference"
                        >
                            <CopyIconOutline color={isCopied ? "#4CCF44" : "#030200"} />
                        </button>
                    </div>
                </div>

                {/* Settings card */}
                <div className="mt-8 w-full max-w-md">
                    <div className="rounded-[14px] border border-[#D8EBD7]  bg-white shadow-[0_8px_16px_rgba(0,166,62,0.01)] px-5 py-6">
                        <p className="px-1 pb-1 text-[14px] font-semibold tracking-wide text-[#94A3B8]">
                            SETTINGS
                        </p>

                        <button
                            type="button"
                            className="flex w-full items-center justify-between rounded-xl px-2 py-3 hover:bg-slate-50"
                            onClick={() => setShowQRModal(true)}
                        >
                            <div className="flex items-center gap-3">
                                <SecurityPinIcon />
                                <div className="flex flex-col items-start gap-2">
                                    <span className="text-sm font-semibold text-[#1E293B]">
                                        View QR Code
                                    </span>
                                    <span className="text-xs text-[#6F7B8F]">
                                        Use a QR code to accept payments
                                    </span>
                                </div>
                            </div>
                            <span><ForwardIcon /></span>
                        </button>

                        <button
                            type="button"
                            className="flex w-full items-center justify-between rounded-xl px-2 py-3 hover:bg-slate-50"
                            onClick={() => router.push("/change-pin")}
                        >
                            <div className="flex items-center gap-3">
                                <SecurityPinIcon />
                                <div className="flex flex-col items-start gap-2">
                                    <span className="text-sm font-semibold text-[#1E293B]">
                                        Change Security PIN
                                    </span>
                                    <span className="text-xs text-[#6F7B8F]">
                                        Update your 4-digit transaction code
                                    </span>
                                </div>
                            </div>
                            <span onClick={() => router.push("/change-pin")}><ForwardIcon /></span>
                        </button>

                        <div className="my-1 h-px w-full bg-slate-100" />

                        <button
                            type="button"
                            className="flex w-full items-center justify-between rounded-xl px-2 py-3 hover:bg-slate-50"
                            onClick={() => router.push("/notification-settings")}
                        >
                            <div className="flex items-center gap-3">
                                <NotificationIconOutline />
                                <div className="flex flex-col items-start gap-3">
                                    <span className="text-sm font-semibold text-[#1E293B]">
                                        Notifications
                                    </span>
                                    <span className="text-xs text-[#6F7B8F]">
                                        Push, email, and SMS alerts
                                    </span>
                                </div>
                            </div>
                            <span onClick={() => router.push("/notification-settings")}><ForwardIcon /></span>
                        </button>
                    </div>
                </div>

                {/* Logout button */}
                <div className="mt-7 w-full max-w-md">
                    <Button size="lg" fullWidth isLoading={false} disabled={false} className="w-full" endIcon={<LogoutIcon />} onClick={handleLogoutClick}>Logout</Button>
                </div>

                {/* Logout Confirmation Modal */}
                <Modal
                    isOpen={showLogoutPopup}
                    onClose={handleCancelLogout}
                    title="Confirm Logout"
                    message="Are you sure you want to logout? You will need to login again to access your account."
                    confirmText="Logout"
                    cancelText="Cancel"
                    onConfirm={handleLogout}
                    variant="danger"
                />

                {/* QR Code Modal */}
                {showQRModal && typeof document !== "undefined" && createPortal(
                    <div
                        className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/50 overflow-y-auto"
                        onClick={() => setShowQRModal(false)}
                    >
                        <div
                            className="bg-white rounded-[14px] p-4 sm:p-6 max-w-[400px] w-full max-h-[85vh] overflow-y-auto shadow-lg flex flex-col items-center justify-center my-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-lg sm:text-[20px] font-semibold text-[#030200] mb-4">
                                Your Payment QR Code
                            </h3>
                            {fullNumber ? (
                                <>
                                    <div className='my-3 bg-[#F8FAFC] rounded-[12px] p-4 flex items-center justify-center'>
                                        <QRCode
                                            value={fullNumber}
                                            size={200}
                                            fgColor="#030200"
                                            bgColor="transparent"
                                        />
                                    </div>
                                    <p className="text-[13px] sm:text-[14px] text-[#6F7B8F] mb-4 text-center">
                                        Scan this QR code to receive payments
                                    </p>

                                    <Button
                                        variant="primary"
                                        size="lg"
                                        fullWidth
                                        onClick={() => setShowQRModal(false)}
                                        className="rounded-[10px] h-[52px] text-base font-semibold"
                                    >
                                        Close
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <p className="text-[13px] sm:text-[14px] text-[#6F7B8F] mb-4 text-center">
                                        Unable to generate QR code. Phone number not found.
                                    </p>
                                    <Button
                                        variant="primary"
                                        size="lg"
                                        fullWidth
                                        onClick={() => setShowQRModal(false)}
                                        className="rounded-[10px] h-[52px] text-base font-semibold"
                                    >
                                        Close
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>,
                    document.body
                )}

                {/* Footer */}
                <div className="mt-6 flex w-full max-w-md flex-col items-center text-center text-[12px] text-[#6F7B8F]">
                    <p className="text-[12px]">
                        NexGenPay v2.4.0 — Securely Connected
                    </p>
                    <div className="mt-1 flex items-center gap-4 text-[10px] font-medium">
                        <button type="button" className="text-[#6F7B8F] text-[12px] underline">
                            About
                        </button>

                        <button type="button" className="text-[#6F7B8F] text-[12px] underline">
                            Privacy Policy
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Page