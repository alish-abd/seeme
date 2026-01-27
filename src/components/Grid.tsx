import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isFuture, getDay } from 'date-fns';

type DayStatus = 'committed' | 'skipped' | 'empty' | 'future';

interface GridProps {
  logs: { date: string; status: 'committed' | 'skipped' }[];
  currentDate?: Date; // Default to now
  onToggleDay?: (date: Date) => void;
  interactive?: boolean;
}

export function Grid({ logs, currentDate = new Date(), onToggleDay, interactive = false }: GridProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Calculate padding days (empty spots before the first day of the month)
  // getDay returns 0 for Sunday, 1 for Monday, etc.
  // If we start on Monday: Mon=0, Tue=1, ..., Sun=6
  const startDay = getDay(monthStart); 
  const mondayStartPadding = (startDay + 6) % 7;
  const padding = Array.from({ length: mondayStartPadding });

  // Simple headers M T W T F S S
  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="habit-grid-container" style={{ width: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', width: '100%', maxWidth: '100%' }}>
        {weekDays.map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: '0.8rem', opacity: 0.3, paddingBottom: '10px' }}>
            {d}
          </div>
        ))}
        {padding.map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((day) => {
          // Find log
          // Note context: date strings from DB are YYYY-MM-DD.
          // date-fns format(day, 'yyyy-MM-dd') matches.
          const dateStr = format(day, 'yyyy-MM-dd');
          const log = logs.find(l => l.date === dateStr);
          
          let status: DayStatus = 'empty';
          if (log) status = log.status as DayStatus;
          
          const isDayFuture = isFuture(day) && !isToday(day);
          
          // Class names
          let classes = 'day-square';
          if (status === 'committed') classes += ' committed';
          if (status === 'skipped') classes += ' skipped';
          if (isToday(day)) classes += ' today'; // We might want to style today differently? border?
          
          // "Empty (outlined)" logic from prompt
          // My CSS has defaults.
          
          return (
            <div
              key={dateStr}
              className={classes}
              style={{
                width: '100%',
                aspectRatio: '1',
                opacity: isDayFuture ? 0.2 : 1,
                border: isToday(day) ? '2px solid var(--color-text)' : '1px solid transparent',
                cursor: interactive && !isDayFuture ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={() => {
                if (interactive && !isDayFuture && onToggleDay) {
                  onToggleDay(day);
                }
              }}
              title={dateStr}
            />
          );
        })}
      </div>
    </div>
  );
}
