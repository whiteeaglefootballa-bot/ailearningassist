import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface QuizAttemptWithTitle {
  score: number;
  total_questions: number;
  completed_at: string;
  quizTitle?: string;
}

interface ProgressStats {
  totalLessonsCompleted: number;
  totalQuizzesTaken: number;
  averageScore: number;
  totalMinutes: number;
  topicPerformance: { topic: string; score: number; attempts: number }[];
  recentQuizzes: QuizAttemptWithTitle[];
}

export function useRealtimeProgress() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ProgressStats>({
    totalLessonsCompleted: 0,
    totalQuizzesTaken: 0,
    averageScore: 0,
    totalMinutes: 0,
    topicPerformance: [],
    recentQuizzes: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    // Fetch initial data
    const fetchStats = async () => {
      const [progressResult, quizResult] = await Promise.all([
        supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user.id),
        supabase
          .from('quiz_attempts')
          .select('*, quizzes(title, course_id, courses(category))')
          .eq('user_id', user.id),
      ]);

      const progress = progressResult.data || [];
      const quizzes = quizResult.data || [];

      // Calculate topic performance
      const topicMap = new Map<string, { scores: number[]; attempts: number }>();
      quizzes.forEach((attempt: any) => {
        const category = attempt.quizzes?.courses?.category || 'General';
        const existing = topicMap.get(category) || { scores: [], attempts: 0 };
        existing.scores.push((attempt.score / attempt.total_questions) * 100);
        existing.attempts++;
        topicMap.set(category, existing);
      });

      const topicPerformance = Array.from(topicMap.entries()).map(([topic, data]) => ({
        topic,
        score: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
        attempts: data.attempts,
      }));

      // Format recent quizzes sorted by date
      const recentQuizzes: QuizAttemptWithTitle[] = quizzes
        .sort((a: any, b: any) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
        .map((q: any) => ({
          score: q.score,
          total_questions: q.total_questions,
          completed_at: q.completed_at,
          quizTitle: q.quizzes?.title,
        }));

      setStats({
        totalLessonsCompleted: progress.filter(p => p.completed).length,
        totalQuizzesTaken: quizzes.length,
        averageScore: quizzes.length
          ? Math.round(quizzes.reduce((acc: number, q: any) => acc + (q.score / q.total_questions) * 100, 0) / quizzes.length)
          : 0,
        totalMinutes: progress.reduce((acc, p) => acc + (p.time_spent_minutes || 0), 0),
        topicPerformance,
        recentQuizzes,
      });
      setLoading(false);
    };

    fetchStats();

    // Subscribe to realtime updates
    const progressChannel = supabase
      .channel('user-progress-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_progress',
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchStats()
      )
      .subscribe();

    const quizChannel = supabase
      .channel('quiz-attempts-changes')
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
      supabase.removeChannel(progressChannel);
      supabase.removeChannel(quizChannel);
    };
  }, [user?.id]);

  return { stats, loading };
}
