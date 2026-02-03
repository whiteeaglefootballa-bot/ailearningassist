import { Bell, BellOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useGoalExpirationReminders } from '@/hooks/useGoalExpirationReminders';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function GoalExpirationToggle() {
  const { toast } = useToast();
  const {
    enabled,
    enableReminders,
    disableReminders,
    isSupported,
    permission,
  } = useGoalExpirationReminders();

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      const success = await enableReminders();
      if (success) {
        toast({
          title: 'Expiration alerts enabled',
          description: "You'll be notified when goals are about to expire",
        });
      } else {
        toast({
          title: 'Permission denied',
          description: 'Please enable notifications in your browser settings',
          variant: 'destructive',
        });
      }
    } else {
      disableReminders();
      toast({
        title: 'Expiration alerts disabled',
        description: "You won't receive goal expiration notifications",
      });
    }
  };

  if (!isSupported) {
    return null;
  }

  const isBlocked = permission === 'denied';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            {enabled ? (
              <Bell className="w-4 h-4 text-primary" />
            ) : (
              <BellOff className="w-4 h-4 text-muted-foreground" />
            )}
            <Label
              htmlFor="goal-expiration-toggle"
              className="text-sm cursor-pointer"
            >
              Expiry alerts
            </Label>
            <Switch
              id="goal-expiration-toggle"
              checked={enabled}
              onCheckedChange={handleToggle}
              disabled={isBlocked}
              aria-label="Toggle goal expiration notifications"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs max-w-48">
            {isBlocked
              ? 'Notifications blocked. Enable in browser settings.'
              : 'Get notified when goals are about to expire without completion'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
