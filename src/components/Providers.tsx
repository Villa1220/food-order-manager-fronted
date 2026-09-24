"use client";

import { Toaster } from "sonner";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      {children}
      <Toaster
        position="top-center"
        closeButton
        duration={4500}
        offset={16}
        toastOptions={{
          classNames: {
            toast:
              "!rounded-2xl !border !border-[#f7c29c] !bg-[#faf6ef] !text-[#2b1003] !shadow-xl",
            title: "!font-semibold",
            description: "!text-[#7c2d06]",
            success: "!border-l-4 !border-l-[#d14a04]",
            closeButton: "!bg-white !border-[#f7c29c]",
          },
        }}
      />
    </LanguageProvider>
  );
}
