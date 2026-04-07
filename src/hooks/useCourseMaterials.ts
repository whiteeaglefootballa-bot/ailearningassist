import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CourseMaterial {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string | null;
  uploaded_by: string;
  created_at: string;
}

export function useCourseMaterials(courseId: string | undefined) {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchMaterials = async () => {
    if (!courseId) return;

    const { data, error } = await supabase
      .from('course_materials')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (!error) {
      setMaterials((data || []) as CourseMaterial[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMaterials();
  }, [courseId]);

  const uploadMaterial = async (file: File, title: string, description?: string) => {
    if (!user?.id || !courseId) return;
    setUploading(true);

    try {
      const filePath = `${user.id}/${courseId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('course-materials')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('course-materials')
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from('course_materials')
        .insert({
          course_id: courseId,
          title,
          description: description || null,
          file_url: urlData.publicUrl,
          file_type: file.type,
          uploaded_by: user.id,
        });

      if (insertError) throw insertError;

      toast.success('Material uploaded successfully');
      fetchMaterials();
    } catch (error: any) {
      toast.error('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const deleteMaterial = async (id: string) => {
    const { error } = await supabase
      .from('course_materials')
      .delete()
      .eq('id', id);

    if (!error) {
      toast.success('Material deleted');
      fetchMaterials();
    } else {
      toast.error('Failed to delete material');
    }
  };

  return { materials, loading, uploading, uploadMaterial, deleteMaterial, refetch: fetchMaterials };
}
