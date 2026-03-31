import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface LearningTrack {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  order_index: number | null;
  courseCount: number;
  totalLessons: number;
  completedLessons: number;
}

export interface TrackWithCourses extends LearningTrack {
  courses: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    difficulty: string | null;
    total_lessons: number | null;
    image_url: string | null;
    progress: number;
    order_index: number;
  }[];
}

export function useLearningTracks() {
  const { user } = useAuth();
  const [tracks, setTracks] = useState<LearningTrack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTracks = async () => {
      const { data: tracksData, error } = await supabase
        .from('learning_tracks')
        .select('*')
        .order('order_index');

      if (error) {
        console.error('Error fetching tracks:', error);
        setLoading(false);
        return;
      }

      const { data: trackCourses } = await supabase
        .from('learning_track_courses')
        .select('track_id, course_id');

      const { data: courses } = await supabase
        .from('courses')
        .select('id, total_lessons');

      let progressMap = new Map<string, boolean>();
      if (user?.id) {
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('course_id, lesson_id, completed')
          .eq('user_id', user.id);

        (progressData || []).forEach(p => {
          if (p.completed && p.lesson_id) {
            progressMap.set(`${p.course_id}-${p.lesson_id}`, true);
          }
        });
      }

      const courseLessonsMap = new Map<string, number>();
      (courses || []).forEach(c => courseLessonsMap.set(c.id, c.total_lessons || 0));

      const trackCoursesMap = new Map<string, string[]>();
      (trackCourses || []).forEach(tc => {
        const list = trackCoursesMap.get(tc.track_id) || [];
        list.push(tc.course_id);
        trackCoursesMap.set(tc.track_id, list);
      });

      const enrichedTracks: LearningTrack[] = (tracksData || []).map(track => {
        const courseIds = trackCoursesMap.get(track.id) || [];
        const totalLessons = courseIds.reduce((sum, cid) => sum + (courseLessonsMap.get(cid) || 0), 0);
        const completedLessons = user?.id
          ? Array.from(progressMap.keys()).filter(key => courseIds.some(cid => key.startsWith(cid))).length
          : 0;

        return {
          ...track,
          courseCount: courseIds.length,
          totalLessons,
          completedLessons,
        };
      });

      setTracks(enrichedTracks);
      setLoading(false);
    };

    fetchTracks();

    const channel = supabase
      .channel('learning-tracks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'learning_tracks' }, () => fetchTracks())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'learning_track_courses' }, () => fetchTracks())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  return { tracks, loading };
}

export function useLearningTrack(trackId: string) {
  const { user } = useAuth();
  const [track, setTrack] = useState<TrackWithCourses | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrack = async () => {
      const { data: trackData, error } = await supabase
        .from('learning_tracks')
        .select('*')
        .eq('id', trackId)
        .single();

      if (error) {
        console.error('Error fetching track:', error);
        setLoading(false);
        return;
      }

      const { data: trackCourses } = await supabase
        .from('learning_track_courses')
        .select('course_id, order_index')
        .eq('track_id', trackId)
        .order('order_index');

      const courseIds = (trackCourses || []).map(tc => tc.course_id);

      if (courseIds.length === 0) {
        setTrack({ ...trackData, courseCount: 0, totalLessons: 0, completedLessons: 0, courses: [] });
        setLoading(false);
        return;
      }

      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .in('id', courseIds);

      let progressMap = new Map<string, { completed: number; total: number }>();
      if (user?.id) {
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('course_id, completed')
          .eq('user_id', user.id)
          .in('course_id', courseIds);

        (progressData || []).forEach(p => {
          const existing = progressMap.get(p.course_id) || { completed: 0, total: 0 };
          existing.total++;
          if (p.completed) existing.completed++;
          progressMap.set(p.course_id, existing);
        });
      }

      const orderMap = new Map<string, number>();
      (trackCourses || []).forEach(tc => orderMap.set(tc.course_id, tc.order_index));

      const courses = (coursesData || [])
        .map(course => {
          const progress = progressMap.get(course.id);
          const totalLessons = course.total_lessons || 1;
          return {
            ...course,
            progress: progress ? Math.round((progress.completed / totalLessons) * 100) : 0,
            order_index: orderMap.get(course.id) || 0,
          };
        })
        .sort((a, b) => a.order_index - b.order_index);

      const totalLessons = courses.reduce((sum, c) => sum + (c.total_lessons || 0), 0);
      const completedLessons = Array.from(progressMap.values()).reduce((sum, p) => sum + p.completed, 0);

      setTrack({
        ...trackData,
        courseCount: courses.length,
        totalLessons,
        completedLessons,
        courses,
      });
      setLoading(false);
    };

    fetchTrack();

    const channel = supabase
      .channel(`track-${trackId}-changes`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'learning_track_courses', filter: `track_id=eq.${trackId}` }, () => fetchTrack())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [trackId, user?.id]);

  return { track, loading };
}
