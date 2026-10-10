import { describe, expect, test } from 'bun:test';
import type { Catalog, TimetableEvent } from '../../api';
import { addDays, dayEvents, timelineBounds, warsawToday, weekDates } from './dates';
import { chosenGroups, initialChoices } from './profile';

function event(id: string, start: string, end: string): TimetableEvent {
  return { id, unitId: id, groupNumber: 1, term: '2026/2027-Z', courseId: id,
    name: 'Zajęcia', activityName: 'Zajęcia', type: 'classgroup2', classTypeName: 'wykład',
    startTime: start, endTime: end, date: start.slice(0, 10) as TimetableEvent['date'],
    timeZone: 'Europe/Warsaw', buildingName: null, buildingId: null, roomNumber: null,
    roomId: null, lecturerIds: [], frequency: null, dateStatus: 'confirmed', url: null };
}
describe('calendar dates and timeline', () => {
  test('uses the date in Warsaw even when UTC is still the previous day', () => {
    expect(warsawToday(new Date('2026-10-10T22:30:00Z'))).toBe('2026-10-11');
    expect(warsawToday(new Date('2026-12-31T23:30:00Z'))).toBe('2027-01-01');
  });
  test('moves between dates and weeks across DST and year boundaries without time shifts', () => {
    expect(addDays('2026-10-25', 1)).toBe('2026-10-26');
    expect(addDays('2026-03-29', -1)).toBe('2026-03-28');
    expect(weekDates('2027-01-03')).toEqual(['2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02', '2027-01-03']);
  });
  test('splits a meeting at midnight and expands hours beyond 08:00–20:00', () => {
    const events = [event('night', '2026-10-12T23:00:00', '2026-10-13T01:30:00')];
    const first = dayEvents(events, '2026-10-12'); const next = dayEvents(events, '2026-10-13');
    expect(first[0]).toMatchObject({ start: 1380, end: 1440 });
    expect(next[0]).toMatchObject({ start: 0, end: 90 });
    expect(timelineBounds(first)).toEqual({ start: 480, end: 1440 });
    expect(timelineBounds(next)).toEqual({ start: 0, end: 1200 });
    expect(timelineBounds([])).toEqual({ start: 480, end: 1200 });
  });
  test('an event ending at midnight is not counted on the following day', () => {
    expect(dayEvents([event('a', '2026-10-12T23:00:00', '2026-10-13T00:00:00')], '2026-10-13')).toEqual([]);
  });
  test('nested and chained overlaps share enough columns, adjacent events do not overlap', () => {
    const data = dayEvents([
      event('a', '2026-10-12T08:00:00', '2026-10-12T11:00:00'),
      event('b', '2026-10-12T08:30:00', '2026-10-12T09:30:00'),
      event('c', '2026-10-12T09:00:00', '2026-10-12T10:00:00'),
      event('d', '2026-10-12T09:30:00', '2026-10-12T11:30:00'),
      event('e', '2026-10-12T11:30:00', '2026-10-12T12:00:00'),
    ], '2026-10-12');
    expect(data.map(item => [item.column, item.columns])).toEqual([[0, 3], [1, 3], [2, 3], [1, 3], [0, 1]]);
    for (const a of data) for (const b of data) {
      if (a !== b && a.start < b.end && b.start < a.end) expect(a.column).not.toBe(b.column);
    }
  });
});
describe('group form validation', () => {
  const catalog: Catalog = { prefix: 'TEST', term: '2026/2027-Z', fetchedAt: 1, stale: false, searchMayBeTruncated: false,
    courses: [
      { courseId: 'a', name: 'Matematyka', unitId: 'a', classTypeId: 'CW', classTypeName: 'ćwiczenia', groupNumbers: [1, 3, 8], groupCount: 3 },
      { courseId: 'a', name: 'Matematyka', unitId: 'b', classTypeId: 'WYK', classTypeName: 'wykład', groupNumbers: [1], groupCount: 1 },
      { courseId: 'c', name: 'Praktyka', unitId: 'c', classTypeId: null, classTypeName: null, groupNumbers: [], groupCount: 0 },
    ] };
  test('does not invent intermediate group numbers or accept partial input', () => {
    for (const invalid of ['', '2', '3foo', '-1', '1.0']) expect(chosenGroups(catalog, { a: invalid, b: '1' })).toBeNull();
    expect(chosenGroups(catalog, { a: '8', b: '1' })).toEqual([{ unitId: 'a', groupNumber: 8 }, { unitId: 'b', groupNumber: 1 }]);
  });
  test('requires every available unit to be selected or explicitly skipped and at least one group', () => {
    expect(chosenGroups(catalog, { a: '3' })).toBeNull();
    expect(chosenGroups(catalog, { a: 'skip', b: 'skip' })).toBeNull();
    expect(chosenGroups(catalog, { a: 'skip', b: '1' })).toEqual([{ unitId: 'b', groupNumber: 1 }]);
  });
  test('restores a skipped single-group course and rejects removed groups during editing', () => {
    const choices = initialChoices(catalog, [{ unitId: 'a', groupNumber: 3 }], ['b']);
    expect(choices).toMatchObject({ a: '3', b: 'skip' });
    expect(chosenGroups(catalog, choices)).toEqual([{ unitId: 'a', groupNumber: 3 }]);
    expect(initialChoices(catalog, [{ unitId: 'a', groupNumber: 2 }]).a).toBe('');
  });
});
