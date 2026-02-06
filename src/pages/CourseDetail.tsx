import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  CheckCircle2,
  Play,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Course {
  id: string;
  title: string;
  description: string | null;
  category: string;
  difficulty: string | null;
  total_lessons: number | null;
  image_url: string | null;
}

interface Lesson {
  id: string;
  title: string;
  content: string | null;
  duration_minutes: number | null;
  order_index: number | null;
  course_id: string;
}

interface LessonProgress {
  lesson_id: string;
  completed: boolean;
}

const difficultyColors: Record<string, string> = {
  beginner: 'bg-success/10 text-success',
  intermediate: 'bg-warning/10 text-warning',
  advanced: 'bg-destructive/10 text-destructive',
};

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Map<string, boolean>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!id) return;

      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (courseError) {
        console.error('Error fetching course:', courseError);
        toast.error('Course not found');
        navigate('/dashboard/courses');
        return;
      }

      setCourse(courseData);

      // Fetch lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', id)
        .order('order_index', { ascending: true });

      if (lessonsError) {
        console.error('Error fetching lessons:', lessonsError);
      } else {
        setLessons(lessonsData || []);
      }

      // Fetch user progress if logged in
      if (user?.id) {
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('lesson_id, completed')
          .eq('user_id', user.id)
          .eq('course_id', id);

        const progressMap = new Map<string, boolean>();
        (progressData || []).forEach((p) => {
          if (p.lesson_id) {
            progressMap.set(p.lesson_id, p.completed || false);
          }
        });
        setProgress(progressMap);
      }

      setLoading(false);
    };

    fetchCourseData();

    // Subscribe to progress changes
    if (user?.id && id) {
      const channel = supabase
        .channel(`course-progress-${id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_progress',
            filter: `user_id=eq.${user.id}`,
          },
          () => fetchCourseData()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [id, user?.id, navigate]);

  const handleToggleLesson = async (lessonId: string, completed: boolean) => {
    if (!user?.id || !id) return;

    const existingProgress = progress.get(lessonId);

    if (existingProgress !== undefined) {
      // Update existing progress
      const { error } = await supabase
        .from('user_progress')
        .update({ 
          completed: !completed,
          completed_at: !completed ? new Date().toISOString() : null
        })
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId);

      if (error) {
        console.error('Error updating progress:', error);
        toast.error('Failed to update progress');
        return;
      }
    } else {
      // Insert new progress
      const { error } = await supabase
        .from('user_progress')
        .insert({
          user_id: user.id,
          course_id: id,
          lesson_id: lessonId,
          completed: true,
          completed_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error inserting progress:', error);
        toast.error('Failed to update progress');
        return;
      }
    }

    // Update local state
    setProgress((prev) => {
      const newMap = new Map(prev);
      newMap.set(lessonId, !completed);
      return newMap;
    });

    toast.success(!completed ? 'Lesson completed!' : 'Lesson marked incomplete');
  };

  const completedCount = Array.from(progress.values()).filter(Boolean).length;
  const totalLessons = lessons.length || course?.total_lessons || 1;
  const progressPercentage = Math.round((completedCount / totalLessons) * 100);

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 w-full" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate('/dashboard/courses')}
        className="gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Courses
      </Button>

      {/* Course Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="h-3 bg-gradient-primary" />
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge className={cn("mb-2", difficultyColors[course.difficulty || 'beginner'])}>
                  {course.difficulty || 'beginner'}
                </Badge>
                <CardTitle className="text-2xl">{course.title}</CardTitle>
                <CardDescription className="mt-2">
                  {course.description || 'No description available'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                {totalLessons} lessons
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {lessons.reduce((acc, l) => acc + (l.duration_minutes || 10), 0)} min total
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                {completedCount} completed
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span className="font-medium text-primary">{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Lessons List */}
      <div>
        <h2 className="text-lg font-display font-semibold mb-4">Lessons</h2>
        {lessons.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="py-12 text-center">
              <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No lessons available</h3>
              <p className="text-muted-foreground">
                Lessons for this course haven't been added yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {lessons.map((lesson, index) => {
              const isCompleted = progress.get(lesson.id) || false;
              return (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className={cn(
                      "border-0 shadow-md transition-all cursor-pointer hover:shadow-lg",
                      isCompleted && "bg-success/5 border-l-4 border-l-success"
                    )}
                    onClick={() => handleToggleLesson(lesson.id, isCompleted)}
                  >
                    <CardContent className="py-4 flex items-center gap-4">
                      <Checkbox
                        checked={isCompleted}
                        onCheckedChange={() => handleToggleLesson(lesson.id, isCompleted)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1">
                        <h3 className={cn(
                          "font-medium",
                          isCompleted && "text-muted-foreground line-through"
                        )}>
                          {index + 1}. {lesson.title}
                        </h3>
                        {lesson.content && (
                          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                            {lesson.content}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {lesson.duration_minutes || 10} min
                      </div>
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      ) : (
                        <Play className="w-5 h-5 text-primary" />
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
