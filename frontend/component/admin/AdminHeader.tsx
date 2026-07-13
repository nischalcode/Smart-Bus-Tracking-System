"use client";

import { Menu } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Breadcrumb from "@/component/ui/Breadcrumb";
import ThemeToggle from "@/component/ui/ThemeToggle";

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-900 sm:px-6">
      <button
        onClick={onMenuClick}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <Breadcrumb />

      <div className="ml-auto flex items-center gap-3">
        <ThemeToggle />
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {user?.name?.charAt(0).toUpperCase() || "A"}
        </div>
      </div>
    </header>
  );
}
