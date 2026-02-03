import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  requestNotificationPermission, 
  getNotificationPermission, 
  showNotification,
  type NotificationPermission 
} from '@/lib/notifications';

interface LearningGoal {
  id: string;
  title: string;
  goal_type: 'daily' | 'weekly';
  target_value: number;
  current_value: number;
  period_start: string;
  is_active: boolean;
}

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // Check every 5 minutes

// Thresholds for when to send expiration warnings
const DAILY_WARNING_HOURS = 2; // Warn 2 hours before daily goal expires
const WEEKLY_WARNING_HOURS = 24; // Warn 24 hours before weekly goal expires

function getStorageKey(userId: string) {
  return `goalExpirationRemindersEnabled_${userId}`;
}

export function useGoalExpirationReminders() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>(getNotificationPermission());
  const [enabled, setEnabled] = useState(false);
  const notifiedGoalsRef = useRef<Set<string>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load enabled state from localStorage when user changes
  useEffect(() => {
    if (user?.id) {
      const stored = localStorage.getItem(getStorageKey(user.id));
      setEnabled(stored === 'true');
    }
  }, [user?.id]);

  const requestPermission = useCallback(async () => {
    const perm = await requestNotificationPermission();
    setPermission(perm);
    return perm;
  }, []);

  const enableReminders = useCallback(async () => {
    const perm = await requestPermission();
    if (perm === 'granted' && user?.id) {
      setEnabled(true);
      localStorage.setItem(getStorageKey(user.id), 'true');
      return true;
    }
    return false;
  }, [requestPermission, user?.id]);

  const disableReminders = useCallback(() => {
    if (user?.id) {
      setEnabled(false);
      localStorage.setItem(getStorageKey(user.id), 'false');
    }
  }, [user?.id]);

  const checkExpiringGoals = useCallback(async () => {
    if (!user?.id || !enabled || permission !== 'granted') return;

    const { data: goals, error } = await supabase
      .from('learning_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (error || !goals) return;

    const now = new Date();
    const todayStr = now.toDateString();

    (goals as LearningGoal[]).forEach((goal) => {
      // Skip if already completed
      if (goal.current_value >= goal.target_value) return;

      const periodStart = new Date(goal.period_start);
      periodStart.setHours(0, 0, 0, 0);

      let endTime: Date;
      let warningHours: number;

      if (goal.goal_type === 'daily') {
        // Daily goal ends at midnight of the next day
        endTime = new Date(periodStart);
        endTime.setDate(endTime.getDate() + 1);
        warningHours = DAILY_WARNING_HOURS;
      } else {
        // Weekly goal ends 7 days after period_start
        endTime = new Date(periodStart);
        endTime.setDate(endTime.getDate() + 7);
        warningHours = WEEKLY_WARNING_HOURS;
      }

      const hoursRemaining = (endTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      const notificationKey = `${goal.id}-${todayStr}-${goal.goal_type}`;

      // Check if within warning window and not yet notified
      if (
        hoursRemaining > 0 &&
        hoursRemaining <= warningHours &&
        !notifiedGoalsRef.current.has(notificationKey)
      ) {
        notifiedGoalsRef.current.add(notificationKey);

        const remaining = goal.target_value - goal.current_value;
        const timeLeft = goal.goal_type === 'daily'
          ? `${Math.floor(hoursRemaining)}h left`
          : `${Math.floor(hoursRemaining / 24)}d ${Math.floor(hoursRemaining % 24)}h left`;

        showNotification(`⏰ Goal expiring soon!`, {
          body: `"${goal.title}" needs ${remaining} more to complete. ${timeLeft}`,
          tag: notificationKey,
          requireInteraction: true,
        });
      }
    });

    // Clean up old notification keys
    notifiedGoalsRef.current.forEach((key) => {
      if (!key.includes(todayStr)) {
        notifiedGoalsRef.current.delete(key);
      }
    });
  }, [user?.id, enabled, permission]);

  // Set up interval to check for expiring goals
  useEffect(() => {
    if (enabled && permission === 'granted') {
      // Check immediately
      checkExpiringGoals();

      // Then check periodically
      intervalRef.current = setInterval(checkExpiringGoals, CHECK_INTERVAL_MS);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, permission, checkExpiringGoals]);

  return {
    permission,
    enabled,
    enableReminders,
    disableReminders,
    requestPermission,
    isSupported: 'Notification' in window,
  };
}
