'use client'

import { useEffect, useState } from 'react'

interface ToastWithProgressProps {
  duration: number
  children: React.ReactNode
}

export function ToastWithProgress({ duration, children }: ToastWithProgressProps) {
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(remaining)
      
      if (remaining <= 0) {
        clearInterval(interval)
      }
    }, 16) // ~60fps

    return () => clearInterval(interval)
  }, [duration])

  return (
    <div className="w-full">
      <div className="mb-2.5">{children}</div>
      <div className="h-1 w-full bg-muted/50 dark:bg-muted/30 rounded-full overflow-hidden">
        <div
          className="h-full bg-current opacity-60 transition-all ease-linear"
          style={{
            width: `${progress}%`,
            transitionDuration: '16ms',
          }}
        />
      </div>
    </div>
  )
}

