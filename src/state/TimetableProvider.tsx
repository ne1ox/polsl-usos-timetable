import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { timetableClient, type Catalog, type GroupSelection, type Timetable } from '../../api';
import { loadStudyCatalog } from '../lib/catalog';
import { readProfile, saveProfile, type Profile, type StudyConfig } from '../lib/profile';

function useTimetableState() {
  const [profile, setProfile] = useState(readProfile);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [restoring, setRestoring] = useState(Boolean(profile));
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const initialProfile = useRef(profile);
  const requestVersion = useRef(0);

  useEffect(() => {
    const saved = initialProfile.current;
    if (!saved) {
      return;
    }
    let active = true;
    async function restore() {
      try {
        const data = await loadStudyCatalog(saved!);
        if (!active) {
          return;
        }
        setCatalog(data);
        const valid = saved!.selections.every((selection) =>
          data.courses
            .find((course) => course.unitId === selection.unitId)
            ?.groupNumbers.includes(selection.groupNumber),
        );
        if (!valid) {
          setError('Dostępne grupy się zmieniły. Sprawdź wybory w „Moich grupach”.');
          return;
        }
        const plan = await timetableClient.getTimetable(data, saved!.selections);
        if (active) {
          setTimetable(plan);
        }
      } catch {
        if (active) {
          setError('Nie udało się wczytać planu. Sprawdź połączenie lub otwórz „Moje grupy”.');
        }
      } finally {
        if (active) {
          setRestoring(false);
        }
      }
    }
    void restore();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!message) {
      return;
    }
    const timer = window.setTimeout(() => setMessage(''), 6000);
    return () => window.clearTimeout(timer);
  }, [message]);

  const save = useCallback(
    async (config: StudyConfig, data: Catalog, selections: GroupSelection[]) => {
      const version = ++requestVersion.current;
      const plan = await timetableClient.getTimetable(data, selections);
      if (!plan.groups.length) {
        throw new Error(
          'Nie udało się pobrać żadnej grupy. Twoje wybory pozostają w formularzu. Spróbuj ponownie.',
        );
      }
      if (version !== requestVersion.current) {
        return;
      }
      const next: Profile = {
        ...config,
        selections,
        skippedUnitIds: data.courses
          .filter(
            (course) =>
              course.groupNumbers.length &&
              !selections.some((selection) => selection.unitId === course.unitId),
          )
          .map((course) => course.unitId),
      };
      const persisted = saveProfile(next);
      setProfile(next);
      setCatalog(data);
      setTimetable(plan);
      setError(
        persisted
          ? ''
          : 'Przeglądarka nie pozwala zapisać ustawień. Wybory są dostępne tylko w tej sesji.',
      );
      setMessage('Zapisano grupy. Twój plan jest gotowy.');
    },
    [],
  );

  const refresh = useCallback(async () => {
    if (!profile || !catalog || refreshing) {
      return;
    }
    const version = ++requestVersion.current;
    setRefreshing(true);
    setError('');
    try {
      const plan = await timetableClient.getTimetable(catalog, profile.selections, {
        refresh: true,
      });
      if (version !== requestVersion.current) {
        return;
      }
      if (!plan.groups.length) {
        throw new Error('No groups loaded');
      }
      setTimetable(plan);
      if (plan.complete && !plan.stale) {
        setMessage('Plan został zaktualizowany.');
      }
    } catch {
      if (version === requestVersion.current) {
        setError('Nie udało się odświeżyć planu. Zachowaliśmy poprzednie dane.');
      }
    } finally {
      setRefreshing(false);
    }
  }, [profile, catalog, refreshing]);

  return {
    profile,
    catalog,
    timetable,
    restoring,
    refreshing,
    error,
    message,
    save,
    refresh,
    dismissError: () => setError(''),
  };
}

type TimetableState = ReturnType<typeof useTimetableState>;
const TimetableContext = createContext<TimetableState | null>(null);

export function TimetableProvider({ children }: { children: ReactNode }) {
  const state = useTimetableState();
  return <TimetableContext.Provider value={state}>{children}</TimetableContext.Provider>;
}

export function useTimetable() {
  const state = useContext(TimetableContext);
  if (!state) {
    throw new Error('useTimetable requires TimetableProvider');
  }
  return state;
}
