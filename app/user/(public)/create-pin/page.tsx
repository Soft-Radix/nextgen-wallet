"use client";

import { Button, Input } from "@/components/ui";
import { CreatePin } from "@/lib/svg";
import { Formik, Form } from "formik";
import { useRouter } from "next/navigation";
import * as Yup from "yup";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateUserPin } from "@/store/userDetailsSlice";
import { RootState } from "@/store/store";
import { useEffect, useState } from "react";
import { bootstrapRedirect } from "@/lib/utils/bootstrapRedirect";

const CreatePinSchema = Yup.object({
    pin: Yup.string()
        .required("PIN is required")
        .matches(/^\d{4}$/, "PIN must be 4 digits"),
    confirmPin: Yup.string()
        .required("Confirm PIN is required")
        .oneOf([Yup.ref("pin")], "PINs must match"),
});

export default function PinPage() {
    const router = useRouter();
    const [userFromStorage, setUserFromStorage] = useState<{ id?: string; pin?: string } | null>(null);
    const dispatch = useAppDispatch();
    const { loading, error, user } = useAppSelector((state: RootState) => state.userDetails);

    useEffect(() => {
        const raw = localStorage.getItem("user");
        const parsed = raw ? JSON.parse(raw) : {};
        setUserFromStorage(parsed);
        if (!parsed?.id) {
            router.push("/user/welcome");
            return;
        }
        if (parsed?.status === "active") {
            router.push("/user/dashboard");
        }
    }, [router]);

    if (userFromStorage === null) {
        return (
            <div className="max-w-[524px] w-full flex items-center justify-center min-h-[200px]">
                Loading...
            </div>
        );
    }

    return (
        <>
            <div className="max-w-[524px] w-full">
                <div className="bg-white pt-[48px] p-6 rounded-[14px] flex flex-col gap-[20px] items-center border-[0.5px] border-[var(--button-outline-border)] shadow-[0_23px_50px_rgba(25,33,61,0.02)] ">
                    <p className="text-text font-semibold text-[24px] leading-[35px]">
                        Secure Your Wallet
                    </p>
                    <p className="text-grey  text-[14px] text-center mb-[20px]">
                        Create a 4-digit PIN for quick access.
                    </p>

                    <Formik
                        initialValues={{
                            pin: userFromStorage?.pin || "",
                            confirmPin: userFromStorage?.pin || "",
                        }}
                        validationSchema={CreatePinSchema}
                        onSubmit={async (values, { setSubmitting, setStatus }) => {
                            try {
                                const res: any = await dispatch(
                                    updateUserPin({
                                        id: user?.id || userFromStorage?.id || "",
                                        pin: values.pin,
                                    })
                                );

                                if (res.meta?.requestStatus == "fulfilled") {
                                    router.push("/user/success");
                                } else {
                                    setStatus(res.payload.message || "Failed to save PIN");
                                }




                            } catch (error: any) {
                                setStatus(error.message || "Something went wrong");
                            } finally {
                                setSubmitting(false);
                            }
                        }}
                    >
                        {({
                            values,
                            errors,
                            touched,
                            handleChange,
                            handleBlur,
                            isSubmitting,
                            status,
                            setStatus,
                        }) => (
                            <Form className="w-full flex flex-col gap-4">
                                <Input
                                    name="pin"
                                    type="text"
                                    label="Create Pin"
                                    placeholder="Enter 4 digit pin"
                                    startIcon={<CreatePin />}
                                    maxLength={4}
                                    value={values.pin}
                                    onChange={(e) => { handleChange(e); setStatus("") }}
                                    onBlur={handleBlur}
                                    error={
                                        touched.pin && typeof errors.pin === "string"
                                            ? errors.pin
                                            : undefined
                                    }
                                />

                                <Input
                                    name="confirmPin"
                                    type="text"
                                    label="Confirm Pin"
                                    placeholder="Confirm your pin"
                                    startIcon={<CreatePin />}
                                    maxLength={4}
                                    value={values.confirmPin}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={
                                        touched.confirmPin && typeof errors.confirmPin === "string"
                                            ? errors.confirmPin
                                            : undefined
                                    }
                                />

                                {/* {status && (
                                    <p className="text-red-500 text-xs w-full text-left">
                                        {status}
                                    </p>
                                )} */}

                                {error && (
                                    <p className="text-red-500 text-xs w-full text-left">
                                        {error}
                                    </p>
                                )}
                                <Button
                                    type="submit"
                                    fullWidth={true}
                                    disabled={isSubmitting || loading}
                                >
                                    {isSubmitting || loading ? "Saving..." : "Create Wallet"}
                                </Button>
                            </Form>
                        )}
                    </Formik>

                    <button
                        type="button"
                        className="text-[#00A63E]  text-[16px]"
                        onClick={() => router.push("/user/success")}
                    >
                        Skip for Now
                    </button>
                </div>
            </div >
        </>
    );
}

