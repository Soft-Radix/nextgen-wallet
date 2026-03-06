"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { Button, Input } from "@/components/ui";
import { EmailIconAdmin, PasswordLockIcon, EyeIcon } from "@/lib/svg";
import { supabase } from "@/lib/supabase/client";

const ADMIN_EMAIL = "admin@nextgenpay.com";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
  //  const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      console.log(data, "-------------------")
      if (data.session?.user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        router.push("/admin/dashboard");
      }
    });
  }, [router]);

  const validate = (): boolean => {
    let valid = true;
    if (!email.trim()) {
      setEmailError("Email is required");
      valid = false;
    } else if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email address");
      valid = false;
    } else {
      setEmailError("");
    }
    if (!password) {
      setPasswordError("Password is required");
      valid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      valid = false;
    } else {
      setPasswordError("");
    }
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    setEmailError("");
    setPasswordError("");

    try {
     // const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        toast.error("Invalid credentials");
        setPasswordError("Invalid credentials");
        setIsSubmitting(false);
        return;
      }

      if (!data.user || data.user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        await supabase.auth.signOut();
        toast.error("Invalid credentials");
        setPasswordError("Invalid credentials");
        setIsSubmitting(false);
        return;
      }

      toast.success("Signed in successfully!!!");
      // Let the browser client persist session to cookies before redirecting
      await new Promise((r) => setTimeout(r, 100));
      window.location.assign("/admin/dashboard");
    } catch {
      toast.error("Invalid credentials");
      setPasswordError("Invalid credentials");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="max-w-[460px] w-full">
        <form
          onSubmit={handleSubmit}
          className="bg-white pt-[45px] p-10 rounded-xl flex flex-col gap-[20px] items-stretch border-[0.5px] border-buttonOutlineBorder shadow-[0_23px_50px_rgba(25,33,61,0.02)]"
        >
          <div className="text-center flex flex-col gap-1">
            <p className="text-text font-semibold text-[22px] leading-[35px]">
              Log In
            </p>
            <p className="text-grey text-[14px]">
              Enter your email to get started.
            </p>
          </div>

          <Input
            label="Email address"
            type="email"
            placeholder="alex27thom@gmail.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError("");
            }}
            startIcon={<EmailIconAdmin />}
            error={emailError}
            onFocus={(e) =>
              e.target.setAttribute(
                "style",
                `
                border: 1px solid;
                border-radius: 8px;
                border-image: linear-gradient(269.66deg, #00DE1C -3.55%, #169D25 75.02%) 1;
                `
              )
            }
            onBlur={(e) =>
              e.target.setAttribute(
                "style",
                `
                border: 1px solid #d1d5db;
                border-radius: 8px;
                `
              )
            }
          />

          <div className="flex flex-col gap-2">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••••••••••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError("");
              }}
              startIcon={<PasswordLockIcon />}
              error={passwordError}
              endIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="flex items-center justify-center cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon off={showPassword} />
                </button>
              }
              onFocus={(e) =>
                e.target.setAttribute(
                  "style",
                  `
                  border: 1px solid;
                  border-image: linear-gradient(269.66deg, #00DE1C -3.55%, #169D25 75.02%) 1;
                  `
                )
              }
              onBlur={(e) =>
                e.target.setAttribute(
                  "style",
                  `
                  border: 1px solid #d1d5db;
                  `
                )
              }
            />
            <button
              type="button"
              className="me-auto text-[14px] text-[#37689D] cursor-pointer"
            >
              Forgot password?
            </button>
          </div>

          <Button type="submit" fullWidth={true} disabled={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Log In"}
          </Button>
        </form>
      </div>
    </>
  );
}
