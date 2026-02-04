import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useStudyStreak } from '@/hooks/useStudyStreak';
import { Flame, Trophy, TrendingUp, TrendingDown, Minus, Calendar, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface QuizAttempt {
  score: number;
  total_questions: number;
  completed_at: string;
  quizTitle?: string;
}

interface StudyStreakWidgetProps {
  recentQuizzes: QuizAttempt[];
  loading?: boolean;
}

export function StudyStreakWidget({ recentQuizzes, loading = false }: StudyStreakWidgetProps) {
  const { currentStreak, longestStreak, lastActiveDate, loading: streakLoading } = useStudyStreak();

  const isLoading = loading || streakLoading;

  // Get last 5 quiz attempts
  const latestQuizzes = recentQuizzes.slice(0, 5);

  // Calculate trend (comparing last 3 to previous 3)
  const getTrend = () => {
    if (recentQuizzes.length < 2) return 'neutral';
    
    const recent = recentQuizzes.slice(0, 3);
    const previous = recentQuizzes.slice(3, 6);
    
    if (previous.length === 0) return 'neutral';
    
    const recentAvg = recent.reduce((acc, q) => acc + (q.score / q.total_questions) * 100, 0) / recent.length;
    const previousAvg = previous.reduce((acc, q) => acc + (q.score / q.total_questions) * 100, 0) / previous.length;
    
    if (recentAvg > previousAvg + 5) return 'up';
    if (recentAvg < previousAvg - 5) return 'down';
    return 'neutral';
  };

  const trend = getTrend();

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground';
  const trendBg = trend === 'up' ? 'bg-success/10' : trend === 'down' ? 'bg-destructive/10' : 'bg-muted';

  return (
    <Card className="border-0 shadow-lg h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="font-display">Activity & Performance</CardTitle>
            <CardDescription>Your study streak and quiz results</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Study Streak Section */}
        <div className="grid grid-cols-2 gap-3">
          {/* Current Streak */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="text-sm font-medium text-muted-foreground">Current Streak</span>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">{currentStreak}</span>
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            )}
          </motion.div>

          {/* Longest Streak */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span className="text-sm font-medium text-muted-foreground">Best Streak</span>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">{longestStreak}</span>
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            )}
          </motion.div>
        </div>

        {/* Last Active */}
        {lastActiveDate && !isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Last active {formatDistanceToNow(lastActiveDate, { addSuffix: true })}</span>
          </div>
        )}

        {/* Quiz Performance Section */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-sm">Recent Quiz Results</span>
            <Badge className={`${trendBg} ${trendColor} border-0`}>
              <TrendIcon className="w-3 h-3 mr-1" />
              {trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable'}
            </Badge>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : latestQuizzes.length > 0 ? (
            <div className="space-y-2">
              {latestQuizzes.map((quiz, index) => {
                const percentage = Math.round((quiz.score / quiz.total_questions) * 100);
                const isGood = percentage >= 70;
                const isMedium = percentage >= 50 && percentage < 70;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isGood ? 'bg-success' : isMedium ? 'bg-warning' : 'bg-destructive'
                        }`}
                      />
                      <div>
                        <p className="text-sm font-medium truncate max-w-[120px] sm:max-w-[180px]">
                          {quiz.quizTitle || 'Quiz'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(quiz.completed_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`font-mono ${
                        isGood
                          ? 'border-success/30 text-success bg-success/10'
                          : isMedium
                          ? 'border-warning/30 text-warning bg-warning/10'
                          : 'border-destructive/30 text-destructive bg-destructive/10'
                      }`}
                    >
                      {quiz.score}/{quiz.total_questions}
                    </Badge>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No quizzes taken yet. Start one to see your performance!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
