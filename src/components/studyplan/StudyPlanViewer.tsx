import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Calendar,
  Clock,
  Target,
  Lightbulb,
  CheckCircle2,
  BookOpen,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

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

export function StudyPlanViewer({ plan, onBack }: StudyPlanViewerProps) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const [selectedDay, setSelectedDay] = useState(
    DAYS_ORDER.includes(today) ? today : 'Monday'
  );

  const getDaySchedule = (day: string): StudySession[] => {
    return plan.weeklySchedule?.[day] || [];
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
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{getTotalHours()}h</p>
              <p className="text-xs text-muted-foreground">Weekly Hours</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">{getActiveDays()}</p>
              <p className="text-xs text-muted-foreground">Study Days</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-success" />
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
                    return (
                      <TabsTrigger
                        key={day}
                        value={day}
                        className={cn(
                          "flex flex-col py-2 gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                          isToday && "ring-2 ring-primary ring-offset-2"
                        )}
                      >
                        <span className="text-xs font-medium">{day.slice(0, 3)}</span>
                        {sessions.length > 0 && (
                          <span className="text-[10px] opacity-70">{sessions.length} sessions</span>
                        )}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {DAYS_ORDER.map(day => (
                  <TabsContent key={day} value={day} className="mt-4">
                    <ScrollArea className="h-[400px] pr-4">
                      {getDaySchedule(day).length > 0 ? (
                        <div className="space-y-3">
                          {getDaySchedule(day).map((session, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <Card className="border shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="font-mono">
                                        {session.time}
                                      </Badge>
                                      <Badge className="bg-primary/10 text-primary">
                                        {session.duration} min
                                      </Badge>
                                    </div>
                                  </div>
                                  <h4 className="font-semibold text-lg mb-1">{session.subject}</h4>
                                  <p className="text-muted-foreground text-sm mb-3">{session.activity}</p>
                                  {session.tip && (
                                    <div className="flex items-start gap-2 bg-muted/50 rounded-lg p-3">
                                      <Lightbulb className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                                      <p className="text-xs text-muted-foreground">{session.tip}</p>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
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
