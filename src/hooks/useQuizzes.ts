 import { useEffect, useState } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 
 export interface Quiz {
   id: string;
   title: string;
   category: string;
   difficulty: string;
   questionCount: number;
   timeLimit: number;
   bestScore?: number;
 }
 
 export interface QuizQuestion {
   id: string;
   question: string;
   options: string[];
   correctAnswer: number;
   explanation: string | null;
 }
 
 export interface QuizStats {
   totalQuizzesTaken: number;
   bestScore: number;
   avgScore: number;
   currentStreak: number;
 }
 
 export function useQuizzes() {
   const { user } = useAuth();
   const [quizzes, setQuizzes] = useState<Quiz[]>([]);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     const fetchQuizzes = async () => {
       // Fetch all quizzes with question count
       const { data: quizzesData, error: quizzesError } = await supabase
         .from('quizzes')
         .select(`
           *,
           courses (category),
           quiz_questions (id)
         `);
 
       if (quizzesError) {
         console.error('Error fetching quizzes:', quizzesError);
         setLoading(false);
         return;
       }
 
       let quizzesWithStats: Quiz[] = (quizzesData || []).map((q: any) => ({
         id: q.id,
         title: q.title,
         category: q.courses?.category || 'General',
         difficulty: q.difficulty || 'medium',
         questionCount: q.quiz_questions?.length || 0,
         timeLimit: Math.max(5, (q.quiz_questions?.length || 5) * 1), // 1 min per question
       }));
 
       // If user is logged in, fetch their best scores
       if (user?.id) {
         const { data: attemptsData } = await supabase
           .from('quiz_attempts')
           .select('quiz_id, score, total_questions')
           .eq('user_id', user.id);
 
         // Calculate best score per quiz
         const bestScoreMap = new Map<string, number>();
         (attemptsData || []).forEach((a) => {
           const percentage = Math.round((a.score / a.total_questions) * 100);
           const existing = bestScoreMap.get(a.quiz_id);
           if (!existing || percentage > existing) {
             bestScoreMap.set(a.quiz_id, percentage);
           }
         });
 
         quizzesWithStats = quizzesWithStats.map((quiz) => ({
           ...quiz,
           bestScore: bestScoreMap.get(quiz.id),
         }));
       }
 
       setQuizzes(quizzesWithStats);
       setLoading(false);
     };
 
     fetchQuizzes();
 
     // Subscribe to realtime updates
     const quizzesChannel = supabase
       .channel('quizzes-list-changes')
       .on(
         'postgres_changes',
         {
           event: '*',
           schema: 'public',
           table: 'quizzes',
         },
         () => fetchQuizzes()
       )
       .subscribe();
 
     let attemptsChannel: ReturnType<typeof supabase.channel> | null = null;
     if (user?.id) {
       attemptsChannel = supabase
         .channel('quizzes-attempts-changes')
         .on(
           'postgres_changes',
           {
             event: '*',
             schema: 'public',
             table: 'quiz_attempts',
             filter: `user_id=eq.${user.id}`,
           },
           () => fetchQuizzes()
         )
         .subscribe();
     }
 
     return () => {
       supabase.removeChannel(quizzesChannel);
       if (attemptsChannel) {
         supabase.removeChannel(attemptsChannel);
       }
     };
   }, [user?.id]);
 
   return { quizzes, loading };
 }
 
 export function useQuizQuestions(quizId: string | null) {
   const [questions, setQuestions] = useState<QuizQuestion[]>([]);
   const [loading, setLoading] = useState(false);
 
   useEffect(() => {
     if (!quizId) {
       setQuestions([]);
       return;
     }
 
     const fetchQuestions = async () => {
       setLoading(true);
       const { data, error } = await supabase
         .from('quiz_questions')
         .select('*')
         .eq('quiz_id', quizId)
         .order('order_index');
 
       if (error) {
         console.error('Error fetching questions:', error);
         setLoading(false);
         return;
       }
 
       const formattedQuestions: QuizQuestion[] = (data || []).map((q) => ({
         id: q.id,
         question: q.question,
        options: Array.isArray(q.options) ? (q.options as string[]) : [],
         correctAnswer: q.correct_answer,
         explanation: q.explanation,
       }));
 
       setQuestions(formattedQuestions);
       setLoading(false);
     };
 
     fetchQuestions();
   }, [quizId]);
 
   return { questions, loading };
 }
 
 export function useQuizStats() {
   const { user } = useAuth();
   const [stats, setStats] = useState<QuizStats>({
     totalQuizzesTaken: 0,
     bestScore: 0,
     avgScore: 0,
     currentStreak: 0,
   });
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     if (!user?.id) {
       setLoading(false);
       return;
     }
 
     const fetchStats = async () => {
       const { data: attemptsData, error } = await supabase
         .from('quiz_attempts')
         .select('score, total_questions, completed_at')
         .eq('user_id', user.id)
         .order('completed_at', { ascending: false });
 
       if (error) {
         console.error('Error fetching quiz stats:', error);
         setLoading(false);
         return;
       }
 
       const attempts = attemptsData || [];
       
       if (attempts.length === 0) {
         setStats({
           totalQuizzesTaken: 0,
           bestScore: 0,
           avgScore: 0,
           currentStreak: 0,
         });
         setLoading(false);
         return;
       }
 
       const scores = attempts.map((a) => Math.round((a.score / a.total_questions) * 100));
       
       // Calculate streak (consecutive days with quiz attempts)
       let streak = 0;
       const today = new Date();
       today.setHours(0, 0, 0, 0);
       
       const attemptDates = [...new Set(
         attempts.map((a) => {
           const date = new Date(a.completed_at);
           date.setHours(0, 0, 0, 0);
           return date.getTime();
         })
       )].sort((a, b) => b - a);
 
       for (let i = 0; i < attemptDates.length; i++) {
         const expectedDate = new Date(today);
         expectedDate.setDate(today.getDate() - i);
         expectedDate.setHours(0, 0, 0, 0);
         
         if (attemptDates[i] === expectedDate.getTime()) {
           streak++;
         } else {
           break;
         }
       }
 
       setStats({
         totalQuizzesTaken: attempts.length,
         bestScore: Math.max(...scores),
         avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
         currentStreak: streak,
       });
       setLoading(false);
     };
 
     fetchStats();
 
     // Subscribe to realtime updates
     const channel = supabase
       .channel('quiz-stats-changes')
       .on(
         'postgres_changes',
         {
           event: '*',
           schema: 'public',
           table: 'quiz_attempts',
           filter: `user_id=eq.${user.id}`,
         },
         () => fetchStats()
       )
       .subscribe();
 
     return () => {
       supabase.removeChannel(channel);
     };
   }, [user?.id]);
 
   return { stats, loading };
 }