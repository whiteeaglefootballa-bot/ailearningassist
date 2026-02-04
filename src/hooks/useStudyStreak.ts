import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfDay, subDays, isSameDay, parseISO } from 'date-fns';

interface StudyStreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: Date | null;
  loading: boolean;
}

export function useStudyStreak(): StudyStreakData {
  const { user } = useAuth();
  const [data, setData] = useState<StudyStreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: null,
    loading: true,
  });

  useEffect(() => {
    if (!user?.id) return;

    const calculateStreak = async () => {
      // Fetch all activity dates from progress and quiz attempts
      const [progressResult, quizResult] = await Promise.all([
        supabase
          .from('user_progress')
          .select('created_at, completed_at')
          .eq('user_id', user.id),
        supabase
          .from('quiz_attempts')
          .select('completed_at')
          .eq('user_id', user.id),
      ]);

      // Collect all activity dates
      const activityDates = new Set<string>();
      
      (progressResult.data || []).forEach((p) => {
        if (p.created_at) {
          activityDates.add(startOfDay(parseISO(p.created_at)).toISOString());
        }
        if (p.completed_at) {
          activityDates.add(startOfDay(parseISO(p.completed_at)).toISOString());
        }
      });

      (quizResult.data || []).forEach((q) => {
        if (q.completed_at) {
          activityDates.add(startOfDay(parseISO(q.completed_at)).toISOString());
        }
      });

      // Sort dates descending
      const sortedDates = Array.from(activityDates)
        .map((d) => new Date(d))
        .sort((a, b) => b.getTime() - a.getTime());

      if (sortedDates.length === 0) {
        setData({ currentStreak: 0, longestStreak: 0, lastActiveDate: null, loading: false });
        return;
      }

      const today = startOfDay(new Date());
      const lastActive = sortedDates[0];
      
      // Calculate current streak
      let currentStreak = 0;
      let checkDate = today;
      
      // Check if active today or yesterday to start counting
      const isActiveToday = isSameDay(lastActive, today);
      const isActiveYesterday = isSameDay(lastActive, subDays(today, 1));
      
      if (isActiveToday || isActiveYesterday) {
        checkDate = isActiveToday ? today : subDays(today, 1);
        
        for (let i = 0; i < sortedDates.length; i++) {
          if (isSameDay(sortedDates[i], checkDate)) {
            currentStreak++;
            checkDate = subDays(checkDate, 1);
          } else if (sortedDates[i] < checkDate) {
            // Gap in streak
            break;
          }
        }
      }

      // Calculate longest streak
      let longestStreak = 0;
      let tempStreak = 1;
      
      for (let i = 0; i < sortedDates.length - 1; i++) {
        const diff = Math.round(
          (sortedDates[i].getTime() - sortedDates[i + 1].getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (diff === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

      setData({
        currentStreak,
        longestStreak,
        lastActiveDate: lastActive,
        loading: false,
      });
    };

    calculateStreak();
  }, [user?.id]);

  return data;
}
