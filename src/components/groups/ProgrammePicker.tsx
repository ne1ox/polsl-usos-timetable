import { useEffect, useState } from 'react';
import { LoaderCircle, Search } from 'lucide-react';
import { searchProgrammes, type Programme } from '../../../api/programmes';

interface Props {
  value: Programme;
  onChange: (programme: Programme) => void;
}

export default function ProgrammePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Programme[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    let active = true;
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const result = await searchProgrammes(query);
        if (!active) {
          return;
        }
        setResults(result.programmes);
        setStatus(result.more ? 'Wpisz dokładniejszą nazwę, aby zawęzić wyniki.' : '');
      } catch {
        if (active) {
          setStatus(
            'Nie udało się pobrać kierunków. Spróbuj ponownie lub wpisz kod przedmiotów w opcjach zaawansowanych.',
          );
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
  }, [query, open]);

  return (
    <div>
      <span className="field-label">Kierunek studiów</span>
      <button
        type="button"
        className="field flex items-center justify-between gap-3 text-left"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span>
          <span className="block font-medium">{value.name.split(',')[0]}</span>
          <span className="mt-1 block text-sm text-muted">
            {value.name.split(',').slice(1).join(',') || value.id}
          </span>
        </span>
        <Search size={20} className="shrink-0 text-muted" />
      </button>
      {open && (
        <div className="mt-3 rounded-xl border border-line bg-subtle p-3">
          <label className="field-label" htmlFor="programme-query">
            Znajdź kierunek
          </label>
          <input
            id="programme-query"
            className="field"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Np. informatyka"
          />
          <div className="mt-2 max-h-64 overflow-y-auto" aria-live="polite">
            {loading && (
              <p className="flex items-center gap-2 p-3 text-sm text-muted">
                <LoaderCircle className="animate-spin" size={18} />
                Szukam kierunków…
              </p>
            )}
            {!loading &&
              results.map((programme) => (
                <button
                  key={programme.id}
                  type="button"
                  className="block w-full rounded-lg p-3 text-left hover:bg-surface"
                  onClick={() => {
                    onChange(programme);
                    setOpen(false);
                  }}
                >
                  <span className="block font-medium">{programme.name}</span>
                  <span className="text-sm text-muted">{programme.id}</span>
                </button>
              ))}
            {!loading && !results.length && !status && (
              <p className="p-3 text-sm text-muted">Brak wyników.</p>
            )}
            {status && <p className="p-3 text-sm text-muted">{status}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
