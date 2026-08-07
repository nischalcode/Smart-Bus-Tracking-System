"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Mail } from "lucide-react";
import AuthLeftPanel from "@/component/auth/AuthLeftPanel";

export default function OTPPage() {
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [countdown, setCountdown] = useState(45);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    // Auto-focus next
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = pasted.split("").concat(Array(6 - pasted.length).fill(""));
    setOtp(newOtp);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== 6) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setVerified(true);
    setLoading(false);
  };

  const handleResend = async () => {
    setResending(true);
    await new Promise((r) => setTimeout(r, 1000));
    setCountdown(45);
    setResending(false);
    setOtp(["", "", "", "", "", ""]);
  };

  const allFilled = otp.every((d) => d !== "");

  return (
    <div className="flex w-full max-w-[1280px] gap-6 lg:gap-10">
      {/* Left Panel */}
      <div className="hidden w-[45%] lg:block">
        <AuthLeftPanel
          heading={
            <>
              Almost There!
              <br />
              <span className="text-primary">Let&apos;s verify it&apos;s you</span>
            </>
          }
          description="We've sent a 6-digit verification code to example@gmail.com"
          features={[
            { icon: <ShieldCheck size={18} />, title: "Secure", description: "Encrypted verification" },
            { icon: <Mail size={18} />, title: "Email Sent", description: "Check your inbox" },
            { icon: <ShieldCheck size={18} />, title: "Quick", description: "Takes less than a minute" },
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
            {!verified ? (
              <>
                {/* Email Icon */}
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15">
                  <Mail className="h-8 w-8 text-primary" />
                </div>

                <div className="mb-8">
                  <h2 className="text-2xl font-extrabold text-foreground">Enter OTP</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Enter the 6-digit code we sent to your email or phone number.
                  </p>
                </div>

                {/* OTP Input */}
                <div className="mb-6 flex justify-center gap-3">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { inputRefs.current[idx] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      onPaste={handlePaste}
                      className="h-14 w-12 rounded-xl border-2 border-border bg-background text-center text-xl font-bold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:h-16 sm:w-14"
                    />
                  ))}
                </div>

                {/* Resend */}
                <div className="mb-6 text-center">
                  {countdown > 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Didn&apos;t receive the code?{" "}
                      <span className="font-semibold text-primary">
                        Resend OTP ({String(Math.floor(countdown / 60)).padStart(2, "0")}:{String(countdown % 60).padStart(2, "0")})
                      </span>
                    </p>
                  ) : (
                    <button
                      onClick={handleResend}
                      disabled={resending}
                      className="text-sm font-semibold text-primary transition hover:underline"
                    >
                      {resending ? "Sending..." : "Resend OTP"}
                    </button>
                  )}
                </div>

                {/* Verify */}
                <button
                  onClick={handleVerify}
                  disabled={!allFilled || loading}
                  className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>

                {/* Divider */}
                <div className="my-7 flex items-center gap-4">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">OR</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <Link
                  href="/forgot-password"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
                >
                  <ArrowLeft size={16} />
                  Back to Reset Password
                </Link>

                {/* Security */}
                <div className="mt-7 flex items-start gap-2.5 rounded-xl border border-border bg-muted p-4">
                  <ShieldCheck size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    For your security, this code will expire in 10 minutes.
                  </p>
                </div>
              </>
            ) : (
              /* Success State */
              <>
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15">
                  <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>

                <div className="mb-8">
                  <h2 className="text-2xl font-extrabold text-foreground">Verified!</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Your identity has been verified. You can now reset your password.
                  </p>
                </div>

                <Link
                  href="/login"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-sm transition hover:opacity-90"
                >
                  Continue to Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
