import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'student' | 'teacher' | 'admin';

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole>('student');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setRole('student');
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setRole(data.role as AppRole);
      }
      setLoading(false);
    };

    fetchRole();
  }, [user?.id]);

  const isTeacher = role === 'teacher' || role === 'admin';
  const isAdmin = role === 'admin';

  return { role, isTeacher, isAdmin, loading };
}
