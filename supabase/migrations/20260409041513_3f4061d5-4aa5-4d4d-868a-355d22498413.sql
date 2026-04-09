
-- Teachers/admins can insert courses
CREATE POLICY "Teachers can insert courses"
ON public.courses FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

-- Teachers/admins can update courses
CREATE POLICY "Teachers can update courses"
ON public.courses FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

-- Teachers/admins can delete courses
CREATE POLICY "Teachers can delete courses"
ON public.courses FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

-- Teachers/admins can insert lessons
CREATE POLICY "Teachers can insert lessons"
ON public.lessons FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

-- Teachers/admins can update lessons
CREATE POLICY "Teachers can update lessons"
ON public.lessons FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

-- Teachers/admins can delete lessons
CREATE POLICY "Teachers can delete lessons"
ON public.lessons FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

-- Teachers/admins can insert quizzes
CREATE POLICY "Teachers can insert quizzes"
ON public.quizzes FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

-- Teachers/admins can update quizzes
CREATE POLICY "Teachers can update quizzes"
ON public.quizzes FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

-- Teachers/admins can delete quizzes
CREATE POLICY "Teachers can delete quizzes"
ON public.quizzes FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

-- Teachers/admins can insert quiz questions
CREATE POLICY "Teachers can insert quiz questions"
ON public.quiz_questions FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

-- Teachers/admins can update quiz questions
CREATE POLICY "Teachers can update quiz questions"
ON public.quiz_questions FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

-- Teachers/admins can delete quiz questions
CREATE POLICY "Teachers can delete quiz questions"
ON public.quiz_questions FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

-- Allow teachers to view all quiz attempts for reporting
CREATE POLICY "Teachers can view all attempts"
ON public.quiz_attempts FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

-- Allow teachers to view all user progress for reporting
CREATE POLICY "Teachers can view all progress"
ON public.user_progress FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));
