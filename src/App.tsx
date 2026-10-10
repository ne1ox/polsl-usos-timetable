import { useEffect, useRef, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { ArrowRight, CalendarDays, Check, GraduationCap, LoaderCircle, RefreshCw, Settings2, ShieldCheck, SlidersHorizontal, Smartphone, WifiOff } from 'lucide-react';
import { timetableClient, type Catalog, type GroupSelection, type Timetable } from '../api';
import { defaultConfig, readProfile, saveProfile, type Profile, type StudyConfig } from './lib/profile';
import { warsawToday } from './lib/dates';
import SetupForm from './components/SetupForm';
import Schedule from './components/Schedule';
import InstallPanel from './components/InstallPanel';
import Modal from './components/Modal';

type View = 'plan' | 'groups' | 'setup' | 'settings';

export default function App() {
  const [profile, setProfile] = useState(readProfile);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [view, setView] = useState<View>(profile ? 'plan' : 'setup');
  const [date, setDate] = useState(warsawToday);
  const [restoring, setRestoring] = useState(!!profile);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [installOpen, setInstallOpen] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const initialProfile = useRef(profile);
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW();

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update); window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  useEffect(() => {
    const saved = initialProfile.current;
    if (!saved) return;
    let active = true;
    (async () => {
      try {
        const data = await timetableClient.getCatalog(saved.prefix, saved.term);
        if (!active) return;
        setCatalog(data);
        if (saved.selections.some(s => !data.courses.find(c => c.unitId === s.unitId)?.groupNumbers.includes(s.groupNumber))) {
          setError('Katalog grup się zmienił. Sprawdź ponownie swoje wybory.'); setView('groups'); return;
        }
        const plan = await timetableClient.getTimetable(data, saved.selections);
        if (active) setTimetable(plan);
      } catch { if (active) { setError('Nie udało się otworzyć zapisanego planu. Sprawdź połączenie i pobierz ponownie swoje przedmioty.'); setView('setup'); } }
      finally { if (active) setRestoring(false); }
    })();
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(''), 6000);
    return () => window.clearTimeout(timeout);
  }, [message]);

  async function save(config: StudyConfig, data: Catalog, selections: GroupSelection[]) {
    const plan = await timetableClient.getTimetable(data, selections);
    if (!plan.groups.length) throw new Error('USOS nie zwrócił danych dla wybranych grup. Spróbuj ponownie za chwilę. Twoje wybory pozostają w formularzu.');
    const next: Profile = { ...config, selections, skippedUnitIds: data.courses.filter(c => c.groupNumbers.length && !selections.some(s => s.unitId === c.unitId)).map(c => c.unitId) };
    const persisted = saveProfile(next);
    setProfile(next); setCatalog(data); setTimetable(plan); setView('plan'); setError(persisted ? '' : 'Przeglądarka nie pozwala zapisać ustawień. Plan działa w tej sesji, ale wybory mogą zniknąć po zamknięciu.');
    if (!profile || profile.term !== next.term) {
      const today = warsawToday(); const dates = Object.keys(plan.byDate).sort();
      setDate(dates.includes(today) ? today : dates.find(d => d >= today) ?? dates[0] ?? today);
    }
    setMessage('Twój plan jest gotowy. Miłego studiowania!');
    window.scrollTo({ top: 0 });
  }
  async function refresh() {
    if (!profile || !catalog || refreshing) return;
    setRefreshing(true); setError(''); setMessage('');
    try {
      const plan = await timetableClient.getTimetable(catalog, profile.selections, { refresh: true });
      if (!plan.groups.length) { setError('Nie udało się odświeżyć żadnej grupy. Nadal wyświetlamy poprzednio pobrany plan.'); return; }
      setTimetable(plan);
      if (plan.complete && !plan.stale) setMessage('Plan odświeżony danymi z USOS.');
    } catch { setError('Odświeżanie nie powiodło się. Zachowaliśmy poprzednio pobrany plan.'); }
    finally { setRefreshing(false); }
  }
  function navigate(next: View) { setView(next); window.scrollTo({ top: 0 }); }
  const active = view === 'setup' ? 'plan' : view;
  const fetchedAt = timetable?.groups.length ? Math.min(...timetable.groups.map(g => g.fetchedAt)) : null;
  const updated = fetchedAt ? new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Warsaw' }).format(fetchedAt) : 'Jeszcze nie pobrano';
  const nav = [{ id: 'plan', title: 'Mój plan', icon: CalendarDays }, { id: 'groups', title: 'Moje grupy', icon: SlidersHorizontal }, { id: 'settings', title: 'Ustawienia', icon: Settings2 }] as const;
  const openNav = (id: typeof nav[number]['id']) => navigate(id === 'plan' && !timetable ? 'setup' : id);

  return <div className="app-shell">
    <a href="#main" className="skip-link">Przejdź do treści</a>
    <aside className="sidebar"><a className="brand" href="#" onClick={e => { e.preventDefault(); openNav('plan'); }}><img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" /><span>kampus<span className="brand-dot">.</span></span></a><div className="workspace-label">TWÓJ STUDENCKI NIEZBĘDNIK</div><nav aria-label="Menu główne">{nav.map(({ id, title, icon: Icon }) => <button key={id} className={active === id ? 'active' : ''} onClick={() => openNav(id)} aria-current={active === id ? 'page' : undefined}><Icon size={20} strokeWidth={1.7} /><span>{title}</span>{active === id && <i />}</button>)}</nav><div className="sidebar-bottom"><button className="install-card" onClick={() => setInstallOpen(true)}><Smartphone size={23} /><strong>Zawsze pod ręką</strong><span>Twój plan na ekranie telefonu.</span><b>Zainstaluj aplikację<ArrowRight size={15} /></b></button><div className="university"><GraduationCap size={20} /><span>Politechnika Śląska<small>Nieoficjalny plan studenta</small></span></div></div></aside>
    <div className="workspace"><header className="topbar"><a className="brand mobile-brand" href="#" onClick={e => { e.preventDefault(); openNav('plan'); }}><img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" /><span>kampus.</span></a><span className="topbar-label">Mały plan. Dużo możliwości.</span><div className="topbar-right"><span className="term-pill"><span className="status-dot" />{(profile ?? defaultConfig).term}</span><button className="icon-button" aria-label="Ustawienia" onClick={() => navigate('settings')}><Settings2 size={19} /></button></div></header>
    <main id="main" className="main-content">
      {!online && <div className="notice warning"><WifiOff size={18} /><span>Jesteś offline. Wyświetlamy dane zapisane na tym urządzeniu.</span></div>}
      {needRefresh && <div className="notice"><span>Nowa wersja Kampusu jest gotowa.</span><button className="text-button" onClick={() => void updateServiceWorker(true)}>Zaktualizuj aplikację</button></div>}
      {error && <div className="notice warning" role="alert">{error}<button className="text-button" onClick={() => setError('')}>Zamknij</button></div>}
      {timetable && view === 'plan' && (!timetable.complete || timetable.stale) && <div className="notice warning" role="status"><div>{!timetable.complete && <><strong>Plan jest niepełny.</strong><p>Nie pobrano {timetable.failures.length} grup: {timetable.failures.map(f => `${catalog?.courses.find(c => c.unitId === f.unitId)?.name ?? 'Zajęcia'} (gr. ${f.groupNumber})`).join(', ')}.</p></>}{timetable.stale && <p>Część danych pochodzi z pamięci. Ostatnie pobranie: {updated}.</p>}<button className="text-button" disabled={refreshing} onClick={() => void refresh()}>Spróbuj odświeżyć</button></div></div>}
      {restoring ? <div className="loading-state"><LoaderCircle size={32} className="spin" /><h1>Twój plan już tu jest.</h1><p>Otwieram zapisane grupy i zajęcia…</p></div>
        : view === 'plan' && timetable && profile ? <Schedule timetable={timetable} profile={profile} selected={date} onDate={setDate} onEdit={() => navigate('groups')} onRefresh={() => void refresh()} refreshing={refreshing} />
        : view === 'settings' ? <div className="settings-page"><div className="page-intro"><span className="eyebrow">TAK, JAK LUBISZ</span><h1>Ustawienia<span className="title-dot">.</span></h1><p>Twoje studia, Twoje grupy, aktualny plan.</p></div><div className="settings-layout"><div><section className="card settings-card"><div className="section-heading"><h2>Twój plan</h2><GraduationCap size={22} /></div><h3>{(profile ?? defaultConfig).programme.name.split(',')[0]}</h3><p className="muted">{(profile ?? defaultConfig).semester}. semestr · {(profile ?? defaultConfig).term}</p><div className="settings-actions"><button className="settings-row" onClick={() => navigate('groups')}><SlidersHorizontal size={20} /><span><strong>Zmień grupy</strong><small>{profile ? `${profile.selections.length} wybranych grup` : 'Skonfiguruj swoje zajęcia'}</small></span><ArrowRight size={17} /></button><button className="settings-row" onClick={() => navigate('setup')}><GraduationCap size={20} /><span><strong>Kierunek i semestr</strong><small>Zmień studia lub rozpocznij nowy cykl</small></span><ArrowRight size={17} /></button></div></section><section className="card settings-card"><div className="section-heading"><h2>Aktualizacja planu</h2><RefreshCw size={20} /></div><p className="muted">Pobierz ponownie spotkania swoich grup z USOS. Twoje wybory pozostaną zapisane.</p><div className="sync-info"><span className="status-dot" /><span>Najstarsze dane planu<strong>{updated}</strong></span></div>{timetable && (!timetable.complete || timetable.stale) && <div className="notice warning">{!timetable.complete ? `Brakuje danych ${timetable.failures.length} grup. ` : ''}{timetable.stale ? 'Część danych jest nieaktualna.' : ''}</div>}<button className="button primary" disabled={!profile || !catalog || refreshing} onClick={() => void refresh()}><RefreshCw size={17} className={refreshing ? 'spin' : ''} />{refreshing ? 'Pobieram z USOS…' : 'Odśwież plan teraz'}</button><p className="small muted">Katalog i dostępne grupy sprawdzisz ponownie, przechodząc przez „Kierunek i semestr”. Dane są przechowywane na tym urządzeniu.</p></section><div className="privacy-note"><ShieldCheck size={18} /><p>Bez hasła i bez konta. Korzystamy z publicznych danych USOS. Twoje grupy zapisujemy tylko w tej przeglądarce.</p></div></div><section className="card settings-card"><InstallPanel /></section></div></div>
        : <SetupForm key={view} profile={profile} catalog={catalog} startAtGroups={view === 'groups'} onSave={save} onCancel={() => navigate(timetable ? 'plan' : 'setup')} />}
      {timetable && view === 'plan' && <p className="source-note"><span className="status-dot" />USOS POLSL · Ostatnie pobranie: {updated}</p>}
    </main></div>
    <nav className="mobile-nav" aria-label="Menu mobilne">{nav.map(({ id, title, icon: Icon }) => <button key={id} className={active === id ? 'active' : ''} onClick={() => openNav(id)} aria-current={active === id ? 'page' : undefined}><Icon size={21} strokeWidth={1.7} /><span>{title}</span></button>)}</nav>
    {message && <div className="toast" role="status"><Check size={18} />{message}</div>}
    {installOpen && <Modal title="Kampus na telefonie" onClose={() => setInstallOpen(false)}><InstallPanel /></Modal>}
  </div>;
}
