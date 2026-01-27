import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target } from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { cn } from '@/lib/utils';

interface TopicPerformance {
  topic: string;
  score: number;
  attempts: number;
}

interface StrengthsWeaknessesProps {
  topicPerformance: TopicPerformance[];
}

export function StrengthsWeaknesses({ topicPerformance }: StrengthsWeaknessesProps) {
  // Sort to find strengths and weaknesses
  const sorted = [...topicPerformance].sort((a, b) => b.score - a.score);
  const strengths = sorted.filter(t => t.score >= 70).slice(0, 3);
  const weaknesses = sorted.filter(t => t.score < 70).slice(-3).reverse();

  // Prepare radar chart data
  const radarData = topicPerformance.map(t => ({
    subject: t.topic,
    score: t.score,
    fullMark: 100,
  }));

  // Default data if no performance yet
  const hasData = topicPerformance.length > 0;
  const defaultData = [
    { subject: 'Programming', score: 0, fullMark: 100 },
    { subject: 'Design', score: 0, fullMark: 100 },
    { subject: 'Mathematics', score: 0, fullMark: 100 },
    { subject: 'Languages', score: 0, fullMark: 100 },
    { subject: 'Science', score: 0, fullMark: 100 },
  ];

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Target className="w-5 h-5 text-accent" />
          </div>
          <div>
            <CardTitle className="font-display">Skill Analysis</CardTitle>
            <CardDescription>Your strengths and areas to improve</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Radar Chart */}
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={hasData ? radarData : defaultData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis 
                  dataKey="subject" 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <PolarRadiusAxis 
                  angle={30} 
                  domain={[0, 100]} 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Strengths & Weaknesses Lists */}
          <div className="space-y-4">
            {/* Strengths */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-success" />
                <span className="font-semibold text-sm">Strengths</span>
              </div>
              {strengths.length > 0 ? (
                <div className="space-y-2">
                  {strengths.map((topic, index) => (
                    <motion.div
                      key={topic.topic}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-2 rounded-lg bg-success/10"
                    >
                      <span className="text-sm font-medium">{topic.topic}</span>
                      <Badge className="bg-success/20 text-success">
                        {topic.score}%
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Complete more quizzes to see your strengths</p>
              )}
            </div>

            {/* Weaknesses */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-4 h-4 text-warning" />
                <span className="font-semibold text-sm">Areas to Improve</span>
              </div>
              {weaknesses.length > 0 ? (
                <div className="space-y-2">
                  {weaknesses.map((topic, index) => (
                    <motion.div
                      key={topic.topic}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-2 rounded-lg bg-warning/10"
                    >
                      <span className="text-sm font-medium">{topic.topic}</span>
                      <Badge className="bg-warning/20 text-warning">
                        {topic.score}%
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Keep learning to identify improvement areas</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
