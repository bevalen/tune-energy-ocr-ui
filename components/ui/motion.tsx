'use client'

import * as React from 'react'
import {
  AnimatePresence,
  motion,
  useInView,
  type HTMLMotionProps,
  type UseInViewOptions,
  type Transition,
  type Variant,
} from 'framer-motion'

// Stagger children animation wrapper
export const StaggerContainer = ({
  children,
  className,
  staggerDelay = 0.1,
  ...props
}: {
  children: React.ReactNode
  className?: string
  staggerDelay?: number
} & HTMLMotionProps<'div'>) => (
  <motion.div
    className={className}
    initial="hidden"
    animate="visible"
    variants={{
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: staggerDelay,
        },
      },
    }}
    {...props}
  >
    {children}
  </motion.div>
)

// Fade up animation for children
export const FadeUp = ({
  children,
  className,
  delay = 0,
  duration = 0.5,
  ...props
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  duration?: number
} & HTMLMotionProps<'div'>) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{
      type: 'spring',
      stiffness: 300,
      damping: 30,
      delay,
      duration,
    }}
    {...props}
  >
    {children}
  </motion.div>
)

// Stagger item for use inside StaggerContainer
export const StaggerItem = ({
  children,
  className,
  ...props
}: {
  children: React.ReactNode
  className?: string
} & HTMLMotionProps<'div'>) => (
  <motion.div
    className={className}
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          type: 'spring',
          stiffness: 300,
          damping: 30,
        },
      },
    }}
    {...props}
  >
    {children}
  </motion.div>
)

// Scale animation on hover/tap
export const ScaleOnHover = ({
  children,
  className,
  scale = 1.02,
  ...props
}: {
  children: React.ReactNode
  className?: string
  scale?: number
} & HTMLMotionProps<'div'>) => (
  <motion.div
    className={className}
    whileHover={{ scale }}
    whileTap={{ scale: 0.98 }}
    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    {...props}
  >
    {children}
  </motion.div>
)

// List item animation with layout
export const AnimatedListItem = ({
  children,
  className,
  layoutId,
  ...props
}: {
  children: React.ReactNode
  className?: string
  layoutId?: string
} & HTMLMotionProps<'div'>) => (
  <motion.div
    className={className}
    layout
    layoutId={layoutId}
    initial={{ opacity: 0, scale: 0.95, x: -20 }}
    animate={{ opacity: 1, scale: 1, x: 0 }}
    exit={{ opacity: 0, scale: 0.95, x: 20 }}
    transition={{
      type: 'spring',
      stiffness: 500,
      damping: 35,
      opacity: { duration: 0.2 },
    }}
    {...props}
  >
    {children}
  </motion.div>
)

// Pulse animation for icons/indicators
export const PulseAnimation = ({
  children,
  className,
  ...props
}: {
  children: React.ReactNode
  className?: string
} & HTMLMotionProps<'div'>) => (
  <motion.div
    className={className}
    animate={{
      scale: [1, 1.1, 1],
      opacity: [1, 0.8, 1],
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
    {...props}
  >
    {children}
  </motion.div>
)

// In-view animation wrapper
type MotionEffectProps = HTMLMotionProps<'div'> & {
  children: React.ReactNode
  className?: string
  transition?: Transition
  delay?: number
  inView?: boolean
  inViewMargin?: UseInViewOptions['margin']
  inViewOnce?: boolean
  blur?: string | boolean
  slide?: {
    direction?: 'up' | 'down' | 'left' | 'right'
    offset?: number
  } | boolean
  fade?: { initialOpacity?: number; opacity?: number } | boolean
  zoom?: {
    initialScale?: number
    scale?: number
  } | boolean
}

export function MotionEffect({
  children,
  className,
  transition = { type: 'spring', stiffness: 200, damping: 20 },
  delay = 0,
  inView = false,
  inViewMargin = '0px',
  inViewOnce = true,
  blur = false,
  slide = false,
  fade = false,
  zoom = false,
  ...props
}: MotionEffectProps) {
  const localRef = React.useRef<HTMLDivElement>(null)

  const inViewResult = useInView(localRef, {
    once: inViewOnce,
    margin: inViewMargin,
  })
  const isInView = !inView || inViewResult

  const hiddenVariant: Variant = {}
  const visibleVariant: Variant = {}

  if (slide) {
    const offset = typeof slide === 'boolean' ? 100 : (slide.offset ?? 100)
    const direction = typeof slide === 'boolean' ? 'up' : (slide.direction ?? 'up')
    const axis = direction === 'up' || direction === 'down' ? 'y' : 'x'
    hiddenVariant[axis] = direction === 'left' || direction === 'up' ? offset : -offset
    visibleVariant[axis] = 0
  }

  if (fade) {
    hiddenVariant.opacity = typeof fade === 'boolean' ? 0 : (fade.initialOpacity ?? 0)
    visibleVariant.opacity = typeof fade === 'boolean' ? 1 : (fade.opacity ?? 1)
  }

  if (zoom) {
    hiddenVariant.scale = typeof zoom === 'boolean' ? 0.95 : (zoom.initialScale ?? 0.95)
    visibleVariant.scale = typeof zoom === 'boolean' ? 1 : (zoom.scale ?? 1)
  }

  if (blur) {
    hiddenVariant.filter = typeof blur === 'boolean' ? 'blur(10px)' : `blur(${blur})`
    visibleVariant.filter = 'blur(0px)'
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        ref={localRef}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        exit="hidden"
        variants={{
          hidden: hiddenVariant,
          visible: visibleVariant,
        }}
        transition={{
          ...transition,
          delay: (transition?.delay ?? 0) + delay,
        }}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// Success checkmark animation
export const SuccessCheckmark = ({ className }: { className?: string }) => (
  <motion.div
    className={className}
    initial={{ scale: 0, rotate: -180 }}
    animate={{ scale: 1, rotate: 0 }}
    transition={{
      type: 'spring',
      stiffness: 260,
      damping: 20,
    }}
  >
    <motion.svg
      className="w-6 h-6 text-emerald-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={3}
    >
      <motion.path
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        d="M5 13l4 4L19 7"
      />
    </motion.svg>
  </motion.div>
)

// Progress bar animation
export const AnimatedProgress = ({
  progress,
  className,
}: {
  progress: number
  className?: string
}) => (
  <div className={`h-1 w-full bg-muted rounded-full overflow-hidden ${className}`}>
    <motion.div
      className="h-full bg-amber-500 rounded-full"
      initial={{ width: 0 }}
      animate={{ width: `${progress}%` }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
    />
  </div>
)

// Export AnimatePresence for use elsewhere
export { AnimatePresence, motion }

