"use client";

import Topbar from "@/components/Topbar";
import { Button, Input } from "@/components/ui";
import { apiGetUserDetails } from "@/lib/api/userDetails";
import { AmountSent } from "@/lib/svg";
import { getUserDetails, getUserImage } from "@/lib/utils/bootstrapRedirect";
import { useAppDispatch } from "@/store/hooks";
import { RootState } from "@/store/store";
import { setDraftTransfer } from "@/store/transactionSlice";
import { setUserBalanceUpdate } from "@/store/userDetailsSlice";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useState } from "react";
import { useSelector } from "react-redux";

const EnterAmountContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const draft = useSelector((state: RootState) => state.transaction.draftTransfer);

    const [name, setName] = useState(draft?.name || "");
    const [isChecked, setIsChecked] = useState(true);
    const [note, setNote] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const dispatch = useAppDispatch()
    const user = getUserDetails();
    const id = searchParams.get("id");
    useEffect(() => {
        if (!id || draft?.name) return;

        const fetchName = async () => {
            let nameFromHistory: string | null = null;
            let isContactFromHistory = false;

            // 1) Try to find latest transaction name for this receiver
            try {
                if (user?.id) {
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

                    if (response.ok) {
                        const data = await response.json();
                        const items = data.items || [];

                        const tx = items.find(
                            (t: any) =>
                                t.receiver_profile_id &&
                                String(t.receiver_profile_id) === String(id) &&
                                t.transaction_type === "sender" &&
                                t.name
                        );

                        if (tx) {
                            nameFromHistory = tx.name ?? null;
                            isContactFromHistory = !!tx.is_contact;
                        }
                    }
                }
            } catch {
                // ignore and fall back to user_details
            }

            // 2) If no transaction name, fall back to user_details
            if (!nameFromHistory) {
                const details = await apiGetUserDetails(id, "", "");
                nameFromHistory = details.name || "";
            }

            setName(nameFromHistory || "");
            if (isContactFromHistory) {
                setIsChecked(true);
            }
        };

        fetchName();
    }, [id, draft?.name, user?.id]);

    const handleContinue = () => {
        const nameValue = name?.trim() || null;
        if (!nameValue) {
            setError("Full Name is required.");
            return;
        }
        dispatch(
            setDraftTransfer({
                name: nameValue,
                note: note.trim() || null,
                receiver_id: draft?.receiver_id,
                receiver_phone: draft?.receiver_phone,
                is_contact: isChecked,
            })
        );



        router.push("/enter-amount");
    };
    return (
        <>
            <Topbar title="Enter Name" />
            <div className="p-5  py-[77px]  overflow-y-auto flex flex-col items-center justify-center gap-2">
                <div className='w-[94px] h-[94px] rounded-full bg-gray-200 mt-[20px] border-4 border-[#dfe9f3] shadow-[0px_0px_4px_4px_rgba(17, 82, 212, 0.8)] relative ' >
                    {draft?.user_image ? <img src={draft?.user_image} alt="user" className='w-full h-full object-cover rounded-full' /> : <p className="text-[#00DE1C] text-[30px] font-semibold capitalize text-center leading-[94px]">{getUserImage(draft?.name ?? "")}</p>}
                    <div className='absolute bottom-0 right-0 w-[20px] h-[20px] border-2 border-white rounded-full bg-green-500'>

                    </div>
                </div>

                <p className="text-grey text-[14px] text-center ">{draft?.receiver_phone || "N/A"}</p>
                {/* amount to send */}
                <Input
                    name="name"
                    type="text"
                    label="Full Name"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => { setError(null); setName(e.target.value) }}
                    error={error ? error : ""}
                />
                <div className="flex  gap-2  justify-start items-center mt-[28px] w-full">
                    <input type="checkbox"
                        style={{ accentColor: 'var(--button-primary-from)', borderColor: '#6F7B8F', borderWidth: "2px", width: "18px", height: "18px", cursor: "pointer" }}
                        checked={isChecked}
                        onChange={() => setIsChecked(!isChecked)}
                    />
                    <span className="text-grey text-[14px] font-medium">
                        Save to my contacts
                    </span>
                </div>

                {/* continue button */}
                <div className="flex items-center justify-center mt-[40px] fixed bottom-0 left-0 right-0 max-w-[968px] w-full mx-auto px-5 bg-mainBackground pb-4">
                    <Button fullWidth={true} onClick={handleContinue} disabled={error !== null}>
                        Continue
                    </Button>
                </div>
            </div>
        </>
    )
};

const page = () => {
    return (
        <Suspense fallback={<div className="p-5 py-[77px] flex items-center justify-center min-h-[50vh]">Loading...</div>}>
            <EnterAmountContent />
        </Suspense>
    );
};

export default page