-- Storage policies for bills bucket
-- Run this SQL in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Policy to allow authenticated users to upload files to the bills bucket
CREATE POLICY "Allow authenticated users to upload to bills bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'bills');

-- Policy to allow authenticated users to read files from the bills bucket
CREATE POLICY "Allow authenticated users to read bills bucket files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'bills');

-- Policy to allow authenticated users to delete files from the bills bucket
CREATE POLICY "Allow authenticated users to delete bills bucket files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'bills');

