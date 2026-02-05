import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { QuizImprovementSuggestions } from '@/components/quiz/QuizImprovementSuggestions';
import { useToast } from '@/hooks/use-toast';
import { useQuizzes, useQuizQuestions, useQuizStats, Quiz } from '@/hooks/useQuizzes';
import {
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Target,
  Brain,
  Zap,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const difficultyColors: Record<string, string> = {
  beginner: 'bg-success/10 text-success',
  intermediate: 'bg-warning/10 text-warning',
  medium: 'bg-warning/10 text-warning',
  advanced: 'bg-destructive/10 text-destructive',
};

export default function Quizzes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { quizzes, loading: quizzesLoading } = useQuizzes();
  const { stats, loading: statsLoading } = useQuizStats();
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const { questions, loading: questionsLoading } = useQuizQuestions(activeQuiz?.id || null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const isCorrect = selectedAnswer === currentQuestion?.correctAnswer;
  const score = answers.reduce((acc, ans, idx) => 
    acc + (ans === questions[idx]?.correctAnswer ? 1 : 0), 0
  );
  const scorePercentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  const startQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setAnswers([]);
    setQuizCompleted(false);
  };

  const handleAnswerSelect = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;
    setShowResult(true);
    setAnswers([...answers, selectedAnswer]);
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Save quiz attempt to database
      if (user?.id && activeQuiz) {
        await supabase.from('quiz_attempts').insert({
          user_id: user.id,
          quiz_id: activeQuiz.id,
          score: score + (selectedAnswer === currentQuestion?.correctAnswer ? 1 : 0),
          total_questions: questions.length,
          answers: answers,
        });
      }
      setQuizCompleted(true);
    }
  };

  const resetQuiz = () => {
    setActiveQuiz(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setAnswers([]);
    setQuizCompleted(false);
  };

  // Loading state when starting a quiz
  if (activeQuiz && !quizCompleted && questionsLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-3xl mx-auto flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading quiz questions...</p>
        </div>
      </div>
    );
  }

  // No questions available
  if (activeQuiz && !quizCompleted && questions.length === 0 && !questionsLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-3xl mx-auto">
        <Card className="border-0 shadow-xl text-center py-12">
          <CardContent>
            <Brain className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-display font-bold mb-2">No Questions Available</h2>
            <p className="text-muted-foreground mb-6">This quiz doesn't have any questions yet.</p>
            <Button onClick={resetQuiz}>Back to Quizzes</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Active quiz with questions
  if (activeQuiz && !quizCompleted && questions.length > 0) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-3xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-display font-bold">{activeQuiz.title}</h1>
            <Button variant="ghost" size="sm" onClick={resetQuiz}>
              Exit Quiz
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="flex-1 h-2" />
            <span className="text-sm text-muted-foreground">
              {currentQuestionIndex + 1}/{questions.length}
            </span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg font-normal leading-relaxed">
                  {currentQuestion.question}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={showResult}
                    className={cn(
                      "w-full text-left p-4 rounded-xl border-2 transition-all",
                      selectedAnswer === index && !showResult && "border-primary bg-primary/5",
                      selectedAnswer !== index && !showResult && "border-border hover:border-primary/50 hover:bg-muted/50",
                      showResult && index === currentQuestion.correctAnswer && "border-success bg-success/10",
                      showResult && selectedAnswer === index && index !== currentQuestion.correctAnswer && "border-destructive bg-destructive/10"
                    )}
                    whileHover={!showResult ? { scale: 1.01 } : {}}
                    whileTap={!showResult ? { scale: 0.99 } : {}}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm",
                        selectedAnswer === index && !showResult && "bg-primary text-primary-foreground",
                        selectedAnswer !== index && !showResult && "bg-muted",
                        showResult && index === currentQuestion.correctAnswer && "bg-success text-success-foreground",
                        showResult && selectedAnswer === index && index !== currentQuestion.correctAnswer && "bg-destructive text-destructive-foreground"
                      )}>
                        {showResult && index === currentQuestion.correctAnswer ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : showResult && selectedAnswer === index ? (
                          <XCircle className="w-5 h-5" />
                        ) : (
                          String.fromCharCode(65 + index)
                        )}
                      </div>
                      <span>{option}</span>
                    </div>
                  </motion.button>
                ))}

                {showResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "p-4 rounded-xl mt-4",
                      isCorrect ? "bg-success/10 border border-success/20" : "bg-muted"
                    )}
                  >
                    <p className="text-sm">
                      <span className="font-semibold">
                        {isCorrect ? '🎉 Correct!' : '📚 Explanation:'}
                      </span>{' '}
                      {currentQuestion.explanation || 'Great job!'}
                    </p>
                  </motion.div>
                )}

                <div className="flex justify-end pt-4">
                  {!showResult ? (
                    <Button
                      onClick={handleSubmitAnswer}
                      disabled={selectedAnswer === null}
                      className="bg-gradient-primary hover:opacity-90"
                    >
                      Submit Answer
                    </Button>
                  ) : (
                    <Button onClick={handleNextQuestion} className="bg-gradient-primary hover:opacity-90">
                      {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  if (quizCompleted && activeQuiz) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-0 shadow-xl text-center">
            <CardContent className="pt-8 pb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className={cn(
                  "w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6",
                  scorePercentage >= 80 ? "bg-success/20" : scorePercentage >= 50 ? "bg-warning/20" : "bg-destructive/20"
                )}
              >
                <Trophy className={cn(
                  "w-12 h-12",
                  scorePercentage >= 80 ? "text-success" : scorePercentage >= 50 ? "text-warning" : "text-destructive"
                )} />
              </motion.div>
              
              <h2 className="text-2xl font-display font-bold mb-2">
                {scorePercentage >= 80 ? 'Excellent!' : scorePercentage >= 50 ? 'Good Job!' : 'Keep Practicing!'}
              </h2>
              <p className="text-muted-foreground mb-6">
                You scored {score} out of {questions.length} questions
              </p>
              
              <div className="text-5xl font-display font-bold mb-6 text-gradient-primary">
                {scorePercentage}%
              </div>

              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => startQuiz(activeQuiz)}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
                <Button onClick={resetQuiz} className="bg-gradient-primary hover:opacity-90">
                  Back to Quizzes
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Improvement Suggestions */}
        <QuizImprovementSuggestions
          score={score}
          totalQuestions={questions.length}
          category={activeQuiz.category}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold">Quizzes</h1>
        <p className="text-muted-foreground">Test your knowledge and track your progress</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(statsLoading ? [
          { icon: Target, label: 'Quizzes Taken', value: '...', color: 'from-chart-1 to-blue-600' },
          { icon: Trophy, label: 'Best Score', value: '...', color: 'from-chart-3 to-green-600' },
          { icon: Brain, label: 'Avg Score', value: '...', color: 'from-chart-2 to-teal-600' },
          { icon: Zap, label: 'Current Streak', value: '...', color: 'from-chart-4 to-orange-600' },
        ] : [
          { icon: Target, label: 'Quizzes Taken', value: String(stats.totalQuizzesTaken), color: 'from-chart-1 to-blue-600' },
          { icon: Trophy, label: 'Best Score', value: stats.bestScore > 0 ? `${stats.bestScore}%` : '-', color: 'from-chart-3 to-green-600' },
          { icon: Brain, label: 'Avg Score', value: stats.avgScore > 0 ? `${stats.avgScore}%` : '-', color: 'from-chart-2 to-teal-600' },
          { icon: Zap, label: 'Current Streak', value: String(stats.currentStreak), color: 'from-chart-4 to-orange-600' },
        ]).map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center", stat.color)}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Available Quizzes */}
      <div>
        <h2 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Available Quizzes
        </h2>
        {quizzesLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="border-0 shadow-md">
                <CardHeader>
                  <Skeleton className="h-5 w-20 mb-2" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : quizzes.length === 0 ? (
          <Card className="border-0 shadow-md text-center py-12">
            <CardContent>
              <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No Quizzes Available</h3>
              <p className="text-muted-foreground">Check back later for new quizzes!</p>
            </CardContent>
          </Card>
        ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizzes.map((quiz, index) => (
            <motion.div
              key={quiz.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="group cursor-pointer hover:shadow-lg transition-all border-0 shadow-md"
                onClick={() => startQuiz(quiz)}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <Badge className={cn("text-xs", difficultyColors[quiz.difficulty] || difficultyColors.medium)}>
                      {quiz.difficulty}
                    </Badge>
                    {quiz.bestScore && (
                      <div className="flex items-center gap-1 text-sm">
                        <Trophy className="w-4 h-4 text-warning" />
                        <span className="font-medium">{quiz.bestScore}%</span>
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {quiz.title}
                  </CardTitle>
                  <CardDescription>{quiz.category}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Brain className="w-4 h-4" />
                        {quiz.questionCount} questions
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {quiz.timeLimit} min
                      </span>
                    </div>
                  </div>
                  <Button className="w-full mt-4 group-hover:bg-gradient-primary" variant="outline">
                    Start Quiz <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}
