 import { useEffect, useState } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { startOfWeek, addDays, format, parseISO, startOfDay } from 'date-fns';
 
 interface DayProgress {
   day: string;
   minutes: number;
   score: number;
 }
 
 export function useWeeklyProgress() {
   const { user } = useAuth();
   const [weeklyData, setWeeklyData] = useState<DayProgress[]>([]);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     if (!user?.id) return;
 
     const fetchWeeklyData = async () => {
       const today = new Date();
       const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
       const weekEnd = addDays(weekStart, 6);
 
       const [progressResult, quizResult] = await Promise.all([
         supabase
           .from('user_progress')
           .select('created_at, time_spent_minutes')
           .eq('user_id', user.id)
           .gte('created_at', weekStart.toISOString())
           .lte('created_at', weekEnd.toISOString()),
         supabase
           .from('quiz_attempts')
           .select('completed_at, score, total_questions')
           .eq('user_id', user.id)
           .gte('completed_at', weekStart.toISOString())
           .lte('completed_at', weekEnd.toISOString()),
       ]);
 
       const dayMap = new Map<string, { minutes: number; scores: number[] }>();
       
       // Initialize all 7 days
       for (let i = 0; i < 7; i++) {
         const date = addDays(weekStart, i);
         const dayKey = format(date, 'yyyy-MM-dd');
         dayMap.set(dayKey, { minutes: 0, scores: [] });
       }
 
       // Aggregate progress data
       (progressResult.data || []).forEach((p) => {
         const dayKey = format(startOfDay(parseISO(p.created_at)), 'yyyy-MM-dd');
         const existing = dayMap.get(dayKey);
         if (existing) {
           existing.minutes += p.time_spent_minutes || 0;
         }
       });
 
       // Aggregate quiz scores
       (quizResult.data || []).forEach((q) => {
         const dayKey = format(startOfDay(parseISO(q.completed_at)), 'yyyy-MM-dd');
         const existing = dayMap.get(dayKey);
         if (existing) {
           const percentage = Math.round((q.score / q.total_questions) * 100);
           existing.scores.push(percentage);
         }
       });
 
       const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
       const weeklyData: DayProgress[] = [];
       
       let dayIndex = 0;
       dayMap.forEach((data, dateKey) => {
         weeklyData.push({
           day: dayNames[dayIndex],
           minutes: data.minutes,
           score: data.scores.length > 0
             ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
             : 0,
         });
         dayIndex++;
       });
 
       setWeeklyData(weeklyData);
       setLoading(false);
     };
 
     fetchWeeklyData();
 
     // Subscribe to realtime updates
     const progressChannel = supabase
       .channel('weekly-progress-changes')
       .on(
         'postgres_changes',
         {
           event: '*',
           schema: 'public',
           table: 'user_progress',
           filter: `user_id=eq.${user.id}`,
         },
         () => fetchWeeklyData()
       )
       .subscribe();
 
     const quizChannel = supabase
       .channel('weekly-quiz-changes')
       .on(
         'postgres_changes',
         {
           event: '*',
           schema: 'public',
           table: 'quiz_attempts',
           filter: `user_id=eq.${user.id}`,
         },
         () => fetchWeeklyData()
       )
       .subscribe();
 
     return () => {
       supabase.removeChannel(progressChannel);
       supabase.removeChannel(quizChannel);
     };
   }, [user?.id]);
 
   return { weeklyData, loading };
 }