import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Calendar,
  Clock,
  Target,
  Sparkles,
  Loader2,
  Plus,
  X,
  Brain,
} from 'lucide-react';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const SUGGESTED_GOALS = [
  'Master JavaScript fundamentals',
  'Build a React project',
  'Learn TypeScript basics',
  'Improve problem-solving skills',
  'Prepare for coding interviews',
  'Complete a certification course',
];

interface StudyPlanGeneratorProps {
  onPlanGenerated: (plan: any) => void;
}

export function StudyPlanGenerator({ onPlanGenerated }: StudyPlanGeneratorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [goals, setGoals] = useState<string[]>([]);
  const [customGoal, setCustomGoal] = useState('');
  const [hoursPerWeek, setHoursPerWeek] = useState(10);
  const [selectedDays, setSelectedDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);

  const addGoal = (goal: string) => {
    if (goal && !goals.includes(goal) && goals.length < 5) {
      setGoals([...goals, goal]);
      setCustomGoal('');
    }
  };

  const removeGoal = (goal: string) => {
    setGoals(goals.filter(g => g !== goal));
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const generatePlan = async () => {
    if (goals.length === 0) {
      toast({
        title: 'Add goals',
        description: 'Please add at least one learning goal',
        variant: 'destructive',
      });
      return;
    }

    if (selectedDays.length === 0) {
      toast({
        title: 'Select days',
        description: 'Please select at least one study day',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Fetch user preferences
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferred_subjects, learning_level')
        .eq('user_id', user?.id)
        .maybeSingle();

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-study-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          goals,
          availableHoursPerWeek: hoursPerWeek,
          preferredDays: selectedDays,
          subjects: profile?.preferred_subjects || [],
          learningLevel: profile?.learning_level || 'intermediate',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate plan');
      }

      const plan = await response.json();

      // Save to database
      const { data: savedPlan, error: saveError } = await supabase
        .from('study_plans')
        .insert({
          user_id: user?.id,
          title: plan.title,
          goals,
          available_hours_per_week: hoursPerWeek,
          preferred_days: selectedDays,
          schedule: plan,
        })
        .select()
        .single();

      if (saveError) throw saveError;

      toast({
        title: 'Study plan created!',
        description: 'Your personalized weekly schedule is ready.',
      });

      onPlanGenerated({ ...plan, id: savedPlan.id });
    } catch (error: any) {
      console.error('Error generating plan:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate study plan',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="font-display">AI Study Plan Generator</CardTitle>
            <CardDescription>Create a personalized weekly schedule based on your goals</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Goals Section */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Learning Goals (up to 5)
          </Label>
          
          {/* Selected Goals */}
          {goals.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {goals.map(goal => (
                <Badge
                  key={goal}
                  variant="secondary"
                  className="pl-3 pr-1 py-1.5 flex items-center gap-2"
                >
                  {goal}
                  <button
                    onClick={() => removeGoal(goal)}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Custom Goal Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter a custom goal..."
              value={customGoal}
              onChange={(e) => setCustomGoal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addGoal(customGoal)}
              disabled={goals.length >= 5}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => addGoal(customGoal)}
              disabled={!customGoal || goals.length >= 5}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Suggested Goals */}
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_GOALS.filter(g => !goals.includes(g)).slice(0, 4).map(goal => (
              <button
                key={goal}
                onClick={() => addGoal(goal)}
                disabled={goals.length >= 5}
                className="text-xs px-3 py-1.5 rounded-full border border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
              >
                + {goal}
              </button>
            ))}
          </div>
        </div>

        {/* Hours Per Week */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent" />
              Available Hours Per Week
            </span>
            <span className="text-lg font-bold text-primary">{hoursPerWeek}h</span>
          </Label>
          <Slider
            value={[hoursPerWeek]}
            onValueChange={(v) => setHoursPerWeek(v[0])}
            min={5}
            max={40}
            step={1}
            className="py-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>5 hours</span>
            <span>40 hours</span>
          </div>
        </div>

        {/* Preferred Days */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4 text-success" />
            Preferred Study Days
          </Label>
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map(day => (
              <motion.button
                key={day}
                onClick={() => toggleDay(day)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                  selectedDays.includes(day)
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                {day.slice(0, 3)}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={generatePlan}
          disabled={loading || goals.length === 0}
          className="w-full bg-gradient-primary hover:opacity-90 h-12 text-base"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating your plan...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Study Plan
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
