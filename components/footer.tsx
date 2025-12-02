'use client';

import { ThemeSwitcher } from "@/components/theme-switcher";

export function Footer() {
  return (
    <footer className="w-full flex items-center justify-center border-t border-amber-200/50 dark:border-zinc-800 text-center text-xs gap-8 py-6 relative z-10 backdrop-blur-sm bg-white/50 dark:bg-zinc-950/50">
      <p className="text-zinc-500">© {new Date().getFullYear()} Tune Energy</p>
      <ThemeSwitcher />
    </footer>
  );
}

