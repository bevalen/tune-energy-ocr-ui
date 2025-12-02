import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { Footer } from "@/components/footer";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";
import { Zap } from "lucide-react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Authentication is handled by proxy.ts middleware

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-400/10 rounded-full blur-3xl" />
      </div>

      <nav className="w-full flex justify-center border-b border-amber-200/50 dark:border-zinc-800 h-16 relative z-10 backdrop-blur-sm bg-white/50 dark:bg-zinc-950/50">
        <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
          <Link href="/" className="flex items-center gap-2 font-semibold text-amber-700 dark:text-amber-500">
            <Zap className="h-5 w-5" />
            <span>Tune Energy</span>
          </Link>
          {!hasEnvVars ? (
            <EnvVarWarning />
          ) : (
            <Suspense>
              <AuthButton />
            </Suspense>
          )}
        </div>
      </nav>

      <div className="flex-1 w-full relative z-10">
        <Suspense fallback={null}>
          {children}
        </Suspense>
      </div>

      <Suspense fallback={<footer className="w-full flex items-center justify-center border-t border-amber-200/50 dark:border-zinc-800 text-center text-xs gap-8 py-6 relative z-10 backdrop-blur-sm bg-white/50 dark:bg-zinc-950/50"><ThemeSwitcher /></footer>}>
        <Footer />
      </Suspense>
    </main>
  );
}

