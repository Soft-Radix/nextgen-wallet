"use client";
import Topbar from "@/components/Topbar";
import { Button, Input } from "@/components/ui";
import { CreatePin } from "@/lib/svg";
import { Form, Formik } from "formik";
import * as Yup from "yup";
import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { RootState } from "@/store/store";
import { updateUserPin } from "@/store/userDetailsSlice";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const Page = () => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { loading, error, user } = useAppSelector(
        (state: RootState) => state.userDetails
    );
    const [userFromStorage, setUserFromStorage] = useState<{
        id?: string;
        pin?: string | null;
        name?: string | null;
    } | null>(null);

    useEffect(() => {
        const raw = localStorage.getItem("user");
        const parsed = raw ? JSON.parse(raw) : {};
        setUserFromStorage(parsed);

        if (!parsed?.id) {
            router.push("/user/welcome");
            return;
        }
    }, [router]);

    const ChangePinSchema = Yup.object({
        oldpin: Yup.string()
            .required("Current PIN is required")
            .matches(/^\d{4}$/, "PIN must be 4 digits"),
        pin: Yup.string()
            .required("New PIN is required")
            .matches(/^\d{4}$/, "New PIN must be 4 digits"),
        confirmPin: Yup.string()
            .required("Confirm New PIN is required")
            .oneOf([Yup.ref("pin")], "New PINs must match"),
    });

    if (userFromStorage === null) {
        return (
            <div className="p-4 sm:p-5 pt-[95px] pb-16 flex items-center justify-center">
                Loading...
            </div>
        );
    }

    return (
        <>
            <Topbar title="Change Pin" />
            <div className="p-5 sm:p-5 pt-[95px] pb-16 overflow-y-auto flex flex-col items-center h-full">
                <div className="w-full max-w-[420px] relative ">
                    <p className="text-text font-semibold text-[24px] leading-[35px] text-center">
                        Change Security PIN
                    </p>
                    <p className="text-grey  text-[14px] text-center mb-[20px]">
                        Update your 4-digit transaction code to keep your account secure.
                    </p>
                    <Formik
                        initialValues={{
                            oldpin: "",
                            pin: "",
                            confirmPin: "",
                        }}
                        validationSchema={ChangePinSchema}
                        onSubmit={async (values, { setSubmitting, setStatus }) => {
                            try {
                                const res: any = await dispatch(
                                    updateUserPin({
                                        id: user?.id || userFromStorage?.id || "",
                                        pin: values.pin,
                                        name: user?.name || userFromStorage?.name || "",
                                        old_pin: values.oldpin,
                                    })
                                );

                                if (res.meta?.requestStatus === "fulfilled") {
                                    toast.success(res.payload.message || "PIN updated successfully");
                                    router.push("/user/profile");
                                } else {
                                    setStatus(
                                        (res.payload as string) || "Failed to update PIN"
                                    );
                                }
                            } catch (err: any) {
                                setStatus(err.message || "Something went wrong");
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
                                <div className="flex flex-col gap-4 min-h-[calc(100vh-77px)]">
                                    <Input
                                        name="oldpin"
                                        type="text"
                                        label="Current PIN"
                                        placeholder="Enter 4 digit current pin"
                                        startIcon={<CreatePin />}
                                        maxLength={4}
                                        value={values.oldpin}
                                        onChange={(e) => {
                                            handleChange(e);
                                            setStatus("");
                                        }}
                                        onBlur={handleBlur}
                                        error={
                                            touched.oldpin && typeof errors.oldpin === "string"
                                                ? errors.oldpin
                                                : undefined
                                        }
                                    />
                                    <Input
                                        name="pin"
                                        type="text"
                                        label="New PIN"
                                        placeholder="Enter 4 digit pin"
                                        startIcon={<CreatePin />}
                                        maxLength={4}
                                        value={values.pin}
                                        onChange={(e) => {
                                            handleChange(e);
                                            setStatus("");
                                        }}
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
                                        label="Confirm New PIN"
                                        placeholder="Confirm your pin"
                                        startIcon={<CreatePin />}
                                        maxLength={4}
                                        value={values.confirmPin}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        error={
                                            touched.confirmPin &&
                                                typeof errors.confirmPin === "string"
                                                ? errors.confirmPin
                                                : undefined
                                        }
                                    />

                                    {status && (
                                        <p className="text-red-500 text-xs w-full text-left">
                                            {status}
                                        </p>
                                    )}

                                   
                                </div>
                                <div className="fixed bottom-0 left-0 w-full  mx-auto px-5">
                                    <Button
                                        type="submit"
                                        fullWidth={true}
                                        disabled={isSubmitting || loading}
                                    >
                                        {isSubmitting || loading ? "Updating..." : "Update PIN"}
                                    </Button>
                                    <button
                                        type="button"
                                        className="text-[#00A63E]  text-[16px] text-center w-full "
                                        onClick={() => router.push("/user/profile")}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </Form>
                        )}
                    </Formik>

                </div>
            </div>
        </>
    );
};

export default Page;