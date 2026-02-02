import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Target,
  Plus,
  Trash2,
  Check,
  Clock,
  Calendar,
  TrendingUp,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface LearningGoal {
  id: string;
  title: string;
  goal_type: 'daily' | 'weekly';
  target_value: number;
  unit: 'sessions' | 'hours' | 'tasks';
  current_value: number;
  period_start: string;
  is_active: boolean;
}

const UNIT_LABELS: Record<string, string> = {
  sessions: 'study sessions',
  hours: 'hours',
  tasks: 'tasks',
};

export function LearningGoals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    goal_type: 'daily' as 'daily' | 'weekly',
    target_value: 1,
    unit: 'sessions' as 'sessions' | 'hours' | 'tasks',
  });

  useEffect(() => {
    if (user?.id) {
      fetchGoals();
      setupRealtimeSubscription();
    }
  }, [user?.id]);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('learning-goals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'learning_goals',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchGoals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchGoals = async () => {
    const { data, error } = await supabase
      .from('learning_goals')
      .select('*')
      .eq('user_id', user?.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching goals:', error);
    } else {
      // Check if goals need to be reset based on period
      const updatedGoals = await Promise.all(
        (data || []).map(async (goal) => {
          const typedGoal = goal as LearningGoal;
          const needsReset = checkIfNeedsReset(typedGoal);
          if (needsReset) {
            await resetGoal(typedGoal.id);
            return { ...typedGoal, current_value: 0, period_start: new Date().toISOString().split('T')[0] };
          }
          return typedGoal;
        })
      );
      setGoals(updatedGoals);
    }
    setLoading(false);
  };

  const checkIfNeedsReset = (goal: LearningGoal): boolean => {
    const periodStart = new Date(goal.period_start);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    periodStart.setHours(0, 0, 0, 0);

    if (goal.goal_type === 'daily') {
      return periodStart < today;
    } else {
      // Weekly - check if it's been more than 7 days
      const diffTime = today.getTime() - periodStart.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      return diffDays >= 7;
    }
  };

  const resetGoal = async (goalId: string) => {
    await supabase
      .from('learning_goals')
      .update({
        current_value: 0,
        period_start: new Date().toISOString().split('T')[0],
      })
      .eq('id', goalId);
  };

  const createGoal = async () => {
    if (!newGoal.title.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a goal title',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase.from('learning_goals').insert({
      user_id: user?.id,
      title: newGoal.title,
      goal_type: newGoal.goal_type,
      target_value: newGoal.target_value,
      unit: newGoal.unit,
      current_value: 0,
      period_start: new Date().toISOString().split('T')[0],
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to create goal',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Goal created!',
        description: 'Start working towards your new goal',
      });
      setDialogOpen(false);
      setNewGoal({
        title: '',
        goal_type: 'daily',
        target_value: 1,
        unit: 'sessions',
      });
      fetchGoals();
    }
  };

  const incrementGoal = async (goal: LearningGoal) => {
    const newValue = Math.min(goal.current_value + 1, goal.target_value);
    
    const { error } = await supabase
      .from('learning_goals')
      .update({ current_value: newValue })
      .eq('id', goal.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update progress',
        variant: 'destructive',
      });
    } else {
      if (newValue === goal.target_value) {
        toast({
          title: '🎉 Goal completed!',
          description: `You've achieved your ${goal.goal_type} goal!`,
        });
      }
      fetchGoals();
    }
  };

  const deleteGoal = async (goalId: string) => {
    const { error } = await supabase
      .from('learning_goals')
      .delete()
      .eq('id', goalId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete goal',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Goal deleted',
        description: 'The goal has been removed',
      });
      fetchGoals();
    }
  };

  const getProgressPercentage = (goal: LearningGoal) => {
    return Math.round((goal.current_value / goal.target_value) * 100);
  };

  const getTimeRemaining = (goal: LearningGoal) => {
    const periodStart = new Date(goal.period_start);
    const now = new Date();
    
    if (goal.goal_type === 'daily') {
      const endOfDay = new Date(periodStart);
      endOfDay.setDate(endOfDay.getDate() + 1);
      const hoursLeft = Math.max(0, Math.floor((endOfDay.getTime() - now.getTime()) / (1000 * 60 * 60)));
      return `${hoursLeft}h left`;
    } else {
      const endOfWeek = new Date(periodStart);
      endOfWeek.setDate(endOfWeek.getDate() + 7);
      const daysLeft = Math.max(0, Math.floor((endOfWeek.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      return `${daysLeft}d left`;
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="py-8 text-center">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-display">Learning Goals</CardTitle>
              <p className="text-sm text-muted-foreground">Track your daily & weekly targets</p>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-gradient-primary hover:opacity-90">
                <Plus className="w-4 h-4 mr-1" />
                Add Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">Create New Goal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Goal Title</Label>
                  <Input
                    placeholder="e.g., Complete morning study session"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={newGoal.goal_type}
                      onValueChange={(v) => setNewGoal({ ...newGoal, goal_type: v as 'daily' | 'weekly' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Select
                      value={newGoal.unit}
                      onValueChange={(v) => setNewGoal({ ...newGoal, unit: v as 'sessions' | 'hours' | 'tasks' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sessions">Sessions</SelectItem>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="tasks">Tasks</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Target ({UNIT_LABELS[newGoal.unit]})</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={newGoal.target_value}
                    onChange={(e) => setNewGoal({ ...newGoal, target_value: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <Button onClick={createGoal} className="w-full bg-gradient-primary hover:opacity-90">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create Goal
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {goals.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-2">No goals set yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first learning goal to stay motivated!
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {goals.map((goal) => {
              const progress = getProgressPercentage(goal);
              const isComplete = progress >= 100;

              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`p-4 rounded-xl border ${
                    isComplete
                      ? 'bg-gradient-to-r from-success/10 to-success/5 border-success/30'
                      : 'bg-muted/30 border-border/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{goal.title}</h4>
                        <Badge
                          variant={goal.goal_type === 'daily' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {goal.goal_type === 'daily' ? (
                            <Clock className="w-3 h-3 mr-1" />
                          ) : (
                            <Calendar className="w-3 h-3 mr-1" />
                          )}
                          {goal.goal_type}
                        </Badge>
                        {isComplete && (
                          <Badge className="bg-success text-success-foreground text-xs">
                            <Check className="w-3 h-3 mr-1" />
                            Complete!
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {goal.current_value} / {goal.target_value} {UNIT_LABELS[goal.unit]} • {getTimeRemaining(goal)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!isComplete && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                          onClick={() => incrementGoal(goal)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteGoal(goal.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <Progress
                    value={progress}
                    className={`h-2 ${isComplete ? '[&>div]:bg-success' : ''}`}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  );
}
