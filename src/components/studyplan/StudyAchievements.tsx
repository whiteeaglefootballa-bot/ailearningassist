import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Flame,
  Trophy,
  Star,
  Zap,
  Target,
  BookOpen,
  Award,
  Crown,
  Sparkles,
  Clock,
  CheckCircle2,
  Lock,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  requirement: number;
  type: 'sessions' | 'streak' | 'hours' | 'plans';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

const ACHIEVEMENTS: Achievement[] = [
  // Session achievements
  { id: 'first-session', name: 'First Steps', description: 'Complete your first study session', icon: <Star className="w-5 h-5" />, requirement: 1, type: 'sessions', tier: 'bronze' },
  { id: 'ten-sessions', name: 'Getting Started', description: 'Complete 10 study sessions', icon: <BookOpen className="w-5 h-5" />, requirement: 10, type: 'sessions', tier: 'bronze' },
  { id: 'fifty-sessions', name: 'Dedicated Learner', description: 'Complete 50 study sessions', icon: <Target className="w-5 h-5" />, requirement: 50, type: 'sessions', tier: 'silver' },
  { id: 'hundred-sessions', name: 'Study Champion', description: 'Complete 100 study sessions', icon: <Trophy className="w-5 h-5" />, requirement: 100, type: 'sessions', tier: 'gold' },
  { id: 'twofifty-sessions', name: 'Master Scholar', description: 'Complete 250 study sessions', icon: <Crown className="w-5 h-5" />, requirement: 250, type: 'sessions', tier: 'platinum' },
  
  // Streak achievements
  { id: 'streak-3', name: 'On a Roll', description: 'Maintain a 3-day streak', icon: <Flame className="w-5 h-5" />, requirement: 3, type: 'streak', tier: 'bronze' },
  { id: 'streak-7', name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: <Flame className="w-5 h-5" />, requirement: 7, type: 'streak', tier: 'silver' },
  { id: 'streak-14', name: 'Unstoppable', description: 'Maintain a 14-day streak', icon: <Zap className="w-5 h-5" />, requirement: 14, type: 'streak', tier: 'gold' },
  { id: 'streak-30', name: 'Legendary Focus', description: 'Maintain a 30-day streak', icon: <Sparkles className="w-5 h-5" />, requirement: 30, type: 'streak', tier: 'platinum' },
  
  // Hours achievements
  { id: 'hours-5', name: 'Time Investor', description: 'Study for 5 hours total', icon: <Clock className="w-5 h-5" />, requirement: 5, type: 'hours', tier: 'bronze' },
  { id: 'hours-20', name: 'Deep Focus', description: 'Study for 20 hours total', icon: <Clock className="w-5 h-5" />, requirement: 20, type: 'hours', tier: 'silver' },
  { id: 'hours-50', name: 'Knowledge Seeker', description: 'Study for 50 hours total', icon: <Award className="w-5 h-5" />, requirement: 50, type: 'hours', tier: 'gold' },
  
  // Plan achievements
  { id: 'first-plan', name: 'Planner', description: 'Create your first study plan', icon: <CheckCircle2 className="w-5 h-5" />, requirement: 1, type: 'plans', tier: 'bronze' },
  { id: 'three-plans', name: 'Multi-Tasker', description: 'Create 3 study plans', icon: <Target className="w-5 h-5" />, requirement: 3, type: 'plans', tier: 'silver' },
];

const TIER_COLORS = {
  bronze: 'from-amber-600 to-amber-800',
  silver: 'from-slate-300 to-slate-500',
  gold: 'from-yellow-400 to-amber-500',
  platinum: 'from-violet-400 to-purple-600',
};

const TIER_BG = {
  bronze: 'bg-amber-500/10 border-amber-500/30',
  silver: 'bg-slate-400/10 border-slate-400/30',
  gold: 'bg-yellow-500/10 border-yellow-500/30',
  platinum: 'bg-violet-500/10 border-violet-500/30',
};

const TIER_TEXT = {
  bronze: 'text-amber-600',
  silver: 'text-slate-500',
  gold: 'text-yellow-600',
  platinum: 'text-violet-500',
};

interface StudyAchievementsProps {
  compact?: boolean;
}

export function StudyAchievements({ compact = false }: StudyAchievementsProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalSessions: 0,
    currentStreak: 0,
    maxStreak: 0,
    totalHours: 0,
    totalPlans: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchStats();

      const channel = supabase
        .channel('achievements-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'study_session_completions',
            filter: `user_id=eq.${user.id}`,
          },
          () => fetchStats()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id]);

  const fetchStats = async () => {
    const [completionsResult, plansResult] = await Promise.all([
      supabase
        .from('study_session_completions')
        .select('*, study_plans!inner(schedule)')
        .eq('user_id', user?.id),
      supabase
        .from('study_plans')
        .select('id')
        .eq('user_id', user?.id),
    ]);

    const completions = completionsResult.data || [];
    const plans = plansResult.data || [];

    // Calculate total sessions
    const totalSessions = completions.length;

    // Calculate total hours from completed sessions
    let totalMinutes = 0;
    completions.forEach((completion: any) => {
      const schedule = completion.study_plans?.schedule?.weeklySchedule || {};
      const daySessions = schedule[completion.day] || [];
      const session = daySessions[completion.session_index];
      if (session?.duration) {
        totalMinutes += session.duration;
      }
    });
    const totalHours = Math.round(totalMinutes / 60 * 10) / 10;

    // Calculate streak (simplified - based on unique days with completions)
    const completionDates = new Set(
      completions.map((c: any) => new Date(c.completed_at).toDateString())
    );
    const sortedDates = Array.from(completionDates).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );

    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toDateString();

      if (completionDates.has(dateStr)) {
        tempStreak++;
        if (i === 0 || currentStreak > 0) {
          currentStreak = tempStreak;
        }
        maxStreak = Math.max(maxStreak, tempStreak);
      } else {
        if (i > 0) break; // Allow today to not have completions yet
        tempStreak = 0;
      }
    }

    setStats({
      totalSessions,
      currentStreak,
      maxStreak: Math.max(maxStreak, currentStreak),
      totalHours,
      totalPlans: plans.length,
    });
    setLoading(false);
  };

  const getProgress = (achievement: Achievement): number => {
    let current = 0;
    switch (achievement.type) {
      case 'sessions':
        current = stats.totalSessions;
        break;
      case 'streak':
        current = stats.maxStreak;
        break;
      case 'hours':
        current = stats.totalHours;
        break;
      case 'plans':
        current = stats.totalPlans;
        break;
    }
    return Math.min(100, (current / achievement.requirement) * 100);
  };

  const isUnlocked = (achievement: Achievement): boolean => {
    return getProgress(achievement) >= 100;
  };

  const unlockedCount = ACHIEVEMENTS.filter(a => isUnlocked(a)).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const displayedAchievements = showAll ? ACHIEVEMENTS : ACHIEVEMENTS.slice(0, compact ? 4 : 8);

  return (
    <div className="space-y-4">
      {/* Streak Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className={cn(
          "border-0 shadow-lg overflow-hidden",
          stats.currentStreak >= 7 ? "bg-gradient-to-r from-orange-500/10 to-red-500/10" : ""
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center",
                    stats.currentStreak > 0 
                      ? "bg-gradient-to-br from-orange-400 to-red-500" 
                      : "bg-muted"
                  )}
                  animate={stats.currentStreak > 0 ? {
                    scale: [1, 1.05, 1],
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Flame className={cn(
                    "w-8 h-8",
                    stats.currentStreak > 0 ? "text-white" : "text-muted-foreground"
                  )} />
                </motion.div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold">{stats.currentStreak}</span>
                    <span className="text-lg text-muted-foreground">day streak</span>
                    {stats.currentStreak >= 7 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-2xl"
                      >
                        🔥
                      </motion.span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {stats.currentStreak === 0 
                      ? "Complete a session today to start your streak!"
                      : stats.currentStreak >= 7
                        ? "You're on fire! Keep it up!"
                        : `Best streak: ${stats.maxStreak} days`
                    }
                  </p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-6 text-center">
                <div>
                  <p className="text-2xl font-bold">{stats.totalSessions}</p>
                  <p className="text-xs text-muted-foreground">Sessions</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalHours}h</p>
                  <p className="text-xs text-muted-foreground">Studied</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{unlockedCount}/{ACHIEVEMENTS.length}</p>
                  <p className="text-xs text-muted-foreground">Badges</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Achievements Grid */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Trophy className="w-5 h-5 text-warning" />
                Achievements
              </CardTitle>
              <CardDescription>
                {unlockedCount} of {ACHIEVEMENTS.length} unlocked
              </CardDescription>
            </div>
            <Progress value={(unlockedCount / ACHIEVEMENTS.length) * 100} className="w-24 h-2" />
          </div>
        </CardHeader>
        <CardContent>
          <div className={cn(
            "grid gap-3",
            compact ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4"
          )}>
            <AnimatePresence>
              {displayedAchievements.map((achievement, index) => {
                const unlocked = isUnlocked(achievement);
                const progress = getProgress(achievement);

                return (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "relative p-3 rounded-xl border-2 transition-all",
                      unlocked 
                        ? TIER_BG[achievement.tier]
                        : "bg-muted/30 border-muted"
                    )}
                  >
                    {/* Badge Icon */}
                    <div className="flex items-start justify-between mb-2">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        unlocked
                          ? `bg-gradient-to-br ${TIER_COLORS[achievement.tier]} text-white`
                          : "bg-muted text-muted-foreground"
                      )}>
                        {unlocked ? achievement.icon : <Lock className="w-4 h-4" />}
                      </div>
                      {unlocked && (
                        <Badge 
                          variant="secondary" 
                          className={cn("text-[10px] uppercase font-bold", TIER_TEXT[achievement.tier])}
                        >
                          {achievement.tier}
                        </Badge>
                      )}
                    </div>

                    {/* Badge Info */}
                    <h4 className={cn(
                      "font-semibold text-sm mb-0.5",
                      !unlocked && "text-muted-foreground"
                    )}>
                      {achievement.name}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {achievement.description}
                    </p>

                    {/* Progress */}
                    {!unlocked && (
                      <div className="mt-2">
                        <Progress value={progress} className="h-1" />
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {Math.round(progress)}% complete
                        </p>
                      </div>
                    )}

                    {/* Unlocked Shine Effect */}
                    {unlocked && (
                      <motion.div
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-foreground/5 to-transparent"
                        initial={{ x: '-100%' }}
                        animate={{ x: '200%' }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      />
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {ACHIEVEMENTS.length > displayedAchievements.length && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full mt-4 text-sm text-primary hover:underline"
            >
              {showAll ? 'Show less' : `Show all ${ACHIEVEMENTS.length} achievements`}
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
