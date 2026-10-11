import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays, formatDate, warsawToday, weekDates } from '../../lib/dates';

interface Props {
  selected: string;
  dates: Set<string>;
  onDate: (date: string) => void;
  onCalendar: () => void;
}

export default function PlanToolbar({ selected, dates, onDate, onCalendar }: Props) {
  const today = warsawToday();
  return (
    <div className="border-b border-line">
      <div className="flex items-center justify-between gap-2 p-3 sm:p-5">
        <div className="flex items-center gap-1">
          <button
            className="icon-button"
            aria-label="Poprzedni tydzień"
            onClick={() => onDate(addDays(selected, -7))}
          >
            <ChevronLeft size={21} />
          </button>
          <button
            className="flex min-h-11 items-center gap-2 rounded-lg px-1 font-medium capitalize sm:px-2"
            onClick={onCalendar}
          >
            <CalendarDays size={20} className="hidden text-primary-text sm:block" />
            {formatDate(selected, { month: 'long', year: 'numeric' })}
          </button>
          <button
            className="icon-button"
            aria-label="Następny tydzień"
            onClick={() => onDate(addDays(selected, 7))}
          >
            <ChevronRight size={21} />
          </button>
        </div>
        <button className="btn btn-secondary px-3" onClick={() => onDate(today)}>
          Dzisiaj
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 px-3 pb-4 sm:gap-2 sm:px-5">
        {weekDates(selected).map((date) => {
          const active = date === selected;
          const classes =
            'flex min-h-20 flex-col items-center justify-center gap-1 rounded-xl border py-2 ';
          let color = 'border-transparent text-muted hover:bg-subtle';
          if (date === today) {
            color = 'border-primary-text text-primary-text';
          }
          if (active) {
            color = 'border-primary bg-primary text-white';
          }
          return (
            <button
              key={date}
              className={classes + color}
              aria-pressed={active}
              aria-label={formatDate(date, { weekday: 'long', day: 'numeric', month: 'long' })}
              onClick={() => onDate(date)}
            >
              <span className="text-xs font-medium capitalize sm:text-sm">
                {formatDate(date, { weekday: 'short' }).replace('.', '')}
              </span>
              <strong className="text-xl">{Number(date.slice(8))}</strong>
              <span
                className={
                  'size-1 rounded-full ' + (dates.has(date) ? 'bg-current' : 'bg-transparent')
                }
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
