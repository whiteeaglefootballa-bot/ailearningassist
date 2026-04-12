import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, BookOpen, Loader2, Search, ArrowLeft, Edit2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

interface Course {
  id: string;
  title: string;
  description: string | null;
  category: string;
  difficulty: string | null;
  total_lessons: number | null;
  created_at: string;
}

interface Lesson {
  id: string;
  title: string;
  content: string | null;
  duration_minutes: number | null;
  order_index: number | null;
  course_id: string;
}

const categories = ['Programming', 'Design', 'Mathematics', 'Languages', 'Science'];
const difficulties = ['beginner', 'intermediate', 'advanced'];

export default function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Course form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Programming');
  const [difficulty, setDifficulty] = useState('beginner');

  // Lesson management
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonDuration, setLessonDuration] = useState('10');
  const [lessonSaving, setLessonSaving] = useState(false);
  const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null);

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.error('Error fetching courses:', error);
    setCourses(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCourses(); }, []);

  const resetForm = () => {
    setTitle(''); setDescription(''); setCategory('Programming'); setDifficulty('beginner');
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('courses').insert({
      title: title.trim(), description: description.trim() || null, category, difficulty, total_lessons: 0,
    });
    setSaving(false);
    if (error) { toast.error('Failed to create course'); }
    else { toast.success('Course created'); setDialogOpen(false); resetForm(); fetchCourses(); }
  };

  const handleDelete = async (id: string, courseTitle: string) => {
    if (!confirm(`Delete "${courseTitle}"? This cannot be undone.`)) return;
    setDeletingId(id);
    const { error } = await supabase.from('courses').delete().eq('id', id);
    setDeletingId(null);
    if (error) { toast.error('Failed to delete course'); }
    else { toast.success('Course deleted'); fetchCourses(); }
  };

  // Lesson functions
  const fetchLessons = async (courseId: string) => {
    setLessonsLoading(true);
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });
    if (error) console.error('Error fetching lessons:', error);
    setLessons(data || []);
    setLessonsLoading(false);
  };

  const openCourse = (course: Course) => {
    setSelectedCourse(course);
    fetchLessons(course.id);
  };

  const resetLessonForm = () => {
    setLessonTitle(''); setLessonContent(''); setLessonDuration('10'); setEditingLesson(null);
  };

  const openEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setLessonTitle(lesson.title);
    setLessonContent(lesson.content || '');
    setLessonDuration(String(lesson.duration_minutes || 10));
    setLessonDialogOpen(true);
  };

  const handleSaveLesson = async () => {
    if (!lessonTitle.trim() || !selectedCourse) return;
    setLessonSaving(true);

    if (editingLesson) {
      const { error } = await supabase.from('lessons').update({
        title: lessonTitle.trim(),
        content: lessonContent.trim() || null,
        duration_minutes: parseInt(lessonDuration) || 10,
      }).eq('id', editingLesson.id);
      if (error) { toast.error('Failed to update lesson'); }
      else { toast.success('Lesson updated'); }
    } else {
      const nextIndex = lessons.length;
      const { error } = await supabase.from('lessons').insert({
        title: lessonTitle.trim(),
        content: lessonContent.trim() || null,
        duration_minutes: parseInt(lessonDuration) || 10,
        course_id: selectedCourse.id,
        order_index: nextIndex,
      });
      if (error) { toast.error('Failed to create lesson'); }
      else {
        toast.success('Lesson added');
        // Update course total_lessons count
        await supabase.from('courses').update({ total_lessons: lessons.length + 1 }).eq('id', selectedCourse.id);
      }
    }

    setLessonSaving(false);
    setLessonDialogOpen(false);
    resetLessonForm();
    fetchLessons(selectedCourse.id);
    fetchCourses();
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Delete this lesson?') || !selectedCourse) return;
    setDeletingLessonId(lessonId);
    const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
    setDeletingLessonId(null);
    if (error) { toast.error('Failed to delete lesson'); }
    else {
      toast.success('Lesson deleted');
      const newCount = lessons.length - 1;
      await supabase.from('courses').update({ total_lessons: newCount }).eq('id', selectedCourse.id);
      fetchLessons(selectedCourse.id);
      fetchCourses();
    }
  };

  const filtered = courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  // Lesson detail view
  if (selectedCourse) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => { setSelectedCourse(null); setLessons([]); }}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-display font-bold">{selectedCourse.title}</h1>
              <p className="text-muted-foreground">Manage lessons for this course</p>
            </div>
          </div>
          <Dialog open={lessonDialogOpen} onOpenChange={(open) => { setLessonDialogOpen(open); if (!open) resetLessonForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" />Add Lesson</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingLesson ? 'Edit Lesson' : 'Add New Lesson'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} placeholder="Lesson title" />
                </div>
                <div className="space-y-2">
                  <Label>Content</Label>
                  <Textarea value={lessonContent} onChange={(e) => setLessonContent(e.target.value)} placeholder="Lesson content" rows={4} />
                </div>
                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Input type="number" value={lessonDuration} onChange={(e) => setLessonDuration(e.target.value)} min="1" />
                </div>
                <Button onClick={handleSaveLesson} disabled={!lessonTitle.trim() || lessonSaving} className="w-full">
                  {lessonSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : editingLesson ? 'Update Lesson' : 'Add Lesson'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {lessonsLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : lessons.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="py-12 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No lessons yet</h3>
              <p className="text-muted-foreground">Add the first lesson for this course.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {lessons.map((lesson, index) => (
              <Card key={lesson.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="py-4 flex items-center gap-4">
                  <div className="text-muted-foreground font-mono text-sm w-6 text-center">{index + 1}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{lesson.title}</h3>
                    {lesson.content && (
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{lesson.content}</p>
                    )}
                  </div>
                  <Badge variant="outline">{lesson.duration_minutes || 10} min</Badge>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditLesson(lesson)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" disabled={deletingLessonId === lesson.id} onClick={() => handleDeleteLesson(lesson.id)}>
                      {deletingLessonId === lesson.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4 text-destructive" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Course list view
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Admin — Manage Courses</h1>
          <p className="text-muted-foreground">Create, delete courses, and manage lessons</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />New Course</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Course title" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Course description" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {difficulties.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleCreate} disabled={!title.trim() || saving} className="w-full">
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Create Course'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search courses..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">{search ? 'No matching courses' : 'No courses yet'}</h3>
            <p className="text-muted-foreground">{search ? 'Try a different search term.' : 'Create your first course to get started.'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((course) => (
            <Card key={course.id} className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={() => openCourse(course)}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Badge variant="secondary" className="mb-2">{course.difficulty}</Badge>
                    <CardTitle className="text-base">{course.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{course.description || 'No description'}</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Badge variant="outline">{course.category}</Badge>
                    <Badge variant="outline">{course.total_lessons ?? 0} lessons</Badge>
                  </div>
                  <Button
                    variant="ghost" size="icon"
                    disabled={deletingId === course.id}
                    onClick={(e) => { e.stopPropagation(); handleDelete(course.id, course.title); }}
                  >
                    {deletingId === course.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 text-destructive" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
