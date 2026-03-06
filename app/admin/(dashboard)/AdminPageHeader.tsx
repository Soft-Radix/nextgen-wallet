"use client";

import { useUser } from "../hooks/useUser";

type AdminPageHeaderProps = {
  title: string;
};

function getInitials(displayName: string | undefined, email: string | undefined): string {
  if (displayName && displayName.trim()) {
    const parts = displayName.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const second = parts[1]?.[0] ?? "";
    if (first || second) return (first + second).toUpperCase().slice(0, 2);
  }
  if (email && email.trim()) {
    const local = email.split("@")[0]?.trim() ?? "";
    if (local.length >= 2) return local.slice(0, 2).toUpperCase();
    if (local.length === 1) return local.toUpperCase();
  }
  return "A";
}

export default function AdminPageHeader({ title }: AdminPageHeaderProps) {
  const { user } = useUser();
  const displayName = user?.user?.user_metadata?.display_name || "Admin";
  const email = user?.user?.email;
  const avatarUrl =
    user?.user?.user_metadata?.avatar_url ||
    user?.user?.user_metadata?.picture ||
    (user?.user as { avatar_url?: string } | undefined)?.avatar_url;
  const initials = getInitials(
    user?.user?.user_metadata?.display_name,
    user?.user?.email
  );

  return (
    <div className="flex flex-row items-center justify-end md:justify-between gap-3 mb-6 sm:mb-8">
      <h1 className="hidden md:block text-xl sm:text-2xl font-bold text-[#030200] truncate min-w-0">{title}</h1>
      <div className="flex items-center gap-3 shrink-0 ml-auto">
        <div
          className="w-10 h-10 rounded-full overflow-hidden shrink-0 flex items-center justify-center font-semibold text-sm"
          style={
            avatarUrl
              ? { backgroundColor: "#E2F1E2", color: "#008236" }
              : { backgroundColor: "#d8ebd7", color: "#13861f"}
          }
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <div className="text-right min-w-0 max-w-[140px] sm:max-w-[200px]">
          <p className="text-[#030200] font-semibold text-sm truncate">{displayName}</p>
          <p className="text-[#6F7B8F] text-xs truncate">{email}</p>
        </div>
      </div>
    </div>
  );
}

