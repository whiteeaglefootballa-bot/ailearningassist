import { Bell, BellOff, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useStudyReminders } from '@/hooks/useStudyReminders';
import { useToast } from '@/hooks/use-toast';

export function StudyReminderToggle() {
  const { permission, enabled, enableReminders, disableReminders, isSupported } = useStudyReminders();
  const { toast } = useToast();

  if (!isSupported) {
    return null;
  }

  const handleToggle = async () => {
    if (enabled) {
      disableReminders();
      toast({
        title: 'Reminders disabled',
        description: 'You will no longer receive study session reminders.',
      });
    } else {
      const success = await enableReminders();
      if (success) {
        toast({
          title: 'Reminders enabled! 🔔',
          description: 'You\'ll get notified 15 minutes before each session.',
        });
      } else {
        toast({
          title: 'Permission denied',
          description: 'Please enable notifications in your browser settings.',
          variant: 'destructive',
        });
      }
    }
  };

  const getIcon = () => {
    if (permission === 'denied') return <BellOff className="w-4 h-4" />;
    if (enabled) return <BellRing className="w-4 h-4" />;
    return <Bell className="w-4 h-4" />;
  };

  const getTooltipText = () => {
    if (permission === 'denied') return 'Notifications blocked in browser';
    if (enabled) return 'Reminders are on';
    return 'Enable study reminders';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <Switch
              id="study-reminders"
              checked={enabled}
              onCheckedChange={handleToggle}
              disabled={permission === 'denied'}
            />
            <Label 
              htmlFor="study-reminders" 
              className="flex items-center gap-2 cursor-pointer text-sm"
            >
              {getIcon()}
              <span className="hidden sm:inline">Reminders</span>
            </Label>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
