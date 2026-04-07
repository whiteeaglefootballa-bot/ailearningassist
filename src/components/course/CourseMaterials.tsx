import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCourseMaterials } from '@/hooks/useCourseMaterials';
import { useUserRole } from '@/hooks/useUserRole';
import { Upload, FileText, Download, Trash2, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CourseMaterialsProps {
  courseId: string;
}

export function CourseMaterials({ courseId }: CourseMaterialsProps) {
  const { materials, loading, uploading, uploadMaterial, deleteMaterial } = useCourseMaterials(courseId);
  const { isTeacher } = useUserRole();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!file || !title.trim()) return;
    await uploadMaterial(file, title.trim(), description.trim());
    setOpen(false);
    setTitle('');
    setDescription('');
    setFile(null);
  };

  if (loading) return null;
  if (materials.length === 0 && !isTeacher) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-display font-semibold">Course Materials</h2>
        {isTeacher && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Upload className="w-4 h-4" />
                Upload Material
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Course Material</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Lecture notes, slides, etc." />
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description" />
                </div>
                <div className="space-y-2">
                  <Label>File</Label>
                  <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </div>
                <Button onClick={handleUpload} disabled={!file || !title.trim() || uploading} className="w-full">
                  {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</> : 'Upload'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {materials.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-8 text-center text-muted-foreground">
            No materials uploaded yet. {isTeacher && 'Click "Upload Material" to add files.'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {materials.map((material) => (
            <Card key={material.id} className="border-0 shadow-md">
              <CardContent className="py-3 flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{material.title}</p>
                  {material.description && (
                    <p className="text-xs text-muted-foreground truncate">{material.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground/60">
                    {formatDistanceToNow(new Date(material.created_at), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" asChild>
                    <a href={material.file_url} target="_blank" rel="noopener noreferrer" download>
                      <Download className="w-4 h-4" />
                    </a>
                  </Button>
                  {isTeacher && (
                    <Button variant="ghost" size="icon" onClick={() => deleteMaterial(material.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
