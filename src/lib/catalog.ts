import { timetableClient, type Catalog, type LoadOptions } from '../../api';
import type { StudyConfig } from './profile';

export function mergeCatalogs(base: Catalog, additions: Catalog[]): Catalog {
  const catalogs = [base, ...additions];
  if (catalogs.some((catalog) => catalog.term !== base.term)) {
    throw new Error('Nie można połączyć przedmiotów z różnych cykli.');
  }
  const courses = new Map(
    catalogs.flatMap((catalog) => catalog.courses).map((course) => [course.unitId, course]),
  );
  return {
    ...base,
    courses: [...courses.values()].sort((a, b) => a.name.localeCompare(b.name, 'pl')),
    fetchedAt: Math.min(...catalogs.map((catalog) => catalog.fetchedAt)),
    stale: catalogs.some((catalog) => catalog.stale),
    searchMayBeTruncated: catalogs.some((catalog) => catalog.searchMayBeTruncated),
  };
}

export async function loadStudyCatalog(config: StudyConfig, options: LoadOptions = {}) {
  const base = await timetableClient.getCatalog(config.prefix, config.term, options);
  const additions = await Promise.all(
    (config.extraCourses ?? []).map(async (course) => {
      const catalog = await timetableClient.getCatalog(course.courseId, config.term, options);
      return {
        ...catalog,
        courses: catalog.courses.filter((unit) => unit.courseId === course.courseId),
      };
    }),
  );
  return mergeCatalogs(base, additions);
}

export function formatUpdatedAt(timestamp: number | null) {
  if (timestamp === null) {
    return 'Jeszcze nie pobrano';
  }
  return new Intl.DateTimeFormat('pl-PL', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Warsaw',
  }).format(timestamp);
}
