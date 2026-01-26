-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  learning_level TEXT DEFAULT 'beginner',
  preferred_subjects TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create courses table
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  difficulty TEXT DEFAULT 'beginner',
  image_url TEXT,
  total_lessons INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create lessons table
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  order_index INTEGER DEFAULT 0,
  duration_minutes INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user progress table
CREATE TABLE public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  score INTEGER,
  time_spent_minutes INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, course_id, lesson_id)
);

-- Create quizzes table
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  difficulty TEXT DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create quiz questions table
CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer INTEGER NOT NULL,
  explanation TEXT,
  order_index INTEGER DEFAULT 0
);

-- Create quiz attempts table
CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  answers JSONB,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create chat messages table for AI tutor conversations
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  conversation_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  context JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Courses policies (public read)
CREATE POLICY "Anyone can view courses" ON public.courses FOR SELECT USING (true);

-- Lessons policies (public read)
CREATE POLICY "Anyone can view lessons" ON public.lessons FOR SELECT USING (true);

-- User progress policies
CREATE POLICY "Users can view own progress" ON public.user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON public.user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.user_progress FOR UPDATE USING (auth.uid() = user_id);

-- Quizzes policies (public read)
CREATE POLICY "Anyone can view quizzes" ON public.quizzes FOR SELECT USING (true);

-- Quiz questions policies (public read)
CREATE POLICY "Anyone can view quiz questions" ON public.quiz_questions FOR SELECT USING (true);

-- Quiz attempts policies
CREATE POLICY "Users can view own attempts" ON public.quiz_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own attempts" ON public.quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Chat messages policies
CREATE POLICY "Users can view own messages" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

-- Trigger for auto-creating profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger for updating profile timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();