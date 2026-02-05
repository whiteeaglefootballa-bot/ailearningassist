 import { useEffect, useState } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 
 export interface Course {
   id: string;
   title: string;
   description: string | null;
   category: string;
   difficulty: string | null;
   total_lessons: number | null;
   image_url: string | null;
   progress?: number;
 }
 
 export function useCourses() {
   const { user } = useAuth();
   const [courses, setCourses] = useState<Course[]>([]);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     const fetchCourses = async () => {
       // Fetch all courses
       const { data: coursesData, error: coursesError } = await supabase
         .from('courses')
         .select('*');
 
       if (coursesError) {
         console.error('Error fetching courses:', coursesError);
         setLoading(false);
         return;
       }
 
       let coursesWithProgress = coursesData || [];
 
       // If user is logged in, fetch their progress
       if (user?.id) {
         const { data: progressData } = await supabase
           .from('user_progress')
           .select('course_id, completed')
           .eq('user_id', user.id);
 
         // Calculate progress per course
         const progressMap = new Map<string, { completed: number; total: number }>();
         
         (progressData || []).forEach((p) => {
           const existing = progressMap.get(p.course_id) || { completed: 0, total: 0 };
           existing.total++;
           if (p.completed) existing.completed++;
           progressMap.set(p.course_id, existing);
         });
 
         coursesWithProgress = (coursesData || []).map((course) => {
           const progress = progressMap.get(course.id);
           const totalLessons = course.total_lessons || 1;
           
           return {
             ...course,
             progress: progress 
               ? Math.round((progress.completed / totalLessons) * 100)
               : 0,
           };
         });
       }
 
       setCourses(coursesWithProgress);
       setLoading(false);
     };
 
     fetchCourses();
 
     // Subscribe to realtime updates for courses
     const coursesChannel = supabase
       .channel('courses-changes')
       .on(
         'postgres_changes',
         {
           event: '*',
           schema: 'public',
           table: 'courses',
         },
         () => fetchCourses()
       )
       .subscribe();
 
     // If user is logged in, also subscribe to progress changes
     let progressChannel: ReturnType<typeof supabase.channel> | null = null;
     if (user?.id) {
       progressChannel = supabase
         .channel('courses-progress-changes')
         .on(
           'postgres_changes',
           {
             event: '*',
             schema: 'public',
             table: 'user_progress',
             filter: `user_id=eq.${user.id}`,
           },
           () => fetchCourses()
         )
         .subscribe();
     }
 
     return () => {
       supabase.removeChannel(coursesChannel);
       if (progressChannel) {
         supabase.removeChannel(progressChannel);
       }
     };
   }, [user?.id]);
 
   return { courses, loading };
 }