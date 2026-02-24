"use client";

import { Button, Input } from "@/components/ui";
import { CreatePin } from "@/lib/svg";
import { Formik, Form } from "formik";
import * as Yup from "yup";

const CreatePinSchema = Yup.object({
    pin: Yup.string()
        .required("PIN is required")
        .matches(/^\d{4}$/, "PIN must be 4 digits"),
    confirmPin: Yup.string()
        .required("Confirm PIN is required")
        .oneOf([Yup.ref("pin")], "PINs must match"),
});

export default function PinPage() {
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
                        initialValues={{ pin: "", confirmPin: "" }}
                        validationSchema={CreatePinSchema}
                        onSubmit={(values) => {
                            // TODO: hook this up to your API or navigation
                            console.log("Create PIN form submitted", values);
                        }}
                    >
                        {({ values, errors, touched, handleChange, handleBlur, isSubmitting }) => (
                            <Form className="w-full flex flex-col gap-4">
                                <Input
                                    name="pin"
                                    type="text"
                                    label="Create Pin"
                                    placeholder="Enter 4 digit pin"
                                    startIcon={<CreatePin />}
                                    maxLength={4}
                                    value={values.pin}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={touched.pin ? errors.pin : undefined}
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
                                    error={touched.confirmPin ? errors.confirmPin : undefined}
                                />

                                <Button type="submit" fullWidth={true} disabled={isSubmitting}>
                                    Create Wallet
                                </Button>
                            </Form>
                        )}
                    </Formik>

                    <button
                        type="button"
                        className="text-[#00A63E]  text-[16px]"
                    >
                        Skip for Now
                    </button>
                </div>
            </div>
        </>
    );
}

