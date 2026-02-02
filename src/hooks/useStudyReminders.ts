import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  requestNotificationPermission, 
  getNotificationPermission, 
  showNotification,
  type NotificationPermission 
} from '@/lib/notifications';

interface StudySession {
  time: string;
  duration: number;
  subject: string;
  activity: string;
}

interface StudyPlan {
  id: string;
  title: string;
  schedule: unknown;
  is_active: boolean | null;
}

export const REMINDER_OPTIONS = [5, 10, 15, 30] as const;
export type ReminderMinutes = typeof REMINDER_OPTIONS[number];

const CHECK_INTERVAL_MS = 60000; // Check every minute

function getReminderMinutes(): ReminderMinutes {
  const stored = localStorage.getItem('studyReminderMinutes');
  if (stored && REMINDER_OPTIONS.includes(Number(stored) as ReminderMinutes)) {
    return Number(stored) as ReminderMinutes;
  }
  return 15;
}

function parseTime(timeStr: string): { hours: number; minutes: number } | null {
  const cleanTime = timeStr.trim().toUpperCase();
  const isPM = cleanTime.includes('PM');
  const isAM = cleanTime.includes('AM');
  
  const timePart = cleanTime.replace(/\s*(AM|PM)\s*/i, '');
  const parts = timePart.split(':');
  
  if (parts.length < 2) return null;
  
  let hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  
  if (isNaN(hours) || isNaN(minutes)) return null;
  
  if (isPM && hours !== 12) {
    hours += 12;
  } else if (isAM && hours === 12) {
    hours = 0;
  }
  
  return { hours, minutes };
}

function getTodaysDayName(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' });
}

export function useStudyReminders() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>(getNotificationPermission());
  const [enabled, setEnabled] = useState(() => {
    return localStorage.getItem('studyRemindersEnabled') === 'true';
  });
  const [reminderMinutes, setReminderMinutesState] = useState<ReminderMinutes>(getReminderMinutes);
  const notifiedSessionsRef = useRef<Set<string>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const requestPermission = useCallback(async () => {
    const perm = await requestNotificationPermission();
    setPermission(perm);
    return perm;
  }, []);

  const setReminderMinutes = useCallback((minutes: ReminderMinutes) => {
    setReminderMinutesState(minutes);
    localStorage.setItem('studyReminderMinutes', String(minutes));
    // Clear notified sessions so reminders recalculate with new timing
    notifiedSessionsRef.current.clear();
  }, []);

  const enableReminders = useCallback(async () => {
    const perm = await requestPermission();
    if (perm === 'granted') {
      setEnabled(true);
      localStorage.setItem('studyRemindersEnabled', 'true');
      return true;
    }
    return false;
  }, [requestPermission]);

  const disableReminders = useCallback(() => {
    setEnabled(false);
    localStorage.setItem('studyRemindersEnabled', 'false');
  }, []);

  const checkUpcomingSessions = useCallback(async () => {
    if (!user?.id || !enabled || permission !== 'granted') return;

    const { data: plans, error } = await supabase
      .from('study_plans')
      .select('id, title, schedule, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (error || !plans) return;

    const today = getTodaysDayName();
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    (plans as StudyPlan[]).forEach((plan) => {
      const schedule = plan.schedule as Record<string, StudySession[]> | null;
      const todaySessions = schedule?.[today] || [];

      todaySessions.forEach((session, index) => {
        const parsed = parseTime(session.time);
        if (!parsed) return;

        const sessionMinutes = parsed.hours * 60 + parsed.minutes;
        const minutesUntilSession = sessionMinutes - currentMinutes;
        const sessionKey = `${plan.id}-${today}-${index}-${now.toDateString()}`;

        // Check if session is coming up in the reminder window
        if (
          minutesUntilSession > 0 &&
          minutesUntilSession <= reminderMinutes &&
          !notifiedSessionsRef.current.has(sessionKey)
        ) {
          notifiedSessionsRef.current.add(sessionKey);
          
          showNotification(`📚 Study session in ${minutesUntilSession} min`, {
            body: `${session.subject}: ${session.activity}`,
            tag: sessionKey,
            requireInteraction: true,
          });
        }
      });
    });

    // Clean up old session keys (from previous days)
    const todayStr = now.toDateString();
    notifiedSessionsRef.current.forEach(key => {
      if (!key.includes(todayStr)) {
        notifiedSessionsRef.current.delete(key);
      }
    });
  }, [user?.id, enabled, permission, reminderMinutes]);

  // Set up interval to check for upcoming sessions
  useEffect(() => {
    if (enabled && permission === 'granted') {
      // Check immediately
      checkUpcomingSessions();
      
      // Then check every minute
      intervalRef.current = setInterval(checkUpcomingSessions, CHECK_INTERVAL_MS);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, permission, checkUpcomingSessions]);

  return {
    permission,
    enabled,
    reminderMinutes,
    setReminderMinutes,
    enableReminders,
    disableReminders,
    requestPermission,
    isSupported: 'Notification' in window,
  };
}
