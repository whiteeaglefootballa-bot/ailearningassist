import { Bell, BellOff, BellRing } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStudyReminders, REMINDER_OPTIONS, type ReminderMinutes } from '@/hooks/useStudyReminders';
import { useToast } from '@/hooks/use-toast';

export function StudyReminderToggle() {
  const { 
    permission, 
    enabled, 
    reminderMinutes,
    setReminderMinutes,
    enableReminders, 
    disableReminders, 
    isSupported 
  } = useStudyReminders();
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
          description: `You'll get notified ${reminderMinutes} minutes before each session.`,
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

  const handleMinutesChange = (value: string) => {
    const minutes = Number(value) as ReminderMinutes;
    setReminderMinutes(minutes);
    if (enabled) {
      toast({
        title: 'Reminder timing updated',
        description: `You'll now be notified ${minutes} minutes before sessions.`,
      });
    }
  };

  const getIcon = () => {
    if (permission === 'denied') return <BellOff className="w-4 h-4" />;
    if (enabled) return <BellRing className="w-4 h-4" />;
    return <Bell className="w-4 h-4" />;
  };

  const getTooltipText = () => {
    if (permission === 'denied') return 'Notifications blocked in browser';
    if (enabled) return `Reminders on (${reminderMinutes} min before)`;
    return 'Enable study reminders';
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-3">
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

        {enabled && (
          <Select 
            value={String(reminderMinutes)} 
            onValueChange={handleMinutesChange}
          >
            <SelectTrigger className="w-[100px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REMINDER_OPTIONS.map((mins) => (
                <SelectItem key={mins} value={String(mins)}>
                  {mins} min
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </TooltipProvider>
  );
}
