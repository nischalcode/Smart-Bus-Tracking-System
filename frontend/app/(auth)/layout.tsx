"use client";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen max-w-full items-center justify-center overflow-x-hidden bg-[#F8FAFC] p-3 dark:bg-gray-900 sm:p-4 lg:p-8 transition-colors">
      {children}
    </div>
  );
}
