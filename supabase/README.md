# Supabase Edge Functions

This directory contains the Edge Functions for the Tune Energy OCR UI project.

## Project Structure

```
supabase/
├── functions/
│   ├── import_map.json       # Top-level import map for all functions
│   └── readBills/            # Bill processing edge function
│       └── index.ts          # Main function code
├── config.toml               # Supabase configuration
├── .env.example              # Example environment variables
└── README.md                 # This file
```

## Edge Functions

### readBills

Processes uploaded utility bills (PDF, JPG, PNG) and extracts structured billing data using LLMWhisperer OCR and OpenAI.

**Features:**
- Batch processing of multiple bill files
- OCR extraction using LLMWhisperer API
- Structured data extraction using OpenAI GPT-5.1
- Anomaly detection for billing rate changes (>15% month-over-month)
- Email notifications with CSV results via Resend
- Automatic file cleanup after processing

**Required Environment Variables:**
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `LLMWHISPERER_API_KEY` - LLMWhisperer API key for OCR
- `OPENAI_API_KEY` - OpenAI API key for data extraction
- `RESEND_API_KEY` - Resend API key for email notifications
- `WHISPER_WAIT_TIME` (optional) - Wait time in seconds for OCR processing (default: 60)

**API Endpoint:**
```
POST https://gjvopleiohywobzkerfa.supabase.co/functions/v1/readBills
```

**Request Body:**
```json
{
  "customer": "Customer Name",
  "location_id": "Site ID",
  "location_address": "Site Address",
  "email": "recipient@example.com"
}
```

**Response:**
```json
{
  "success": true
}
```

## Development

### Prerequisites
- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- [Deno](https://deno.com) installed (for local development and type checking)

### Local Development

1. **Link your project:**
   ```bash
   supabase link --project-ref gjvopleiohywobzkerfa
   ```

2. **Set up environment variables:**
   ```bash
   cp supabase/.env.example supabase/.env
   # Edit .env with your actual values
   ```

3. **Start Supabase locally:**
   ```bash
   supabase start
   ```

4. **Serve the function locally:**
   ```bash
   supabase functions serve readBills
   ```

   The function will be available at:
   ```
   http://localhost:54321/functions/v1/readBills
   ```

### Testing

Test the function locally using curl:

```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/readBills' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"customer":"Test Customer","location_id":"LOC001","location_address":"123 Main St","email":"test@example.com"}'
```

### Deployment

Deploy the function to production:

```bash
supabase functions deploy readBills
```

## Database Tables

The edge function interacts with the following Supabase tables:

### processing_queue
Tracks the processing status of uploaded files.

```sql
CREATE TABLE processing_queue (
  filename TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Storage Buckets

### bills
Stores uploaded bill files (PDF, JPG, PNG) for processing.

- Files are automatically deleted after successful processing
- Supports files with extensions: `.pdf`, `.PDF`, `.jpg`, `.JPG`, `.png`, `.PNG`

## Workflow

1. User uploads bill files to the `bills` storage bucket
2. Frontend calls the `readBills` edge function with customer details
3. Edge function:
   - Fetches unprocessed files from storage
   - Validates file extensions
   - Submits files to LLMWhisperer for OCR
   - Waits for OCR processing to complete
   - Retrieves extracted text
   - Sends text to OpenAI for structured data extraction
   - Performs anomaly detection on billing rates
   - Generates CSV results
   - Sends email with CSV attachment
   - Updates processing queue
   - Cleans up processed files from storage
4. User receives email with extracted billing data

## Notes

- The function uses JWT verification by default (see `config.toml`)
- Processing is asynchronous - the function returns immediately while processing continues in the background
- Failed files are tracked in the `processing_queue` table with error messages
- Anomalies (>15% billing rate changes) are flagged in the CSV output

