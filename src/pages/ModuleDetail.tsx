import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLearningTrack } from '@/hooks/useLearningTracks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, BookOpen, ChevronRight, Code, Palette, Calculator, Globe, Beaker, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-500/10 text-green-600',
  intermediate: 'bg-yellow-500/10 text-yellow-600',
  advanced: 'bg-red-500/10 text-red-600',
};

const categoryIcons: Record<string, typeof Code> = {
  Programming: Code, Design: Palette, Mathematics: Calculator, Languages: Globe, Science: Beaker,
};

export default function ModuleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { track, loading } = useLearningTrack(id || '');

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader></Card>
          ))}
        </div>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="p-8 text-center">
        <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Track not found</h2>
        <Button variant="outline" onClick={() => navigate('/dashboard/modules')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Modules
        </Button>
      </div>
    );
  }

  const overallProgress = track.totalLessons > 0
    ? Math.round((track.completedLessons / track.totalLessons) * 100)
    : 0;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/modules')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Modules
        </Button>
        <h1 className="text-2xl md:text-3xl font-display font-bold">{track.title}</h1>
        <p className="text-muted-foreground mt-1">{track.description}</p>
        <div className="flex items-center gap-4 mt-4">
          <Badge variant="secondary">{track.courseCount} courses</Badge>
          <Badge variant="secondary">{track.totalLessons} lessons</Badge>
          <span className="text-sm font-medium text-primary">{overallProgress}% complete</span>
        </div>
        <Progress value={overallProgress} className="h-2 mt-3" />
      </div>

      {/* Course List */}
      <div className="space-y-4">
        <h2 className="text-lg font-display font-semibold">Courses in this track</h2>
        {track.courses.map((course, index) => {
          const CategoryIcon = categoryIcons[course.category] || BookOpen;
          return (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <Card
                className="group cursor-pointer hover:shadow-lg transition-all border-0 shadow-md"
                onClick={() => navigate(`/dashboard/courses/${course.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-lg flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {course.title}
                        </CardTitle>
                        <Badge className={cn("text-xs flex-shrink-0", difficultyColors[course.difficulty || 'beginner'])}>
                          {course.difficulty || 'beginner'}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-1 mt-1">
                        {course.description || 'No description available'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between ml-14">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" /> {course.total_lessons || 0} lessons
                      </span>
                      <span className="font-medium text-primary">{course.progress}%</span>
                    </div>
                    <Button size="sm" variant="ghost" className="group-hover:text-primary">
                      {course.progress > 0 ? 'Continue' : 'Start'} <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                  <div className="ml-14 mt-2">
                    <Progress value={course.progress} className="h-1.5" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
