import type { TimetableEvent } from '../../api';

// UTC is a neutral calendar for arithmetic, never a conversion of USOS wall times.
export function calendarDate(value: string) {
  return new Date(`${value}T12:00:00Z`);
}
export function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}
export function addDays(value: string, count: number) {
  const date = calendarDate(value);
  date.setUTCDate(date.getUTCDate() + count);
  return dateKey(date);
}
export function warsawToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Warsaw',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function formatDate(date: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('pl-PL', { ...options, timeZone: 'UTC' }).format(
    calendarDate(date),
  );
}
export function weekDates(date: string) {
  const day = calendarDate(date).getUTCDay();
  const monday = addDays(date, -(day === 0 ? 6 : day - 1));
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}
export function clockTime(value: string) {
  return value.slice(11, 16);
}
export function minutes(value: string) {
  return Number(value.slice(11, 13)) * 60 + Number(value.slice(14, 16));
}
export function hourLabel(value: number) {
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}
export function roomNumberLabel(value: string) {
  return value.split(' ').map(x => x.at(0)?.toUpperCase() + x.slice(1)).join(' ');
}
export interface DayEvent {
  event: TimetableEvent;
  start: number;
  end: number;
  column: number;
  columns: number;
}
export function dayEvents(events: TimetableEvent[], date: string): DayEvent[] {
  const next = addDays(date, 1);
  const items = events
    .filter((event) => event.startTime < `${next}T00:00:00` && event.endTime > `${date}T00:00:00`)
    .map((event) => ({
      event,
      start: event.startTime.slice(0, 10) < date ? 0 : minutes(event.startTime),
      end: event.endTime.slice(0, 10) > date ? 1440 : minutes(event.endTime),
      column: 0,
      columns: 1,
    }))
    .filter((item) => item.end > item.start)
    .sort((a, b) => a.start - b.start || b.end - a.end || a.event.id.localeCompare(b.event.id));
  let cluster: DayEvent[] = [];
  let ends: number[] = [];
  let clusterEnd = -1;
  const finish = () => {
    for (const item of cluster) {
      item.columns = ends.length;
    }
  };
  for (const item of items) {
    if (item.start >= clusterEnd) {
      finish();
      cluster = [];
      ends = [];
    }
    let column = ends.findIndex((end) => end <= item.start);
    if (column === -1) {
      column = ends.length;
    }
    ends[column] = item.end;
    item.column = column;
    cluster.push(item);
    clusterEnd = Math.max(...ends);
  }
  finish();
  return items;
}
export function timelineBounds(items: DayEvent[]) {
  return {
    start: Math.min(7 * 60, ...items.map((item) => Math.floor(item.start / 60) * 60)),
    end: Math.max(21 * 60, ...items.map((item) => Math.ceil(item.end / 60) * 60)),
  };
}
export function eventTone(type: string | null) {
  const name = (type ?? '').toLowerCase();
  if (name.includes('lab')) {
    return 'course-lab';
  }
  if (name.includes('ćw') || name.includes('cw')) {
    return 'course-exercise';
  }
  if (name.includes('proj') || name.includes('sem')) {
    return 'course-project';
  }
  return 'course-lecture';
}

export function warsawMinutes(now: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Warsaw',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value);
  return hour * 60 + minute;
}
