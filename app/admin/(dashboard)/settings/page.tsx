"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdminPageHeader from "../AdminPageHeader";
import { useUser } from "../../hooks/useUser";
import { supabase } from "@/lib/supabase/client";
import PhoneNumberInput from "@/components/ui/Phone";

export default function AdminSettingsPage() {
  const router = useRouter();
  const { user, setUserSession } = useUser();

  const [pushNotifications, setPushNotifications] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState<string>(user?.user?.user_metadata?.display_name || "Admin");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [country, setCountry] = useState<string>("us");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.user) {
      setDisplayName(user?.user?.user_metadata?.display_name);
      setPhoneNumber(`${user?.user?.user_metadata?.phone}`);
    }
  }, [user]);

  return (
    <div className="px-4 py-4 sm:px-8">
      <AdminPageHeader title="Settings" />

      {/* Page title for card */}
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-[#030200]">Admin Settings</h2>
        <p className="text-sm text-[#6F7B8F]">
          Manage system configuration, security, and preferences.
        </p>
      </div>

      {/* Main card */}
      <div className="max-w-4xl">
        <div className="bg-white rounded-2xl border border-[#E2F1E2] shadow-[0_23px_50px_rgba(25,33,61,0.03)] p-8">
          {/* Profile section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-3 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden shrink-0">
                <img src="/user.png" alt="Alex Thompson" className="w-full h-full object-cover" />
              </div>
              <div>
                {isEditingProfile ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-[#6F7B8F] mb-1">
                        Display name
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-sm text-[#030200] focus:outline-none focus:ring-2 focus:ring-[#4ADE80]"
                      />
                    </div>
                    <div>
                      <PhoneNumberInput
                        label="Phone"
                        placeholder="Enter phone number"
                        value={phoneNumber}
                        onChange={setPhoneNumber}
                        country={country}
                        setCountry={setCountry}
                        shadow={false}
                      />
                    </div>
                    {profileError && (
                      <p className="text-xs text-red-600">{profileError}</p>
                    )}
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={async () => {
                          if (!user?.user?.id) return;
                          if (!displayName.trim()) {
                            setProfileError("Name is required.");
                            return;
                          }
                          setProfileError(null);
                          try {
                            setIsSavingProfile(true);
                            const { error } = await supabase.auth.updateUser({
                              data: {
                                display_name: displayName.trim(),
                                phone: phoneNumber ? `+${phoneNumber.trim()}` : null,
                              },
                            });
                            if (error) {
                              setProfileError(error.message || "Failed to update profile.");
                              return;
                            }
                            // Refresh session and sync localStorage using getSession
                            const { data: sessionData } = await supabase.auth.getSession();
                            const session = sessionData?.session;
                            if (session?.access_token && session.user) {
                              localStorage.setItem(
                                "access_token",
                                JSON.stringify(session.access_token)
                              );
                              localStorage.setItem(
                                "user",
                                JSON.stringify(session.user)
                              );
                              setUserSession(session.access_token, session.user as any);
                            }
                            setIsEditingProfile(false);
                          } catch (err: any) {
                            setProfileError(
                              err?.message || "Something went wrong while saving."
                            );
                          } finally {
                            setIsSavingProfile(false);
                            window.location.reload();
                          }
                        }}
                        className="inline-flex items-center justify-center rounded-lg bg-linear-to-r from-[#169D25] to-[#00DE1C] px-4 py-1.5 text-xs font-semibold text-white shadow-[0_8px_18px_rgba(0,166,62,0.35)] disabled:opacity-70 disabled:cursor-not-allowed"
                        disabled={isSavingProfile}
                      >
                        {isSavingProfile ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingProfile(false);
                          setProfileError(null);
                          setDisplayName(user?.user?.name || "Admin");
                          setPhoneNumber("");
                        }}
                        className="inline-flex items-center justify-center rounded-lg border border-[#E2E8F0] px-4 py-1.5 text-xs font-medium text-[#0F172A] hover:bg-[#F8FAFC]"
                        disabled={isSavingProfile}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="text-base font-semibold text-[#030200]">
                      {displayName || user?.user?.name || "Admin"}
                    </h3>
                    <div className="mt-1 space-y-1 text-sm text-[#6F7B8F]">
                      <div className="flex items-center gap-2">
                        <svg width="20" height="18" viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 0H19C19.2652 0 19.5196 0.105357 19.7071 0.292893C19.8946 0.48043 20 0.734784 20 1V17C20 17.2652 19.8946 17.5196 19.7071 17.7071C19.5196 17.8946 19.2652 18 19 18H1C0.734784 18 0.48043 17.8946 0.292893 17.7071C0.105357 17.5196 0 17.2652 0 17V1C0 0.734784 0.105357 0.48043 0.292893 0.292893C0.48043 0.105357 0.734784 0 1 0ZM18 4.238L10.072 11.338L2 4.216V16H18V4.238ZM2.511 2L10.061 8.662L17.502 2H2.511Z" fill="#64748B" />
                        </svg>

                        <span>{user?.user?.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <g clipPath="url(#clip0_152_2433)">
                            <path d="M9.366 10.682C10.3043 12.3305 11.6695 13.6957 13.318 14.634L14.202 13.396C14.3442 13.1969 14.5543 13.0569 14.7928 13.0023C15.0313 12.9478 15.2814 12.9825 15.496 13.1C16.9103 13.8729 18.4722 14.3378 20.079 14.464C20.3298 14.4839 20.5638 14.5975 20.7345 14.7823C20.9052 14.9671 21 15.2094 21 15.461V19.923C21.0001 20.1706 20.9083 20.4094 20.7424 20.5932C20.5765 20.777 20.3483 20.8927 20.102 20.918C19.572 20.973 19.038 21 18.5 21C9.94 21 3 14.06 3 5.5C3 4.962 3.027 4.428 3.082 3.898C3.10725 3.6517 3.22298 3.42352 3.40679 3.25763C3.5906 3.09175 3.82941 2.99995 4.077 3H8.539C8.79056 2.99997 9.0329 3.09475 9.21768 3.26545C9.40247 3.43615 9.51613 3.67022 9.536 3.921C9.66222 5.52779 10.1271 7.08968 10.9 8.504C11.0175 8.71856 11.0522 8.96874 10.9977 9.2072C10.9431 9.44565 10.8031 9.65584 10.604 9.798L9.366 10.682ZM6.844 10.025L8.744 8.668C8.20478 7.50409 7.83535 6.26884 7.647 5H5.01C5.004 5.166 5.001 5.333 5.001 5.5C5 12.956 11.044 19 18.5 19C18.667 19 18.834 18.997 19 18.99V16.353C17.7312 16.1646 16.4959 15.7952 15.332 15.256L13.975 17.156C13.4287 16.9437 12.898 16.6931 12.387 16.406L12.329 16.373C10.3676 15.2567 8.74328 13.6324 7.627 11.671L7.594 11.613C7.30691 11.102 7.05628 10.5713 6.844 10.025Z" fill="#64748B" />
                          </g>
                          <defs>
                            <clipPath id="clip0_152_2433">
                              <rect width="24" height="24" fill="white" />
                            </clipPath>
                          </defs>
                        </svg>

                        <span>{phoneNumber || "+1 XXX-XXX-XXXX"}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsEditingProfile(true);
                setDisplayName(user?.user?.name || displayName || "Admin");
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-[#169D25] to-[#00DE1C] hover:bg-[#15803D] text-white text-sm font-semibold px-5 py-2.5 shadow-[0_10px_25px_rgba(22,163,74,0.35)]"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3.33301 10.6667L9.83301 4.16667L11.833 6.16667L5.33301 12.6667H3.33301V10.6667Z"
                  stroke="white"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Edit Profile
            </button>
          </div>

          {/* Account Security */}
          <section className="pt-4 pb-6 border-b border-[#E2E8F0]">
            <h3 className="text-sm font-semibold text-[#030200] mb-3">Account Security</h3>
            <button
              type="button"
              onClick={() => router.push("/admin/settings/change-password")}
              className="cursor-pointer w-full flex items-center justify-between rounded-xl border border-[#E2F1E2] bg-white px-4 py-4 text-left hover:bg-[#F9FFFB] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#ECFDF3] text-[#16A34A]">
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="40" height="40" rx="8" fill="#F0F7F0" />
                    <path d="M20 33C18.2017 33 16.5117 32.6587 14.93 31.9762C13.3483 31.2937 11.9725 30.3675 10.8025 29.1975C9.6325 28.0275 8.70625 26.6517 8.02375 25.07C7.34125 23.4883 7 21.7983 7 20H9.6C9.6 21.43 9.87083 22.7787 10.4125 24.0462C10.9542 25.3137 11.6962 26.4187 12.6388 27.3612C13.5812 28.3037 14.6862 29.0513 15.9537 29.6038C17.2212 30.1562 18.57 30.4325 20 30.4325C22.9033 30.4325 25.3625 29.425 27.3775 27.41C29.3925 25.395 30.4 22.9358 30.4 20.0325C30.4 17.1292 29.3925 14.67 27.3775 12.655C25.3625 10.64 22.9033 9.6325 20 9.6325C18.0717 9.6325 16.3221 10.1037 14.7512 11.0462C13.1804 11.9887 11.94 13.24 11.03 14.8H14.8V17.4H7V9.6H9.6V12.2C10.7917 10.6183 12.2867 9.35625 14.085 8.41375C15.8833 7.47125 17.855 7 20 7C21.7983 7 23.4883 7.34125 25.07 8.02375C26.6517 8.70625 28.0275 9.6325 29.1975 10.8025C30.3675 11.9725 31.2937 13.3483 31.9762 14.93C32.6587 16.5117 33 18.2017 33 20C33 21.7983 32.6587 23.4883 31.9762 25.07C31.2937 26.6517 30.3675 28.0275 29.1975 29.1975C28.0275 30.3675 26.6517 31.2937 25.07 31.9762C23.4883 32.6587 21.7983 33 20 33ZM17.4 25.2C17.0317 25.2 16.7229 25.0754 16.4737 24.8262C16.2246 24.5771 16.1 24.2683 16.1 23.9V20C16.1 19.6317 16.2246 19.3229 16.4737 19.0738C16.7229 18.8246 17.0317 18.7 17.4 18.7V17.4C17.4 16.685 17.6546 16.0729 18.1637 15.5638C18.6729 15.0546 19.285 14.8 20 14.8C20.715 14.8 21.3271 15.0546 21.8363 15.5638C22.3454 16.0729 22.6 16.685 22.6 17.4V18.7C22.9683 18.7 23.2771 18.8246 23.5262 19.0738C23.7754 19.3229 23.9 19.6317 23.9 20V23.9C23.9 24.2683 23.7754 24.5771 23.5262 24.8262C23.2771 25.0754 22.9683 25.2 22.6 25.2H17.4ZM18.7 18.7H21.3V17.4C21.3 17.0317 21.1754 16.7229 20.9262 16.4737C20.6771 16.2246 20.3683 16.1 20 16.1C19.6317 16.1 19.3229 16.2246 19.0738 16.4737C18.8246 16.7229 18.7 17.0317 18.7 17.4V18.7Z" fill="url(#paint0_linear_152_402)" />
                    <defs>
                      <linearGradient id="paint0_linear_152_402" x1="34.0327" y1="24.6604" x2="13.484" y2="24.7824" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#00DE1C" />
                        <stop offset="1" stopColor="#169D25" />
                      </linearGradient>
                    </defs>
                  </svg>


                </span>
                <div >
                  <p className="text-sm font-medium text-[#030200]">Change Password</p>
                </div>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"

              >
                <path
                  d="M6 3.33301L10 7.99967L6 12.6663"
                  stroke="#94A3B8"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </section>

          {/* Alerts & Notifications */}
          <section className="pt-6">
            <h3 className="text-sm font-semibold text-[#030200] mb-3">Alerts &amp; Notifications</h3>
            <div className="space-y-3">
              <SettingToggleRow
                title="Push Notifications"
                description="Get real-time updates on account activity on your desktop mobile browser."
                checked={pushNotifications}
                onChange={setPushNotifications}
                icon={
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="48" height="48" rx="8" fill="#F0F7F0" />
                    <path d="M20 33V31H22V29H16C15.45 29 14.9792 28.8042 14.5875 28.4125C14.1958 28.0208 14 27.55 14 27V17C14 16.45 14.1958 15.9792 14.5875 15.5875C14.9792 15.1958 15.45 15 16 15H32C32.55 15 33.0208 15.1958 33.4125 15.5875C33.8042 15.9792 34 16.45 34 17V27C34 27.55 33.8042 28.0208 33.4125 28.4125C33.0208 28.8042 32.55 29 32 29H26V31H28V33H20ZM16 27H32V17H16V27ZM16 27V17V27Z" fill="url(#paint0_linear_156_12678)" />
                    <defs>
                      <linearGradient id="paint0_linear_156_12678" x1="34.7944" y1="27.2264" x2="18.9879" y2="27.3307" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#00DE1C" />
                        <stop offset="1" stopColor="#169D25" />
                      </linearGradient>
                    </defs>
                  </svg>

                }
              />
              <SettingToggleRow
                title="SMS Alerts"
                description="Receive critical alerts and verification codes via text message directly to your phone."
                checked={smsAlerts}
                onChange={setSmsAlerts}
                icon={
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="48" height="48" rx="8" fill="#F0F7F0" />
                    <path d="M20 23C20.2833 23 20.5208 22.9042 20.7125 22.7125C20.9042 22.5208 21 22.2833 21 22C21 21.7167 20.9042 21.4792 20.7125 21.2875C20.5208 21.0958 20.2833 21 20 21C19.7167 21 19.4792 21.0958 19.2875 21.2875C19.0958 21.4792 19 21.7167 19 22C19 22.2833 19.0958 22.5208 19.2875 22.7125C19.4792 22.9042 19.7167 23 20 23ZM24 23C24.2833 23 24.5208 22.9042 24.7125 22.7125C24.9042 22.5208 25 22.2833 25 22C25 21.7167 24.9042 21.4792 24.7125 21.2875C24.5208 21.0958 24.2833 21 24 21C23.7167 21 23.4792 21.0958 23.2875 21.2875C23.0958 21.4792 23 21.7167 23 22C23 22.2833 23.0958 22.5208 23.2875 22.7125C23.4792 22.9042 23.7167 23 24 23ZM28 23C28.2833 23 28.5208 22.9042 28.7125 22.7125C28.9042 22.5208 29 22.2833 29 22C29 21.7167 28.9042 21.4792 28.7125 21.2875C28.5208 21.0958 28.2833 21 28 21C27.7167 21 27.4792 21.0958 27.2875 21.2875C27.0958 21.4792 27 21.7167 27 22C27 22.2833 27.0958 22.5208 27.2875 22.7125C27.4792 22.9042 27.7167 23 28 23ZM14 34V16C14 15.45 14.1958 14.9792 14.5875 14.5875C14.9792 14.1958 15.45 14 16 14H32C32.55 14 33.0208 14.1958 33.4125 14.5875C33.8042 14.9792 34 15.45 34 16V28C34 28.55 33.8042 29.0208 33.4125 29.4125C33.0208 29.8042 32.55 30 32 30H18L14 34ZM17.15 28H32V16H16V29.125L17.15 28ZM16 28V16V28Z" fill="url(#paint0_linear_156_12682)" />
                    <defs>
                      <linearGradient id="paint0_linear_156_12682" x1="34.7944" y1="27.5849" x2="18.9877" y2="27.6787" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#00DE1C" />
                        <stop offset="1" stopColor="#169D25" />
                      </linearGradient>
                    </defs>
                  </svg>

                }
              />
              <SettingToggleRow
                title="Email Notifications"
                description="Stay informed about weekly reports, security updates, and important account activity."
                checked={emailNotifications}
                onChange={setEmailNotifications}
                icon={
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="48" height="48" rx="8" fill="#F0F7F0" />
                    <path d="M16 32C15.45 32 14.9792 31.8042 14.5875 31.4125C14.1958 31.0208 14 30.55 14 30V18C14 17.45 14.1958 16.9792 14.5875 16.5875C14.9792 16.1958 15.45 16 16 16H32C32.55 16 33.0208 16.1958 33.4125 16.5875C33.8042 16.9792 34 17.45 34 18V30C34 30.55 33.8042 31.0208 33.4125 31.4125C33.0208 31.8042 32.55 32 32 32H16ZM24 25L16 20V30H32V20L24 25ZM24 23L32 18H16L24 23ZM16 20V18V20V30V20Z" fill="url(#paint0_linear_156_12686)" />
                    <defs>
                      <linearGradient id="paint0_linear_156_12686" x1="34.7944" y1="26.8679" x2="18.988" y2="26.9852" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#00DE1C" />
                        <stop offset="1" stopColor="#169D25" />
                      </linearGradient>
                    </defs>
                  </svg>

                }
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

type SettingToggleRowProps = {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  icon: React.ReactNode;
};

function SettingToggleRow({ title, description, checked, onChange, icon }: SettingToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-6 rounded-xl border border-[#E2F1E2] bg-[#F9FFFB] px-4 py-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#ECFDF3] text-[#16A34A]">
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#030200]">{title}</p>
          <p className="text-xs text-[#6F7B8F] mt-1">{description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-[#16A34A]" : "bg-[#CBD5E1]"
          }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-1"
            }`}
        />
      </button>
    </div>
  );
}
