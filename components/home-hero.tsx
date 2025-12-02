'use client'

import { motion } from 'framer-motion'
import { Zap, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function HomeHero() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-5 py-16">
      <div className="max-w-2xl text-center space-y-8">
        {/* Animated Icon */}
        <motion.div
          className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-2xl shadow-amber-500/30 relative"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 20,
          }}
          whileHover={{
            scale: 1.05,
            boxShadow: '0 25px 50px -12px rgba(251, 191, 36, 0.4)',
          }}
        >
          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 blur-xl opacity-50"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.3, 0.5],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            animate={{
              filter: [
                'drop-shadow(0 0 0px rgba(255,255,255,0))',
                'drop-shadow(0 0 15px rgba(255,255,255,0.8))',
                'drop-shadow(0 0 0px rgba(255,255,255,0))',
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Zap className="h-12 w-12 text-white relative z-10" />
          </motion.div>
        </motion.div>

        {/* Title with gradient */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 30 }}
        >
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              Tune Energy
            </span>
          </h1>
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, type: 'spring', stiffness: 300, damping: 30 }}
        >
          <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Automated billing upload and analysis. Contact your administrator to get access.
          </p>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 300, damping: 30 }}
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-300 text-lg px-8 py-6 rounded-xl group"
            >
              <Link href="/auth/login" className="flex items-center gap-2">
                Sign In
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </motion.span>
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

