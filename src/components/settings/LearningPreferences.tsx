import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { 
  BookOpen, 
  GraduationCap, 
  Rocket, 
  Save, 
  Loader2,
  Code,
  Palette,
  Calculator,
  Globe,
  Beaker,
  Music,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const subjects = [
  { id: 'Programming', icon: Code, color: 'bg-chart-1/10 text-chart-1' },
  { id: 'Design', icon: Palette, color: 'bg-chart-2/10 text-chart-2' },
  { id: 'Mathematics', icon: Calculator, color: 'bg-chart-3/10 text-chart-3' },
  { id: 'Languages', icon: Globe, color: 'bg-chart-4/10 text-chart-4' },
  { id: 'Science', icon: Beaker, color: 'bg-chart-5/10 text-chart-5' },
  { id: 'Music', icon: Music, color: 'bg-accent/10 text-accent' },
];

const levels = [
  { id: 'beginner', label: 'Beginner', icon: BookOpen, description: 'Just starting out' },
  { id: 'intermediate', label: 'Intermediate', icon: GraduationCap, description: 'Some experience' },
  { id: 'advanced', label: 'Advanced', icon: Rocket, description: 'Looking for challenges' },
];

export function LearningPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [learningLevel, setLearningLevel] = useState('beginner');

  useEffect(() => {
    if (!user?.id) return;

    const fetchPreferences = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('preferred_subjects, learning_level')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setSelectedSubjects(data.preferred_subjects || []);
        setLearningLevel(data.learning_level || 'beginner');
      }
      setLoading(false);
    };

    fetchPreferences();
  }, [user?.id]);

  const toggleSubject = (subject: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const handleSave = async () => {
    if (!user?.id) return;
    
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        preferred_subjects: selectedSubjects,
        learning_level: learningLevel,
      })
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to save preferences',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Preferences saved',
        description: 'Your learning preferences have been updated',
      });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle>Learning Preferences</CardTitle>
            <CardDescription>Personalize your learning experience</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Subject Selection */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Preferred Subjects</Label>
          <p className="text-sm text-muted-foreground mb-4">
            Select the subjects you're interested in learning
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {subjects.map((subject) => {
              const isSelected = selectedSubjects.includes(subject.id);
              return (
                <motion.button
                  key={subject.id}
                  onClick={() => toggleSubject(subject.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border-2 transition-all",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", subject.color)}>
                    <subject.icon className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-sm">{subject.id}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Learning Level */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Learning Level</Label>
          <p className="text-sm text-muted-foreground mb-4">
            Choose your current skill level to get personalized content
          </p>
          <RadioGroup value={learningLevel} onValueChange={setLearningLevel}>
            <div className="grid gap-3">
              {levels.map((level) => (
                <motion.div
                  key={level.id}
                  whileHover={{ scale: 1.01 }}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                    learningLevel === level.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => setLearningLevel(level.id)}
                >
                  <RadioGroupItem value={level.id} id={level.id} />
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <level.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={level.id} className="font-medium cursor-pointer">
                      {level.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{level.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </RadioGroup>
        </div>

        {/* Selected Summary */}
        {selectedSubjects.length > 0 && (
          <div className="bg-muted/50 rounded-xl p-4">
            <p className="text-sm font-medium mb-2">Your selections:</p>
            <div className="flex flex-wrap gap-2">
              {selectedSubjects.map(subject => (
                <Badge key={subject} variant="secondary">
                  {subject}
                </Badge>
              ))}
              <Badge className="bg-primary/10 text-primary capitalize">
                {learningLevel}
              </Badge>
            </div>
          </div>
        )}

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-gradient-primary hover:opacity-90"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Preferences
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
