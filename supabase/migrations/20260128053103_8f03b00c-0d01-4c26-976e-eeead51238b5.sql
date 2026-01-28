-- Create study_plans table
CREATE TABLE public.study_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  goals TEXT[] NOT NULL DEFAULT '{}',
  available_hours_per_week INTEGER NOT NULL DEFAULT 10,
  preferred_days TEXT[] DEFAULT '{}',
  schedule JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own study plans" ON public.study_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own study plans" ON public.study_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own study plans" ON public.study_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own study plans" ON public.study_plans FOR DELETE USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_study_plans_updated_at
  BEFORE UPDATE ON public.study_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_plans;