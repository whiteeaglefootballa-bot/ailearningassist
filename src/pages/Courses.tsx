import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  BookOpen,
  Clock,
  Search,
  Filter,
  Play,
  ChevronRight,
  Sparkles,
  Code,
  Palette,
  Calculator,
  Globe,
  Beaker,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  total_lessons: number;
  image_url?: string;
  progress?: number;
}

const categoryIcons: Record<string, typeof Code> = {
  Programming: Code,
  Design: Palette,
  Mathematics: Calculator,
  Languages: Globe,
  Science: Beaker,
};

const difficultyColors: Record<string, string> = {
  beginner: 'bg-success/10 text-success',
  intermediate: 'bg-warning/10 text-warning',
  advanced: 'bg-destructive/10 text-destructive',
};

// Sample courses for demo
const sampleCourses: Course[] = [
  {
    id: '1',
    title: 'JavaScript Fundamentals',
    description: 'Master the core concepts of JavaScript programming, from variables to async/await.',
    category: 'Programming',
    difficulty: 'beginner',
    total_lessons: 12,
    progress: 75,
  },
  {
    id: '2',
    title: 'React Hooks Deep Dive',
    description: 'Learn advanced React patterns with hooks including useState, useEffect, and custom hooks.',
    category: 'Programming',
    difficulty: 'intermediate',
    total_lessons: 8,
    progress: 45,
  },
  {
    id: '3',
    title: 'TypeScript Mastery',
    description: 'From basic types to advanced generics, become a TypeScript expert.',
    category: 'Programming',
    difficulty: 'intermediate',
    total_lessons: 15,
    progress: 30,
  },
  {
    id: '4',
    title: 'UI/UX Design Principles',
    description: 'Learn the fundamentals of creating beautiful and user-friendly interfaces.',
    category: 'Design',
    difficulty: 'beginner',
    total_lessons: 10,
    progress: 0,
  },
  {
    id: '5',
    title: 'Calculus Made Easy',
    description: 'Understand derivatives, integrals, and their applications in real-world problems.',
    category: 'Mathematics',
    difficulty: 'intermediate',
    total_lessons: 20,
    progress: 15,
  },
  {
    id: '6',
    title: 'Spanish for Beginners',
    description: 'Start your journey to fluency with essential Spanish vocabulary and grammar.',
    category: 'Languages',
    difficulty: 'beginner',
    total_lessons: 25,
    progress: 0,
  },
];

const categories = ['All', 'Programming', 'Design', 'Mathematics', 'Languages', 'Science'];

export default function Courses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>(sampleCourses);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(false);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const inProgressCourses = filteredCourses.filter(c => c.progress && c.progress > 0);
  const newCourses = filteredCourses.filter(c => !c.progress || c.progress === 0);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Courses</h1>
          <p className="text-muted-foreground">Explore and continue your learning journey</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "whitespace-nowrap",
                selectedCategory === category && "bg-gradient-primary"
              )}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Continue Learning Section */}
      {inProgressCourses.length > 0 && (
        <div>
          <h2 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
            <Play className="w-5 h-5 text-primary" />
            Continue Learning
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inProgressCourses.map((course, index) => {
              const CategoryIcon = categoryIcons[course.category] || BookOpen;
              return (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="group cursor-pointer hover:shadow-lg transition-all border-0 shadow-md overflow-hidden"
                    onClick={() => navigate(`/dashboard/courses/${course.id}`)}>
                    <div className="h-3 bg-gradient-primary" />
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <CategoryIcon className="w-5 h-5 text-primary" />
                        </div>
                        <Badge className={cn("text-xs", difficultyColors[course.difficulty])}>
                          {course.difficulty}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {course.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {course.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            {course.total_lessons} lessons
                          </span>
                          <span className="font-medium text-primary">{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} className="h-2" />
                        <Button className="w-full group-hover:bg-gradient-primary transition-all" variant="outline">
                          Continue <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Explore Courses */}
      <div>
        <h2 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          {inProgressCourses.length > 0 ? 'Explore New Courses' : 'All Courses'}
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {newCourses.map((course, index) => {
            const CategoryIcon = categoryIcons[course.category] || BookOpen;
            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="group cursor-pointer hover:shadow-lg transition-all border-0 shadow-md"
                  onClick={() => navigate(`/dashboard/courses/${course.id}`)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                        <CategoryIcon className="w-5 h-5 text-accent" />
                      </div>
                      <Badge className={cn("text-xs", difficultyColors[course.difficulty])}>
                        {course.difficulty}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {course.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {course.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {course.total_lessons} lessons
                      </span>
                      <Button size="sm" variant="ghost" className="group-hover:text-primary">
                        Start <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No courses found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
