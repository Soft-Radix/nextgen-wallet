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
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
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
        country="us"
        value={value}
        placeholder={placeholder}
        onChange={(val) => handleChange(val)}
        enableClickOutside={true}
        inputClass={[
          "w-full h-[52px] rounded-[10px] border bg-background px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2",
          error
            ? "border-error focus:ring-error/50"
            : "border-[#D8EBD7] focus:ring-[#D8EBD7] focus:border-[#D8EBD7]",
        ]
          .filter(Boolean)
          .join(" ")}
        isValid={(inputNumber) => {
          const input = String(inputNumber ?? "").replace(/\D/g, "");
          const valid = input.length >= 10;
          setError(valid || !input ? null : "Invalid phone number");
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

