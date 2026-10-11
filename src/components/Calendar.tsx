import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays, calendarDate, dateKey, formatDate, warsawToday, weekDates } from '../lib/dates';

interface Props {
  selected: string;
  dates: Set<string>;
  onSelect: (date: string) => void;
}

export default function Calendar({ selected, dates, onSelect }: Props) {
  const [month, setMonth] = useState(selected.slice(0, 7));
  const start = weekDates(month + '-01')[0]!;
  const today = warsawToday();
  function shift(count: number) {
    const date = calendarDate(month + '-01');
    date.setUTCMonth(date.getUTCMonth() + count);
    setMonth(dateKey(date).slice(0, 7));
  }
  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="capitalize">
          {formatDate(month + '-01', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="flex">
          <button className="icon-button" aria-label="Poprzedni miesiąc" onClick={() => shift(-1)}>
            <ChevronLeft size={20} />
          </button>
          <button className="icon-button" aria-label="Następny miesiąc" onClick={() => shift(1)}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      <div
        className="mb-2 grid grid-cols-7 text-center text-xs font-medium text-muted"
        aria-hidden="true"
      >
        {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 42 }, (_, index) => {
          const date = addDays(start, index);
          const chosen = date === selected;
          const outside = date.slice(0, 7) !== month;
          const classes = [
            'relative flex min-h-10 items-center justify-center rounded-lg border text-sm tabular-nums',
          ];
          classes.push(date === today ? 'border-primary-text' : 'border-transparent');
          if (chosen) {
            classes.push('bg-primary text-white font-bold');
          } else {
            classes.push('hover:bg-subtle', outside ? 'text-muted' : 'text-ink');
          }
          return (
            <button
              key={date}
              className={classes.join(' ')}
              aria-label={formatDate(date, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
              aria-pressed={chosen}
              aria-current={date === today ? 'date' : undefined}
              onClick={() => onSelect(date)}
            >
              {Number(date.slice(8))}
              {dates.has(date) && (
                <span
                  className={
                    'absolute bottom-1 size-1 rounded-full ' +
                    (chosen ? 'bg-white' : 'bg-primary-text')
                  }
                />
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-4 flex items-center gap-2 border-t border-line pt-4 text-xs text-muted">
        <span className="size-1.5 rounded-full bg-primary-text" />
        Dzień z zajęciami
      </p>
    </div>
  );
}
