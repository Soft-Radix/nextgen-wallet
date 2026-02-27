import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  /** Optional icon rendered at the start (left) of the input. */
  startIcon?: ReactNode;
  /** Optional icon rendered at the end (right) of the input. */
  endIcon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, id, className = "", startIcon, endIcon, ...props },
  ref
) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-semibold text-text "
        >
          {label}
        </label>
      )}
      <div className="relative">
        {startIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[var(--button-primary-from)]">
            {startIcon}
          </span>
        )}
        {endIcon && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[var(--button-primary-from)]">
            {endIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            "w-full rounded-lg h-[52px] border shadow-[0_2px_6px_rgba(0,166,62,0.1)] bg-background text-foreground placeholder:text-muted text-[14px]",
            startIcon && !endIcon && "pl-10 pr-3 py-2",
            endIcon && !startIcon && "pl-3 pr-10 py-2",
            startIcon && endIcon && "pl-10 pr-10 py-2",
            !startIcon && !endIcon && "px-3 py-2",
            "focus:outline-none focus:ring-2 focus:ring-[#D8EBD7] focus:border-[#D8EBD7]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error
              ? "border-error focus:ring-error/50 focus:border-error"
              : "border-[#D8EBD7]",
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
          {...props}
        />
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
});

export default Input;
