import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquarePlus, History, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Conversation {
  id: string;
  firstMessage: string;
  createdAt: string;
}

interface ConversationSidebarProps {
  activeConversationId: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
}

export default function ConversationSidebar({
  activeConversationId,
  onSelectConversation,
  onNewConversation,
}: ConversationSidebarProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadConversations();
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('chat_messages')
      .select('conversation_id, content, created_at, role')
      .eq('user_id', user.id)
      .eq('role', 'user')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading conversations:', error);
      setLoading(false);
      return;
    }

    // Group by conversation_id, take first user message as preview
    const seen = new Map<string, Conversation>();
    for (const msg of data || []) {
      if (!seen.has(msg.conversation_id)) {
        seen.set(msg.conversation_id, {
          id: msg.conversation_id,
          firstMessage: msg.content.slice(0, 60) + (msg.content.length > 60 ? '...' : ''),
          createdAt: msg.created_at,
        });
      }
    }

    // Sort by most recent first (the first user message per conversation with latest created_at)
    const convos = Array.from(seen.values());
    setConversations(convos);
    setLoading(false);
  };

  const deleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('conversation_id', convId)
      .eq('user_id', user.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete conversation', variant: 'destructive' });
      return;
    }

    setConversations(prev => prev.filter(c => c.id !== convId));
    if (convId === activeConversationId) {
      onNewConversation();
    }
  };

  // Refresh conversations list when active conversation changes (new messages saved)
  useEffect(() => {
    loadConversations();
  }, [activeConversationId]);

  return (
    <div className="w-64 border-r border-border flex flex-col h-full bg-muted/30">
      <div className="p-3 border-b border-border">
        <Button
          onClick={onNewConversation}
          className="w-full bg-gradient-primary hover:opacity-90"
          size="sm"
        >
          <MessageSquarePlus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      <div className="px-3 py-2 flex items-center gap-2 text-xs text-muted-foreground font-medium">
        <History className="w-3 h-3" />
        Chat History
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {loading ? (
            <div className="text-xs text-muted-foreground text-center py-4">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-4">No conversations yet</div>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={cn(
                  "w-full text-left p-2 rounded-lg text-sm transition-colors group flex items-start gap-1",
                  conv.id === activeConversationId
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted text-foreground'
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate text-xs font-medium">{conv.firstMessage}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {format(new Date(conv.createdAt), 'MMM d, h:mm a')}
                  </p>
                </div>
                <button
                  onClick={(e) => deleteConversation(conv.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
