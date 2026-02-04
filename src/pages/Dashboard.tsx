import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeProgress } from '@/hooks/useRealtimeProgress';
import { StrengthsWeaknesses } from '@/components/dashboard/StrengthsWeaknesses';
import { StudyStreakWidget } from '@/components/dashboard/StudyStreakWidget';
import { ActivityHeatmap } from '@/components/dashboard/ActivityHeatmap';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Brain,
  Trophy,
  Clock,
  TrendingUp,
  ArrowRight,
  Target,
  Flame,
  Loader2,
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

const weeklyData = [
  { day: 'Mon', minutes: 45, score: 72 },
  { day: 'Tue', minutes: 60, score: 78 },
  { day: 'Wed', minutes: 30, score: 65 },
  { day: 'Thu', minutes: 90, score: 85 },
  { day: 'Fri', minutes: 45, score: 70 },
  { day: 'Sat', minutes: 120, score: 92 },
  { day: 'Sun', minutes: 60, score: 80 },
];

const recentTopics = [
  { name: 'JavaScript Fundamentals', progress: 75, color: 'bg-chart-1' },
  { name: 'React Hooks', progress: 45, color: 'bg-chart-2' },
  { name: 'TypeScript Basics', progress: 30, color: 'bg-chart-3' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { stats, loading } = useRealtimeProgress();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Student';

  const statCards = [
    {
      title: 'Lessons',
      value: stats.totalLessonsCompleted,
      icon: BookOpen,
      color: 'from-chart-1 to-blue-600',
      subtitle: 'Completed',
    },
    {
      title: 'Quizzes',
      value: stats.totalQuizzesTaken,
      icon: Target,
      color: 'from-chart-2 to-teal-600',
      subtitle: 'Taken',
    },
    {
      title: 'Avg Score',
      value: `${stats.averageScore}%`,
      icon: Trophy,
      color: 'from-chart-4 to-orange-600',
      subtitle: 'Performance',
    },
    {
      title: 'Study Time',
      value: `${stats.totalMinutes}`,
      icon: TrendingUp,
      color: 'from-chart-3 to-green-600',
      subtitle: 'Minutes',
    },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">
            {greeting}, {firstName}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Ready to continue your learning journey?
          </p>
        </div>
        <div className="flex items-center gap-3 bg-gradient-primary text-white px-4 py-3 rounded-xl">
          <Flame className="w-6 h-6" />
          <div>
            <p className="text-sm opacity-90">Study Streak</p>
            <p className="text-xl font-bold">{loading ? '...' : `${stats.recentQuizzes.length > 0 ? 'Active' : 'Start today!'}`}</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-10`} />
              <CardContent className="p-4 md:p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin mt-2" />
                    ) : (
                      <p className="text-2xl md:text-3xl font-bold mt-1">{stat.value}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Study Time Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-display">Weekly Progress</CardTitle>
                  <CardDescription>Your study time this week</CardDescription>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {stats.totalMinutes} mins total
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData}>
                    <defs>
                      <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="minutes"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorMinutes)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-lg h-full">
            <CardHeader>
              <CardTitle className="font-display">Quick Actions</CardTitle>
              <CardDescription>Jump right back in</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => navigate('/dashboard/tutor')}
                className="w-full justify-between bg-gradient-primary hover:opacity-90"
              >
                <span className="flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Ask AI Tutor
                </span>
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => navigate('/dashboard/courses')}
                variant="outline"
                className="w-full justify-between"
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Continue Learning
                </span>
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => navigate('/dashboard/quizzes')}
                variant="outline"
                className="w-full justify-between"
              >
                <span className="flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Take a Quiz
                </span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Strengths & Weaknesses and Study Streak Widget */}
      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <StrengthsWeaknesses topicPerformance={stats.topicPerformance} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <StudyStreakWidget recentQuizzes={stats.recentQuizzes} loading={loading} />
        </motion.div>
      </div>

      {/* Activity Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <ActivityHeatmap />
      </motion.div>

      {/* Topics Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-display">Current Topics</CardTitle>
                <CardDescription>Your learning progress</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/courses')}>
                View all <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {recentTopics.map((topic, index) => (
                <motion.div
                  key={topic.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{topic.name}</span>
                    <span className="text-sm text-muted-foreground">{topic.progress}%</span>
                  </div>
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${topic.progress}%` }}
                      transition={{ duration: 1, delay: 0.7 + index * 0.1 }}
                      className={`absolute inset-y-0 left-0 ${topic.color} rounded-full`}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
