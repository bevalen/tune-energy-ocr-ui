// supabase/functions/readBills/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { parse } from "https://deno.land/std@0.217.0/csv/parse.ts";
import { stringify } from "https://deno.land/std@0.217.0/csv/stringify.ts";
import { load } from "https://deno.land/std@0.218.0/dotenv/mod.ts";
import { SmtpClient } from "https://deno.land/x/smtp/mod.ts";

// --- CONFIG ---
const LLMS_WHISPER_URL = "https://llmwhisperer-api.us-central.unstract.com/api/v2/whisper";
const LLMS_RETRIEVE_URL = "https://llmwhisperer-api.us-central.unstract.com/api/v2/whisper-retrieve";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const WHISPER_API_KEY = Deno.env.get("LLMWHISPERER_API_KEY"); // Your secret key
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');    

// Optional: Configurable wait time (in seconds) for LLMWhisperer processing
const WHISPER_WAIT_TIME = parseInt(Deno.env.get("WHISPER_WAIT_TIME") || "60");

// Valid file extensions
const VALID_EXTENSIONS = ['.pdf','.PDF', '.jpg', '.JPG','.png','.PNG'];
const imageExtensions = ['.jpg', '.JPG', '.png', '.PNG'];
const pdfExtensions = ['.pdf', '.PDF'];

interface WhisperJob {
  filename: string;
  whisper_hash: string;
}

interface LLMExtractionResult {
  total_kwh: number | null;
  start_date: string | null;
  end_date: string | null;
  total_charges: number | null;
  adjustments: number | null;
  meter_number: string | null;
}

interface ProcessedFileResult {
  index: number;
  filename: string;
  data: LLMExtractionResult | null;
  error: string | null;
  warning: string | null;
}

// --- Helper Functions ---
function csvToHtmlTable(csv: string): string {
  const rows = csv.trim().split('\n');
  if (rows.length === 0) return '';

  const headers = rows[0].split(',').map(cell => cell.trim());
  const dataRows = rows.slice(1);

  let html = '<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; font-family: Arial, sans-serif;">';
  
  // Header row
  html += '<thead><tr>';
  headers.forEach(header => {
    html += `<th style="background-color: #f2f2f2; padding: 8px; text-align: left;">${header}</th>`;
  });
  html += '</tr></thead>';

  // Data rows
  html += '<tbody>';
  dataRows.forEach(row => {
    const cells = row.split(',').map(cell => cell.trim());
    html += '<tr>';
    cells.forEach(cell => {
      html += `<td style="padding: 8px; border: 1px solid #ddd;">${cell}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';

  return html;
}

/**
 * Submits a PDF file to LLMWhisperer and returns the job ID.
 */
async function submitToLLMWhisperer(filename: string, fileBuffer: ArrayBuffer): Promise<string> {
  const whisperURL = new URL(LLMS_WHISPER_URL);
  const fileBlob = new Blob([fileBuffer]);

  if (imageExtensions.some(ext => filename.endsWith(ext))) {
    whisperURL.searchParams.set("mode", "high_quality");
  } else {
    whisperURL.searchParams.set("mode","high_quality")
  }

  const response = await fetch(whisperURL, {
    method: "POST",
    headers: {
      "unstract-key": WHISPER_API_KEY || "",
      "Content-Type": "application/octet-stream",
    },
    body: fileBlob,
  });

  if (!response.ok) {
    throw new Error(`LLMWhisperer submit failed: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  if (!result.whisper_hash) {
    throw new Error("LLMWhisperer response missing job_id");
  }

  console.log(`✅ Submitted ${filename} to LLMWhisperer, job_id: ${result.whisper_hash}`);
  return result.whisper_hash;
};

/**
 * Polls LLMWhisperer until text result is available. Returns extracted text.
 */
async function retrieveLLMWhispererResult(jobId: string): Promise<string> {
  let attempts = 0;
  const maxAttempts = 2;
  const intervalMs = 10_000;
  const text = "";

  while (attempts < maxAttempts) {
    attempts++;
    const url = new URL(LLMS_RETRIEVE_URL);
    url.searchParams.set("whisper_hash", jobId);
    url.searchParams.set("text_only", "true");

    const response = await fetch(url.toString(), {
      headers: { "unstract-key": WHISPER_API_KEY || "" },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const text = await response.text();
    if (text !== "") {
      return text.trim();
    }
    console.log(`⏳ LLMWhisperer job ${jobId} still processing... (${attempts}/${maxAttempts})`);
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  
  if (text === "") {
    throw new Error(`LLMWhisperer job ${jobId} timed out after ${maxAttempts * intervalMs / 1000}s`);
  }
  
  return text.trim();
};

/**
 * Sends extracted text to OpenAI for structured parsing.
 */
async function sendTextToOpenAI(text: string, filename: string, retry: boolean=false, guess: string=""): Promise<string> {
  let prompt = "";

  if (!retry) {
    prompt = "You are an expert electrical bill extractor. Review the provided bill(s) and extract key information as instructed for each meter & billing period. Do not include gas meters. Extract ONLY the following from the provided text:\n" +
              "1. meter_number: The electrical meter number for this reading (string, or null)\n" +
              "2. start_date: The start date of the billing period for this meter (YYYY-MM-DD format, or null)\n" +
              "3. end_date: The end date of the billing period for this meter (YYYY-MM-DD format, or null)\n" +
              "4. total_kwh: The total electricity usage in kWh on this meter for the current billing period (number, or null if not found). This should be a single number on the page somewhere, without having to add anything up.\n" +
              "5. total_charges: The total electrical charges in USD on this meter for the current billing period (number, or null), excluding any gas charges. This should be a single number on the page somewhere, without having to add anything up.\n" +
              "6. adjustments: The value of any line item listed as an 'adjustment' on this meter for the current billing period (number, or null)\n"+
              "Return ONLY an array of JSON objects as property 'results', each element having these 6 keys. Do not include any other text, markdown, or explanation. For example:\n" +
              `{
                "results": [
                  {
                    "meter_number": "KU39487",
                    "start_date": "2024-12-12",
                    "end_date": "2025-01-13",
                    "total_kwh": 19560,
                    "total_charges": 2271.93,
                    "adjustments": 0
                  },
                  {
                    "meter_number": "1124520",
                    "start_date": "2025-11-01",
                    "end_date": "2025-12-01",
                    "total_kwh": 225,
                    "total_charges": 379.20,
                    "adjustments": -420.22
                  }
                ]
              }`
  } else {
    prompt = "You are an expert electrical bill extractor. Review the provided bill(s) and extract key information as instructed for each meter & billing period. Do not include gas meters. Extract ONLY the following from the provided text:\n" +
              "1. meter_number: The electrical meter number for this reading (string, or null)\n" +
              "2. start_date: The start date of the billing period for this meter (YYYY-MM-DD format, or null)\n" +
              "3. end_date: The end date of the billing period for this meter (YYYY-MM-DD format, or null)\n" +
              "4. total_kwh: The total electricity usage in kWh on this meter for the current billing period (number, or null if not found). This should be a single number on the page somewhere, without having to add anything up.\n" +
              "5. total_charges: The total electrical charges in USD on this meter for the current billing period (number, or null), excluding any gas charges. This should be a single number on the page somewhere, without having to add anything up.\n" +
              "6. adjustments: The value of any line item listed as an 'adjustment' on this meter for the current billing period (number, or null)\n"+
              "Return ONLY an array of JSON objects as property 'results', each element having these 6 keys. Do not include any other text, markdown, or explanation. For example:\n" +
              `{
                "results": [
                  {
                    "meter_number": "KU39487",
                    "start_date": "2024-12-12",
                    "end_date": "2025-01-13",
                    "total_kwh": 19560,
                    "total_charges": 2271.93,
                    "adjustments": 0
                  },
                  {
                    "meter_number": "1124520",
                    "start_date": "2025-11-01",
                    "end_date": "2025-12-01",
                    "total_kwh": 225,
                    "total_charges": 379.20,
                    "adjustments": -420.22
                  }
                ]
              }`+
              `\n\nThe total_kwh should be close to ${guess}.`
  }

  if (retry) {console.log(`retrying with ${guess}`)};

  try {
    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-5.1",
        messages: [
          {
            role: "system",
            content: prompt
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${await response.text()}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    return content;

  } catch (error) {
    console.log (`Error during OpenAI processing`);
    return "";
  }
};

// --- BACKGROUND PROCESSOR ---
async function processBatch(
  customer: string,
  location_id: string,
  location_address: string,
  email: string,
  supaUrl: string,
  supaKey: string
) {
  try {
    const supabase = createClient(supaUrl,supaKey);

    // Step 1: Fetch all unprocessed files from storage
    const { data: objects, error: listError } = await supabase.storage
      .from("bills")
      .list("", { limit: 100, offset: 0 });

    if (listError) throw listError;

    // Filter files that are not yet processed
    const { data: queue, error: queueError } = await supabase
      .from("processing_queue")
      .select("filename, status")
      .in("status", ["pending", "processing"]);

    if (queueError) throw queueError;

    const processedFilenames = new Set(queue.map(item => item.filename));
    const filesToProcess = objects.filter(obj => !processedFilenames.has(obj.name));

    if (filesToProcess.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No files to process" }), { status: 200 });
    }

    // Step 2: Validate file extensions
    const invalidFiles = filesToProcess.filter(file => !VALID_EXTENSIONS.some(ext => file.name.endsWith(ext)));
    if (invalidFiles.length > 0) {
      console.warn(`Invalid file extensions: ${invalidFiles.map(f => f.name).join(", ")}`);
    }

    const validFiles = filesToProcess.filter(file => VALID_EXTENSIONS.some(ext => file.name.endsWith(ext)));

    if (validFiles.length === 0) {
      // Mark all as failed due to invalid type
      for (const obj of filesToProcess) {
        await supabase.from("processing_queue").upsert({
          filename: obj.name,
          status: "failed",
          error: "Invalid file extension. Only .pdf, .jpg, .png allowed.",
        }, { onConflict: "filename" });
      }
      return new Response(JSON.stringify({ success: true, message: "No valid files to process" }), { status: 200 });
    }

    // Step 3: Submit all valid files to LLMWhisperer
    const whisperJobs: WhisperJob[] = [];
    const processingLog: { filename: string; status: string; error: string }[] = [];
    console.log(`Building LLMWhisperer jobs...`);

    for (const obj of validFiles) {
      try {
        const { data: fileData, error } = await supabase.storage.from("bills").download(obj.name);
        if (error) throw error;

        const fileBuffer = await fileData.arrayBuffer();
       
        const job_hash = await submitToLLMWhisperer(obj.name,fileBuffer);

        whisperJobs.push({
          filename: obj.name,
          whisper_hash: job_hash
        });

        processingLog.push({ filename: obj.name, status: "submitted", error: "" });

      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        processingLog.push({ filename: obj.name, status: "failed", error: errMsg });
      }
    }

    // Step 4: Wait for LLMWhisperer to process (configurable timeout)
    console.log(`Waiting ${WHISPER_WAIT_TIME} seconds for LLMWhisperer to process ${whisperJobs.length} files...`);
    await new Promise(resolve => setTimeout(resolve, WHISPER_WAIT_TIME * 1000));

    // Step 5: Retrieve results from LLMWhisperer (text_only=true)
    const textResults: { filename: string; text: string | null; error: string }[] = [];
    console.log(`Starting to retrieve results`);

    for (const job of whisperJobs) {
      try {
        let OCRText = await retrieveLLMWhispererResult(job.whisper_hash);

        textResults.push({ filename: job.filename, text: OCRText || null, error: "" });
        
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        textResults.push({ filename: job.filename, text: null, error: errMsg });
      }
    }

    // Step 6: Send each extracted text to OpenAI for structured extraction
    const processedResults: ProcessedFileResult[] = [];
    console.log(`Starting to send results to LLM`);
    
    for (const { filename, text, error } of textResults) {
     
      if (error || !text) {
        processedResults.push({
          index: processedResults.length,
          filename: filename,
          data: null,
          error: error || "No text extracted from LLMWhisperer",
          warning: null,
        });
        continue;
      }
      
      try {
        const content = await sendTextToOpenAI(text,filename);
        
        let parsedContent;
        try {
          parsedContent = JSON.parse(content);
        } catch (parseError) {
          throw new Error(`Failed to parse OpenAI response as JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}\nRaw content: ${content}`);
        }

        // Validate structure
        if (!Array.isArray(parsedContent.results)) {
          throw new Error('OpenAI response missing valid "results" array');
        }

        for (const monthData of parsedContent.results) {
          processedResults.push({
            index: processedResults.length,
            filename: filename,
            ...monthData,
            error: null,
            warning: null,
          });
        }

      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        processedResults.push({
          index: processedResults.length,
          filename: filename,
          total_kwh: null,
          start_date: null,
          end_date: null,
          total_charges: null,
          adjustments: null,
          meter_number: null,
          error: `OpenAI extraction failed: ${errMsg}`,
          warning: null,
        });
      }
    }

    console.log(`Step 6.5: Checking for anomalies across meters...`);

    const sortedResults = [...processedResults]
      .filter(r => r.end_date && typeof r.end_date === 'string' && !r.error)
      .sort((a, b) => {
        const meterCompare = (a.meter_number || "").localeCompare(b.meter_number || "");
        if (meterCompare !== 0) return meterCompare;
        return a.end_date.localeCompare(b.end_date);
      });

    // Track previous valid record
    let prevRecord: typeof sortedResults[0] | null = null;

    const reprocessQueue: { filename: string; originalResult: any; guess: string; diff: number; index: number }[] = [];

    for (const current of sortedResults) {
      if (!prevRecord) {
        prevRecord = current;
        continue; // Skip first record — no prior to compare
      }

      const prevCharges = prevRecord.total_charges;
      const currCharges = current.total_charges;
      const prevKwh = prevRecord.total_kwh;
      const currKwh = current.total_kwh;

      // Skip if any is null or zero to avoid division by zero
      if (!prevCharges || !currCharges || !prevKwh || !currKwh) {
        prevRecord = current;
        continue;
      }

      // Compute relative change (absolute % difference)
      const rateDiffPct = Math.abs(((currCharges / currKwh) - (prevCharges / prevKwh)) / (currCharges / currKwh));
      
      // Flag if either exceeds 15%
      const isAnomaly = rateDiffPct > 0.15;
      const bestGuess = (prevCharges / prevKwh) / currCharges;

      if (isAnomaly) {
        console.log(`Anomaly detected: ${current.filename} [${current.index}] (${currCharges}/${prevCharges} charges, ${currKwh}/${prevKwh} kWh)`);
        reprocessQueue.push({ filename: current.filename, originalResult: current, guess: bestGuess, diff: rateDiffPct, index: current.index });
        prevRecord = null; //this will skip the next month's record--we don't want to re-run it with the current anomalous month as the baseline
      }

      prevRecord = current;
    }

    // Handle flagged results
    if (reprocessQueue.length > 0) {
      console.log(`Flagging ${reprocessQueue.length} anomalous results...`);

      for (const { filename, originalResult, guess, diff, index } of reprocessQueue) {
        try {
         console.log(`index is ${index}`);
          if (index !== -1) {
            console.log(`Adding anomaly to index ${index}`);
            processedResults[index] = {
              ...originalResult,
              warning: `Anomaly detected: Calculated rate was ${diff.toPrecision(2)*100}% changed from previous month`,
            };
          }
        } catch (error) {
          console.error(`Failed to reprocess ${filename}:`, error);
        }
      }
    }

    // Step 7: Build CSV results (as before) — now with structured data
    console.log(`building csv results`);
    const csvHeaders = ["meter_number", "total_kwh", "start_date", "end_date", "total_charges", "adjustments", "warnings", "filename"];
    const resultsCsv = stringify(
      processedResults.map(r => ({
        meter_number: r.meter_number ?? "",
        start_date: r.start_date ?? "",
        end_date: r.end_date ?? "",
        total_kwh: r.total_kwh ?? "",
        total_charges: r.total_charges ?? "",
        adjustments: r.adjustments ?? "",
        warnings: r.warning || "",
        filename: r.filename,
      })),
      { 
        headers: csvHeaders,
        columns: csvHeaders,
      }
    );

    console.log(`building log results`);
    const logHeaders = ["filename", "status", "error"];
    const logCsv = stringify(
      processingLog.map(log => ({
        filename: log.filename,
        status: log.status,
        error: log.error,
      })).concat(
        textResults.map(r => ({
          filename: r.filename,
          status: r.error ? "failed" : "retrieved",
          error: r.error || ""
        }))
      ),
      { 
        headers: logHeaders,
        columns: logHeaders,
      }
    );
    const htmlTable = csvToHtmlTable(logCsv);

    // Step 8: Send email
    const filename = `${customer}_bill_analysis_${new Date().toISOString().slice(0, 10)}.csv`;
    const emailBody = `
    Hi there,<br><br>

    Please find attached the extracted bill data from your uploaded files for:<br>
    Customer: ${customer}<br>
    Site ID: ${location_id}<br>
    Address: ${location_address}<br><br>>

    Processed ${processedResults.filter(r => !r.error).length} records from ${validFiles.length} files.<br><br>

    Log:
    ${htmlTable}<br>
    -- 
    This message was generated automatically by the bill-processing system.`;

    console.log(`sending email via Resend SMTP`);

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Dev <dev@dev.tadaha.com>',
          to: [email],
          subject: `Bill Analysis for ${customer}, site ${location_id}`,
          html: emailBody,
          attachments: [
            {
              filename: filename,
              content: btoa(unescape(encodeURIComponent(resultsCsv))),
            },         
          ]
        }),
      }); 

      const data = await res.json();

      console.log(`Email sent to ${email} with file: ${filename}`);

    } catch (emailError) {
      console.error(`Failed to send email via SMTP:`, emailError);
      // Don’t fail the whole process if email fails
    }

    // Step 9: Mark all processed files in queue
    for (const { filename, error } of processedResults) {
      const status = error ? "failed" : "completed";
      const { error: updateError } = await supabase
        .from("processing_queue")
        .upsert({
          filename,
          status,
          error: error || null,
        });

      if (updateError) {
        console.error(`Failed to update queue for ${filename}:`, updateError.message);
      }
    }

    console.log(`Batch complete! Processed ${processedResults.filter(r => !r.error).length} files successfully.`);

    // Step 10: Cleanup files in storage
    const { data: existingFiles, error: fetchError } = await supabase.storage
      .from("bills")
      .list("");

    if (fetchError) {
      console.error("Failed to list files in 'bills' bucket:", fetchError.message);
    } else {
      const deletePromises = existingFiles.map(file =>
        supabase.storage.from("bills").remove([file.name])
      );
      const deleteResults = await Promise.allSettled(deletePromises);

      deleteResults.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error(`Failed to delete ${existingFiles[index].name}:`, result.reason.message);
        } else {
          console.log(`Deleted: ${existingFiles[index].name}`);
        }
      });
    }
  } catch (error) {
      console.error(`Unknown error occurred:`, error);
  }
}

// --- HANDLER ---
Deno.serve(async (req) => {
  try {

    await load({ export: true }); // This loads .env and sets process.env (or Deno.env in Deno)

    // readBills/index.ts
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    // Retrieve parameters
    let customer = "";
    let location_id = "";
    let location_address = "";
    let email = "";

    try {
      const body = await req.json();

      // Extract and validate required fields
      customer = body.customer?.toString().trim() || "";
      location_id = body.location_id?.toString().trim() || "";
      location_address = body.location_address?.toString() || ""; // optional, can be empty
      email = body.email?.toString().trim() || "";

      // Validate required fields are non-empty
      if (!customer) {
        return new Response(JSON.stringify({ error: "customer is required" }), { status: 400 });
      }
      if (!location_id) {
        return new Response(JSON.stringify({ error: "location_id is required" }), { status: 400 });
      }
      if (!email) {
        return new Response(JSON.stringify({ error: "email is required" }), { status: 400 });
      }

    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 });
    }

    // Start processing in background
    const batch = processBatch(
      customer,
      location_id,
      location_address,
      email,
      SUPABASE_URL,
      SERVICE_ROLE_KEY
    ).catch(err => console.error("Background task crashed:", err));
    
    EdgeRuntime.waitUntil(batch); // Wait until the batch is done so we don't terminate early after client response 

    return new Response(JSON.stringify({
      success: true
    }), { status: 202 });

  } catch (error) {
    console.error("💥 readBills failed:", error);
    return new Response(JSON.stringify({ 
      error: "Internal server error", 
      details: (error as Error).message 
    }), { status: 500 });
  }
});