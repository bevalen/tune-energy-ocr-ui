"use client"

import {
  CheckCircle2,
  Info,
  Loader2Icon,
  XCircle,
  AlertTriangle,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

// Duration constants
const DEFAULT_DURATION = 7000  // 7 seconds
const MIN_DURATION = 5000     // 5 seconds
const MAX_DURATION = 10000    // 10 seconds

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="bottom-right"
      className="toaster group"
      toastOptions={{
        duration: DEFAULT_DURATION,
        classNames: {
          toast: "group toast group-[.toaster]:bg-white/90 group-[.toaster]:dark:bg-slate-900/90 group-[.toaster]:backdrop-blur group-[.toaster]:border group-[.toaster]:shadow-2xl group-[.toaster]:shadow-black/10 group-[.toaster]:rounded-2xl",
          title: "group-[.toast]:font-semibold",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-sm",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toaster]:border-emerald-500/20 group-[.toaster]:text-emerald-600 dark:group-[.toaster]:text-emerald-400 [&>svg]:text-emerald-500",
          error: "group-[.toaster]:border-rose-500/20 group-[.toaster]:text-rose-600 dark:group-[.toaster]:text-rose-400 [&>svg]:text-rose-500",
          warning: "group-[.toaster]:border-amber-500/25 group-[.toaster]:text-amber-600 dark:group-[.toaster]:text-amber-400 [&>svg]:text-amber-500",
          info: "group-[.toaster]:border-sky-500/20 group-[.toaster]:text-sky-600 dark:group-[.toaster]:text-sky-400 [&>svg]:text-sky-500",
        },
      }}
      icons={{
        success: <CheckCircle2 className="size-4" />,
        info: <Info className="size-4" />,
        warning: <AlertTriangle className="size-4" />,
        error: <XCircle className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "1rem",
        } as React.CSSProperties
      }
      gap={12}
      {...props}
    />
  )
}

export { Toaster, DEFAULT_DURATION, MIN_DURATION, MAX_DURATION }
