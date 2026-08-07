"use client";

import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { LanguageProvider } from "@/context/LanguageContext";

function ThemedToaster() {
  const { isDark } = useTheme();
  return <Toaster position="top-right" richColors theme={isDark ? "dark" : "light"} />;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <ThemedToaster />
          {children}
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}

