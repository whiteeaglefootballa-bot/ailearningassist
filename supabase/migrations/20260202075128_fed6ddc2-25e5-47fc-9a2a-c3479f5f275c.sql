-- Create learning goals table
CREATE TABLE public.learning_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  goal_type TEXT NOT NULL DEFAULT 'daily', -- 'daily' or 'weekly'
  target_value INTEGER NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'sessions', -- 'sessions', 'hours', 'tasks'
  current_value INTEGER NOT NULL DEFAULT 0,
  period_start DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.learning_goals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own goals"
  ON public.learning_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON public.learning_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON public.learning_goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON public.learning_goals FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_learning_goals_updated_at
  BEFORE UPDATE ON public.learning_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.learning_goals;