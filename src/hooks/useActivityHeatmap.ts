import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfDay, subDays, format, parseISO, eachDayOfInterval } from 'date-fns';

export interface DayActivity {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4; // 0 = no activity, 4 = highest
}

interface UseActivityHeatmapResult {
  activities: DayActivity[];
  loading: boolean;
  totalActivities: number;
  activeDays: number;
}

export function useActivityHeatmap(days: number = 365): UseActivityHeatmapResult {
  const { user } = useAuth();
  const [activities, setActivities] = useState<DayActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchActivityData = async () => {
      const endDate = new Date();
      const startDate = subDays(endDate, days);

      // Fetch all activity data
      const [progressResult, quizResult, sessionsResult] = await Promise.all([
        supabase
          .from('user_progress')
          .select('created_at, completed_at')
          .eq('user_id', user.id)
          .gte('created_at', startDate.toISOString()),
        supabase
          .from('quiz_attempts')
          .select('completed_at')
          .eq('user_id', user.id)
          .gte('completed_at', startDate.toISOString()),
        supabase
          .from('study_session_completions')
          .select('completed_at')
          .eq('user_id', user.id)
          .gte('completed_at', startDate.toISOString()),
      ]);

      // Count activities per day
      const activityMap = new Map<string, number>();

      (progressResult.data || []).forEach((p) => {
        if (p.created_at) {
          const dateKey = format(startOfDay(parseISO(p.created_at)), 'yyyy-MM-dd');
          activityMap.set(dateKey, (activityMap.get(dateKey) || 0) + 1);
        }
        if (p.completed_at) {
          const dateKey = format(startOfDay(parseISO(p.completed_at)), 'yyyy-MM-dd');
          activityMap.set(dateKey, (activityMap.get(dateKey) || 0) + 1);
        }
      });

      (quizResult.data || []).forEach((q) => {
        if (q.completed_at) {
          const dateKey = format(startOfDay(parseISO(q.completed_at)), 'yyyy-MM-dd');
          activityMap.set(dateKey, (activityMap.get(dateKey) || 0) + 2); // Quizzes count more
        }
      });

      (sessionsResult.data || []).forEach((s) => {
        if (s.completed_at) {
          const dateKey = format(startOfDay(parseISO(s.completed_at)), 'yyyy-MM-dd');
          activityMap.set(dateKey, (activityMap.get(dateKey) || 0) + 1);
        }
      });

      // Calculate max for normalization
      const counts = Array.from(activityMap.values());
      const maxCount = Math.max(...counts, 1);

      // Generate all days in range
      const allDays = eachDayOfInterval({ start: startDate, end: endDate });
      
      const dayActivities: DayActivity[] = allDays.map((date) => {
        const dateKey = format(date, 'yyyy-MM-dd');
        const count = activityMap.get(dateKey) || 0;
        
        // Calculate level (0-4) based on activity count
        let level: 0 | 1 | 2 | 3 | 4 = 0;
        if (count > 0) {
          const ratio = count / maxCount;
          if (ratio <= 0.25) level = 1;
          else if (ratio <= 0.5) level = 2;
          else if (ratio <= 0.75) level = 3;
          else level = 4;
        }

        return { date: dateKey, count, level };
      });

      setActivities(dayActivities);
      setLoading(false);
    };

    fetchActivityData();
  }, [user?.id, days]);

  const totalActivities = activities.reduce((sum, a) => sum + a.count, 0);
  const activeDays = activities.filter((a) => a.count > 0).length;

  return { activities, loading, totalActivities, activeDays };
}
