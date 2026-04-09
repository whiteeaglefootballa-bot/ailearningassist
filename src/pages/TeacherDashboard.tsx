import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Trophy, Users, FileText, Plus, BarChart3 } from 'lucide-react';

interface TeacherStats {
  totalCourses: number;
  totalQuizzes: number;
  totalStudents: number;
  totalMaterials: number;
}

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<TeacherStats>({
    totalCourses: 0,
    totalQuizzes: 0,
    totalStudents: 0,
    totalMaterials: 0,
  });
  const [recentAttempts, setRecentAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [coursesRes, quizzesRes, attemptsRes, materialsRes, progressRes] = await Promise.all([
        supabase.from('courses').select('id', { count: 'exact', head: true }),
        supabase.from('quizzes').select('id', { count: 'exact', head: true }),
        supabase.from('quiz_attempts').select('id, score, total_questions, completed_at, quiz_id, quizzes(title)').order('completed_at', { ascending: false }).limit(10),
        supabase.from('course_materials').select('id', { count: 'exact', head: true }),
        supabase.from('user_progress').select('user_id').then(res => {
          const uniqueUsers = new Set((res.data || []).map(p => p.user_id));
          return { count: uniqueUsers.size };
        }),
      ]);

      setStats({
        totalCourses: coursesRes.count || 0,
        totalQuizzes: quizzesRes.count || 0,
        totalStudents: progressRes.count || 0,
        totalMaterials: materialsRes.count || 0,
      });
      setRecentAttempts(attemptsRes.data || []);
      setLoading(false);
    };

    fetchStats();
  }, []);

  const statCards = [
    { label: 'Total Courses', value: stats.totalCourses, icon: BookOpen, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Total Quizzes', value: stats.totalQuizzes, icon: Trophy, color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Active Students', value: stats.totalStudents, icon: Users, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Materials Uploaded', value: stats.totalMaterials, icon: FileText, color: 'text-secondary-foreground', bg: 'bg-secondary' },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Teacher Dashboard</h1>
          <p className="text-muted-foreground">Manage your courses, quizzes, and track student progress</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{loading ? '...' : stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/dashboard/teacher/courses')}>
          <CardContent className="p-6 flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Plus className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Manage Courses</h3>
              <p className="text-sm text-muted-foreground">Create, edit and manage courses & lessons</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/dashboard/teacher/quizzes')}>
          <CardContent className="p-6 flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-warning/10 flex items-center justify-center">
              <Trophy className="w-7 h-7 text-warning" />
            </div>
            <div>
              <h3 className="font-semibold">Manage Quizzes</h3>
              <p className="text-sm text-muted-foreground">Create quizzes and add questions</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/dashboard/teacher/students')}>
          <CardContent className="p-6 flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center">
              <BarChart3 className="w-7 h-7 text-success" />
            </div>
            <div>
              <h3 className="font-semibold">Student Progress</h3>
              <p className="text-sm text-muted-foreground">View student performance & reports</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Quiz Attempts */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Recent Quiz Attempts</CardTitle>
        </CardHeader>
        <CardContent>
          {recentAttempts.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">No quiz attempts yet.</p>
          ) : (
            <div className="space-y-3">
              {recentAttempts.map((attempt) => (
                <div key={attempt.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">{(attempt.quizzes as any)?.title || 'Quiz'}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(attempt.completed_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{attempt.score}/{attempt.total_questions}</p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round((attempt.score / attempt.total_questions) * 100)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
