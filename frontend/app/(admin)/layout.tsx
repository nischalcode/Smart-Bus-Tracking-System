"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Providers from "@/context/Providers";
import AdminSidebar from "@/component/admin/AdminSidebar";
import AdminHeader from "@/component/admin/AdminHeader";
import LoadingSpinner from "@/component/ui/LoadingSpinner";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (!token || !user) {
      router.replace("/login");
      return;
    }
    try {
      const parsed = JSON.parse(user);
      if (parsed.role !== "admin") {
        router.replace("/login");
        return;
      }
    } catch {
      router.replace("/login");
      return;
    }
    setChecking(false);
  }, [router]);

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <Providers>
      <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
        <AdminSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex flex-1 flex-col overflow-hidden">
          <AdminHeader onMenuClick={() => setSidebarOpen(true)} />

          <main className="flex-1 overflow-y-auto bg-gray-50 p-4 dark:bg-gray-900 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </Providers>
  );
}
