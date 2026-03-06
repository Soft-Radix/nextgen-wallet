"use client";

import Topbar from "@/components/Topbar";
import { Button } from "@/components/ui";
import React, { useState } from "react";
import toast from "react-hot-toast";

type ToggleProps = {
    checked: boolean;
    onChange: () => void;
};

const Toggle: React.FC<ToggleProps> = ({ checked, onChange }) => {
    return (
        <button
            type="button"
            onClick={onChange}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "from-[#169D25] bg-linear-to-r to-[#00DE1C]" : "bg-[#E5E7EB]"
                }`}
        >
            <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-1"
                    }`}
            />
        </button>
    );
};

type CheckRowProps = {
    label: string;
    description: string;
    checked: boolean;
    onChange: () => void;
};

const ChannelRow: React.FC<CheckRowProps> = ({
    label,
    description,
    checked,
    onChange,
}) => {
    return (
        <button
            type="button"
            onClick={onChange}
            className="flex w-full items-center justify-between rounded-[12px] px-3 py-3 transition-colors hover:bg-[#F1F5F9]"
        >
            <div className="flex items-start gap-3 text-left">
                <div
                    className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border ${checked
                        ? "border-[#00DE1C] bg-[#00DE1C]"
                        : "border-[#CBD5E1] bg-white"
                        }`}
                >
                    {checked && (
                        <span className="h-3 w-3 rotate-45 border-b-2 border-r-2 border-white" />
                    )}
                </div>
                <div>
                    <p className="text-[14px] font-semibold text-[#0F172A]">{label}</p>
                    <p className="text-[12px] text-[#6B7280]">{description}</p>
                </div>
            </div>
        </button>
    );
};

const Page = () => {
    const [transactionAlerts, setTransactionAlerts] = useState(true);
    const [withdrawalAlerts, setWithdrawalAlerts] = useState(true);
    const [requestAlerts, setRequestAlerts] = useState(false);

    const [pushEnabled, setPushEnabled] = useState(true);
    const [smsEnabled, setSmsEnabled] = useState(false);
    const [emailEnabled, setEmailEnabled] = useState(false);

    const handleSave = () => {
        // Later you can persist these to an API.
        toast.success("Notification preferences saved.");
    };

    return (
        <>
            <Topbar title="Notification Preferences" />
            <div className="max-h-[calc(100vh-100px)]   px-5 pt-[88px] pb-6 overflow-y-auto flex flex-col items-center">
                <div className="w-full max-w-[420px] flex flex-col gap-2">
                    <p className="text-[14px] font-bold uppercase  text-[#1E2C44] mt-3">
                        Activity Alerts
                    </p>
                    {/* Activity alerts */}
                    <div className="w-full rounded-[18px] bg-white shadow-[0_20px_40px_rgba(15,23,42,0.04)] border border-[#E5E7EB] px-4 py-4">


                        <div className="space-y-3">
                            <div className="flex items-center justify-between rounded-[12px] px-2 py-2 hover:bg-[#F9FAFB] gap-3">
                                <div className="flex items-start gap-3 w-[80%]">
                                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-2xl bg-[#ECFDF3] text-xs font-semibold text-[#16A34A]">
                                        $
                                    </div>
                                    <div >
                                        <p className="text-[14px] font-semibold text-text">
                                            Transaction Alerts
                                        </p>
                                        <p className="text-[12px] text-grey mt-1">
                                            Get notified when money is sent or received.
                                        </p>
                                    </div>
                                </div>
                                <Toggle
                                    checked={transactionAlerts}
                                    onChange={() => setTransactionAlerts((v) => !v)}
                                />
                            </div>

                            <div className="flex items-center justify-between rounded-[12px] px-2 py-2 gap-3 hover:bg-[#F9FAFB]">
                                <div className="flex items-start gap-3 w-[80%]">
                                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-2xl bg-[#EEF2FF] text-xs font-semibold text-[#4F46E5]">
                                        ATM
                                    </div>
                                    <div >
                                        <p className="text-[14px] font-semibold text-text">
                                            Withdrawal Alerts
                                        </p>
                                        <p className="text-[12px] text-grey mt-1">
                                            Notifications for cash withdrawals and ATM usage.
                                        </p>
                                    </div>
                                </div>
                                <Toggle
                                    checked={withdrawalAlerts}
                                    onChange={() => setWithdrawalAlerts((v) => !v)}
                                />
                            </div>

                            <div className="flex items-center justify-between rounded-[12px] px-2 py-2 gap-3 hover:bg-[#F9FAFB]">
                                <div className="flex items-start gap-3 w-[80%]">
                                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-2xl bg-[#ECFEFF] text-xs font-semibold text-[#0891B2]">
                                        Req
                                    </div>
                                    <div >
                                        <p className="text-[14px] font-semibold text-text">
                                            Request Alerts
                                        </p>
                                        <p className="text-[12px] text-grey mt-1">
                                            When someone requests money from you.
                                        </p>
                                    </div>
                                </div>
                                <Toggle
                                    checked={requestAlerts}
                                    onChange={() => setRequestAlerts((v) => !v)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Notification channels */}
                    <p className="text-[14px] font-bold uppercase  text-[#1E2C44] mb-3  mt-6">
                        Notification Channel
                    </p>
                    <div className="w-full rounded-[18px] bg-white shadow-[0_20px_40px_rgba(15,23,42,0.04)] border border-[#E5E7EB] px-4 py-4">
                        <div className="space-y-1">
                            <ChannelRow
                                label="Push Notifications"
                                description="Instant alerts in the app."
                                checked={pushEnabled}
                                onChange={() => setPushEnabled((v) => !v)}
                            />
                            <ChannelRow
                                label="SMS Alerts"
                                description="Text messages for important activity."
                                checked={smsEnabled}
                                onChange={() => setSmsEnabled((v) => !v)}
                            />
                            <ChannelRow
                                label="Email Notifications"
                                description="Summaries and updates to your inbox."
                                checked={emailEnabled}
                                onChange={() => setEmailEnabled((v) => !v)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-4 pb-5 fixed bottom-0 left-0 right-0 max-w-[968px] w-full mx-auto bg-linear-to-t from-white/90 via-white/80 to-transparent">
                <Button
                    type="button"
                    fullWidth
                    onClick={handleSave}
                    className="h-[52px] rounded-[12px]"
                >
                    Save Changes
                </Button>
            </div>
        </>
    );
};

export default Page;