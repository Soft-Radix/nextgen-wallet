"use client";
import Topbar from '@/components/Topbar'
import { Button, Input } from '@/components/ui';
import { CreatePin } from '@/lib/svg';
import { Form, Formik } from 'formik';
import React from 'react'

const page = () => {
    return (
        <>
            <Topbar title="Change Pin" />
            <div className="p-4 sm:p-5 pt-[95px] pb-16 overflow-y-auto flex flex-col items-center min-h-[calc(100vh-120px)]">
                <div className="w-full max-w-[420px]">
                    <p className="text-text font-semibold text-[24px] leading-[35px] text-center">
                        Change Security PIN
                    </p>
                    <p className="text-grey  text-[14px] text-center mb-[20px]">
                        Update your 4-digit transaction code to keep your account secure.
                    </p>
                    <Formik
                        initialValues={{
                            old: "",
                            pin: "",
                            confirmPin: "",
                        }}
                        // validationSchema={CreatePinSchema}
                        onSubmit={async (values, { setSubmitting, setStatus }) => {
                            // try {
                            //     const res: any = await dispatch(
                            //         updateUserPin({
                            //             id: user?.id || userFromStorage?.id || "",
                            //             pin: values.pin,
                            //             name: user?.name || userFromStorage?.name || "",
                            //         })
                            //     );

                            //     if (res.meta?.requestStatus == "fulfilled") {
                            //         router.push("/user/success");
                            //     } else {
                            //         setStatus(res.payload.message || "Failed to save PIN");
                            //     }




                            // } catch (error: any) {
                            //     setStatus(error.message || "Something went wrong");
                            // } finally {
                            //     setSubmitting(false);
                            // }
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
                                    name="oldpin"
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

                                {/* {error && (
                                    <p className="text-red-500 text-xs w-full text-left">
                                        {error}
                                    </p>
                                )} */}
                                {/* <Button
                                    type="submit"
                                    fullWidth={true}
                                    disabled={isSubmitting || loading}
                                >
                                    {isSubmitting || loading ? "Updating..." : "Update PIN"}
                                </Button> */}
                            </Form>
                        )}
                    </Formik>
                </div>
            </div>
        </>
    )
}

export default page