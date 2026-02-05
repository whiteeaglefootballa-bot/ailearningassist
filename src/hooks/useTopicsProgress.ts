 import { useEffect, useState } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 
 interface TopicProgress {
   name: string;
   progress: number;
   color: string;
 }
 
 const topicColors = [
   'bg-chart-1',
   'bg-chart-2',
   'bg-chart-3',
   'bg-chart-4',
   'bg-chart-5',
 ];
 
 export function useTopicsProgress() {
   const { user } = useAuth();
   const [topics, setTopics] = useState<TopicProgress[]>([]);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     if (!user?.id) return;
 
     const fetchTopicsProgress = async () => {
       // Fetch user's progress with course/lesson details
       const { data: progressData } = await supabase
         .from('user_progress')
         .select(`
           completed,
           course_id,
           courses (
             id,
             title,
             total_lessons
           )
         `)
         .eq('user_id', user.id);
 
       if (!progressData || progressData.length === 0) {
         setTopics([]);
         setLoading(false);
         return;
       }
 
       // Group by course and calculate progress
       const courseMap = new Map<string, {
         title: string;
         totalLessons: number;
         completedLessons: number;
       }>();
 
       progressData.forEach((p: any) => {
         if (!p.courses) return;
         
         const existing = courseMap.get(p.course_id) || {
           title: p.courses.title,
           totalLessons: p.courses.total_lessons || 1,
           completedLessons: 0,
         };
         
         if (p.completed) {
           existing.completedLessons++;
         }
         
         courseMap.set(p.course_id, existing);
       });
 
       const topicsArray: TopicProgress[] = Array.from(courseMap.entries())
         .map(([id, data], index) => ({
           name: data.title,
           progress: Math.round((data.completedLessons / data.totalLessons) * 100),
           color: topicColors[index % topicColors.length],
         }))
         .sort((a, b) => b.progress - a.progress)
         .slice(0, 5); // Show top 5 topics
 
       setTopics(topicsArray);
       setLoading(false);
     };
 
     fetchTopicsProgress();
 
     // Subscribe to realtime updates
     const channel = supabase
       .channel('topics-progress-changes')
       .on(
         'postgres_changes',
         {
           event: '*',
           schema: 'public',
           table: 'user_progress',
           filter: `user_id=eq.${user.id}`,
         },
         () => fetchTopicsProgress()
       )
       .subscribe();
 
     return () => {
       supabase.removeChannel(channel);
     };
   }, [user?.id]);
 
   return { topics, loading };
 }