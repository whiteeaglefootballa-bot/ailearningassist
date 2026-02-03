import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Copy, Check, Link2, Trash2, Loader2, ExternalLink } from 'lucide-react';

interface SharePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
  planTitle: string;
}

interface SharedLink {
  id: string;
  share_token: string;
  created_at: string;
  is_active: boolean;
}

export function SharePlanDialog({ open, onOpenChange, planId, planTitle }: SharePlanDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [links, setLinks] = useState<SharedLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (open && planId) {
      fetchLinks();
    }
  }, [open, planId]);

  const fetchLinks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('shared_study_plan_links')
      .select('*')
      .eq('study_plan_id', planId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setLinks(data);
    }
    setLoading(false);
  };

  const createShareLink = async () => {
    if (!user?.id) return;

    setCreating(true);
    const { data, error } = await supabase
      .from('shared_study_plan_links')
      .insert({
        study_plan_id: planId,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to create share link',
        variant: 'destructive',
      });
    } else if (data) {
      setLinks([data, ...links]);
      toast({
        title: 'Link created!',
        description: 'Share this link with others to let them view your study plan.',
      });
    }
    setCreating(false);
  };

  const deleteLink = async (linkId: string) => {
    const { error } = await supabase
      .from('shared_study_plan_links')
      .delete()
      .eq('id', linkId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete link',
        variant: 'destructive',
      });
    } else {
      setLinks(links.filter(l => l.id !== linkId));
      toast({
        title: 'Link deleted',
        description: 'The share link has been removed.',
      });
    }
  };

  const getShareUrl = (token: string) => {
    return `${window.location.origin}/shared/${token}`;
  };

  const copyToClipboard = async (token: string, linkId: string) => {
    const url = getShareUrl(token);
    await navigator.clipboard.writeText(url);
    setCopiedId(linkId);
    toast({
      title: 'Copied!',
      description: 'Share link copied to clipboard.',
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" />
            Share Study Plan
          </DialogTitle>
          <DialogDescription>
            Create shareable links for "{planTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Button
            onClick={createShareLink}
            disabled={creating}
            className="w-full gap-2"
          >
            {creating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Link2 className="w-4 h-4" />
            )}
            Create New Share Link
          </Button>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : links.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Active share links:</p>
              <AnimatePresence>
                {links.map((link) => (
                  <motion.div
                    key={link.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30"
                  >
                    <Input
                      readOnly
                      value={getShareUrl(link.share_token)}
                      className="flex-1 text-xs bg-background"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(link.share_token, link.id)}
                      className="shrink-0"
                    >
                      {copiedId === link.id ? (
                        <Check className="w-4 h-4 text-success" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      asChild
                      className="shrink-0"
                    >
                      <a href={getShareUrl(link.share_token)} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteLink(link.id)}
                      className="shrink-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Link2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No share links yet</p>
              <p className="text-xs">Create a link to share your study plan</p>
            </div>
          )}

          <div className="pt-2 border-t">
            <Badge variant="outline" className="text-xs">
              Anyone with the link can view this plan
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
