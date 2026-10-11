import { MapPin } from 'lucide-react';
import type { TimetableEvent } from '../../../api';
import { eventTone, hourLabel, roomNumberLabel, type DayEvent } from '../../lib/dates';

interface Props {
  item: DayEvent;
  start: number;
  pixelsPerMinute: number;
  onOpen: (event: TimetableEvent) => void;
}

export default function EventCard({ item, start, pixelsPerMinute, onOpen }: Props) {
  const { event } = item;
  const compact = item.end - item.start < 45;
  return (
    <button
      className={
        eventTone(event.classTypeName) +
        ' absolute flex flex-col overflow-hidden rounded-xl border-l-4 border-[var(--event-line)] bg-[var(--event-bg)] px-3 py-2 text-left text-[var(--event-ink)] transition-shadow hover:ring-2 hover:ring-[var(--event-line)] sm:px-4'
      }
      style={{
        top: (item.start - start) * pixelsPerMinute + 24,
        height: Math.max(32, (item.end - item.start) * pixelsPerMinute - 5),
        left: 'calc(' + (item.column / item.columns) * 100 + '% + 3px)',
        width: 'calc(' + 100 / item.columns + '% - 7px)',
      }}
      onClick={() => onOpen(event)}
      aria-label={
        event.name +
        ', ' +
        hourLabel(item.start) +
        '–' +
        hourLabel(item.end) +
        ', ' +
        event.classTypeName +
        ', grupa ' +
        event.groupNumber
      }
    >
      <span className="text-base font-medium tabular-nums sm:text-sm">
        {hourLabel(item.start)}–{hourLabel(item.end)}
      </span>
      <strong className="line-clamp-2 text-lg leading-snug sm:text-base">{event.name}</strong>
      {!compact && (
        <span className="mt-1 text-base sm:text-sm">
          {event.classTypeName} · gr. {event.groupNumber}
        </span>
      )}
      {event.dateStatus === 'uncertain' && (
        <span className="text-xs font-bold">Termin niepewny</span>
      )}
      {!compact && event.roomNumber && (
        <span className="mt-auto flex items-center gap-1 text-base sm:text-sm">
          <MapPin size={14} />
          {roomNumberLabel(event.roomNumber)}
        </span>
      )}
    </button>
  );
}
