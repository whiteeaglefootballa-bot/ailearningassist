import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, BookOpen, Brain, Target, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface QuizImprovementSuggestionsProps {
  score: number;
  totalQuestions: number;
  category: string;
  wrongTopics?: string[];
}

const suggestionsByScore = {
  excellent: {
    icon: Sparkles,
    title: "Outstanding Performance!",
    color: "text-success",
    suggestions: [
      "Challenge yourself with advanced topics",
      "Try teaching this concept to solidify your knowledge",
      "Explore related advanced courses",
    ],
  },
  good: {
    icon: Target,
    title: "Great Job!",
    color: "text-primary",
    suggestions: [
      "Review the questions you missed",
      "Practice with similar quizzes",
      "Focus on specific weak areas",
    ],
  },
  needsWork: {
    icon: Lightbulb,
    title: "Room for Improvement",
    color: "text-warning",
    suggestions: [
      "Re-read the lesson materials",
      "Take notes on key concepts",
      "Ask the AI tutor for help",
      "Try practice exercises before retaking",
    ],
  },
};

const topicResources: Record<string, { course: string; description: string }[]> = {
  Programming: [
    { course: "JavaScript Fundamentals", description: "Master the basics of JS" },
    { course: "React Hooks Deep Dive", description: "Advanced React patterns" },
  ],
  Design: [
    { course: "UI/UX Design Principles", description: "Create beautiful interfaces" },
  ],
  Mathematics: [
    { course: "Calculus Made Easy", description: "Understand derivatives & integrals" },
  ],
};

export function QuizImprovementSuggestions({
  score,
  totalQuestions,
  category,
  wrongTopics = [],
}: QuizImprovementSuggestionsProps) {
  const navigate = useNavigate();
  const percentage = Math.round((score / totalQuestions) * 100);

  const tier = percentage >= 80 ? 'excellent' : percentage >= 50 ? 'good' : 'needsWork';
  const { icon: Icon, title, color, suggestions } = suggestionsByScore[tier];
  
  const relatedResources = topicResources[category] || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-4"
    >
      {/* Personalized Suggestions */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl bg-muted flex items-center justify-center", color)}>
              <Icon className="w-5 h-5" />
            </div>
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Based on your score, here's what we recommend:
          </p>
          <ul className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <motion.li
                key={suggestion}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex items-center gap-2 text-sm"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                {suggestion}
              </motion.li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Recommended Resources */}
      {relatedResources.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-accent" />
              </div>
              <CardTitle className="text-lg">Recommended Courses</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {relatedResources.map((resource, index) => (
                <motion.div
                  key={resource.course}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">{resource.course}</p>
                    <p className="text-xs text-muted-foreground">{resource.description}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate('/dashboard/courses')}
                  >
                    View <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Tutor Prompt */}
      {percentage < 80 && (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-primary/10 to-accent/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Need help understanding?</p>
                <p className="text-sm text-muted-foreground">
                  Ask EduBot to explain the concepts you missed
                </p>
              </div>
              <Button
                onClick={() => navigate('/dashboard/tutor')}
                className="bg-gradient-primary hover:opacity-90"
              >
                Ask AI Tutor
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
