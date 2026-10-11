import { ArrowUpRight, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import Calendar from '../Calendar';
import { hourLabel, type DayEvent } from '../../lib/dates';

interface Props {
  selected: string;
  dates: Set<string>;
  items: DayEvent[];
  onDate: (date: string) => void;
}
const types = [
  { name: 'Wykład', tone: 'course-lecture' },
  { name: 'Ćwiczenia', tone: 'course-exercise' },
  { name: 'Laboratorium', tone: 'course-lab' },
  { name: 'Projekt / seminarium', tone: 'course-project' },
];

export default function PlanAside({ selected, dates, items, onDate }: Props) {
  return (
    <aside className="hidden space-y-5 xl:block">
      <section className="panel p-5">
        <Calendar key={selected.slice(0, 7)} selected={selected} dates={dates} onSelect={onDate} />
      </section>
      <section className="panel p-5">
        <h2 className="text-lg">Twój dzień w skrócie</h2>
        <dl className="my-5 grid grid-cols-3 gap-2">
          <div>
            <dd className="text-2xl font-bold">{items.length}</dd>
            <dt className="text-xs text-muted">zajęć</dt>
          </div>
          <div>
            <dd className="text-xl font-bold tabular-nums">
              {items.length ? hourLabel(items[0]!.start) : '—'}
            </dd>
            <dt className="text-xs text-muted">początek</dt>
          </div>
          <div>
            <dd className="text-xl font-bold tabular-nums">
              {items.length ? hourLabel(Math.max(...items.map((item) => item.end))) : '—'}
            </dd>
            <dt className="text-xs text-muted">koniec</dt>
          </div>
        </dl>
        <div className="space-y-3 border-t border-line pt-5">
          {types.map((type) => (
            <div key={type.name} className="flex items-center gap-3 text-sm text-muted">
              <span className={type.tone + ' size-3 rounded bg-[var(--event-line)]'} />
              {type.name}
            </div>
          ))}
        </div>
      </section>
      <Link className="panel flex items-center gap-3 p-5 hover:border-primary-text" to="/groups">
        <SlidersHorizontal size={22} className="shrink-0 text-primary-text" />
        <span className="flex-1">
          <strong className="block">Twoje zajęcia</strong>
          <span className="text-sm text-muted">Zmień lub dodaj grupy</span>
        </span>
        <ArrowUpRight size={18} />
      </Link>
    </aside>
  );
}
