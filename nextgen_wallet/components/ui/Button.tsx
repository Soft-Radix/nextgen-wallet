import { forwardRef, type ButtonHTMLAttributes } from "react";

const variantStyles = {
  primary:
    "bg-gradient-to-r from-[var(--button-primary-from)] to-[var(--button-primary-to)] text-white shadow-[0_2px_3px_rgba(0,166,62,0.3)] hover:from-[var(--button-primary-from-hover)] hover:to-[var(--button-primary-to-hover)] focus-visible:ring-[var(--button-primary-from)]/50",
  secondary:
    "bg-muted text-foreground hover:bg-muted/80 focus-visible:ring-muted",
  outline:
    "border-[0.5px] shadow-[0_23px_50px_rgba(25, 33, 61, 0.02)] border-[var(--button-outline-border)] text-[var(--button-outline-text)] bg-transparent hover:bg-[var(--button-outline-border)]/20 focus-visible:ring-[var(--button-outline-border)]",
  ghost: "bg-transparent hover:bg-border/30 focus-visible:ring-border",
  danger:
    "bg-error text-white hover:bg-error/90 focus-visible:ring-error/50",
} as const;

const sizeStyles = {
  sm: "px-3 py-1.5 text-sm rounded-md",
  md: "px-4 py-2 text-sm rounded-lg",
  lg: "px-6 py-3 text-base rounded-lg",
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
  fullWidth?: boolean;
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    fullWidth,
    isLoading,
    disabled,
    className = "",
    children,
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={props.type ?? "button"}
      disabled={disabled ?? isLoading}
      className={[
        "inline-flex items-center text-[16px] font-semibold h-[52px] rounded-[10px] justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && "w-full",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
});

export default Button;
