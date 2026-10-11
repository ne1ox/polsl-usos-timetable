import { Link, useOutletContext } from 'react-router-dom';
import { ArrowRight, Monitor, Moon, RefreshCw, ShieldCheck, Sun } from 'lucide-react';
import PageHeading from '../components/PageHeading';
import InstallPanel from '../components/InstallPanel';
import { useTimetable } from '../state/TimetableProvider';
import type { useTheme } from '../hooks/useTheme';
import { formatUpdatedAt } from '../lib/catalog';

const themes = [
  { value: 'light', title: 'Jasny', icon: Sun },
  { value: 'dark', title: 'Ciemny', icon: Moon },
  { value: 'system', title: 'Systemowy', icon: Monitor },
] as const;

export default function SettingsPage() {
  const { theme, setTheme } = useOutletContext<ReturnType<typeof useTheme>>();
  const { profile, timetable, refreshing, refresh } = useTimetable();
  const updated = timetable?.groups.length
    ? Math.min(...timetable.groups.map((group) => group.fetchedAt))
    : null;
  return (
    <>
      <PageHeading title="Ustawienia" description="Wygodnie dla oczu. W sam raz dla Ciebie." />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <section className="panel p-5 sm:p-7">
            <h2 className="text-xl">Wygląd aplikacji</h2>
            <p className="mt-2 mb-5 text-muted">
              Wybierz motyw lub dopasuj go do ustawień urządzenia.
            </p>
            <div
              className="grid grid-cols-3 gap-2 sm:gap-3"
              role="group"
              aria-label="Motyw aplikacji"
            >
              {themes.map(({ value, title, icon: Icon }) => (
                <button
                  key={value}
                  aria-pressed={theme === value}
                  onClick={() => setTheme(value)}
                  className={
                    'flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border text-sm font-medium sm:text-base ' +
                    (theme === value
                      ? 'border-primary-text bg-primary-soft text-primary-text'
                      : 'border-line text-muted hover:bg-subtle')
                  }
                >
                  <Icon size={24} />
                  {title}
                </button>
              ))}
            </div>
          </section>
          <section className="panel p-5 sm:p-7">
            <h2 className="text-xl">Twoje studia i grupy</h2>
            <p className="mt-2 text-muted">
              {profile ? profile.programme.name : 'Nie masz jeszcze skonfigurowanego planu.'}
            </p>
            {profile && (
              <p className="mt-1 text-sm text-muted">
                {profile.semester}. semestr · {profile.term} · {profile.selections.length} wybranych
                grup
              </p>
            )}
            <Link className="btn btn-secondary mt-5" to="/groups">
              Przejdź do moich grup
              <ArrowRight size={18} />
            </Link>
          </section>
          <section className="panel p-5 sm:p-7">
            <h2 className="text-xl">Aktualność planu</h2>
            <p className="mt-2 text-muted">
              Ostatnie pobranie:{' '}
              <strong className="font-medium text-ink">{formatUpdatedAt(updated)}</strong>
            </p>
            <p className="mt-3 text-sm text-muted">
              Plan pobieramy przy otwieraniu, jeśli zapisane dane mają ponad 12 godzin. Możesz
              odświeżyć go wcześniej. Listę dostępnych grup odświeżysz w „Moich grupach”.
            </p>
            {timetable && (!timetable.complete || timetable.stale) && (
              <p className="notice notice-warning mt-4">
                Plan zawiera starsze dane lub nie udało się pobrać wszystkich grup.
              </p>
            )}
            <button
              className="btn btn-secondary mt-5"
              disabled={!timetable || refreshing}
              onClick={() => void refresh()}
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Odświeżam…' : 'Odśwież plan teraz'}
            </button>
          </section>
          <p className="flex items-start gap-3 px-2 text-sm text-muted">
            <ShieldCheck size={21} className="shrink-0" />
            Bez konta i hasła. Korzystamy z publicznych danych USOS. Twoje wybory zostają w tej
            przeglądarce.
          </p>
        </div>
        <InstallPanel />
      </div>
    </>
  );
}
