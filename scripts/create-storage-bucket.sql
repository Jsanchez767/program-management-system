-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);

-- Set up RLS policies for documents bucket
CREATE POLICY "Students can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Students can view their own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);
