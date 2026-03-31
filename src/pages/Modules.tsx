import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLearningTracks } from '@/hooks/useLearningTracks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Code, Palette, Calculator, Globe, Beaker, ChevronRight, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, typeof Code> = {
  Code, Palette, Calculator, Globe, Beaker, BookOpen, Layers,
};

const colorMap: Record<string, string> = {
  primary: 'from-primary/20 to-primary/5 border-primary/20',
  accent: 'from-accent/20 to-accent/5 border-accent/20',
  success: 'from-green-500/20 to-green-500/5 border-green-500/20',
};

const iconColorMap: Record<string, string> = {
  primary: 'bg-primary/10 text-primary',
  accent: 'bg-accent/10 text-accent',
  success: 'bg-green-500/10 text-green-600',
};

export default function Modules() {
  const navigate = useNavigate();
  const { tracks, loading } = useLearningTracks();

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="border-0 shadow-md">
              <CardHeader><Skeleton className="h-12 w-12 rounded-xl mb-3" /><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-full mt-2" /></CardHeader>
              <CardContent><Skeleton className="h-4 w-full" /><Skeleton className="h-2 w-full mt-3" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold flex items-center gap-3">
          <Layers className="w-8 h-8 text-primary" />
          Learning Modules
        </h1>
        <p className="text-muted-foreground mt-1">Follow structured learning paths to master new skills</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tracks.map((track, index) => {
          const Icon = iconMap[track.icon || 'BookOpen'] || BookOpen;
          const color = track.color || 'primary';
          const progressPercent = track.totalLessons > 0
            ? Math.round((track.completedLessons / track.totalLessons) * 100)
            : 0;

          return (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={cn(
                  "group cursor-pointer hover:shadow-xl transition-all border shadow-md overflow-hidden bg-gradient-to-br",
                  colorMap[color] || colorMap.primary
                )}
                onClick={() => navigate(`/dashboard/modules/${track.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", iconColorMap[color] || iconColorMap.primary)}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {track.courseCount} {track.courseCount === 1 ? 'course' : 'courses'}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors mt-2">
                    {track.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {track.description || 'Explore this learning track'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {track.totalLessons} lessons total
                      </span>
                      <span className="font-medium text-primary">{progressPercent}%</span>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                    <div className="flex items-center justify-end text-sm font-medium text-primary group-hover:translate-x-1 transition-transform">
                      View Track <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {tracks.length === 0 && (
        <div className="text-center py-12">
          <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No learning modules yet</h3>
          <p className="text-muted-foreground">Learning tracks will appear here once they're added</p>
        </div>
      )}
    </div>
  );
}
