"use client";

type LoaderProps = {
  /** Size: "sm" (20px), "md" (32px), "lg" (40px). Default "md". */
  size?: "sm" | "md" | "lg";
  /** Optional className for the wrapper. */
  className?: string;
};

const sizeClasses = {
  sm: "w-5 h-5 border-2",
  md: "w-8 h-8 border-2",
  lg: "w-10 h-10 border-[3px]",
} as const;

/**
 * Standard admin loader (spinner). Uses theme green.
 * Use for table loading rows, page loading, cards, etc.
 */
export function Loader({ size = "md", className = "" }: LoaderProps) {
  return (
    <div
      className={`inline-block rounded-full border-[#E2F1E2] border-t-[#169D25] animate-spin ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

/**
 * Centered loader block (e.g. full section or page loading).
 */
export function LoaderBlock({ size = "lg", className = "" }: LoaderProps) {
  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <Loader size={size} />
    </div>
  );
}
