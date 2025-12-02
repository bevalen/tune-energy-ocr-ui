'use client'

import { BillUploadForm } from '@/components/bill-upload-form'
import { Zap } from 'lucide-react'
import { motion } from 'framer-motion'

export function ProtectedPageWrapper() {
  return (
    <div className="flex-1 w-full flex flex-col gap-8 max-w-2xl mx-auto py-8 px-4">
      {/* Animated Header */}
      <motion.div
        className="text-center space-y-3"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
      >
        <motion.div
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-xl shadow-amber-500/30 mb-2"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20,
            delay: 0.1,
          }}
          whileHover={{
            scale: 1.05,
            rotate: [0, -5, 5, 0],
            transition: { duration: 0.3 },
          }}
        >
          <motion.div
            animate={{
              filter: ['drop-shadow(0 0 0px rgba(251,191,36,0))', 'drop-shadow(0 0 8px rgba(251,191,36,0.5))', 'drop-shadow(0 0 0px rgba(251,191,36,0))'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Zap className="h-7 w-7 text-white" />
          </motion.div>
        </motion.div>
        
        <motion.h1
          className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-900 dark:from-zinc-100 dark:via-zinc-300 dark:to-zinc-100 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Tune Energy
        </motion.h1>
        
        <motion.p
          className="text-lg text-amber-600 dark:text-amber-400 font-medium"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Bill Analysis System
        </motion.p>
        
        <motion.p
          className="text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Upload and analyze utility bills with AI-powered processing
        </motion.p>
      </motion.div>

      {/* Form with stagger animation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <BillUploadForm />
      </motion.div>
    </div>
  )
}

