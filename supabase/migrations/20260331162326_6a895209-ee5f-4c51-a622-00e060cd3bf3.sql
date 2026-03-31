
-- Create learning_tracks table
CREATE TABLE public.learning_tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'BookOpen',
  color TEXT DEFAULT 'primary',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create junction table linking tracks to courses
CREATE TABLE public.learning_track_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id UUID NOT NULL REFERENCES public.learning_tracks(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  UNIQUE(track_id, course_id)
);

-- Enable RLS
ALTER TABLE public.learning_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_track_courses ENABLE ROW LEVEL SECURITY;

-- Everyone can view tracks and track-courses
CREATE POLICY "Anyone can view learning tracks" ON public.learning_tracks FOR SELECT USING (true);
CREATE POLICY "Anyone can view track courses" ON public.learning_track_courses FOR SELECT USING (true);
