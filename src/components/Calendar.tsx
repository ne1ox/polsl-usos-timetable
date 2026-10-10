import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays, calendarDate, dateKey, formatDate, warsawToday, weekDates } from '../lib/dates';

export default function Calendar({ selected, dates, onSelect }: { selected: string; dates: Set<string>; onSelect: (date: string) => void }) {
  const [month, setMonth] = useState(selected.slice(0, 7));
  useEffect(() => setMonth(selected.slice(0, 7)), [selected]);
  const start = weekDates(`${month}-01`)[0]!;
  const today = warsawToday();
  function shift(count: number) {
    const date = calendarDate(`${month}-01`); date.setUTCMonth(date.getUTCMonth() + count);
    setMonth(dateKey(date).slice(0, 7));
  }
  return <div className="calendar"><div className="calendar-header"><strong>{formatDate(`${month}-01`, { month: 'long', year: 'numeric' })}</strong><div><button className="icon-button" aria-label="Poprzedni miesiąc" onClick={() => shift(-1)}><ChevronLeft size={17} /></button><button className="icon-button" aria-label="Następny miesiąc" onClick={() => shift(1)}><ChevronRight size={17} /></button></div></div><div className="calendar-grid"><div className="calendar-weekdays">{['P', 'W', 'Ś', 'C', 'P', 'S', 'N'].map((day, i) => <span key={i}>{day}</span>)}</div><div className="calendar-days">{Array.from({ length: 42 }, (_, i) => {
    const date = addDays(start, i);
    return <button key={date} className={`${date === selected ? 'selected' : ''} ${date === today ? 'today' : ''} ${date.slice(0, 7) !== month ? 'outside' : ''}`} aria-label={formatDate(date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} aria-pressed={date === selected} aria-current={date === today ? 'date' : undefined} onClick={() => onSelect(date)}>{Number(date.slice(8))}{dates.has(date) && <i />}</button>;
  })}</div></div><div className="calendar-legend"><i />Dzień z zajęciami</div></div>;
}
