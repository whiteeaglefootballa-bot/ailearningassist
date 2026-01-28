import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { StudyPlanGenerator } from '@/components/studyplan/StudyPlanGenerator';
import { StudyPlanViewer } from '@/components/studyplan/StudyPlanViewer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Calendar, Clock, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StoredPlan {
  id: string;
  title: string;
  goals: string[];
  available_hours_per_week: number;
  preferred_days: string[];
  schedule: any;
  created_at: string;
  is_active: boolean;
}

export default function StudyPlan() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<StoredPlan[]>([]);
  const [activePlan, setActivePlan] = useState<any>(null);
  const [showGenerator, setShowGenerator] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchPlans();
    }
  }, [user?.id]);

  const fetchPlans = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('study_plans')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching plans:', error);
    } else {
      setPlans(data || []);
    }
    setLoading(false);
  };

  const handlePlanGenerated = (plan: any) => {
    setActivePlan(plan);
    setShowGenerator(false);
    fetchPlans();
  };

  const viewPlan = (plan: StoredPlan) => {
    setActivePlan({
      id: plan.id,
      ...plan.schedule,
    });
  };

  const deletePlan = async (planId: string) => {
    const { error } = await supabase
      .from('study_plans')
      .delete()
      .eq('id', planId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete plan',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Plan deleted',
        description: 'Study plan has been removed',
      });
      fetchPlans();
      if (activePlan?.id === planId) {
        setActivePlan(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (activePlan) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        <StudyPlanViewer
          plan={activePlan}
          onBack={() => setActivePlan(null)}
        />
      </div>
    );
  }

  if (showGenerator) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => setShowGenerator(false)}
          className="mb-4"
        >
          ← Back to plans
        </Button>
        <StudyPlanGenerator onPlanGenerated={handlePlanGenerated} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Study Plans</h1>
          <p className="text-muted-foreground">AI-generated personalized weekly schedules</p>
        </div>
        <Button onClick={() => setShowGenerator(true)} className="bg-gradient-primary hover:opacity-90">
          <Plus className="w-4 h-4 mr-2" />
          Create New Plan
        </Button>
      </div>

      {/* Plans List */}
      {plans.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-0 shadow-lg text-center py-12">
            <CardContent>
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-2">No study plans yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Create your first AI-powered study plan to get a personalized weekly schedule based on your goals.
              </p>
              <Button onClick={() => setShowGenerator(true)} className="bg-gradient-primary hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Plan
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer group">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {plan.title}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePlan(plan.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                  <CardDescription>
                    Created {new Date(plan.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent onClick={() => viewPlan(plan)}>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1">
                      {plan.goals.slice(0, 2).map((goal, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {goal.length > 25 ? goal.slice(0, 25) + '...' : goal}
                        </Badge>
                      ))}
                      {plan.goals.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{plan.goals.length - 2} more
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {plan.available_hours_per_week}h/week
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {plan.preferred_days.length} days
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
