import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCheck, ChevronDown, GraduationCap, LoaderCircle, RefreshCw, Search, ShieldCheck, Sparkles, WifiOff } from 'lucide-react';
import { timetableClient, type Catalog, type GroupSelection } from '../../api';
import { searchProgrammes, suggestPrefix, type Programme } from '../../api/programmes';
import { chosenGroups, defaultConfig, initialChoices, type Profile, type StudyConfig } from '../lib/profile';
import { eventTone } from '../lib/dates';

interface Props {
  profile: Profile | null; catalog: Catalog | null; startAtGroups: boolean;
  onSave: (config: StudyConfig, catalog: Catalog, selections: GroupSelection[]) => Promise<void>;
  onCancel: () => void;
}

export default function SetupForm({ profile, catalog: savedCatalog, startAtGroups, onSave, onCancel }: Props) {
  const [config, setConfig] = useState<StudyConfig>(profile ?? defaultConfig);
  const [catalog, setCatalog] = useState<Catalog | null>(startAtGroups ? savedCatalog : null);
  const [step, setStep] = useState(startAtGroups && savedCatalog ? 2 : 1);
  const [choices, setChoices] = useState<Record<string, string>>(() => savedCatalog
    ? initialChoices(savedCatalog, profile?.selections, profile?.skippedUnitIds) : {});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Programme[]>([]);
  const [more, setMore] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [changeProgramme, setChangeProgramme] = useState(false);
  const alive = useRef(true);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    if (!changeProgramme) return;
    let active = true;
    setSearching(true); setSearchError('');
    const timer = window.setTimeout(() => {
      searchProgrammes(query).then(result => {
        if (active) { setResults(result.programmes); setMore(result.more); }
      }).catch(() => { if (active) { setResults([]); setSearchError('Nie udało się pobrać kierunków. Sprawdź połączenie lub wpisz kod przedmiotów poniżej.'); } })
        .finally(() => { if (active) setSearching(false); });
    }, 400);
    return () => { active = false; window.clearTimeout(timer); };
  }, [query, changeProgramme]);

  async function loadCatalog(refresh = false) {
    setBusy(true); setError('');
    try {
      const data = await timetableClient.getCatalog(config.prefix, config.term, { refresh });
      if (!alive.current) return;
      if (!data.courses.some(course => course.groupNumbers.length)) {
        setError('Brak dostępnych grup dla tego kierunku i cyklu. Sprawdź semestr studiów, cykl oraz kod przedmiotów w opcjach poniżej.'); return;
      }
      setCatalog(data);
      const sameStudy = profile?.prefix === config.prefix && profile.term === config.term;
      setChoices(refresh && catalog ? Object.fromEntries(data.courses.map(course => [course.unitId,
        choices[course.unitId] === 'skip' || course.groupNumbers.includes(Number(choices[course.unitId])) ? choices[course.unitId]! : course.groupNumbers.length === 1 ? String(course.groupNumbers[0]) : '',
      ])) : initialChoices(data, sameStudy ? profile.selections : [], sameStudy ? profile.skippedUnitIds : []));
      setStep(2); window.scrollTo({ top: 0, behavior: 'smooth' });
      requestAnimationFrame(() => heading.current?.focus());
    } catch { if (alive.current) setError('Nie udało się pobrać przedmiotów z USOS. Sprawdź połączenie i spróbuj ponownie za chwilę.'); }
    finally { if (alive.current) setBusy(false); }
  }
  async function submitGroups() {
    if (!catalog) return;
    const groups = chosenGroups(catalog, choices);
    if (!groups) { setError('Wybierz poprawną grupę lub „Nie uczęszczam” przy każdych zajęciach. Potrzebujesz co najmniej jednej grupy.'); return; }
    setBusy(true); setError('');
    try { await onSave(config, catalog, groups); }
    catch (e) { if (alive.current) setError(e instanceof Error ? e.message : 'Nie udało się pobrać planu.'); }
    finally { if (alive.current) setBusy(false); }
  }
  function selectProgramme(programme: Programme) {
    setConfig({ ...config, programme, prefix: suggestPrefix(programme.id, config.semester) });
    setChangeProgramme(false); setQuery('');
  }
  const courseList = catalog ? [...new Set(catalog.courses.map(c => c.courseId))] : [];
  const required = catalog?.courses.filter(c => c.groupNumbers.length) ?? [];
  const completed = required.filter(c => choices[c.unitId] === 'skip' || (choices[c.unitId] !== '' && c.groupNumbers.includes(Number(choices[c.unitId])))).length;
  const valid = catalog && chosenGroups(catalog, choices);
  const title = profile ? 'Wszystko po Twojemu.' : 'Twój tydzień. Po Twojemu.';

  return <div className="setup-page">
    <div className="page-intro"><span className="eyebrow"><span className="status-dot" /> MNIEJ SZUKANIA, WIĘCEJ CZASU</span><h1>{title}</h1><p>Wybierz kierunek i swoje grupy. My uporządkujemy resztę.</p></div>
    <div className="setup-layout">
      <div className="setup-main">
        <div className="steps" aria-label={`Krok ${step} z 2`}><span className={step > 1 ? 'done' : 'active'}><b>{step > 1 ? <Check size={14} /> : '1'}</b>Twój kierunek</span><i /><span className={step === 2 ? 'active' : ''}><b>2</b>Twoje grupy</span><i /><span><CheckCheck size={18} />Gotowy plan</span></div>
        <section className="card setup-card">
          <div className="form-heading"><span className="soft-icon">{step === 1 ? <GraduationCap size={24} /> : <BookOpen size={23} />}</span><div><h2 ref={heading} tabIndex={-1}>{step === 1 ? 'Zacznijmy od kierunku' : 'Wybierz swoje grupy'}</h2><p>{step === 1 ? 'Dopasuj plan do tego, co studiujesz.' : `${courseList.length} przedmiotów · ${config.term}`}</p></div></div>
          {step === 1 ? <form onSubmit={e => { e.preventDefault(); void loadCatalog(); }}>
            <fieldset disabled={busy}>
              <label className="field-label">Kierunek studiów</label>
              <button type="button" className="programme-choice" aria-expanded={changeProgramme} onClick={() => setChangeProgramme(!changeProgramme)}><span><strong>{config.programme.name.split(',')[0]}</strong><small>{config.programme.name.split(',').slice(1).join(',').trim() || config.programme.id}</small></span><ChevronDown size={18} /></button>
              {changeProgramme && <div className="programme-search"><div className="search-field"><Search size={18} /><input autoFocus aria-label="Szukaj kierunku" placeholder="Wpisz nazwę kierunku…" value={query} onChange={e => setQuery(e.target.value)} /></div><div className="programme-results" aria-live="polite">
                {searching ? <p className="search-status"><LoaderCircle className="spin" size={17} />Szukam w USOS…</p> : searchError ? <p className="error-text small">{searchError}</p> : <>{results.map(p => <button type="button" key={p.id} onClick={() => selectProgramme(p)}><strong>{p.name.split(',')[0]}</strong><small>{p.name.split(',').slice(1).join(',')} · {p.id}</small></button>)}{!results.length && <p className="search-status">Nie znaleziono kierunku.</p>}{more && <p className="search-status small">Wpisz dokładniejszą nazwę, aby zawęzić wyniki.</p>}</>}
              </div></div>}
              <div className="form-columns"><label><span className="field-label">Semestr studiów</span><select value={config.semester} onChange={e => { const semester = Number(e.target.value); setConfig({ ...config, semester, prefix: suggestPrefix(config.programme.id, semester) }); }}>{Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{i + 1}. semestr</option>)}</select></label>
                <label><span className="field-label">Cykl zajęć</span><input aria-label="Cykl zajęć" value={config.term} onChange={e => setConfig({ ...config, term: e.target.value })} required pattern="[0-9]{4}/[0-9]{4}-[ZL]" placeholder="2026/2027-Z" title="Np. 2026/2027-Z (zimowy) lub 2026/2027-L (letni)" /></label></div>
              <p className="field-hint">Z — semestr zimowy, L — letni. Wybierz cykl zgodny z USOS.</p>
              <details className="advanced" open={!config.prefix || undefined}><summary>Kod przedmiotów i opcje zaawansowane</summary><label><span className="field-label">Prefiks kodu przedmiotów w USOS</span><input value={config.prefix} onChange={e => setConfig({ ...config, prefix: e.target.value })} required maxLength={100} placeholder="np. SIAu>SI1" /></label><p className="field-hint">Podpowiadamy kod na podstawie kierunku. Jeśli uczelnia używa innego oznaczenia, wpisz początek kodu przedmiotów z USOS. Możesz go też zawęzić do swojej specjalności.</p></details>
              {error && <div className="notice warning" role="alert">{error}</div>}
              <div className="form-footer"><span className="small muted"><ShieldCheck size={15} />Bez logowania do USOS</span><button className="button primary" type="submit">{busy ? <><LoaderCircle className="spin" size={17} />Pobieram przedmioty…</> : <>Wybierz grupy<ArrowRight size={17} /></>}</button></div>
            </fieldset>
          </form> : catalog && <form onSubmit={e => { e.preventDefault(); void submitGroups(); }}>
            <fieldset disabled={busy}>
              <div className="group-progress"><span>{completed} z {required.length} uzupełnionych</span><div><i style={{ width: `${completed / Math.max(required.length, 1) * 100}%` }} /></div></div>
              <p className="small muted">Wybierz lub wpisz numer grupy. Zajęcia, na które nie chodzisz, oznacz „Nie uczęszczam”.</p>
              <button type="button" className="button plain catalog-refresh" onClick={() => void loadCatalog(true)}><RefreshCw size={13} />Odśwież dostępne grupy</button>
              {catalog.stale && <div className="notice warning">Katalog pochodzi z pamięci urządzenia. Numery grup mogą być nieaktualne.</div>}
              {catalog.searchMayBeTruncated && <div className="notice warning">USOS ograniczył wyniki do 100. Wróć i zawęź kod przedmiotów, aby uzyskać pełny katalog.</div>}
              <div className="course-list">{courseList.map((id, index) => {
                const units = catalog.courses.filter(c => c.courseId === id);
                return <section className="course" key={id}><div className="course-title"><span>{String(index + 1).padStart(2, '0')}</span><h3>{units[0]!.name}</h3></div>{units.map(unit => <div className="group-row" key={unit.unitId}><label htmlFor={`group-${unit.unitId}`}><span className={`type-dot ${eventTone(unit.classTypeName)}`} />{unit.classTypeName ?? 'Zajęcia'}<small>{unit.groupCount ? `${unit.groupCount} ${unit.groupCount === 1 ? 'grupa' : 'grup'}` : 'Brak grup w USOS'}</small></label>{unit.groupCount > 0 && <div className="group-inputs"><select aria-label={`Grupa: ${unit.name}, ${unit.classTypeName ?? 'zajęcia'}`} id={`group-${unit.unitId}`} value={unit.groupNumbers.includes(Number(choices[unit.unitId])) || choices[unit.unitId] === 'skip' ? choices[unit.unitId] : ''} onChange={e => setChoices({ ...choices, [unit.unitId]: e.target.value })}><option value="">Wybierz…</option>{unit.groupNumbers.map(n => <option key={n} value={n}>Grupa {n}</option>)}<option value="skip">Nie uczęszczam</option></select>{unit.groupCount > 4 && <input aria-label={`Wpisz grupę: ${unit.name}, ${unit.classTypeName ?? 'zajęcia'}`} className="group-number" inputMode="numeric" placeholder="Nr" value={choices[unit.unitId] === 'skip' ? '' : choices[unit.unitId] ?? ''} onChange={e => setChoices({ ...choices, [unit.unitId]: e.target.value })} />}</div>}</div>)}</section>;
              })}</div>
              {error && <div className="notice warning" role="alert">{error}</div>}
              <div className="form-footer"><button type="button" className="button plain" onClick={() => { setStep(1); setError(''); }}><ArrowLeft size={16} />Kierunek</button><button className="button primary" type="submit" disabled={!valid || catalog.searchMayBeTruncated}>{busy ? <><LoaderCircle className="spin" size={17} />Układam Twój plan…</> : <>{profile ? 'Zapisz zmiany' : 'Pokaż mój plan'}<ArrowRight size={17} /></>}</button></div>
            </fieldset>
          </form>}
        </section>
        {profile && <button className="button plain cancel-edit" onClick={onCancel} disabled={busy}>Anuluj zmiany i wróć do planu</button>}
        <p className="source-note"><span className="status-dot" />Dane prosto z USOS Politechniki Śląskiej</p>
      </div>
      <aside className="setup-aside"><div className="preview-art" aria-hidden="true"><div className="art-top"><span>TWÓJ DOBRY TYDZIEŃ</span><Sparkles size={18} /></div><div className="art-days"><span>PON<b>12</b></span><span className="selected">WT<b>13</b></span><span>ŚR<b>14</b></span><span>CZW<b>15</b></span><span>PT<b>16</b></span></div><div className="art-timeline"><span className="art-time">08:00</span><div className="art-event green"><span>08:30 – 10:00</span><strong>Trochę nowej wiedzy</strong><small>Wykład · sala 101</small></div><span className="art-time">10:00</span><div className="art-break">Chwila na kawę ☕</div><span className="art-time">12:00</span><div className="art-event purple"><span>12:00 – 13:30</span><strong>Czas na praktykę</strong><small>Laboratorium · grupa 2</small></div></div><div className="art-sticker"><Check size={16} />Wszystko na swoim miejscu</div></div><div className="aside-copy"><h3>Plan, który nadąża za Tobą.</h3><p>Przesuń palcem, sprawdź kolejny dzień.<br />I zajmij się tym, co ważne.</p><div className="feature"><WifiOff size={17} /><span>Dostępny również offline</span></div><div className="feature"><CheckCheck size={17} /><span>Tylko Twoje przedmioty i grupy</span></div></div></aside>
    </div>
  </div>;
}
