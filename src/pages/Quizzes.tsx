import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { QuizImprovementSuggestions } from '@/components/quiz/QuizImprovementSuggestions';
import { useToast } from '@/hooks/use-toast';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface Quiz {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  questionCount: number;
  timeLimit: number;
  bestScore?: number;
}

const sampleQuizzes: Quiz[] = [
  { id: '1', title: 'JavaScript Basics', category: 'Programming', difficulty: 'beginner', questionCount: 10, timeLimit: 10, bestScore: 80 },
  { id: '2', title: 'React Fundamentals', category: 'Programming', difficulty: 'intermediate', questionCount: 15, timeLimit: 15, bestScore: 67 },
  { id: '3', title: 'TypeScript Types', category: 'Programming', difficulty: 'intermediate', questionCount: 12, timeLimit: 12 },
  { id: '4', title: 'CSS Layouts', category: 'Design', difficulty: 'beginner', questionCount: 8, timeLimit: 8, bestScore: 100 },
  { id: '5', title: 'Algebra Essentials', category: 'Mathematics', difficulty: 'beginner', questionCount: 10, timeLimit: 15 },
];

const sampleQuestions: QuizQuestion[] = [
  {
    id: '1',
    question: 'What is the output of typeof null in JavaScript?',
    options: ['null', 'undefined', 'object', 'boolean'],
    correctAnswer: 2,
    explanation: 'This is a well-known JavaScript quirk. typeof null returns "object" due to a bug in the original JavaScript implementation.',
  },
  {
    id: '2',
    question: 'Which method is used to add an element to the end of an array?',
    options: ['push()', 'pop()', 'shift()', 'unshift()'],
    correctAnswer: 0,
    explanation: 'The push() method adds one or more elements to the end of an array and returns the new length.',
  },
  {
    id: '3',
    question: 'What does "===" operator check in JavaScript?',
    options: ['Only value', 'Only type', 'Value and type', 'Reference'],
    correctAnswer: 2,
    explanation: 'The strict equality operator (===) checks both the value and the type, without type coercion.',
  },
  {
    id: '4',
    question: 'Which is NOT a JavaScript data type?',
    options: ['undefined', 'boolean', 'float', 'symbol'],
    correctAnswer: 2,
    explanation: 'JavaScript has number type which handles both integers and floating-point numbers. There is no separate "float" type.',
  },
  {
    id: '5',
    question: 'What is the purpose of the "let" keyword?',
    options: ['Declare a constant', 'Declare a block-scoped variable', 'Declare a global variable', 'Declare a function'],
    correctAnswer: 1,
    explanation: 'The "let" keyword declares a block-scoped variable that can be reassigned, unlike "const" which cannot.',
  },
];

const difficultyColors: Record<string, string> = {
  beginner: 'bg-success/10 text-success',
  intermediate: 'bg-warning/10 text-warning',
  advanced: 'bg-destructive/10 text-destructive',
};

export default function Quizzes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const currentQuestion = sampleQuestions[currentQuestionIndex];
  const isCorrect = selectedAnswer === currentQuestion?.correctAnswer;
  const score = answers.reduce((acc, ans, idx) => 
    acc + (ans === sampleQuestions[idx]?.correctAnswer ? 1 : 0), 0
  );
  const scorePercentage = Math.round((score / sampleQuestions.length) * 100);

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
    if (currentQuestionIndex < sampleQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Save quiz attempt to database
      if (user?.id && activeQuiz) {
        await supabase.from('quiz_attempts').insert({
          user_id: user.id,
          quiz_id: activeQuiz.id.length > 10 ? activeQuiz.id : 'aaaa1111-1111-1111-1111-111111111111',
          score: score + (selectedAnswer === currentQuestion?.correctAnswer ? 1 : 0),
          total_questions: sampleQuestions.length,
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

  if (activeQuiz && !quizCompleted) {
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
            <Progress value={((currentQuestionIndex + 1) / sampleQuestions.length) * 100} className="flex-1 h-2" />
            <span className="text-sm text-muted-foreground">
              {currentQuestionIndex + 1}/{sampleQuestions.length}
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
                      {currentQuestion.explanation}
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
                      {currentQuestionIndex < sampleQuestions.length - 1 ? 'Next Question' : 'See Results'}
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
                You scored {score} out of {sampleQuestions.length} questions
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
          totalQuestions={sampleQuestions.length}
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
        {[
          { icon: Target, label: 'Quizzes Taken', value: '12', color: 'from-chart-1 to-blue-600' },
          { icon: Trophy, label: 'Best Score', value: '100%', color: 'from-chart-3 to-green-600' },
          { icon: Brain, label: 'Avg Score', value: '78%', color: 'from-chart-2 to-teal-600' },
          { icon: Zap, label: 'Current Streak', value: '5', color: 'from-chart-4 to-orange-600' },
        ].map((stat, index) => (
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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sampleQuizzes.map((quiz, index) => (
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
                    <Badge className={cn("text-xs", difficultyColors[quiz.difficulty])}>
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
      </div>
    </div>
  );
}
