-- Create table for shareable study plan links
CREATE TABLE public.shared_study_plan_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_plan_id UUID NOT NULL REFERENCES public.study_plans(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.shared_study_plan_links ENABLE ROW LEVEL SECURITY;

-- Owner can manage their own shared links
CREATE POLICY "Users can view own shared links"
ON public.shared_study_plan_links
FOR SELECT
USING (auth.uid() = created_by);

CREATE POLICY "Users can create shared links for own plans"
ON public.shared_study_plan_links
FOR INSERT
WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (SELECT 1 FROM public.study_plans WHERE id = study_plan_id AND user_id = auth.uid())
);

CREATE POLICY "Users can delete own shared links"
ON public.shared_study_plan_links
FOR DELETE
USING (auth.uid() = created_by);

-- Anyone with the token can view the shared link record (for public access)
CREATE POLICY "Anyone can view active shared links by token"
ON public.shared_study_plan_links
FOR SELECT
USING (is_active = true);

-- Create a function to get shared plan data (bypasses RLS on study_plans)
CREATE OR REPLACE FUNCTION public.get_shared_study_plan(p_share_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_id UUID;
  v_plan JSON;
BEGIN
  -- Get plan_id from valid share token
  SELECT study_plan_id INTO v_plan_id
  FROM public.shared_study_plan_links
  WHERE share_token = p_share_token
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now());

  IF v_plan_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get the plan data
  SELECT json_build_object(
    'id', sp.id,
    'title', sp.title,
    'goals', sp.goals,
    'schedule', sp.schedule,
    'available_hours_per_week', sp.available_hours_per_week,
    'preferred_days', sp.preferred_days
  ) INTO v_plan
  FROM public.study_plans sp
  WHERE sp.id = v_plan_id;

  RETURN v_plan;
END;
$$;