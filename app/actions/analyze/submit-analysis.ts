"use server"

import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

// Zod schema for input validation
const AnalysisRequestSchema = z.object({
  email: z.string().email("Valid email address is required").max(255),
  customer: z.string().min(1, "Customer name is required"),
  locationId: z.string().min(1, "Location ID is required"),
  address: z.string().optional(), // Optional field
})

export type AnalysisRequest = z.infer<typeof AnalysisRequestSchema>

export type AnalysisResult = {
  success: boolean
  message?: string
  error?: string
}

export async function submitAnalysis(requestData: AnalysisRequest): Promise<AnalysisResult> {
  try {
    // Validate input
    const validatedData = AnalysisRequestSchema.safeParse(requestData)
    
    if (!validatedData.success) {
      return {
        success: false,
        error: validatedData.error.issues[0]?.message || "Invalid input",
      }
    }

    const { email, customer, locationId, address } = validatedData.data

    // Verify authentication
    const supabase = await createClient()
    const { data: userData, error: authError } = await supabase.auth.getUser()

    if (authError || !userData?.user) {
      return {
        success: false,
        error: "Unauthorized - Please sign in",
      }
    }

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session?.access_token) {
      return { success: false, error: "Session invalid or token missing" }
    }

    // Call Supabase function
    const { data, error: functionError, response: functionResponse } = await supabase.functions.invoke("readBills", {
      body: {
        email,
        customer,
        location_id: locationId,
        location_address: address || null,
      },
    })

    if (functionError || (!functionResponse || functionResponse.status !== 200)) {
      return { success: false, error: functionError.message }
    }

    // Return success with any message or data from the function
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
