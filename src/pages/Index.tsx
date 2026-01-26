import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  GraduationCap,
  Brain,
  BookOpen,
  Trophy,
  Target,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  MessageSquare,
  BarChart3,
  Zap,
} from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Tutor',
    description: 'Get instant, personalized answers to any question. Our AI adapts to your learning style.',
    color: 'from-chart-1 to-blue-600',
  },
  {
    icon: BookOpen,
    title: 'Adaptive Courses',
    description: 'Content that adjusts to your skill level, ensuring optimal challenge and growth.',
    color: 'from-chart-2 to-teal-600',
  },
  {
    icon: Trophy,
    title: 'Interactive Quizzes',
    description: 'Test your knowledge with smart quizzes that identify strengths and areas to improve.',
    color: 'from-chart-4 to-orange-600',
  },
  {
    icon: BarChart3,
    title: 'Progress Tracking',
    description: 'Visual dashboards show your learning journey with detailed analytics.',
    color: 'from-chart-3 to-green-600',
  },
];

const benefits = [
  'Personalized learning paths',
  '24/7 AI tutor availability',
  'Comprehensive progress tracking',
  'Adaptive difficulty levels',
  'Instant feedback on quizzes',
  'Multi-subject support',
];

export default function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-primary rounded-xl flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-display font-bold">AI Learning Assistant</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Button onClick={() => navigate('/dashboard')} className="bg-gradient-primary hover:opacity-90">
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/auth')}>
                  Sign In
                </Button>
                <Button onClick={() => navigate('/auth')} className="bg-gradient-primary hover:opacity-90">
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Powered by Advanced AI
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight mb-6">
              Your Personal
              <span className="block text-gradient-hero">AI Learning Assistant</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Master any subject with an intelligent tutor that adapts to your learning style. 
              Get instant answers, personalized courses, and track your progress.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => navigate('/auth')}
                className="bg-gradient-primary hover:opacity-90 text-lg px-8 py-6 shadow-glow"
              >
                Start Learning Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/auth')}
                className="text-lg px-8 py-6"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                Try AI Tutor
              </Button>
            </div>
          </motion.div>

          {/* Hero Image/Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-16 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
            <div className="bg-card rounded-2xl shadow-2xl border border-border overflow-hidden max-w-5xl mx-auto">
              <div className="h-8 bg-muted flex items-center px-4 gap-2 border-b border-border">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-warning/60" />
                <div className="w-3 h-3 rounded-full bg-success/60" />
              </div>
              <div className="p-6 bg-gradient-card">
                <div className="grid md:grid-cols-3 gap-4">
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-chart-1 to-blue-600 flex items-center justify-center">
                        <Brain className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold">AI Tutor</p>
                        <p className="text-xs text-muted-foreground">Ask anything</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-chart-2 to-teal-600 flex items-center justify-center">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold">23 Lessons</p>
                        <p className="text-xs text-muted-foreground">Completed</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-chart-4 to-orange-600 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold">7 Day Streak</p>
                        <p className="text-xs text-muted-foreground">Keep it up!</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              Everything you need to learn effectively
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our platform combines AI technology with proven learning methods to help you achieve your goals.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow group">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-display font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-display font-bold mb-6">
                Why choose AI Learning Assistant?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                We combine cutting-edge AI with educational expertise to create a learning experience that's truly personalized to you.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                    <span>{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-primary rounded-3xl blur-3xl opacity-20" />
              <Card className="relative border-0 shadow-2xl">
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-gradient-primary rounded-2xl flex items-center justify-center">
                      <Brain className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-display font-semibold">EduBot</h3>
                      <p className="text-sm text-muted-foreground">Your AI Tutor</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-muted rounded-2xl p-4">
                      <p className="text-sm">Can you explain quantum entanglement in simple terms?</p>
                    </div>
                    <div className="bg-primary/10 rounded-2xl p-4">
                      <p className="text-sm">
                        Think of quantum entanglement like having two magical dice. When you roll them, no matter how far apart they are, they always show matching numbers instantly! 🎲✨
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-6">
              Ready to transform your learning?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of students who are already learning smarter with AI.
            </p>
            <Button
              size="lg"
              onClick={() => navigate('/auth')}
              className="bg-gradient-primary hover:opacity-90 text-lg px-8 py-6 shadow-glow"
            >
              Get Started for Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold">AI Learning Assistant</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 AI Learning Assistant. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
