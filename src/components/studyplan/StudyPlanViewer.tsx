import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar,
  Clock,
  Target,
  Lightbulb,
  CheckCircle2,
  BookOpen,
  ArrowLeft,
  Sparkles,
  Download,
} from 'lucide-react';
import { downloadICSFile } from '@/lib/ics-generator';

interface StudySession {
  time: string;
  duration: number;
  subject: string;
  activity: string;
  tip: string;
}

interface StudyPlan {
  id?: string;
  title: string;
  weeklySchedule: Record<string, StudySession[]>;
  weeklyGoals: string[];
  recommendations: string[];
}

interface StudyPlanViewerProps {
  plan: StudyPlan;
  onBack: () => void;
}

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface Completion {
  day: string;
  session_index: number;
}

export function StudyPlanViewer({ plan, onBack }: StudyPlanViewerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const [selectedDay, setSelectedDay] = useState(
    DAYS_ORDER.includes(today) ? today : 'Monday'
  );
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (plan.id && user?.id) {
      fetchCompletions();
      
      // Subscribe to realtime updates
      const channel = supabase
        .channel(`completions-${plan.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'study_session_completions',
            filter: `study_plan_id=eq.${plan.id}`,
          },
          () => fetchCompletions()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [plan.id, user?.id]);

  const fetchCompletions = async () => {
    if (!plan.id) return;
    
    const { data, error } = await supabase
      .from('study_session_completions')
      .select('day, session_index')
      .eq('study_plan_id', plan.id);

    if (!error && data) {
      setCompletions(data);
    }
    setLoading(false);
  };

  const isSessionCompleted = (day: string, sessionIndex: number) => {
    return completions.some(c => c.day === day && c.session_index === sessionIndex);
  };

  const toggleSessionCompletion = async (day: string, sessionIndex: number) => {
    if (!plan.id || !user?.id) return;

    const isCompleted = isSessionCompleted(day, sessionIndex);

    if (isCompleted) {
      // Remove completion
      const { error } = await supabase
        .from('study_session_completions')
        .delete()
        .eq('study_plan_id', plan.id)
        .eq('day', day)
        .eq('session_index', sessionIndex);

      if (error) {
        toast({ title: 'Error', description: 'Failed to update progress', variant: 'destructive' });
      }
    } else {
      // Add completion
      const { error } = await supabase
        .from('study_session_completions')
        .insert({
          user_id: user.id,
          study_plan_id: plan.id,
          day,
          session_index: sessionIndex,
        });

      if (error) {
        toast({ title: 'Error', description: 'Failed to update progress', variant: 'destructive' });
      } else {
        toast({ title: 'Session completed! 🎉', description: 'Keep up the great work!' });
      }
    }
  };

  const getDaySchedule = (day: string): StudySession[] => {
    return plan.weeklySchedule?.[day] || [];
  };

  const getDayProgress = (day: string) => {
    const sessions = getDaySchedule(day);
    if (sessions.length === 0) return 0;
    const completed = completions.filter(c => c.day === day).length;
    return Math.round((completed / sessions.length) * 100);
  };

  const getWeeklyProgress = () => {
    let totalSessions = 0;
    let completedSessions = 0;
    
    DAYS_ORDER.forEach(day => {
      const sessions = getDaySchedule(day);
      totalSessions += sessions.length;
      completedSessions += completions.filter(c => c.day === day).length;
    });
    
    return totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
  };

  const getTotalHours = () => {
    let total = 0;
    Object.values(plan.weeklySchedule || {}).forEach(sessions => {
      sessions.forEach(session => {
        total += session.duration;
      });
    });
    return Math.round(total / 60 * 10) / 10;
  };

  const getActiveDays = () => {
    return Object.entries(plan.weeklySchedule || {}).filter(
      ([_, sessions]) => sessions.length > 0
    ).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold">{plan.title}</h1>
            <p className="text-muted-foreground">Your personalized weekly schedule</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={() => downloadICSFile(plan)}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Export to Calendar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold">{getWeeklyProgress()}%</p>
              <p className="text-xs text-muted-foreground">Week Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">{getTotalHours()}h</p>
              <p className="text-xs text-muted-foreground">Weekly Hours</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{getActiveDays()}</p>
              <p className="text-xs text-muted-foreground">Study Days</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{plan.weeklyGoals?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Weekly Goals</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Schedule */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Weekly Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Day Tabs */}
              <Tabs value={selectedDay} onValueChange={setSelectedDay}>
                <TabsList className="w-full grid grid-cols-7 h-auto p-1">
                  {DAYS_ORDER.map(day => {
                    const sessions = getDaySchedule(day);
                    const isToday = day === today;
                    const progress = getDayProgress(day);
                    return (
                      <TabsTrigger
                        key={day}
                        value={day}
                        className={cn(
                          "flex flex-col py-2 gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground relative",
                          isToday && "ring-2 ring-primary ring-offset-2"
                        )}
                      >
                        <span className="text-xs font-medium">{day.slice(0, 3)}</span>
                        {sessions.length > 0 && (
                          <>
                            <span className="text-[10px] opacity-70">{sessions.length} sessions</span>
                            {progress > 0 && (
                              <div className="absolute bottom-0 left-1 right-1 h-0.5 bg-background/20 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-success transition-all duration-300"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            )}
                          </>
                        )}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {DAYS_ORDER.map(day => (
                  <TabsContent key={day} value={day} className="mt-4">
                    {getDaySchedule(day).length > 0 && (
                      <div className="mb-4 flex items-center gap-3">
                        <Progress value={getDayProgress(day)} className="flex-1 h-2" />
                        <span className="text-sm font-medium text-muted-foreground w-12">
                          {getDayProgress(day)}%
                        </span>
                      </div>
                    )}
                    <ScrollArea className="h-[380px] pr-4">
                      {getDaySchedule(day).length > 0 ? (
                        <div className="space-y-3">
                          {getDaySchedule(day).map((session, index) => {
                            const completed = isSessionCompleted(day, index);
                            return (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                              >
                                <Card className={cn(
                                  "border shadow-sm hover:shadow-md transition-all",
                                  completed && "bg-success/5 border-success/30"
                                )}>
                                  <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                      <Checkbox
                                        checked={completed}
                                        onCheckedChange={() => toggleSessionCompletion(day, index)}
                                        className="mt-1 h-5 w-5"
                                      />
                                      <div className="flex-1">
                                        <div className="flex items-start justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="font-mono">
                                              {session.time}
                                            </Badge>
                                            <Badge className="bg-primary/10 text-primary">
                                              {session.duration} min
                                            </Badge>
                                            {completed && (
                                              <Badge className="bg-success/10 text-success">
                                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                                Done
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                        <h4 className={cn(
                                          "font-semibold text-lg mb-1 transition-all",
                                          completed && "line-through text-muted-foreground"
                                        )}>
                                          {session.subject}
                                        </h4>
                                        <p className={cn(
                                          "text-muted-foreground text-sm mb-3",
                                          completed && "line-through"
                                        )}>
                                          {session.activity}
                                        </p>
                                        {session.tip && !completed && (
                                          <div className="flex items-start gap-2 bg-muted/50 rounded-lg p-3">
                                            <Lightbulb className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                                            <p className="text-xs text-muted-foreground">{session.tip}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center py-12">
                          <BookOpen className="w-12 h-12 text-muted-foreground/50 mb-4" />
                          <h4 className="font-medium text-muted-foreground">Rest Day</h4>
                          <p className="text-sm text-muted-foreground/70">No study sessions scheduled</p>
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Weekly Goals */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Target className="w-4 h-4 text-success" />
                Weekly Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {plan.weeklyGoals?.map((goal, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{goal}</span>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {plan.recommendations?.map((rec, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 bg-muted/50 rounded-lg p-3"
                  >
                    <Lightbulb className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{rec}</span>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
