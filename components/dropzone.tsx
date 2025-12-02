'use client'

import { cn } from '@/lib/utils'
import { type UseSupabaseUploadReturn } from '@/hooks/use-supabase-upload'
import { Button } from '@/components/ui/button'
import { CheckCircle, File, Loader2, Upload, X } from 'lucide-react'
import { createContext, type PropsWithChildren, useCallback, useContext } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

export const formatBytes = (
  bytes: number,
  decimals = 2,
  size?: 'bytes' | 'KB' | 'MB' | 'GB' | 'TB' | 'PB' | 'EB' | 'ZB' | 'YB'
) => {
  const k = 1000
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  if (bytes === 0 || bytes === undefined) return size !== undefined ? `0 ${size}` : '0 bytes'
  const i = size !== undefined ? sizes.indexOf(size) : Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

type DropzoneContextType = Omit<UseSupabaseUploadReturn, 'getRootProps' | 'getInputProps'>

const DropzoneContext = createContext<DropzoneContextType | undefined>(undefined)

type DropzoneProps = UseSupabaseUploadReturn & {
  className?: string
}

const Dropzone = ({
  className,
  children,
  getRootProps,
  getInputProps,
  ...restProps
}: PropsWithChildren<DropzoneProps>) => {
  const isSuccess = restProps.isSuccess
  const isActive = restProps.isDragActive
  const isInvalid =
    (restProps.isDragActive && restProps.isDragReject) ||
    (restProps.errors.length > 0 && !restProps.isSuccess) ||
    restProps.files.some((file) => file.errors.length !== 0)

  return (
    <DropzoneContext.Provider value={{ ...restProps }}>
      <motion.div
        {...getRootProps({
          className: cn(
            'border-2 border-gray-300 rounded-xl p-6 text-center bg-card transition-colors duration-300 text-foreground relative overflow-hidden',
            className,
            isSuccess ? 'border-solid border-emerald-500/50' : 'border-dashed',
            isActive && 'border-amber-500 bg-amber-500/5',
            isInvalid && 'border-destructive bg-destructive/5',
            restProps.files.length === 0 && 'cursor-pointer' // Only show pointer cursor when no files
          ),
        })}
        initial={false}
        animate={{
          scale: isActive ? 1.01 : 1,
          borderWidth: isActive ? '3px' : '2px',
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        {/* Animated background gradient on drag */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-orange-500/10 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          )}
        </AnimatePresence>
        
        <input {...getInputProps()} />
        {children}
      </motion.div>
    </DropzoneContext.Provider>
  )
}

const DropzoneContent = ({ className }: { className?: string }) => {
  const {
    files,
    setFiles,
    loading,
    successes,
    errors,
    maxFileSize,
    maxFiles,
    isSuccess,
    inputRef,
  } = useDropzoneContext()

  const exceedMaxFiles = files.length > maxFiles

  const handleRemoveFile = useCallback(
    (fileName: string) => {
      setFiles(files.filter((file) => file.name !== fileName))
    },
    [files, setFiles]
  )

  if (isSuccess) {
    return (
      <motion.div
        className={cn('flex flex-row items-center gap-x-3 justify-center py-4', className)}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
        >
          <CheckCircle size={24} className="text-emerald-500" />
        </motion.div>
        <motion.p
          className="text-emerald-600 dark:text-emerald-400 font-medium"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          Successfully uploaded {files.length} file{files.length > 1 ? 's' : ''}
        </motion.p>
      </motion.div>
    )
  }

  return (
    <div className={cn('flex flex-col', className)}>
      <AnimatePresence mode="popLayout">
        {files.map((file, idx) => {
          const fileError = errors.find((e) => e.name === file.name)
          const isSuccessfullyUploaded = !!successes.find((e) => e === file.name)

          return (
            <motion.div
              key={`${file.name}-${file.size}-${file.lastModified}`}
              layout
              initial={{ opacity: 0, x: -30, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, x: 30, height: 0 }}
              transition={{
                type: 'spring',
                stiffness: 500,
                damping: 35,
                opacity: { duration: 0.2 },
              }}
              className="flex items-center gap-x-4 border-b border-border/50 py-3 first:mt-4 last:mb-4"
            >
              {/* File thumbnail */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="relative"
              >
                {file.type.startsWith('image/') ? (
                  <div className="h-12 w-12 rounded-lg border overflow-hidden shrink-0 bg-muted flex items-center justify-center relative">
                    <Image
                      src={file.preview || ''}
                      alt={file.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="h-12 w-12 rounded-lg border bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 flex items-center justify-center">
                    <File size={20} className="text-amber-600 dark:text-amber-400" />
                  </div>
                )}
                
                {/* Upload progress indicator */}
                {loading && !isSuccessfullyUploaded && (
                  <motion.div
                    className="absolute -bottom-1 -right-1 bg-white dark:bg-zinc-900 rounded-full p-0.5"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    <Loader2 size={14} className="text-amber-500 animate-spin" />
                  </motion.div>
                )}
                
                {/* Success indicator */}
                {isSuccessfullyUploaded && (
                  <motion.div
                    className="absolute -bottom-1 -right-1 bg-white dark:bg-zinc-900 rounded-full p-0.5"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  >
                    <CheckCircle size={14} className="text-emerald-500" />
                  </motion.div>
                )}
              </motion.div>

              {/* File info */}
              <div className="shrink grow flex flex-col items-start truncate">
                <p title={file.name} className="text-sm font-medium truncate max-w-full">
                  {file.name}
                </p>
                <AnimatePresence mode="wait">
                  {file.errors.length > 0 ? (
                    <motion.p
                      key="error"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="text-xs text-destructive"
                    >
                      {file.errors
                        .map((e) =>
                          e.message.startsWith('File is larger than')
                            ? `File is larger than ${formatBytes(maxFileSize, 2)} (Size: ${formatBytes(file.size, 2)})`
                            : e.message
                        )
                        .join(', ')}
                    </motion.p>
                  ) : loading && !isSuccessfullyUploaded ? (
                    <motion.p
                      key="uploading"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="text-xs text-amber-600 dark:text-amber-400"
                    >
                      Uploading file...
                    </motion.p>
                  ) : !!fileError ? (
                    <motion.p
                      key="upload-error"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="text-xs text-destructive"
                    >
                      Failed to upload: {fileError.message}
                    </motion.p>
                  ) : isSuccessfullyUploaded ? (
                    <motion.p
                      key="success"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="text-xs text-emerald-600 dark:text-emerald-400"
                    >
                      Successfully uploaded
                    </motion.p>
                  ) : (
                    <motion.p
                      key="size"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="text-xs text-muted-foreground"
                    >
                      {formatBytes(file.size, 2)}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Remove button */}
              <AnimatePresence>
                {!loading && !isSuccessfullyUploaded && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Button
                      size="icon"
                      variant="ghost"
                      className="shrink-0 h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveFile(file.name)
                      }}
                    >
                      <X size={16} />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </AnimatePresence>
      
      {/* Error message for exceeding max files */}
      <AnimatePresence>
        {exceedMaxFiles && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-sm text-left mt-2 text-destructive"
          >
            You may upload only up to {maxFiles} files, please remove {files.length - maxFiles} file
            {files.length - maxFiles > 1 ? 's' : ''}.
          </motion.p>
        )}
      </AnimatePresence>
      
      {/* Add files button */}
      <AnimatePresence>
        {files.length > 0 && !exceedMaxFiles && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-3"
          >
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                // Trigger file input to add more files
                inputRef.current?.click()
              }}
              disabled={files.some((file) => file.errors.length !== 0) || loading}
              className="relative overflow-hidden"
            >
              <Upload className="mr-2 h-4 w-4" />
              Add files
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const DropzoneEmptyState = ({ className }: { className?: string }) => {
  const { maxFiles, maxFileSize, isSuccess, files } = useDropzoneContext()

  if (isSuccess || files.length > 0) {
    return null
  }

  return (
    <motion.div
      className={cn('flex flex-col items-center gap-y-3 py-4', className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <motion.div
        className="p-4 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        <Upload size={28} className="text-amber-600 dark:text-amber-400" />
      </motion.div>
      
      <div className="space-y-1 text-center">
        <p className="text-sm font-medium">
          Upload{!!maxFiles && maxFiles > 1 ? ` up to ${maxFiles}` : ''} file
          {!maxFiles || maxFiles > 1 ? 's' : ''}
        </p>
        <p className="text-xs text-muted-foreground">
          Drag and drop files here or click anywhere to browse
        </p>
        {maxFileSize !== Number.POSITIVE_INFINITY && (
          <p className="text-xs text-muted-foreground">
            Max size: {formatBytes(maxFileSize, 0)}
          </p>
        )}
      </div>
    </motion.div>
  )
}

const useDropzoneContext = () => {
  const context = useContext(DropzoneContext)

  if (!context) {
    throw new Error('useDropzoneContext must be used within a Dropzone')
  }

  return context
}

export { Dropzone, DropzoneContent, DropzoneEmptyState, useDropzoneContext }
