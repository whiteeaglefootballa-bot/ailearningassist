interface StudySession {
  time: string;
  duration: number;
  subject: string;
  activity: string;
}

interface StudyPlan {
  title: string;
  weeklySchedule: Record<string, StudySession[]>;
}

const DAYS_MAP: Record<string, number> = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 0,
};

function getNextDayOfWeek(dayName: string, baseDate: Date = new Date()): Date {
  const targetDay = DAYS_MAP[dayName];
  const currentDay = baseDate.getDay();
  let daysUntilTarget = targetDay - currentDay;
  
  if (daysUntilTarget <= 0) {
    daysUntilTarget += 7;
  }
  
  const result = new Date(baseDate);
  result.setDate(result.getDate() + daysUntilTarget);
  return result;
}

function formatDateToICS(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}00`;
}

function parseTime(timeStr: string): { hours: number; minutes: number } {
  // Handle formats like "9:00 AM", "14:00", "9:00"
  const cleanTime = timeStr.trim().toUpperCase();
  const isPM = cleanTime.includes('PM');
  const isAM = cleanTime.includes('AM');
  
  const timePart = cleanTime.replace(/\s*(AM|PM)\s*/i, '');
  const [hoursStr, minutesStr] = timePart.split(':');
  
  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr || '0', 10);
  
  if (isPM && hours !== 12) {
    hours += 12;
  } else if (isAM && hours === 12) {
    hours = 0;
  }
  
  return { hours, minutes };
}

function generateUID(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@lovable.app`;
}

function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export function generateICSFile(plan: StudyPlan, weeksToGenerate: number = 4): string {
  const events: string[] = [];
  const now = new Date();
  
  Object.entries(plan.weeklySchedule || {}).forEach(([day, sessions]) => {
    sessions.forEach((session, index) => {
      const { hours, minutes } = parseTime(session.time);
      
      // Generate events for each week
      for (let week = 0; week < weeksToGenerate; week++) {
        const baseDate = new Date(now);
        baseDate.setDate(baseDate.getDate() + (week * 7));
        
        const eventDate = getNextDayOfWeek(day, baseDate);
        eventDate.setHours(hours, minutes, 0, 0);
        
        const endDate = new Date(eventDate);
        endDate.setMinutes(endDate.getMinutes() + session.duration);
        
        const event = [
          'BEGIN:VEVENT',
          `UID:${generateUID()}`,
          `DTSTAMP:${formatDateToICS(now)}`,
          `DTSTART:${formatDateToICS(eventDate)}`,
          `DTEND:${formatDateToICS(endDate)}`,
          `SUMMARY:${escapeICSText(session.subject)}`,
          `DESCRIPTION:${escapeICSText(session.activity)}`,
          `CATEGORIES:Study,${escapeICSText(plan.title)}`,
          'STATUS:CONFIRMED',
          'END:VEVENT',
        ].join('\r\n');
        
        events.push(event);
      }
    });
  });
  
  const calendar = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Lovable//Study Plan//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICSText(plan.title)}`,
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
  
  return calendar;
}

export function downloadICSFile(plan: StudyPlan, weeksToGenerate: number = 4): void {
  const icsContent = generateICSFile(plan, weeksToGenerate);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${plan.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-study-plan.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}
