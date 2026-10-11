import { useEffect, useRef, useState } from 'react';
import { timetableClient, type Catalog } from '../../api';
import { loadStudyCatalog, mergeCatalogs } from '../lib/catalog';
import {
  chosenGroups,
  defaultConfig,
  initialChoices,
  type ExtraCourse,
  type StudyConfig,
} from '../lib/profile';
import { useTimetable } from '../state/TimetableProvider';

function preserveChoices(catalog: Catalog, previous: Record<string, string>) {
  const defaults = initialChoices(catalog);
  return Object.fromEntries(
    catalog.courses.map((course) => {
      const value = previous[course.unitId];
      if (value === 'skip' || (value && course.groupNumbers.includes(Number(value)))) {
        return [course.unitId, value];
      }
      return [course.unitId, defaults[course.unitId] ?? ''];
    }),
  );
}

export function useGroupEditor() {
  const saved = useTimetable();
  const [config, setConfig] = useState<StudyConfig>(saved.profile ?? defaultConfig);
  const [catalog, setCatalog] = useState(saved.catalog);
  const [choices, setChoices] = useState(() =>
    saved.catalog
      ? initialChoices(saved.catalog, saved.profile?.selections, saved.profile?.skippedUnitIds)
      : {},
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dirty, setDirty] = useState(false);
  const lock = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  async function run(action: () => Promise<void>) {
    if (lock.current) {
      return;
    }
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Nie udało się pobrać danych z USOS.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  async function load(next: StudyConfig, refresh = false) {
    let success = false;
    await run(async () => {
      const sameStudy = next.prefix === config.prefix && next.term === config.term;
      const nextConfig = { ...next, extraCourses: sameStudy ? config.extraCourses : [] };
      const data = await loadStudyCatalog(nextConfig, { refresh });
      if (!data.courses.some((course) => course.groupNumbers.length)) {
        throw new Error(
          'Nie znaleziono grup. Sprawdź cykl i kod przedmiotów w opcjach zaawansowanych.',
        );
      }
      setCatalog(data);
      setConfig(nextConfig);
      const restoredChoices = initialChoices(
        data,
        saved.profile?.selections,
        saved.profile?.skippedUnitIds,
      );
      const previousChoices = catalog ? choices : restoredChoices;
      setChoices(sameStudy ? preserveChoices(data, previousChoices) : initialChoices(data));
      setDirty(true);
      success = true;
    });
    return success && mounted.current;
  }

  async function addCourse(course: ExtraCourse) {
    if (!catalog) {
      return false;
    }
    let success = false;
    await run(async () => {
      const result = await timetableClient.getCatalog(course.courseId, config.term);
      const addition = {
        ...result,
        courses: result.courses.filter((unit) => unit.courseId === course.courseId),
      };
      if (!addition.courses.some((unit) => unit.groupNumbers.length)) {
        throw new Error('Ten przedmiot nie ma dostępnych grup w wybranym cyklu.');
      }
      const merged = mergeCatalogs(catalog, [addition]);
      setCatalog(merged);
      setChoices(preserveChoices(merged, choices));
      setConfig({ ...config, extraCourses: [...(config.extraCourses ?? []), course] });
      setDirty(true);
      success = true;
    });
    return success && mounted.current;
  }

  function removeCourse(courseId: string) {
    if (!catalog || busy) {
      return;
    }
    const extraCourses = config.extraCourses?.filter((course) => course.courseId !== courseId);
    setConfig({ ...config, extraCourses });
    const courses = catalog.courses.filter(
      (course) => course.courseId !== courseId || course.courseId.startsWith(config.prefix),
    );
    setCatalog({ ...catalog, courses });
    setDirty(true);
  }

  function select(unitId: string, value: string) {
    setChoices((previous) => ({ ...previous, [unitId]: value }));
    setDirty(true);
  }

  async function save() {
    if (!catalog) {
      return false;
    }
    const selections = chosenGroups(catalog, choices);
    if (!selections) {
      setError(
        'Wybierz grupę lub „Nie uczęszczam” przy każdych zajęciach. Wybierz przynajmniej jedną grupę.',
      );
      return false;
    }
    let success = false;
    await run(async () => {
      await saved.save(config, catalog, selections);
      setDirty(false);
      success = true;
    });
    return success && mounted.current;
  }

  const available = catalog?.courses.filter((course) => course.groupNumbers.length) ?? [];
  const completed = available.filter(
    (course) =>
      choices[course.unitId] === 'skip' ||
      course.groupNumbers.includes(Number(choices[course.unitId])),
  ).length;

  return {
    config,
    catalog,
    choices,
    busy,
    error,
    dirty,
    load,
    addCourse,
    removeCourse,
    select,
    save,
    completed,
    total: available.length,
  };
}
