import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Users, BookOpen, Trophy, MessageSquare, Activity,
  TrendingUp, Clock, BarChart3,
} from 'lucide-react';
import { format, subDays } from 'date-fns';

export default function AdminActivity() {
  const { isAdmin } = useUserRole();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-activity'],
    queryFn: async () => {
      const [
        { count: totalUsers },
        { count: totalCourses },
        { count: totalQuizzes },
        { count: totalAttempts },
        { data: recentAttempts },
        { data: recentProgress },
        { count: totalMessages },
        { data: profiles },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('quizzes').select('*', { count: 'exact', head: true }),
        supabase.from('quiz_attempts').select('*', { count: 'exact', head: true }),
        supabase
          .from('quiz_attempts')
          .select('*, quizzes(title)')
          .order('completed_at', { ascending: false })
          .limit(15),
        supabase
          .from('user_progress')
          .select('*, courses(title)')
          .eq('completed', true)
          .order('completed_at', { ascending: false })
          .limit(10),
        supabase.from('chat_messages').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('user_id, full_name'),
      ]);

      // Weekly active users (users with quiz attempts in last 7 days)
      const weekAgo = subDays(new Date(), 7).toISOString();
      const { data: weeklyActive } = await supabase
        .from('quiz_attempts')
        .select('user_id')
        .gte('completed_at', weekAgo);

      const activeUserCount = new Set(weeklyActive?.map(a => a.user_id) || []).size;

      // Average quiz score
      const { data: allScores } = await supabase
        .from('quiz_attempts')
        .select('score, total_questions');

      const avgScore = allScores && allScores.length > 0
        ? Math.round(allScores.reduce((sum, a) => sum + (a.score / a.total_questions) * 100, 0) / allScores.length)
        : 0;

      const nameMap = new Map((profiles || []).map(p => [p.user_id, p.full_name || 'Unknown']));

      return {
        totalUsers: totalUsers || 0,
        totalCourses: totalCourses || 0,
        totalQuizzes: totalQuizzes || 0,
        totalAttempts: totalAttempts || 0,
        totalMessages: totalMessages || 0,
        activeUserCount,
        avgScore,
        recentAttempts: (recentAttempts || []).map(a => ({
          ...a,
          userName: nameMap.get(a.user_id) || 'Unknown',
        })),
        recentProgress: (recentProgress || []).map(p => ({
          ...p,
          userName: nameMap.get(p.user_id) || 'Unknown',
        })),
      };
    },
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-destructive">Access Denied</h2>
        <p className="text-muted-foreground mt-2">Admin privileges required.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const overviewStats = [
    { label: 'Total Users', value: stats?.totalUsers, icon: Users, color: 'text-primary' },
    { label: 'Active (7d)', value: stats?.activeUserCount, icon: Activity, color: 'text-green-500' },
    { label: 'Courses', value: stats?.totalCourses, icon: BookOpen, color: 'text-blue-500' },
    { label: 'Quizzes', value: stats?.totalQuizzes, icon: Trophy, color: 'text-yellow-500' },
    { label: 'Quiz Attempts', value: stats?.totalAttempts, icon: BarChart3, color: 'text-purple-500' },
    { label: 'Avg Score', value: `${stats?.avgScore}%`, icon: TrendingUp, color: 'text-emerald-500' },
    { label: 'AI Messages', value: stats?.totalMessages, icon: MessageSquare, color: 'text-pink-500' },
    { label: 'Completions', value: stats?.recentProgress?.length, icon: Clock, color: 'text-orange-500' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">System Activity Monitor</h1>
        <p className="text-muted-foreground">Overview of all platform activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {overviewStats.map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Quiz Attempts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Recent Quiz Attempts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Quiz</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats?.recentAttempts.map((a: any) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.userName}</TableCell>
                    <TableCell>{a.quizzes?.title || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={a.score / a.total_questions >= 0.7 ? 'default' : 'destructive'}>
                        {a.score}/{a.total_questions}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(a.completed_at), 'MMM d, HH:mm')}
                    </TableCell>
                  </TableRow>
                ))}
                {(!stats?.recentAttempts || stats.recentAttempts.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                      No quiz attempts yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Course Completions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-500" />
              Recent Course Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats?.recentProgress.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.userName}</TableCell>
                    <TableCell>{p.courses?.title || 'N/A'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {p.completed_at ? format(new Date(p.completed_at), 'MMM d, HH:mm') : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
                {(!stats?.recentProgress || stats.recentProgress.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                      No completions yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
