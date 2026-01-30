import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import {
  TrendingUp,
  Target,
  Calendar,
  Clock,
  CheckCircle2,
  Flame,
  Trophy,
  Loader2,
} from 'lucide-react';

interface StoredPlan {
  id: string;
  title: string;
  goals: string[];
  available_hours_per_week: number;
  preferred_days: string[];
  schedule: any;
  created_at: string;
}


interface Completion {
  study_plan_id: string;
  day: string;
  session_index: number;
  completed_at: string;
}

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const chartConfig: ChartConfig = {
  completed: {
    label: 'Completed',
    color: 'hsl(var(--success))',
  },
  total: {
    label: 'Total',
    color: 'hsl(var(--muted))',
  },
  progress: {
    label: 'Progress',
    color: 'hsl(var(--primary))',
  },
};

export function WeeklySummary() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<StoredPlan[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchData();

      const channel = supabase
        .channel('weekly-summary-completions')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'study_session_completions',
            filter: `user_id=eq.${user.id}`,
          },
          () => fetchData()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id]);

  const fetchData = async () => {
    const [plansResult, completionsResult] = await Promise.all([
      supabase
        .from('study_plans')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true),
      supabase
        .from('study_session_completions')
        .select('*')
        .eq('user_id', user?.id),
    ]);

    if (plansResult.data) setPlans(plansResult.data);
    if (completionsResult.data) setCompletions(completionsResult.data);
    setLoading(false);
  };

  const getDailyData = () => {
    return DAYS_ORDER.map(day => {
      let totalSessions = 0;
      let completedSessions = 0;

      plans.forEach(plan => {
        const schedule = plan.schedule?.weeklySchedule || {};
        const daySessions = schedule[day] || [];
        totalSessions += daySessions.length;
        completedSessions += completions.filter(
          c => c.study_plan_id === plan.id && c.day === day
        ).length;
      });

      return {
        day: day.slice(0, 3),
        completed: completedSessions,
        total: totalSessions,
        percentage: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
      };
    });
  };

  const getPlanProgressData = () => {
    return plans.map(plan => {
      const schedule = plan.schedule?.weeklySchedule || {};
      let totalSessions = 0;
      let completedSessions = 0;

      DAYS_ORDER.forEach(day => {
        const daySessions = schedule[day] || [];
        totalSessions += daySessions.length;
        completedSessions += completions.filter(
          c => c.study_plan_id === plan.id && c.day === day
        ).length;
      });

      return {
        name: plan.title.length > 20 ? plan.title.slice(0, 20) + '...' : plan.title,
        fullName: plan.title,
        completed: completedSessions,
        total: totalSessions,
        percentage: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
      };
    });
  };

  const getOverallStats = () => {
    let totalSessions = 0;
    let completedSessions = 0;
    let totalMinutes = 0;
    let completedMinutes = 0;

    plans.forEach(plan => {
      const schedule = plan.schedule?.weeklySchedule || {};
      DAYS_ORDER.forEach(day => {
        const daySessions = schedule[day] || [];
        daySessions.forEach((session, index) => {
          totalSessions++;
          totalMinutes += session.duration || 0;
          if (completions.some(c => c.study_plan_id === plan.id && c.day === day && c.session_index === index)) {
            completedSessions++;
            completedMinutes += session.duration || 0;
          }
        });
      });
    });

    return {
      totalSessions,
      completedSessions,
      totalMinutes,
      completedMinutes,
      overallProgress: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
    };
  };

  const getStreak = () => {
    const todayIndex = new Date().getDay();
    const reorderedDays = [...DAYS_ORDER.slice(todayIndex === 0 ? 6 : todayIndex - 1), ...DAYS_ORDER.slice(0, todayIndex === 0 ? 6 : todayIndex - 1)].reverse();
    
    let streak = 0;
    for (const day of reorderedDays) {
      let dayHasSessions = false;
      let dayCompleted = true;

      plans.forEach(plan => {
        const schedule = plan.schedule?.weeklySchedule || {};
        const daySessions = schedule[day] || [];
        if (daySessions.length > 0) {
          dayHasSessions = true;
          const dayCompletions = completions.filter(c => c.study_plan_id === plan.id && c.day === day).length;
          if (dayCompletions < daySessions.length) {
            dayCompleted = false;
          }
        }
      });

      if (dayHasSessions && dayCompleted) {
        streak++;
      } else if (dayHasSessions) {
        break;
      }
    }
    return streak;
  };

  const getPieData = () => {
    const stats = getOverallStats();
    return [
      { name: 'Completed', value: stats.completedSessions, fill: 'hsl(var(--success))' },
      { name: 'Remaining', value: stats.totalSessions - stats.completedSessions, fill: 'hsl(var(--muted))' },
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="py-12 text-center">
          <Trophy className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No Active Plans</h3>
          <p className="text-muted-foreground text-sm">
            Create a study plan to see your weekly summary and progress charts.
          </p>
        </CardContent>
      </Card>
    );
  }

  const dailyData = getDailyData();
  const planProgress = getPlanProgressData();
  const stats = getOverallStats();
  const streak = getStreak();
  const pieData = getPieData();

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.overallProgress}%</p>
                <p className="text-xs text-muted-foreground">Overall Progress</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completedSessions}/{stats.totalSessions}</p>
                <p className="text-xs text-muted-foreground">Sessions Done</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{Math.round(stats.completedMinutes / 60 * 10) / 10}h</p>
                <p className="text-xs text-muted-foreground">Hours Studied</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <Flame className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{streak}</p>
                <p className="text-xs text-muted-foreground">Day Streak 🔥</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Daily Progress Bar Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Daily Progress
              </CardTitle>
              <CardDescription>Sessions completed each day this week</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                  />
                  <Bar
                    dataKey="total"
                    fill="hsl(var(--muted))"
                    radius={[4, 4, 0, 0]}
                    name="Total Sessions"
                  />
                  <Bar
                    dataKey="completed"
                    fill="hsl(var(--success))"
                    radius={[4, 4, 0, 0]}
                    name="Completed"
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Overall Completion Pie Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-success" />
                Weekly Completion
              </CardTitle>
              <CardDescription>Overall session completion rate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <ChartContainer config={chartConfig} className="h-[200px] w-[200px]">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-success" />
                  <span className="text-sm text-muted-foreground">Completed ({stats.completedSessions})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-muted" />
                  <span className="text-sm text-muted-foreground">Remaining ({stats.totalSessions - stats.completedSessions})</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Plan Progress */}
      {planProgress.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Trophy className="w-5 h-5 text-warning" />
                Progress by Plan
              </CardTitle>
              <CardDescription>How you're doing on each study plan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {planProgress.map((plan, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + index * 0.05 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm truncate max-w-[200px]" title={plan.fullName}>
                      {plan.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {plan.completed}/{plan.total}
                      </Badge>
                      <span className="text-sm font-semibold w-12 text-right">{plan.percentage}%</span>
                    </div>
                  </div>
                  <Progress value={plan.percentage} className="h-2" />
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
