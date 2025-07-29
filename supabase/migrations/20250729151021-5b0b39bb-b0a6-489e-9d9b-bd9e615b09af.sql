
-- Create team_documents table for GDPR-compliant document management
CREATE TABLE public.team_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id UUID NOT NULL REFERENCES public.team_registrations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for team_documents
ALTER TABLE public.team_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for team_documents (GDPR-compliant access control)
CREATE POLICY "Teams can view their own documents" ON public.team_documents
  FOR SELECT USING (
    registration_id IN (
      SELECT id FROM public.team_registrations WHERE user_id = auth.uid()
    )
  );

-- Admin policy for team_documents (assuming is_admin flag in profiles)
CREATE POLICY "Admins can manage all documents" ON public.team_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Update announcements table to add missing fields
ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS content TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS audience TEXT DEFAULT 'all' CHECK (audience IN ('all', 'open', 'under_12'));

-- Drop the existing message column and rename content (if message exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'message') THEN
    UPDATE public.announcements SET content = message WHERE content IS NULL;
    ALTER TABLE public.announcements DROP COLUMN message;
  END IF;
END $$;

-- Update announcements policies to allow admins to manage
DROP POLICY IF EXISTS "Everyone can view announcements" ON public.announcements;

CREATE POLICY "Teams can view relevant announcements" ON public.announcements
  FOR SELECT USING (
    audience = 'all' OR 
    (audience = 'open' AND EXISTS (
      SELECT 1 FROM public.team_registrations 
      WHERE user_id = auth.uid() AND category = 'open'
    )) OR
    (audience = 'under_12' AND EXISTS (
      SELECT 1 FROM public.team_registrations 
      WHERE user_id = auth.uid() AND category = 'under_12'
    ))
  );

CREATE POLICY "Admins can manage announcements" ON public.announcements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create a private storage bucket for team documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('team-documents', 'team-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for team documents (private access)
CREATE POLICY "Teams can view their own document files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'team-documents' AND 
    name IN (
      SELECT REPLACE(file_url, 'https://nefumdoduepusfcukynt.supabase.co/storage/v1/object/public/team-documents/', '')
      FROM public.team_documents td
      JOIN public.team_registrations tr ON td.registration_id = tr.id
      WHERE tr.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all team document files" ON storage.objects
  FOR ALL USING (
    bucket_id = 'team-documents' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );
