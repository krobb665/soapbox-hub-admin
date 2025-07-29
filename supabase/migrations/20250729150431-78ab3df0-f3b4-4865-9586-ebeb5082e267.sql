
-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (id)
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create team_registrations table
CREATE TABLE public.team_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  captain_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  soapbox_name TEXT NOT NULL,
  soapbox_description TEXT,
  category TEXT NOT NULL CHECK (category IN ('under_12', 'open')),
  file_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'waitlist')),
  race_number TEXT,
  heat_time TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for team_registrations
ALTER TABLE public.team_registrations ENABLE ROW LEVEL SECURITY;

-- Create policies for team_registrations
CREATE POLICY "Users can view their own registrations" ON public.team_registrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own registrations" ON public.team_registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own registrations" ON public.team_registrations
  FOR UPDATE USING (auth.uid() = user_id);

-- Create team_members table
CREATE TABLE public.team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id UUID NOT NULL REFERENCES public.team_registrations(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  member_age INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for team_members
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Create policies for team_members (users can manage members of their own registrations)
CREATE POLICY "Users can view members of their registrations" ON public.team_members
  FOR SELECT USING (
    registration_id IN (
      SELECT id FROM public.team_registrations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert members to their registrations" ON public.team_members
  FOR INSERT WITH CHECK (
    registration_id IN (
      SELECT id FROM public.team_registrations WHERE user_id = auth.uid()
    )
  );

-- Create announcements table
CREATE TABLE public.announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('info', 'urgent', 'general')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for announcements (public read access)
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Create policy for announcements (everyone can read)
CREATE POLICY "Everyone can view announcements" ON public.announcements
  FOR SELECT USING (true);

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY definer SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '')
  );
  RETURN new;
END;
$$;

-- Create trigger to automatically create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for team files
INSERT INTO storage.buckets (id, name, public)
VALUES ('team-files', 'team-files', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Team files are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'team-files');

CREATE POLICY "Authenticated users can upload team files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'team-files' AND auth.role() = 'authenticated');
