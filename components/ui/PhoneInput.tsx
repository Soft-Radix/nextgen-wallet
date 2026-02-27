/** Client-side phone input with simple country selector. */
"use client";

import {
  forwardRef,
  useState,
  type InputHTMLAttributes,
  type ChangeEvent,
} from "react";
import { countries } from "country-data-list";


function getFlagEmoji(countryCode: string) {
  return countryCode
    .toUpperCase()
    .replace(/./g, char =>
      String.fromCodePoint(127397 + char.charCodeAt(0))
    );
}

const COUNTRIES = countries.all.map((c) => ({
  code: c.alpha2,
  dialCode: c.countryCallingCodes[0] || "",
  name: c.name,
  flag: getFlagEmoji(c.alpha2),
})).filter(c => c.dialCode);

type Country = (typeof COUNTRIES)[number];

export interface PhoneInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  /** Initial country code, e.g. "US". Defaults to "US". */
  defaultCountry?: Country["code"];
  /** Called when the user selects a different country. */
  onCountryChange?: (country: Country) => void;
}

const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  function PhoneInput(
    {
      label,
      error,
      hint,
      id,
      className = "",
      defaultCountry = "US",
      onCountryChange,
      onChange,
      ...inputProps
    },
    ref
  ) {
    const [isOpen, setIsOpen] = useState(false);
    const [country, setCountry] = useState<Country>(
      () => COUNTRIES.find((c) => c.code === defaultCountry) ?? COUNTRIES[0]
    );

    const inputId =
      id ?? label?.toLowerCase().replace(/\s+/g, "-") ?? undefined;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="  text-sm font-semibold text-text "
          >
            {label}
          </label>
        )}

        <div
          className={[
            "relative flex items-center h-[52px] mt-2 w-full  rounded-[10px] border bg-background px-3 py-2",
            "border-[#D8EBD7]",
            "focus-within:outline-none focus-within:ring-2 focus-within:ring-[#D8EBD7] focus-within:border-[#D8EBD7]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error
              ? "border-error focus-within:ring-error/50 focus-within:border-error"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <button
            type="button"
            className="flex items-center h-full gap-1 pr-2 mr-2 border-r border-[#D8EBD7] text-sm text-foreground"
            aria-label="Select country code"
            onClick={() => setIsOpen((open) => !open)}
          >
            <span className="text-lg leading-none">{country.flag}</span>

            <svg
              aria-hidden="true"
              className={`h-3 w-3 text-foreground transition-transform ${isOpen ? "rotate-180" : ""
                }`}
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 6L8 10L12 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <input
            ref={ref}
            id={inputId}
            type="tel"
            className={[
              "border-0 bg-transparent px-0 text-foreground placeholder:text-muted text-sm",
              "focus:outline-none focus:ring-0 focus:border-0 w-full",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
            aria-invalid={error ? true : undefined}
            aria-describedby={
              [error && `${inputId}-error`, hint && `${inputId}-hint`]
                .filter(Boolean)
                .join(" ") || undefined
            }
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              if (/^\d*$/.test(e.target.value)) {
                onChange?.(e);
              }
            }}
            {...inputProps}
          />

          {isOpen && (
            <div className="absolute inset-x-0 top-full z-10 mt-2 rounded-[10px] border border-[#D8EBD7] bg-white shadow-[0_10px_30px_rgba(25,33,61,0.08)] max-w-[260px] ">
              <ul className="max-h-48 overflow-auto text-sm">
                {COUNTRIES.map((c) => (
                  <li key={c.code}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-[#F5FFF5]"
                      onClick={() => {
                        setCountry(c);
                        setIsOpen(false);
                        onCountryChange?.(c);
                      }}
                    >
                      <span className="text-lg leading-none">{c.flag}</span>
                      <span className="truncate">{c.name}</span>
                      <span className="ml-auto text-xs text-muted">
                        {c.dialCode}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1.5 text-sm text-error"
            role="alert"
          >
            {error}
          </p>
        )}

        {hint && !error && (
          <p id={`${inputId}-hint`} className="mt-1.5 text-sm text-muted">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

export default PhoneInput;

