import { BuildingComplex, CalendarDays, Clock3, ExternalLink, MapPin } from 'lucide-react';
import type { TimetableEvent } from '../../../api';
import { clockTime, eventTone, formatDate, roomNumberLabel } from '../../lib/dates';
import Modal from '../Modal';

export default function EventDetails({
  event,
  onClose,
}: {
  event: TimetableEvent;
  onClose: () => void;
}) {
  const safeUrl = event.url && /^https?:\/\//i.test(event.url) ? event.url : null;
  const endsAnotherDay = event.endTime.slice(0, 10) !== event.date;
  return (
    <Modal title="Szczegóły zajęć" onClose={onClose}>
      <span
        className={
          eventTone(event.classTypeName) +
          ' inline-block rounded-lg bg-[var(--event-bg)] px-3 py-1.5 text-sm font-medium text-[var(--event-ink)]'
        }
      >
        {event.classTypeName ?? 'Zajęcia'} · grupa {event.groupNumber}
      </span>
      <h3 className="mt-4 mb-6 text-2xl">{event.name}</h3>
      <dl className="space-y-5">
        <div className="flex gap-3">
          <CalendarDays className="mt-1 shrink-0 text-muted" size={21} />
          <div>
            <dt className="text-sm text-muted">Termin</dt>
            <dd>
              {formatDate(event.date, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </dd>
          </div>
        </div>
        <div className="flex gap-3">
          <Clock3 className="mt-1 shrink-0 text-muted" size={21} />
          <div>
            <dt className="text-sm text-muted">Godziny</dt>
            <dd>
              {clockTime(event.startTime)} – {clockTime(event.endTime)}
              {endsAnotherDay &&
                ' (' +
                  formatDate(event.endTime.slice(0, 10), { day: 'numeric', month: 'long' }) +
                  ')'}
            </dd>
          </div>
        </div>
        <div className="flex gap-3">
          <MapPin className="mt-1 shrink-0 text-muted" size={21} />
          <div>
            <dt className="text-sm text-muted">Miejsce</dt>
            <dd>{event.roomNumber ? roomNumberLabel(event.roomNumber) : 'Nie podano sali'}</dd>
          </div>
        </div>
        <div className="flex gap-3">
          <BuildingComplex className="mt-1 shrink-0 text-muted" size={21} />
          <div>
            <dt className="text-sm text-muted">Budynek</dt>
            <dd className="text-sm">{event.buildingName ?? 'Nie podano budynku'}</dd>
          </div>
        </div>
      </dl>
      {/* {event.dateStatus !== 'confirmed' && (
        <p className="notice notice-warning mt-6">
          {event.dateStatus === 'uncertain'
            ? 'Termin niepewny. Potwierdź go z prowadzącym.'
            : 'USOS wyliczył ten termin z reguły cyklicznych zajęć.'}
        </p>
      )} */}
      {safeUrl && (
        <a
          className="btn btn-secondary mt-6 w-full"
          href={safeUrl}
          target="_blank"
          rel="noreferrer"
        >
          Otwórz w USOS
          <ExternalLink size={18} />
        </a>
      )}
    </Modal>
  );
}
