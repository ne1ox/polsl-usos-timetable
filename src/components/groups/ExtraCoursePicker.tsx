import { useEffect, useState } from 'react';
import { LoaderCircle, Plus, Search } from 'lucide-react';
import { findCourses, type CourseSearchResult } from '../../../api/courseSearch';
import type { CourseCategory, ExtraCourse } from '../../lib/profile';

interface Props {
  term: string;
  existingIds: string[];
  busy: boolean;
  onAdd: (course: ExtraCourse) => Promise<boolean>;
}

export default function ExtraCoursePicker({ term, existingIds, busy, onAdd }: Props) {
  const [category, setCategory] = useState<CourseCategory>('language');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CourseSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Wpisz co najmniej 3 znaki, aby wyszukać zajęcia.');
  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      setLoading(false);
      setStatus('Wpisz co najmniej 3 znaki, aby wyszukać zajęcia.');
      return;
    }
    let active = true;
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const result = await findCourses(query, term);
        if (!active) {
          return;
        }
        setResults(result.courses);
        setStatus(
          result.more
            ? 'USOS ogranicza wyszukiwanie do 100 wyników. Zawęź nazwę lub wpisz kod przedmiotu.'
            : '',
        );
        if (!result.courses.length) {
          setStatus(
            'Brak wyników w tym cyklu wśród sprawdzonych przedmiotów. Spróbuj dokładniejszej nazwy lub kodu z USOS.',
          );
        }
      } catch {
        if (active) {
          setStatus('Nie udało się wyszukać zajęć. Sprawdź połączenie i spróbuj ponownie.');
          setResults([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }, 400);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query, term]);

  return (
    <div>
      <p className="mb-5 text-muted">
        Dodaj język, WF lub inne zajęcia do tego samego planu. Szukamy przedmiotów dostępnych w
        cyklu {term}.
      </p>
      <fieldset disabled={busy} className="space-y-4">
        <label>
          <span className="field-label">Rodzaj dodatkowych zajęć</span>
          <select
            className="field"
            value={category}
            onChange={(event) => setCategory(event.target.value as CourseCategory)}
          >
            <option value="language">Język obcy</option>
            <option value="sport">Wychowanie fizyczne</option>
            <option value="other">Inny przedmiot</option>
          </select>
        </label>
        <label className="block">
          <span className="field-label">Nazwa lub kod przedmiotu</span>
          <div className="relative">
            <Search size={19} className="absolute top-4 left-3.5 text-muted" />
            <input
              className="field pl-11"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Np. język angielski, wychowanie fizyczne"
            />
          </div>
        </label>
        <div aria-live="polite">
          {loading && (
            <p className="flex items-center gap-2 py-4 text-muted">
              <LoaderCircle className="animate-spin" size={18} />
              Szukam w USOS…
            </p>
          )}
          {!loading &&
            results.map((course) => {
              const added = existingIds.includes(course.courseId);
              return (
                <div
                  key={course.courseId}
                  className="flex items-center gap-3 border-b border-line py-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{course.name}</p>
                    <p className="text-sm break-all text-muted">{course.courseId}</p>
                  </div>
                  <button
                    type="button"
                    disabled={added || busy}
                    className="btn btn-secondary shrink-0"
                    aria-label={'Dodaj ' + course.name}
                    onClick={() => void onAdd({ ...course, category })}
                  >
                    {busy ? (
                      <LoaderCircle className="animate-spin" size={17} />
                    ) : (
                      <Plus size={17} />
                    )}
                    {added ? 'Dodano' : 'Dodaj'}
                  </button>
                </div>
              );
            })}
          {!loading && status && <p className="mt-4 text-sm text-muted">{status}</p>}
        </div>
      </fieldset>
    </div>
  );
}
