'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'

const shimmer = {
  hidden: { opacity: 0.5 },
  visible: {
    opacity: 1,
    transition: {
      repeat: Infinity,
      repeatType: 'reverse' as const,
      duration: 1,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      type: 'spring' as const,
      stiffness: 300,
      damping: 30,
    },
  }),
}

export function BillUploadSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <motion.div
        className="text-center space-y-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div variants={shimmer} initial="hidden" animate="visible">
          <Skeleton className="h-12 w-12 rounded-xl mx-auto" />
        </motion.div>
        <Skeleton className="h-8 w-64 mx-auto" />
        <Skeleton className="h-4 w-48 mx-auto" />
      </motion.div>

      {/* Email Information Card Skeleton */}
      <motion.div
        custom={0}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        <Card className="overflow-hidden border-border/50">
          <CardHeader className="bg-gradient-to-r from-amber-50/30 to-orange-50/30 dark:from-amber-950/10 dark:to-orange-950/10 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Skeleton className="h-2 w-2 rounded-full" />
              <Skeleton className="h-5 w-32" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <motion.div variants={shimmer} initial="hidden" animate="visible">
                <Skeleton className="h-10 w-full rounded-md" />
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Upload Bills Card Skeleton */}
      <motion.div
        custom={1}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        <Card className="overflow-hidden border-border/50">
          <CardHeader className="bg-gradient-to-r from-amber-50/30 to-orange-50/30 dark:from-amber-950/10 dark:to-orange-950/10 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Skeleton className="h-2 w-2 rounded-full" />
              <Skeleton className="h-5 w-28" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <motion.div
              className="border-2 border-dashed border-border/50 rounded-xl p-8 flex flex-col items-center gap-4"
              variants={shimmer}
              initial="hidden"
              animate="visible"
            >
              <Skeleton className="h-16 w-16 rounded-2xl" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Action Buttons Skeleton */}
      <motion.div
        custom={2}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="flex items-center justify-between gap-4"
      >
        <Skeleton className="h-10 w-28 rounded-md" />
        <Skeleton className="h-10 w-32 rounded-md" />
      </motion.div>
    </div>
  )
}

