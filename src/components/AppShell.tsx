import { useEffect, useState } from 'react';
import {
  CalendarDays,
  Check,
  GraduationCap,
  Moon,
  Settings2,
  SlidersHorizontal,
  Sun,
  WifiOff,
  X,
} from 'lucide-react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useTheme } from '../hooks/useTheme';
import { useTimetable } from '../state/TimetableProvider';

const navigation = [
  { to: '/plan', label: 'Mój plan', icon: CalendarDays },
  { to: '/groups', label: 'Moje grupy', icon: SlidersHorizontal },
  { to: '/settings', label: 'Ustawienia', icon: Settings2 },
];

function Brand() {
  return (
    <Link to="/plan" aria-label="Kampus — mój plan" className="flex items-center gap-3">
      <img src={import.meta.env.BASE_URL + 'icon.svg'} alt="" className="size-10 rounded-xl" />
      <span className="text-2xl font-bold tracking-tight">
        kampus<span className="text-primary-text">.</span>
      </span>
    </Link>
  );
}

function Navigation({ mobile = false }: { mobile?: boolean }) {
  return (
    <nav
      aria-label={mobile ? 'Menu mobilne' : 'Menu główne'}
      className={mobile ? 'grid grid-cols-3' : 'flex flex-col gap-2'}
    >
      {navigation.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            [
              'flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 font-medium transition-colors',
              mobile ? 'flex-col gap-1 px-2 text-xs' : 'text-base',
              isActive ? 'bg-primary-soft text-primary-text' : 'text-muted hover:bg-subtle',
            ].join(' ')
          }
        >
          <Icon size={21} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function ConnectionStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  return (
    <>
      {!online && (
        <div className="notice notice-warning mb-5" role="status">
          <WifiOff size={20} />
          Jesteś offline. Dostępny jest wcześniej pobrany plan.
        </div>
      )}
      {needRefresh && (
        <div className="notice mb-5 flex-wrap">
          <span>Nowa wersja Kampusu jest gotowa.</span>
          <button className="font-medium underline" onClick={() => void updateServiceWorker(true)}>
            Zaktualizuj aplikację
          </button>
        </div>
      )}
    </>
  );
}

export default function AppShell() {
  const theme = useTheme();
  const { profile, error, message, dismissError } = useTimetable();
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);
  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById('main')?.focus();
        }}
        className="sr-only z-50 rounded-lg bg-primary p-3 text-white focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Przejdź do treści
      </a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-surface px-5 py-8 lg:flex">
        <Brand />
        <p className="mt-12 mb-4 px-4 text-xs font-medium tracking-widest text-muted uppercase">
          Twój dzień na uczelni
        </p>
        <Navigation />
        <div className="mt-auto rounded-2xl bg-subtle p-4">
          <GraduationCap className="mb-3 text-primary-text" size={25} />
          <p className="text-sm font-medium">Politechnika Śląska</p>
          <p className="mt-1 text-sm text-muted">
            Nieoficjalny plan studenta.
            <br />
            Wszystko w jednym miejscu.
          </p>
        </div>
      </aside>
      <div className="lg:ml-60">
        <header className="flex h-20 items-center justify-between border-b border-line bg-surface px-4 sm:px-8 lg:px-10">
          <div className="lg:hidden">
            <Brand />
          </div>
          <p className="hidden text-sm text-muted lg:block">Dobrze mieć plan.</p>
          <div className="flex items-center gap-2 sm:gap-4">
            {profile && (
              <span className="hidden rounded-lg bg-subtle px-3 py-1.5 text-sm font-medium sm:block">
                {profile.term}
              </span>
            )}
            <button
              className="icon-button"
              onClick={() => theme.setTheme(theme.dark ? 'light' : 'dark')}
              aria-label={theme.dark ? 'Włącz tryb jasny' : 'Włącz tryb ciemny'}
            >
              {theme.dark ? <Sun size={22} /> : <Moon size={22} />}
            </button>
          </div>
        </header>
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto max-w-7xl px-4 pt-7 pb-28 sm:px-8 sm:pt-9 lg:px-10 lg:pb-10"
        >
          <ConnectionStatus />
          {error && (
            <div className="notice notice-warning mb-5" role="alert">
              <p className="flex-1">{error}</p>
              <button onClick={dismissError} aria-label="Zamknij komunikat">
                <X size={20} />
              </button>
            </div>
          )}
          <Outlet context={theme} />
        </main>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
        <Navigation mobile />
      </div>
      {message && (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-50 flex w-max max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-3 rounded-xl bg-primary px-5 py-3 text-sm text-white shadow-xl lg:bottom-6"
        >
          <Check size={20} />
          {message}
        </div>
      )}
    </div>
  );
}
