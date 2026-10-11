import { useEffect, useRef } from 'react';
import type { TimetableEvent } from '../../../api';
import {
  addDays,
  dayEvents,
  hourLabel,
  timelineBounds,
  warsawMinutes,
  warsawToday,
} from '../../lib/dates';
import { useClock } from '../../hooks/useClock';
import EventCard from './EventCard';
import { useTimelineViewport } from '../../hooks/useTimelineViewport';

interface Props {
  events: TimetableEvent[];
  selected: string;
  onDate: (date: string) => void;
  onOpen: (event: TimetableEvent) => void;
}
const PIXELS_PER_MINUTE = 1.6;
const TOP_PADDING = 24;

export default function Timeline({ events, selected, onDate, onOpen }: Props) {
  const now = useClock();
  const items = dayEvents(events, selected);
  const { start, end } = timelineBounds(items);
  const today = selected === warsawToday(now);
  const currentMinute = warsawMinutes(now);
  const { ref: scrollRef, viewport } = useTimelineViewport();
  const touch = useRef<{ x: number; y: number } | null>(null);
  const hours = Array.from({ length: (end - start) / 60 + 1 }, (_, index) => start + index * 60);
  const height = (end - start) * PIXELS_PER_MINUTE + TOP_PADDING * 2;
  const actualTop = (currentMinute - start) * PIXELS_PER_MINUTE + TOP_PADDING;
  const markerTop = Math.max(
    viewport.top + 15,
    Math.min(actualTop, viewport.top + viewport.height - 18),
  );
  const pinned = Math.abs(markerTop - actualTop) > 2;
  const direction = actualTop < markerTop ? '↑' : '↓';

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }
    const minute = today ? warsawMinutes(new Date()) : start;
    element.scrollTop = Math.max(0, (minute - start) * PIXELS_PER_MINUTE - 120);
  }, [selected, today, start, scrollRef]);

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- A focusable scroll region supports arrow navigation; its events remain native buttons.
    <div
      ref={scrollRef}
      tabIndex={0}
      role="region"
      aria-label="Plan godzinowy. Strzałki w lewo i w prawo zmieniają dzień."
      className="relative h-[58dvh] max-h-[720px] min-h-80 [touch-action:pan-y] [scrollbar-gutter:stable] overflow-y-auto overscroll-y-contain sm:h-[620px]"
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) {
          return;
        }
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          onDate(addDays(selected, event.key === 'ArrowLeft' ? -1 : 1));
        }
      }}
      onTouchStart={(event) => {
        const point = event.touches[0];
        touch.current =
          event.touches.length === 1 && point ? { x: point.clientX, y: point.clientY } : null;
      }}
      onTouchCancel={() => {
        touch.current = null;
      }}
      onTouchEnd={(event) => {
        const point = event.changedTouches[0];
        const from = touch.current;
        touch.current = null;
        if (!from || !point) {
          return;
        }
        const dx = point.clientX - from.x;
        const dy = point.clientY - from.y;
        if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.7) {
          onDate(addDays(selected, dx < 0 ? 1 : -1));
        }
      }}
    >
      <div className="relative mx-2 sm:mx-4" style={{ height }}>
        {hours.map((hour) => (
          <div
            key={hour}
            className="pointer-events-none absolute inset-x-0 flex items-start gap-3"
            style={{ top: (hour - start) * PIXELS_PER_MINUTE + TOP_PADDING }}
          >
            <time className="w-12 shrink-0 -translate-y-1/2 text-center text-xs font-medium text-muted tabular-nums">
              {hourLabel(hour)}
            </time>
            <span className="h-px flex-1 bg-line" />
          </div>
        ))}
        <div className="absolute inset-y-0 right-0 left-15">
          {items.map((item) => (
            <EventCard
              key={item.event.id}
              item={item}
              start={start}
              pixelsPerMinute={PIXELS_PER_MINUTE}
              onOpen={onOpen}
            />
          ))}
        </div>
        {today && (
          <div
            className="pointer-events-none absolute inset-x-0 z-10 flex items-center gap-1.5"
            style={{ top: markerTop }}
          >
            <span className="absolute left-0 -translate-y-1/2 rounded-md bg-[#b53643] px-1.5 py-1 text-xs font-bold text-white tabular-nums dark:bg-[#a52d3c]">
              {hourLabel(currentMinute)}
              {pinned && ' ' + direction}
            </span>
            <span
              className={
                'ml-15 h-0.5 flex-1 bg-[#b53643] dark:bg-[#ff8e9a] ' + (pinned ? 'opacity-70' : '')
              }
            />
            <span className="sr-only">
              {pinned ? 'Bieżąca godzina poza widocznym fragmentem: ' : 'Bieżąca godzina: '}
              {hourLabel(currentMinute)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
