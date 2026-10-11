import type { Catalog, GroupSelection } from '../../api';
import { defaultProgramme, type Programme } from '../../api/programmes';

export type CourseCategory = 'language' | 'sport' | 'other';
export interface ExtraCourse {
  courseId: string;
  name: string;
  category: CourseCategory;
}
export interface StudyConfig {
  programme: Programme;
  semester: number;
  prefix: string;
  term: string;
  extraCourses?: ExtraCourse[];
}
export interface Profile extends StudyConfig {
  selections: GroupSelection[];
  skippedUnitIds?: string[];
}
export const defaultConfig: StudyConfig = {
  programme: defaultProgramme,
  semester: 1,
  prefix: 'SIAu>SI1',
  term: '2026/2027-Z',
};
const key = 'kampus.profile.v1';
export function readProfile(): Profile | null {
  try {
    const data = JSON.parse(localStorage.getItem(key) ?? 'null');
    if (
      !data ||
      typeof data.prefix !== 'string' ||
      !data.prefix.trim() ||
      typeof data.term !== 'string' ||
      !/^\d{4}\/\d{4}-[ZL]$/.test(data.term) ||
      typeof data.programme?.id !== 'string' ||
      typeof data.programme?.name !== 'string' ||
      !Number.isInteger(data.semester) ||
      data.semester < 1 ||
      data.semester > 12 ||
      (data.extraCourses !== undefined &&
        (!Array.isArray(data.extraCourses) ||
          !data.extraCourses.every(
            (course: ExtraCourse) =>
              typeof course?.courseId === 'string' &&
              typeof course.name === 'string' &&
              ['language', 'sport', 'other'].includes(course.category),
          ))) ||
      (data.skippedUnitIds !== undefined &&
        (!Array.isArray(data.skippedUnitIds) ||
          !data.skippedUnitIds.every((id: unknown) => typeof id === 'string'))) ||
      !Array.isArray(data.selections) ||
      !data.selections.length ||
      !data.selections.every(
        (s: GroupSelection) => typeof s?.unitId === 'string' && Number.isInteger(s.groupNumber),
      )
    ) {
      return null;
    }
    return data as Profile;
  } catch {
    return null;
  }
}
export function saveProfile(profile: Profile): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(profile));
    return true;
  } catch {
    return false;
  }
}
export function initialChoices(
  catalog: Catalog,
  selections: GroupSelection[] = [],
  skippedUnitIds: string[] = [],
) {
  const previous = new Map(selections.map((s) => [s.unitId, String(s.groupNumber)]));
  return Object.fromEntries(
    catalog.courses.map((course) => {
      const value = previous.get(course.unitId);
      if (skippedUnitIds.includes(course.unitId)) {
        return [course.unitId, 'skip'];
      }
      if (value && course.groupNumbers.includes(Number(value))) {
        return [course.unitId, value];
      }
      return [
        course.unitId,
        course.groupNumbers.length === 1 ? String(course.groupNumbers[0]) : '',
      ];
    }),
  );
}
export function chosenGroups(
  catalog: Catalog,
  choices: Record<string, string>,
): GroupSelection[] | null {
  const result: GroupSelection[] = [];
  for (const course of catalog.courses) {
    if (!course.groupNumbers.length) {
      continue;
    }
    const choice = choices[course.unitId];
    if (choice === 'skip') {
      continue;
    }
    if (!choice || !/^\d+$/.test(choice) || !course.groupNumbers.includes(Number(choice))) {
      return null;
    }
    result.push({ unitId: course.unitId, groupNumber: Number(choice) });
  }
  return result.length ? result : null;
}
