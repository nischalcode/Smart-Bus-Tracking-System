"use client";

import Link from "next/link";
import ThemeToggle from "@/component/ui/ThemeToggle";
import LanguageSwitcher from "@/component/ui/LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";

const PublicActions = () => {
  const { t } = useLanguage();

  return (
    <div className="flex items-center gap-1.5 sm:gap-4">
      <LanguageSwitcher />

      <ThemeToggle />

      <Link
        href="/login"
        className="hidden min-h-10 rounded-lg border border-border px-5 py-2 text-sm font-medium transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:inline-flex"
      >
        {t("nav.login")}
      </Link>

      <Link
        href="/register"
        className="hidden min-h-10 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:inline-flex"
      >
        {t("nav.signup")}
      </Link>
    </div>
  );
};

export default PublicActions;
