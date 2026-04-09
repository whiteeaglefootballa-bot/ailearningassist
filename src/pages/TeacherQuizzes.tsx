import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit2, Trash2, Trophy, Loader2, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Quiz {
  id: string;
  title: string;
  difficulty: string | null;
  course_id: string | null;
  courses?: { title: string } | null;
  question_count?: number;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string | null;
  order_index: number | null;
}

interface Course {
  id: string;
  title: string;
}

export default function TeacherQuizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [saving, setSaving] = useState(false);

  // Quiz form
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [courseId, setCourseId] = useState<string>('none');

  // Question form
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [explanation, setExplanation] = useState('');
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);

  const fetchQuizzes = async () => {
    const { data } = await supabase.from('quizzes').select('*, courses(title)').order('created_at', { ascending: false });
    if (data) {
      const quizzesWithCount = await Promise.all(data.map(async (q) => {
        const { count } = await supabase.from('quiz_questions').select('id', { count: 'exact', head: true }).eq('quiz_id', q.id);
        return { ...q, question_count: count || 0 };
      }));
      setQuizzes(quizzesWithCount);
    }
    setLoading(false);
  };

  const fetchCourses = async () => {
    const { data } = await supabase.from('courses').select('id, title').order('title');
    setCourses(data || []);
  };

  const fetchQuestions = async (quizId: string) => {
    const { data } = await supabase.from('quiz_questions').select('*').eq('quiz_id', quizId).order('order_index');
    setQuestions((data || []).map(q => ({ ...q, options: q.options as unknown as string[] })));
  };

  useEffect(() => { fetchQuizzes(); fetchCourses(); }, []);

  const resetQuizForm = () => { setTitle(''); setDifficulty('medium'); setCourseId('none'); setEditingQuiz(null); };
  const resetQuestionForm = () => { setQuestionText(''); setOptions(['', '', '', '']); setCorrectAnswer(0); setExplanation(''); setEditingQuestion(null); };

  const openEditQuiz = (quiz: Quiz) => {
    setEditingQuiz(quiz); setTitle(quiz.title); setDifficulty(quiz.difficulty || 'medium');
    setCourseId(quiz.course_id || 'none'); setQuizDialogOpen(true);
  };

  const handleSaveQuiz = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const payload = { title: title.trim(), difficulty, course_id: courseId === 'none' ? null : courseId };

    if (editingQuiz) {
      const { error } = await supabase.from('quizzes').update(payload).eq('id', editingQuiz.id);
      if (error) toast.error('Failed to update quiz'); else toast.success('Quiz updated');
    } else {
      const { error } = await supabase.from('quizzes').insert(payload);
      if (error) toast.error('Failed to create quiz'); else toast.success('Quiz created');
    }
    setSaving(false); setQuizDialogOpen(false); resetQuizForm(); fetchQuizzes();
  };

  const handleDeleteQuiz = async (id: string) => {
    if (!confirm('Delete this quiz and all its questions?')) return;
    await supabase.from('quiz_questions').delete().eq('quiz_id', id);
    const { error } = await supabase.from('quizzes').delete().eq('id', id);
    if (error) toast.error('Failed to delete'); else { toast.success('Quiz deleted'); fetchQuizzes(); }
  };

  const openQuestions = (quizId: string) => {
    setSelectedQuizId(quizId); fetchQuestions(quizId);
  };

  const handleSaveQuestion = async () => {
    if (!questionText.trim() || !selectedQuizId || options.some(o => !o.trim())) return;
    setSaving(true);
    const payload = {
      quiz_id: selectedQuizId, question: questionText.trim(),
      options: options.map(o => o.trim()) as unknown as any, correct_answer: correctAnswer,
      explanation: explanation.trim() || null, order_index: questions.length,
    };

    if (editingQuestion) {
      const { error } = await supabase.from('quiz_questions').update(payload).eq('id', editingQuestion.id);
      if (error) toast.error('Failed to update'); else toast.success('Question updated');
    } else {
      const { error } = await supabase.from('quiz_questions').insert(payload);
      if (error) toast.error('Failed to add question'); else toast.success('Question added');
    }
    setSaving(false); setQuestionDialogOpen(false); resetQuestionForm();
    fetchQuestions(selectedQuizId); fetchQuizzes();
  };

  const openEditQuestion = (q: QuizQuestion) => {
    setEditingQuestion(q); setQuestionText(q.question); setOptions([...q.options]);
    setCorrectAnswer(q.correct_answer); setExplanation(q.explanation || ''); setQuestionDialogOpen(true);
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!selectedQuizId) return;
    await supabase.from('quiz_questions').delete().eq('id', id);
    toast.success('Question deleted'); fetchQuestions(selectedQuizId); fetchQuizzes();
  };

  if (selectedQuizId) {
    const quiz = quizzes.find(q => q.id === selectedQuizId);
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={() => { setSelectedQuizId(null); setQuestions([]); }} className="mb-2">← Back to Quizzes</Button>
            <h1 className="text-2xl font-display font-bold">{quiz?.title} — Questions</h1>
          </div>
          <Dialog open={questionDialogOpen} onOpenChange={(o) => { setQuestionDialogOpen(o); if (!o) resetQuestionForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" />Add Question</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editingQuestion ? 'Edit Question' : 'Add Question'}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Question</Label>
                  <Textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)} placeholder="Enter your question" />
                </div>
                {options.map((opt, i) => (
                  <div key={i} className="space-y-1">
                    <Label className="flex items-center gap-2">
                      Option {String.fromCharCode(65 + i)}
                      {correctAnswer === i && <Badge className="bg-success/10 text-success text-xs">Correct</Badge>}
                    </Label>
                    <div className="flex gap-2">
                      <Input value={opt} onChange={(e) => { const n = [...options]; n[i] = e.target.value; setOptions(n); }} placeholder={`Option ${String.fromCharCode(65 + i)}`} />
                      <Button variant={correctAnswer === i ? 'default' : 'outline'} size="sm" onClick={() => setCorrectAnswer(i)} type="button">✓</Button>
                    </div>
                  </div>
                ))}
                <div className="space-y-2">
                  <Label>Explanation (optional)</Label>
                  <Textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} placeholder="Why this answer is correct" />
                </div>
                <Button onClick={handleSaveQuestion} disabled={!questionText.trim() || options.some(o => !o.trim()) || saving} className="w-full">
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {editingQuestion ? 'Update Question' : 'Add Question'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {questions.length === 0 ? (
          <Card className="border-0 shadow-md"><CardContent className="py-12 text-center">
            <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No questions yet</h3>
            <p className="text-muted-foreground">Add questions to this quiz.</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {questions.map((q, i) => (
              <Card key={q.id} className="border-0 shadow-md">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-medium text-sm">Q{i + 1}. {q.question}</p>
                      <div className="mt-2 grid grid-cols-2 gap-1">
                        {q.options.map((opt, oi) => (
                          <p key={oi} className={`text-xs px-2 py-1 rounded ${oi === q.correct_answer ? 'bg-success/10 text-success font-medium' : 'text-muted-foreground'}`}>
                            {String.fromCharCode(65 + oi)}. {opt}
                          </p>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditQuestion(q)}><Edit2 className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteQuestion(q.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Manage Quizzes</h1>
          <p className="text-muted-foreground">Create quizzes and add questions</p>
        </div>
        <Dialog open={quizDialogOpen} onOpenChange={(o) => { setQuizDialogOpen(o); if (!o) resetQuizForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />New Quiz</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingQuiz ? 'Edit Quiz' : 'Create New Quiz'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Quiz title" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Course (optional)</Label>
                  <Select value={courseId} onValueChange={setCourseId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No course</SelectItem>
                      {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleSaveQuiz} disabled={!title.trim() || saving} className="w-full">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {editingQuiz ? 'Update Quiz' : 'Create Quiz'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : quizzes.length === 0 ? (
        <Card className="border-0 shadow-md"><CardContent className="py-12 text-center">
          <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No quizzes yet</h3>
          <p className="text-muted-foreground">Create your first quiz.</p>
        </CardContent></Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {quizzes.map((quiz) => (
            <Card key={quiz.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant="secondary" className="mb-2">{quiz.difficulty}</Badge>
                    <CardTitle className="text-base">{quiz.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {quiz.question_count} questions {quiz.courses ? `• ${(quiz.courses as any).title}` : ''}
                </p>
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="sm" onClick={() => openQuestions(quiz.id)} className="gap-1">
                    <HelpCircle className="w-4 h-4" />Questions
                  </Button>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditQuiz(quiz)}><Edit2 className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteQuiz(quiz.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
