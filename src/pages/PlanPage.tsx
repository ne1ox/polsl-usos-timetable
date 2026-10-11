import { useMemo, useState } from 'react';
import {
  ArrowRight,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Timetable, TimetableEvent } from '../../api';
import PageHeading from '../components/PageHeading';
import Calendar from '../components/Calendar';
import Modal from '../components/Modal';
import Timeline from '../components/schedule/Timeline';
import PlanToolbar from '../components/schedule/PlanToolbar';
import PlanAside from '../components/schedule/PlanAside';
import EventDetails from '../components/schedule/EventDetails';
import { useTimetable } from '../state/TimetableProvider';
import { addDays, dayEvents, formatDate, warsawToday } from '../lib/dates';
import { formatUpdatedAt } from '../lib/catalog';

function PlanWarnings({ timetable }: { timetable: Timetable | null }) {
  const { catalog } = useTimetable();
  if (!timetable || (timetable.complete && !timetable.stale)) {
    return null;
  }
  return (
    <div className="notice notice-warning mb-5" role="status">
      <div>
        {!timetable.complete && (
          <p>
            <strong>Plan jest niepełny.</strong> Nie udało się pobrać:{' '}
            {timetable.failures
              .map(
                (failure) =>
                  (catalog?.courses.find((course) => course.unitId === failure.unitId)?.name ??
                    'Zajęcia') +
                  ' (gr. ' +
                  failure.groupNumber +
                  ')',
              )
              .join(', ')}
            .
          </p>
        )}
        {timetable.stale && (
          <p>Część danych pochodzi ze starszego zapisu. Odśwież plan, gdy odzyskasz połączenie.</p>
        )}
      </div>
    </div>
  );
}

export default function PlanPage() {
  const { profile, timetable, restoring, refreshing, refresh } = useTimetable();
  const [selected, setSelected] = useState(warsawToday);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [detail, setDetail] = useState<TimetableEvent | null>(null);
  const events = timetable?.events ?? [];
  const items = dayEvents(events, selected);
  const dates = useMemo(() => {
    const result = new Set<string>();
    for (const event of timetable?.events ?? []) {
      for (
        let date = event.date as string;
        date + 'T00:00:00' < event.endTime;
        date = addDays(date, 1)
      ) {
        result.add(date);
      }
    }
    return result;
  }, [timetable]);
  const nextDate = [...dates].sort().find((date) => date > selected);
  const updated = timetable?.groups.length
    ? Math.min(...timetable.groups.map((group) => group.fetchedAt))
    : null;
  const description = profile
    ? profile.programme.name.split(',')[0] +
      ' · ' +
      profile.semester +
      '. semestr · ' +
      profile.term
    : 'Twój dzień, spokojnie zaplanowany.';
  function selectDate(date: string) {
    setSelected(date);
    setCalendarOpen(false);
  }

  return (
    <>
      <PageHeading title="Mój plan" description={description}>
        <button
          className="btn btn-secondary"
          disabled={!timetable || refreshing}
          onClick={() => void refresh()}
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Odświeżam…' : 'Odśwież plan'}
        </button>
      </PageHeading>
      {restoring && (
        <p className="notice mb-5" role="status">
          <LoaderCircle className="animate-spin" size={20} />
          Wczytuję zapisany plan…
        </p>
      )}
      {!profile && (
        <section className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-primary-soft p-5 sm:p-6">
          <span className="rounded-xl bg-surface p-3 text-primary-text">
            <CalendarPlus size={26} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg">Zrób miejsce na swój tydzień</h2>
            <p className="mt-1 text-sm text-muted">
              Wybierz grupy, a zajęcia pojawią się tutaj. Język i WF też.
            </p>
          </div>
          <Link to="/groups" className="btn btn-primary">
            Ustaw moje grupy
            <ArrowRight size={18} />
          </Link>
        </section>
      )}
      <PlanWarnings timetable={timetable} />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="panel min-w-0 overflow-hidden" aria-label="Plan zajęć">
          <PlanToolbar
            selected={selected}
            dates={dates}
            onDate={setSelected}
            onCalendar={() => setCalendarOpen(true)}
          />
          <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
            <div>
              <h2 className="text-lg capitalize">
                {formatDate(selected, { weekday: 'long' })}
                <span className="ml-2 text-sm font-normal text-muted">
                  {formatDate(selected, { day: 'numeric', month: 'long' })}
                </span>
              </h2>
              <p className="text-sm text-muted">
                {items.length
                  ? items.length + ' zajęć w planie'
                  : 'Brak zapisanych zajęć na ten dzień'}
              </p>
            </div>
            <div className="flex">
              <button
                className="icon-button"
                aria-label="Poprzedni dzień"
                onClick={() => setSelected(addDays(selected, -1))}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                className="icon-button"
                aria-label="Następny dzień"
                onClick={() => setSelected(addDays(selected, 1))}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          {!items.length && profile && nextDate && (
            <div className="px-4 pb-3 sm:px-6">
              <button className="btn btn-quiet" onClick={() => setSelected(nextDate)}>
                Przejdź do najbliższych zajęć
                <ArrowRight size={17} />
              </button>
            </div>
          )}
          <Timeline events={events} selected={selected} onDate={setSelected} onOpen={setDetail} />
          <div className="flex flex-wrap justify-between gap-2 border-t border-line px-4 py-3 text-xs text-muted sm:px-6">
            <span>Godziny w Polsce · Europe/Warsaw</span>
            <span>07:00–21:00 i zajęcia poza zakresem</span>
          </div>
        </section>
        <PlanAside selected={selected} dates={dates} items={items} onDate={setSelected} />
      </div>
      <p className="mt-5 text-center text-xs text-muted">
        USOS POLSL · Ostatnie pobranie: {formatUpdatedAt(updated)}
      </p>
      {calendarOpen && (
        <Modal title="Przejdź do daty" onClose={() => setCalendarOpen(false)}>
          <Calendar selected={selected} dates={dates} onSelect={selectDate} />
          <label className="mt-6 block">
            <span className="field-label">Lub wybierz konkretną datę</span>
            <input
              className="field"
              type="date"
              value={selected}
              onChange={(event) => {
                if (/^\d{4}-\d{2}-\d{2}$/.test(event.target.value)) {
                  selectDate(event.target.value);
                }
              }}
            />
          </label>
        </Modal>
      )}
      {detail && <EventDetails event={detail} onClose={() => setDetail(null)} />}
    </>
  );
}
