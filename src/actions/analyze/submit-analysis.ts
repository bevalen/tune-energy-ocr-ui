"use server"

import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

// Zod schema for input validation
const AnalysisRequestSchema = z.object({
  email: z.string().email("Valid email address is required").max(255),
  files: z.array(z.string()).min(1, "At least one file is required"),
})

export type AnalysisRequest = z.infer<typeof AnalysisRequestSchema>

export type AnalysisResult = {
  success: boolean
  message?: string
  error?: string
}

export async function submitAnalysis(
  data: AnalysisRequest
): Promise<AnalysisResult> {
  try {
    // Validate input
    const validatedData = AnalysisRequestSchema.safeParse(data)
    
    if (!validatedData.success) {
      return {
        success: false,
        error: validatedData.error.issues[0]?.message || "Invalid input",
      }
    }

    const { email, files } = validatedData.data

    // Verify authentication
    const supabase = await createClient()
    const { data: userData, error: authError } = await supabase.auth.getUser()

    if (authError || !userData?.user) {
      return {
        success: false,
        error: "Unauthorized - Please sign in",
      }
    }

    const user = userData.user

    // TODO: Implement actual analysis logic here
    // This could include:
    // 1. Fetching files from Supabase storage
    // 2. Processing with OCR/AI
    // 3. Sending results via email
    // 4. Storing analysis results in database

    console.log("Analysis request received:", {
      email,
      files,
      userId: user.id,
      userEmail: user.email,
    })

    // For now, return success
    return {
      success: true,
      message: "Analysis request submitted successfully",
    }
  } catch (error) {
    console.error("Analysis error:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

