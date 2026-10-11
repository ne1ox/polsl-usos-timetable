import { expect, test } from 'bun:test';
import type { Catalog } from '../../api';
import { mergeCatalogs } from './catalog';
import { chosenGroups, initialChoices } from './profile';
import { eventTone, warsawMinutes } from './dates';

function catalog(unitId: string, fetchedAt = 100): Catalog {
  return {
    prefix: 'STUDY',
    term: '2026/2027-Z',
    fetchedAt,
    stale: false,
    searchMayBeTruncated: false,
    courses: [
      {
        courseId: unitId,
        name: unitId,
        unitId,
        classTypeId: 'CW',
        classTypeName: 'cwiczenia',
        groupNumbers: [1, 3],
        groupCount: 2,
      },
    ],
  };
}

test('study, language and sport catalogs combine without duplicating units or hiding stale sources', () => {
  const study = catalog('study');
  const language = { ...catalog('language', 50), stale: true };
  const sport = catalog('sport');
  const merged = mergeCatalogs(study, [language, sport, language]);
  expect(merged.courses.map((course) => course.unitId)).toEqual(['language', 'sport', 'study']);
  expect(merged.stale).toBe(true);
  expect(merged.fetchedAt).toBe(50);
  const selections = [
    { unitId: 'study', groupNumber: 3 },
    { unitId: 'language', groupNumber: 1 },
  ];
  const choices = initialChoices(merged, selections, ['sport']);
  expect(chosenGroups(merged, choices)).toEqual([
    { unitId: 'language', groupNumber: 1 },
    { unitId: 'study', groupNumber: 3 },
  ]);
  expect(study.courses).toHaveLength(1);
});

test('catalogs from different academic terms cannot be mixed', () => {
  expect(() =>
    mergeCatalogs(catalog('study'), [{ ...catalog('language'), term: '2025/2026-Z' }]),
  ).toThrow();
});

test('current-time marker follows Warsaw time including both sides of the DST change', () => {
  expect(warsawMinutes(new Date('2026-10-25T00:30:00Z'))).toBe(150);
  expect(warsawMinutes(new Date('2026-10-25T01:30:00Z'))).toBe(150);
  expect(warsawMinutes(new Date('2026-10-10T22:05:00Z'))).toBe(5);
});

test('USOS class types use blue lectures, yellow exercises, and green labs', () => {
  expect(eventTone('Wyklad')).toBe('course-lecture');
  expect(eventTone('cwiczenia')).toBe('course-exercise');
  expect(eventTone('Laboratorium')).toBe('course-lab');
  expect(eventTone('Projekt')).toBe('course-project');
});
