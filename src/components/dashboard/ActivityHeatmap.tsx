import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useActivityHeatmap, DayActivity } from '@/hooks/useActivityHeatmap';
import { CalendarDays, Flame } from 'lucide-react';
import { format, parseISO, getDay, startOfWeek, addDays } from 'date-fns';
import { cn } from '@/lib/utils';

const WEEKS_TO_SHOW = 20; // ~5 months
const DAYS_TO_SHOW = WEEKS_TO_SHOW * 7;

const levelColors = {
  0: 'bg-muted',
  1: 'bg-emerald-200 dark:bg-emerald-900',
  2: 'bg-emerald-400 dark:bg-emerald-700',
  3: 'bg-emerald-500 dark:bg-emerald-500',
  4: 'bg-emerald-600 dark:bg-emerald-400',
};

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function ActivityHeatmap() {
  const { activities, loading, totalActivities, activeDays } = useActivityHeatmap(DAYS_TO_SHOW);

  // Organize activities into weeks for the grid
  const getWeeksData = () => {
    if (activities.length === 0) return [];

    const weeks: DayActivity[][] = [];
    let currentWeek: DayActivity[] = [];

    // Find the start of the first week
    const firstDate = parseISO(activities[0].date);
    const dayOfWeek = getDay(firstDate);
    
    // Pad the first week with empty days
    for (let i = 0; i < dayOfWeek; i++) {
      currentWeek.push({ date: '', count: 0, level: 0 });
    }

    activities.forEach((activity) => {
      currentWeek.push(activity);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    // Add remaining days to last week
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  };

  const weeks = getWeeksData();

  // Get month labels for the header
  const getMonthLabels = () => {
    if (activities.length === 0) return [];
    
    const months: { label: string; startWeek: number }[] = [];
    let lastMonth = '';
    
    weeks.forEach((week, weekIndex) => {
      const firstValidDay = week.find(d => d.date);
      if (firstValidDay) {
        const month = format(parseISO(firstValidDay.date), 'MMM');
        if (month !== lastMonth) {
          months.push({ label: month, startWeek: weekIndex });
          lastMonth = month;
        }
      }
    });
    
    return months;
  };

  const monthLabels = getMonthLabels();

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="font-display">Study Activity</CardTitle>
              <CardDescription>Your learning contributions over time</CardDescription>
            </div>
          </div>
          {!loading && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="font-medium">{activeDays}</span>
                <span className="text-muted-foreground">active days</span>
              </div>
              <div className="text-muted-foreground">
                <span className="font-medium text-foreground">{totalActivities}</span> activities
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-[100px] w-full" />
          </div>
        ) : (
          <TooltipProvider delayDuration={100}>
            <div className="overflow-x-auto">
              {/* Month labels */}
              <div className="flex mb-1 ml-8">
                {monthLabels.map((month, i) => (
                  <div
                    key={i}
                    className="text-xs text-muted-foreground"
                    style={{
                      marginLeft: i === 0 ? month.startWeek * 14 : (month.startWeek - (monthLabels[i - 1]?.startWeek || 0)) * 14 - 28,
                    }}
                  >
                    {month.label}
                  </div>
                ))}
              </div>

              <div className="flex gap-0.5">
                {/* Day labels */}
                <div className="flex flex-col gap-0.5 mr-1">
                  {dayLabels.map((day, i) => (
                    <div
                      key={day}
                      className={cn(
                        "h-[12px] text-[10px] text-muted-foreground flex items-center",
                        i % 2 === 0 ? "opacity-0" : ""
                      )}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Heatmap grid */}
                <div className="flex gap-0.5">
                  {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="flex flex-col gap-0.5">
                      {week.map((day, dayIndex) => (
                        <Tooltip key={`${weekIndex}-${dayIndex}`}>
                          <TooltipTrigger asChild>
                            <motion.div
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: weekIndex * 0.01 }}
                              className={cn(
                                "w-[12px] h-[12px] rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-primary/50",
                                day.date ? levelColors[day.level] : "bg-transparent"
                              )}
                            />
                          </TooltipTrigger>
                          {day.date && (
                            <TooltipContent side="top" className="text-xs">
                              <p className="font-medium">
                                {day.count} {day.count === 1 ? 'activity' : 'activities'}
                              </p>
                              <p className="text-muted-foreground">
                                {format(parseISO(day.date), 'MMM d, yyyy')}
                              </p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-end gap-2 mt-3 text-xs text-muted-foreground">
                <span>Less</span>
                {[0, 1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={cn("w-[12px] h-[12px] rounded-sm", levelColors[level as 0 | 1 | 2 | 3 | 4])}
                  />
                ))}
                <span>More</span>
              </div>
            </div>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  );
}
