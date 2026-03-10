"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminPageHeader from "../../AdminPageHeader";
import { supabase } from "@/lib/supabase/client";
import toast from "react-hot-toast";

export default function AdminChangePasswordPage() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputType = showPassword ? "text" : "password";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!currentPassword.trim()) {
      setError("Current password is required.");
      return;
    }
    if (!newPassword.trim()) {
      setError("New password is required.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    if (currentPassword === newPassword) {
      setError("New password must be different from current password.");
      return;
    }

    try {
      setIsSubmitting(true);

      const { data: sessionData } = await supabase.auth.getSession();
      const email = sessionData?.session?.user?.email;
      if (!email) {
        setError("You are not signed in. Please sign in again.");
        return;
      }

      // Verify current password by re-signing in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (signInError) {
        setError("Current password is incorrect.");
        return;
      }

      // Update password for the logged-in user (that email)
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) {
        setError(updateError.message || "Failed to update password.");
        return;
      }

      toast.success("Password updated successfully.");
      router.push("/admin/settings");
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="px-4 py-4 pb-12 sm:px-8 sm:py-8">
      <AdminPageHeader title="Settings" />

      {/* Main card */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-[#030200] mb-1 text-center">Change Password</h2>
            <p className="text-sm text-[#6F7B8F] text-center">
              Update your password to keep your account secure.
            </p>
          </div>

          <form
            className="space-y-4 w-full max-w-md mx-auto shadow-sm mb-10 px-6 py-6 rounded-2xl sm:px-10"
            onSubmit={handleSubmit}
          >
            <PasswordField
              label="Current Password"
              placeholder="Enter current password"
              type={inputType}
              value={currentPassword}
              onChange={setCurrentPassword}
            />
            <PasswordField
              label="New Password"
              placeholder="Enter new password"
              type={inputType}
              value={newPassword}
              onChange={setNewPassword}
            />
            <PasswordField
              label="Confirm New Password"
              placeholder="Confirm new password"
              type={inputType}
              value={confirmPassword}
              onChange={setConfirmPassword}
            />

            <label className="flex items-center gap-2 text-sm text-[#6F7B8F] mt-2 cursor-pointer select-none">
              <span className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center  border-2 border-[#6F7B8F] bg-white">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="sr-only"
                />
                {showPassword && (
                  <svg
                    className="w-2.5 h-2.5 text-[#6F7B8F] pointer-events-none"
                    viewBox="0 0 12 10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M1 5.5L4.5 9L11 1" />
                  </svg>
                )}
              </span>
              <span>Show password</span>
            </label>

            {error && (
              <p className="text-sm text-red-600 mt-2" role="alert">
                {error}
              </p>
            )}

            <div className="mt-6 sm:flex-row gap-3 sm:items-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className="cursor-pointer inline-flex w-full justify-center items-center rounded-lg bg-linear-to-r from-[#169D25] to-[#00DE1C] hover:bg-[#15803D] text-white text-sm font-semibold px-6 py-2.5 shadow-[0_10px_25px_rgba(22,163,74,0.35)] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Updating…" : "Update Password"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/admin/settings")}
                className="cursor-pointer text-sm w-full mt-4 font-medium text-[#16A34A] hover:text-[#15803D]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

type PasswordFieldProps = {
  label: string;
  placeholder: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
};

function PasswordField({ label, placeholder, type, value, onChange }: PasswordFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-[#030200]">{label}</label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <svg width="17" height="20" viewBox="0 0 17 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.75 6.41667V5.5C2.75 4.04131 3.32946 2.64236 4.36091 1.61091C5.39236 0.579463 6.79131 0 8.25 0C9.70869 0 11.1076 0.579463 12.1391 1.61091C13.1705 2.64236 13.75 4.04131 13.75 5.5V6.41667H15.5833C15.8264 6.41667 16.0596 6.51324 16.2315 6.68515C16.4034 6.85706 16.5 7.09022 16.5 7.33333V18.3333C16.5 18.5764 16.4034 18.8096 16.2315 18.9815C16.0596 19.1534 15.8264 19.25 15.5833 19.25H0.916667C0.673552 19.25 0.440394 19.1534 0.268485 18.9815C0.0965771 18.8096 0 18.5764 0 18.3333V7.33333C0 7.09022 0.0965771 6.85706 0.268485 6.68515C0.440394 6.51324 0.673552 6.41667 0.916667 6.41667H2.75ZM14.6667 8.25H1.83333V17.4167H14.6667V8.25ZM7.33333 13.5043C6.98382 13.3025 6.71066 12.9911 6.55622 12.6182C6.40178 12.2453 6.37468 11.8319 6.47914 11.4421C6.58359 11.0523 6.81376 10.7078 7.13394 10.4621C7.45412 10.2165 7.84642 10.0833 8.25 10.0833C8.65358 10.0833 9.04588 10.2165 9.36606 10.4621C9.68624 10.7078 9.91641 11.0523 10.0209 11.4421C10.1253 11.8319 10.0982 12.2453 9.94378 12.6182C9.78934 12.9911 9.51618 13.3025 9.16667 13.5043V15.5833H7.33333V13.5043ZM4.58333 6.41667H11.9167V5.5C11.9167 4.52754 11.5304 3.59491 10.8427 2.90728C10.1551 2.21964 9.22246 1.83333 8.25 1.83333C7.27754 1.83333 6.34491 2.21964 5.65728 2.90728C4.96964 3.59491 4.58333 4.52754 4.58333 5.5V6.41667Z" fill="url(#paint0_linear_553_164)" />
            <defs>
              <linearGradient id="paint0_linear_553_164" x1="17.1554" y1="13.0755" x2="4.11475" y2="13.1418" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00DE1C" />
                <stop offset="1" stopColor="#169D25" />
              </linearGradient>
            </defs>
          </svg>

        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-[#E2E8F0] bg-white pl-9 pr-3 py-4 text-sm text-[#030200] placeholder:text-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#16A34A]"
        />
      </div>
    </div>
  );
}

