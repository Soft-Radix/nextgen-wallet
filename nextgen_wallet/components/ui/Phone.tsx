/** Phone input using react-phone-input-2 with NexGen styling. */
"use client";

import { useState } from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

const PhoneNumberInput = ({
  value,
  onChange,
  label,
  placeholder,
  country,
  setCountry,
  onDialCodeChange,
  shadow = true,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
  country: string;
  setCountry: (country: string) => void;
  onDialCodeChange?: (code: string) => void;
  shadow?: boolean;
}) => {
  const [error, setError] = useState<string | null>(null);

  const handleChange = (val: string) => {
    onChange(val);
  };

  return (
    <div className="w-full">
      <label className="mb-1.5 block text-sm font-semibold text-text">
        {label}
      </label>

      <PhoneInput
        country={country}
        value={value}
        placeholder={placeholder}
        onChange={(val, data: any) => {
          setCountry(data?.countryCode || country);
          if (onDialCodeChange && data?.dialCode) {
            onDialCodeChange(`+${data.dialCode}`);
          }
          handleChange(val);
        }}
        enableClickOutside={true}
        containerClass={shadow ? "applied-shadow" : ""}
        inputClass={[
          "w-full h-[52px] rounded-[10px] border bg-background px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2",
          error
            ? "border-error focus:ring-error/50"
            : shadow ? "border-[#D8EBD7] focus:ring-[#D8EBD7] focus:border-[#D8EBD7]" : "border-[#e2e8f0] focus:ring-[#e2e8f0] focus:border-[#e2e8f0]",
        ]
          .filter(Boolean)
          .join(" ")}
        isValid={(inputNumber, country: any) => {
          const digits = String(inputNumber ?? "").replace(/\D/g, "");

          const dialCode = country?.dialCode ? String(country.dialCode) : "";
          const nationalDigits = dialCode
            ? digits.slice(dialCode.length)
            : digits;

          // If user hasn't typed any national digits yet, don't show an error
          if (!nationalDigits.length) {
            setError(null);
            return true;
          }

          const valid = nationalDigits.length >= 10;
          setError(valid ? null : "Invalid phone number");
          return valid;
        }}
      />

      {error && (
        <p className="mt-1.5 text-sm text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default PhoneNumberInput;

