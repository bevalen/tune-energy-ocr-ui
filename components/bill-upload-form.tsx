'use client'

import { useState, useCallback } from 'react'
import { useSupabaseUpload } from '@/hooks/use-supabase-upload'
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/dropzone'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Trash2, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ToastWithProgress } from '@/components/toast-with-progress'
import { submitAnalysis, AnalysisRequest } from '@/src/actions/analyze/submit-analysis'

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 30,
    },
  },
}

const buttonVariants = {
  idle: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 },
}

export function BillUploadForm() {
  const [email, setEmail] = useState('')
  const [customer, setCustomer] = useState('')
  const [locationId, setLocationId] = useState('')
  const [address, setAddress] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const uploadProps = useSupabaseUpload({
    bucketName: 'bills',
    allowedMimeTypes: ['application/pdf', 'image/*'],
    maxFiles: 15,
    maxFileSize: 50 * 1000 * 1000, // 50MB
    upsert: false, // Don't overwrite - auto-rename on collision
  })

  const { files, setFiles, onUpload, loading, setErrors, clearSuccesses } = uploadProps

  const handleClear = useCallback(() => {
    setEmail('')
    setCustomer('')
    setLocationId('')
    setAddress('')
    setFiles([])
    setErrors([])
    clearSuccesses()
  }, [setFiles, setErrors, clearSuccesses])

  const handleAnalyze = async () => {
    // Validate form
    if (!email.trim()) {
      toast.error('Please enter an email address', {
        description: (
          <ToastWithProgress duration={5000}>
            Email is required.
          </ToastWithProgress>
        ),
        duration: 5000,
      })
      return
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      toast.error('Please enter a valid email address', {
        description: (
          <ToastWithProgress duration={5000}>
            The email format is invalid.
          </ToastWithProgress>
        ),
        duration: 5000,
      })
      return
    }
    
    if (!customer.trim()) {
      toast.error('Please enter a customer name', {
        description: (
          <ToastWithProgress duration={5000}>
            Customer Name is required.
          </ToastWithProgress>
        ),
        duration: 5000,
      })
      return
    }
    
    if (!locationId.trim()) {
      toast.error('Please enter a location ID', {
        description: (
          <ToastWithProgress duration={5000}>
            Store # or Location ID is required.
          </ToastWithProgress>
        ),
        duration: 5000,
      })
      return
    }
    
    if (files.length === 0) {
      toast.error('Please add at least one file', {
        description: (
          <ToastWithProgress duration={5000}>
            You need to add bill documents to upload.
          </ToastWithProgress>
        ),
        duration: 5000,
      })
      return
    }

    // Check for file errors
    if (files.some(file => file.errors.length > 0)) {
      toast.error('Please fix file errors before submitting', {
        description: (
          <ToastWithProgress duration={5000}>
            Remove or replace files with errors.
          </ToastWithProgress>
        ),
        duration: 5000,
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Upload files to Supabase storage
      const uploadResult = await onUpload()

      if (!uploadResult || uploadResult.successes.length === 0) {
        toast.error('Upload failed', {
          description: (
            <ToastWithProgress duration={8000}>
              No files were successfully uploaded. Please try again.
            </ToastWithProgress>
          ),
          duration: 8000,
        })
        setIsSubmitting(false)
        return
      }

      if (uploadResult.errors.length > 0) {
        const errorMessages = uploadResult.errors.map(e => e.message).join(', ')
        toast.warning('Partial upload', {
          description: (
            <ToastWithProgress duration={8000}>
              {uploadResult.errors.length} file(s) failed: {errorMessages}. {uploadResult.successes.length} file(s) uploaded successfully.
            </ToastWithProgress>
          ),
          duration: 8000,
        })
      } else {
        const analysisData: AnalysisRequest = {
          email: email,
          customer: customer,
          locationId: locationId,
          address: address || undefined
        } 
        await submitAnalysis(analysisData);
        toast.success('Files uploaded successfully! Your email will be sent shortly.', {
          description: (
            <ToastWithProgress duration={5000}>
              {uploadResult.successes.length} file(s) uploaded.
            </ToastWithProgress>
          ),
          duration: 5000,
        })
        
        // Scroll to top after successful upload
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }

      // Reset form after successful upload
      handleClear()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred'
      toast.error('Upload failed', {
        description: (
          <ToastWithProgress duration={8000}>
            {message}
          </ToastWithProgress>
        ),
        duration: 8000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isLoading = loading || isSubmitting

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.15,
            delayChildren: 0.1,
          },
        },
      }}
    >
      {/* Email Information Card */}
      <motion.div variants={cardVariants}>
        <Card className="overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 border-b border-border/50">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Email Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {/* Email Address */}
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address <span className="text-amber-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@tuneenergy.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="transition-all duration-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </motion.div>

            {/* Customer */}
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Label htmlFor="customer" className="text-sm font-medium">
                Customer <span className="text-amber-500">*</span>
              </Label>
              <Input
                id="customer"
                type="text"
                placeholder="Enter customer name"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                disabled={isLoading}
                className="transition-all duration-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </motion.div>

            {/* Location ID */}
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Label htmlFor="locationId" className="text-sm font-medium">
                Location <span className="text-amber-500">*</span>
              </Label>
              <Input
                id="locationId"
                type="text"
                placeholder="Store # or Location ID"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                disabled={isLoading}
                className="transition-all duration-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </motion.div>

            {/* Address */}
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Label htmlFor="address" className="text-sm font-medium">
                Address
              </Label>
              <Input
                id="address"
                type="text"
                placeholder="Physical address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={isLoading}
                className="transition-all duration-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Upload Bills Card */}
      <motion.div variants={cardVariants}>
        <Card className="overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 border-b border-border/50">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              Upload Bills
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Dropzone {...uploadProps}>
              <DropzoneEmptyState />
              <DropzoneContent />
            </Dropzone>
          </CardContent>
        </Card>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        variants={cardVariants}
        className="flex items-center justify-between gap-4"
      >
        <motion.div
          variants={buttonVariants}
          initial="idle"
          whileHover="hover"
          whileTap="tap"
        >
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={isLoading}
            className="text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-colors"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear All
          </Button>
        </motion.div>

        <motion.div
          variants={buttonVariants}
          initial="idle"
          whileHover={!isLoading && files.length > 0 ? 'hover' : 'idle'}
          whileTap={!isLoading && files.length > 0 ? 'tap' : 'idle'}
        >
          <Button
            onClick={handleAnalyze}
            disabled={isLoading || files.length === 0}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-300 relative overflow-hidden"
          >
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.span
                  key="loading"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center"
                >
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </motion.span>
              ) : (
                <motion.span
                  key="analyze"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analyze
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
