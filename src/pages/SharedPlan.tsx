import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import {
  Calendar,
  Clock,
  Target,
  Lightbulb,
  BookOpen,
  ArrowLeft,
  Sparkles,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface StudySession {
  time: string;
  duration: number;
  subject: string;
  activity: string;
  tip: string;
}

interface SharedPlan {
  id: string;
  title: string;
  goals: string[];
  schedule: Record<string, StudySession[]>;
  available_hours_per_week: number;
  preferred_days: string[];
}

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function SharedPlan() {
  const { token } = useParams<{ token: string }>();
  const [plan, setPlan] = useState<SharedPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const [selectedDay, setSelectedDay] = useState(
    DAYS_ORDER.includes(today) ? today : 'Monday'
  );

  useEffect(() => {
    if (token) {
      fetchSharedPlan();
    }
  }, [token]);

  const fetchSharedPlan = async () => {
    setLoading(true);
    setError(null);

    const { data, error: rpcError } = await supabase
      .rpc('get_shared_study_plan', { p_share_token: token });

    if (rpcError) {
      setError('Failed to load the shared plan.');
    } else if (!data) {
      setError('This share link is invalid or has expired.');
    } else {
      setPlan(data as unknown as SharedPlan);
    }
    setLoading(false);
  };

  const getDaySchedule = (day: string): StudySession[] => {
    return plan?.schedule?.[day] || [];
  };

  const getTotalHours = () => {
    if (!plan?.schedule) return 0;
    let total = 0;
    Object.values(plan.schedule).forEach(sessions => {
      sessions.forEach(session => {
        total += session.duration;
      });
    });
    return Math.round(total / 60 * 10) / 10;
  };

  const getActiveDays = () => {
    if (!plan?.schedule) return 0;
    return Object.entries(plan.schedule).filter(
      ([_, sessions]) => sessions.length > 0
    ).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading shared plan...</p>
        </div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Plan Not Found</h2>
            <p className="text-muted-foreground mb-6">{error || 'This share link is invalid or has expired.'}</p>
            <Button asChild>
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go to Homepage
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Badge variant="outline" className="mb-4">
            <Sparkles className="w-3 h-3 mr-1" />
            Shared Study Plan
          </Badge>
          <h1 className="text-3xl font-bold mb-2">{plan.title}</h1>
          <p className="text-muted-foreground">View-only access to this study schedule</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
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
                <p className="text-2xl font-bold">{plan.goals?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Goals</p>
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
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Weekly Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={selectedDay} onValueChange={setSelectedDay}>
                  <TabsList className="w-full grid grid-cols-7 h-auto p-1">
                    {DAYS_ORDER.map(day => {
                      const sessions = getDaySchedule(day);
                      const isToday = day === today;
                      return (
                        <TabsTrigger
                          key={day}
                          value={day}
                          className={`flex flex-col py-2 gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground ${
                            isToday ? 'ring-2 ring-primary ring-offset-2' : ''
                          }`}
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
                      <ScrollArea className="h-[380px] pr-4">
                        {getDaySchedule(day).length > 0 ? (
                          <div className="space-y-3">
                            {getDaySchedule(day).map((session, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                              >
                                <Card className="border shadow-sm">
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
                                    <h4 className="font-semibold text-lg mb-1">
                                      {session.subject}
                                    </h4>
                                    <p className="text-muted-foreground text-sm mb-3">
                                      {session.activity}
                                    </p>
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
            {/* Goals */}
            {plan.goals && plan.goals.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="w-4 h-4 text-success" />
                    Goals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {plan.goals.map((goal, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-3"
                      >
                        <Target className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{goal}</span>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* CTA */}
            <Card className="border-0 shadow-lg bg-primary/5">
              <CardContent className="p-6 text-center">
                <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Create Your Own Plan</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Sign up to generate personalized AI study plans
                </p>
                <Button asChild className="w-full">
                  <Link to="/auth">Get Started Free</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
