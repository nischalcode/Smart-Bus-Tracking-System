"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import PublicActions from "./HeaderActions/PublicActions";

const Header = () => {
  const { t } = useLanguage();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/", label: t("nav.home") },
    { href: "/track-bus", label: t("nav.track_bus") },
    { href: "/journey-planner", label: t("nav.journey_planner") },
    { href: "/routes", label: t("nav.routes") },
    { href: "/schedule", label: t("nav.schedule") },
    { href: "/notifications", label: t("nav.notifications") },
    { href: "/about", label: t("nav.about") },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-[999] flex flex-col border-b border-border bg-background transition-colors">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="min-w-0 flex items-center gap-2 sm:gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary sm:h-10 sm:w-10">
            <Image
              src="/Logo.png"
              alt="Smart Bus Logo"
              width={24}
              height={24}
              className="h-5 w-5 sm:h-6 sm:w-6"
              priority
            />
          </div>
          <div className="hidden flex-col min-[380px]:flex">
            <h1 className="text-lg font-bold leading-tight text-foreground sm:text-xl">
              <span className="text-primary">Smart </span>
              <span className="text-primary">Bus</span>
            </h1>
            <p className="text-[10px] text-muted-foreground sm:text-xs">
              Tracking System
            </p>
          </div>
        </Link>
     
        <nav className="hidden items-center gap-6 xl:gap-8 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`pb-1 font-medium transition-colors ${
                isActive(item.href)
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <PublicActions />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:hidden"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav className="flex flex-col gap-2 border-t border-border bg-background px-4 py-4 lg:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`py-1 font-medium transition-colors ${
                isActive(item.href)
                  ? "font-semibold text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-2 grid grid-cols-2 gap-3 border-t border-border pt-4 sm:hidden">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-11 items-center justify-center rounded-lg border border-border text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              {t("nav.login")}
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-11 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t("nav.signup")}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
};

export default Header;
