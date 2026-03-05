"use client";
import { Button, Input } from '@/components/ui';
import { AccountSecurelyConnectedIcon } from '@/lib/svg';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { RootState } from '@/store/store';
import { updateUserPin } from '@/store/userDetailsSlice';
import { Form, Formik } from 'formik';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast';
import * as Yup from 'yup';
const CreateProfilePage = () => {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const [userFromStorage, setUserFromStorage] = useState<{ id?: string; name?: string, full_number?: string } | null>(null);
    const { loading, error, user } = useAppSelector((state: RootState) => state.userDetails);

    useEffect(() => {
        const raw = localStorage.getItem("user");
        const parsed = raw ? JSON.parse(raw) : {};
        setUserFromStorage(parsed);

        if (!parsed?.id) {
            router.push("/user/welcome");
            return;
        }
        if (!parsed?.name) {
            router.push("/user/create-profile");
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
                        Create Your Profile
                    </p>
                    <div className="w-full mb-[20px]">
                        <p className="text-grey  text-[14px] text-center ">
                            set up your profile to get started.
                        </p>
                        <p className="text-[#00d641] text-[12px] bg-[#84ec7b59] w-fit mx-auto mt-[14px] rounded-[30px] px-4 py-2 flex items-center justify-center gap-1"><AccountSecurelyConnectedIcon color="#00d641" />{userFromStorage?.full_number} Verified</p>
                    </div>
                    <Formik
                        initialValues={{
                            name: userFromStorage?.name || "",
                        }}
                        validationSchema={Yup.object({
                            name: Yup.string()
                                .trim()
                                .required("Name is required")
                                .min(3, "Name must be at least 3 characters long")
                                .max(20, "Name must be less than 20 characters long")
                                .matches(/^[A-Za-z\s]+$/, "Name can only contain letters and spaces")
                                .matches(/\S/, "Name cannot contain only spaces")
                        })}
                        onSubmit={async (values, { setSubmitting, setStatus }) => {
                            try {
                                const res: any = await dispatch(
                                    updateUserPin({
                                        id: user?.id || userFromStorage?.id || "",
                                        name: values.name,
                                    })
                                );
                                if (res.meta?.requestStatus == "fulfilled") {
                                    router.push("/user/create-pin");
                                } else {
                                    setStatus(res.payload.message || "Failed to save profile");
                                }
                            } catch (error: any) {
                                toast.error(error.message || "Something went wrong");
                            } finally {
                                setSubmitting(false);
                            }
                        }}
                    >
                        {({ values, errors, touched, handleChange, handleBlur, isSubmitting, status, setStatus }) => (
                            <Form className="w-full flex flex-col gap-4">
                                <Input
                                    name="name"
                                    type="text"
                                    label="Full Name"
                                    placeholder="Enter your full name"
                                    value={values.name}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={touched.name && errors.name ? errors.name : undefined}
                                />
                                <Button type="submit" fullWidth={true} disabled={isSubmitting || loading}>
                                    {isSubmitting || loading ? "Saving..." : "Create Profile"}
                                </Button>
                            </Form>
                        )}
                    </Formik>
                </div>
            </div>
        </>
    );
};

export default CreateProfilePage;