"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, ArrowLeft, Shield, Zap, Bell } from "lucide-react";
import AuthLeftPanel from "@/component/auth/AuthLeftPanel";

const forgotSchema = z.object({
  email: z.string().min(1, "Email or phone is required"),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotForm) => {
    setLoading(true);
    setEmail(data.email);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1500));
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="flex w-full max-w-[1280px] gap-6 lg:gap-10">
      {/* Left Panel */}
      <div className="hidden w-[45%] lg:block">
        <AuthLeftPanel
          heading={
            <>
              No worries,
              <br />
              we&apos;ll help you
              <br />
              <span className="text-primary">get back on track</span>
            </>
          }
          description="Enter your registered email or phone number and we'll send you instructions to reset your password."
          features={[
            { icon: <Shield size={18} />, title: "Secure", description: "Your data is always protected" },
            { icon: <Zap size={18} />, title: "Quick Recovery", description: "Reset your password in minutes" },
            { icon: <Bell size={18} />, title: "Stay Updated", description: "Get back to tracking instantly" },
          ]}
        />
      </div>

      {/* Right Panel */}
      <div className="flex w-full items-center justify-center lg:w-[55%]">
        <div className="w-full max-w-[520px]">
          {/* Mobile Logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-xl">
              🚌
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">SmartBus</h1>
              <p className="text-xs text-muted-foreground">Tracking System</p>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-8 shadow-xl transition-colors sm:p-10">
            {!sent ? (
              <>
                {/* Lock Icon */}
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15">
                  <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>

                <div className="mb-8">
                  <h2 className="text-2xl font-extrabold text-foreground">Forgot Password?</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    No problem! Enter your registered email or phone number and we&apos;ll send a reset link.
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-foreground">
                      Email or Phone Number
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Enter your email or phone"
                        {...register("email")}
                        className="w-full rounded-xl border border-border bg-background py-3.5 pl-11 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1.5 text-xs text-danger">{errors.email.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50"
                  >
                    {loading ? "Sending..." : "Send Reset Link"}
                  </button>
                </form>

                {/* Divider */}
                <div className="my-7 flex items-center gap-4">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">OR</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <Link
                  href="/login"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
                >
                  <ArrowLeft size={16} />
                  Back to Login
                </Link>

                {/* Security note */}
                <div className="mt-7 flex items-start gap-2.5 rounded-xl border border-border bg-muted p-4">
                  <Shield size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    We&apos;ll never share your information with anyone. Your data is safe with us.
                  </p>
                </div>
              </>
            ) : (
              /* Success State */
              <>
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15">
                  <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>

                <div className="mb-8">
                  <h2 className="text-2xl font-extrabold text-foreground">Check Your Email</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    We&apos;ve sent a password reset link to{" "}
                    <span className="font-semibold text-foreground">{email}</span>. Please check your inbox and follow the instructions.
                  </p>
                </div>

                <Link
                  href="/login"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-sm transition hover:opacity-90"
                >
                  <ArrowLeft size={16} />
                  Back to Sign In
                </Link>

                <p className="mt-5 text-center text-xs text-muted-foreground">
                  Didn&apos;t receive the email? Check your spam folder or{" "}
                  <button onClick={() => setSent(false)} className="font-semibold text-primary hover:underline">
                    try again
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
