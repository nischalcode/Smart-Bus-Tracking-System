"use client";

import Providers from "@/context/Providers";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Providers>
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-4 lg:p-8">
        {children}
      </div>
    </Providers>
  );
}
