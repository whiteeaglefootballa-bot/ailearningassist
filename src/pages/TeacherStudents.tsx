import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, BookOpen, Trophy, Loader2 } from 'lucide-react';

interface StudentProgress {
  user_id: string;
  email: string;
  completedLessons: number;
  quizzesTaken: number;
  avgScore: number;
}

export default function TeacherStudents() {
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [courseStats, setCourseStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Get all progress records
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('user_id, completed, course_id, courses(title)');

      // Get all quiz attempts
      const { data: attemptsData } = await supabase
        .from('quiz_attempts')
        .select('user_id, score, total_questions');

      // Get profiles for names
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name');

      const profileMap = new Map((profilesData || []).map(p => [p.user_id, p.full_name]));

      // Aggregate per student
      const studentMap = new Map<string, StudentProgress>();
      
      (progressData || []).forEach(p => {
        if (!studentMap.has(p.user_id)) {
          studentMap.set(p.user_id, {
            user_id: p.user_id,
            email: profileMap.get(p.user_id) || p.user_id.slice(0, 8),
            completedLessons: 0,
            quizzesTaken: 0,
            avgScore: 0,
          });
        }
        if (p.completed) {
          studentMap.get(p.user_id)!.completedLessons++;
        }
      });

      (attemptsData || []).forEach(a => {
        if (!studentMap.has(a.user_id)) {
          studentMap.set(a.user_id, {
            user_id: a.user_id,
            email: profileMap.get(a.user_id) || a.user_id.slice(0, 8),
            completedLessons: 0,
            quizzesTaken: 0,
            avgScore: 0,
          });
        }
        const s = studentMap.get(a.user_id)!;
        s.quizzesTaken++;
        s.avgScore = ((s.avgScore * (s.quizzesTaken - 1)) + (a.score / a.total_questions * 100)) / s.quizzesTaken;
      });

      setStudents(Array.from(studentMap.values()));

      // Course-level stats
      const courseMap = new Map<string, { title: string; enrolled: Set<string>; completed: number }>();
      (progressData || []).forEach(p => {
        const courseTitle = (p.courses as any)?.title || 'Unknown';
        if (!courseMap.has(p.course_id)) {
          courseMap.set(p.course_id, { title: courseTitle, enrolled: new Set(), completed: 0 });
        }
        courseMap.get(p.course_id)!.enrolled.add(p.user_id);
        if (p.completed) courseMap.get(p.course_id)!.completed++;
      });

      setCourseStats(Array.from(courseMap.entries()).map(([id, c]) => ({
        id, title: c.title, enrolled: c.enrolled.size, completed: c.completed,
      })));

      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-display font-bold">Student Progress</h1>
        <p className="text-muted-foreground">Track student performance across courses and quizzes</p>
      </div>

      {/* Course Performance */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Course Performance</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {courseStats.length === 0 ? (
            <Card className="border-0 shadow-md col-span-2"><CardContent className="py-8 text-center text-muted-foreground">No student activity yet.</CardContent></Card>
          ) : courseStats.map(cs => (
            <Card key={cs.id} className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{cs.title}</p>
                    <p className="text-xs text-muted-foreground">{cs.enrolled} students enrolled</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Lessons completed</span>
                  <span>{cs.completed}</span>
                </div>
                <Progress value={cs.enrolled > 0 ? (cs.completed / (cs.enrolled * 5)) * 100 : 0} className="h-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Student List */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Individual Students</h2>
        {students.length === 0 ? (
          <Card className="border-0 shadow-md"><CardContent className="py-8 text-center text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            No students have started learning yet.
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {students.map(s => (
              <Card key={s.user_id} className="border-0 shadow-md">
                <CardContent className="py-3 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {s.email[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{s.email}</p>
                    <div className="flex gap-3 mt-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />{s.completedLessons} lessons
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Trophy className="w-3 h-3" />{s.quizzesTaken} quizzes
                      </span>
                    </div>
                  </div>
                  <Badge variant={s.avgScore >= 70 ? 'default' : 'secondary'} className={s.avgScore >= 70 ? 'bg-success/10 text-success' : ''}>
                    {s.avgScore > 0 ? `${Math.round(s.avgScore)}%` : 'N/A'}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
