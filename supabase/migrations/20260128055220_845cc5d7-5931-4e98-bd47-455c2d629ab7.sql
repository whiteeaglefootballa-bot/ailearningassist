-- Create table for tracking completed study sessions
CREATE TABLE public.study_session_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  study_plan_id UUID NOT NULL REFERENCES public.study_plans(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  session_index INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(study_plan_id, day, session_index)
);

-- Enable RLS
ALTER TABLE public.study_session_completions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own completions"
ON public.study_session_completions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completions"
ON public.study_session_completions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own completions"
ON public.study_session_completions FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_session_completions;