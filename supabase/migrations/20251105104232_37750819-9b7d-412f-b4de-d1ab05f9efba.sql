-- Create books table for storing book metadata
CREATE TABLE public.books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT,
  description TEXT,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT,
  isbn TEXT
);

-- Enable Row Level Security
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view all books"
  ON public.books
  FOR SELECT
  USING (true);

CREATE POLICY "Users can upload books"
  ON public.books
  FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete their own books"
  ON public.books
  FOR DELETE
  USING (auth.uid() = uploaded_by);

-- Create storage bucket for books
INSERT INTO storage.buckets (id, name, public)
VALUES ('books', 'books', false);

-- Create storage policies for authenticated users
CREATE POLICY "Users can view all book files"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'books');

CREATE POLICY "Users can upload book files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'books' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own book files"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'books' AND auth.uid()::text = (storage.foldername(name))[1]);