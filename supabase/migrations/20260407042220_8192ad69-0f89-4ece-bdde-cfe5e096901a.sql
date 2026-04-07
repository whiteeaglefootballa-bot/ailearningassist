
DROP POLICY "System can insert notifications" ON public.notifications;

CREATE POLICY "Authenticated users can receive notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (true);
