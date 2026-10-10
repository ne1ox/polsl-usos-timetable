import { useEffect, useState } from 'react';
import { Check, Download, Share, Smartphone } from 'lucide-react';

interface InstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
let pendingInstall: InstallEvent | null = null;
// Listen before the user opens settings; the browser only emits this event once.
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault(); pendingInstall = event as InstallEvent;
  window.dispatchEvent(new Event('kampus-install-ready'));
});

export default function InstallPanel() {
  const [install, setInstall] = useState(pendingInstall);
  const [installed, setInstalled] = useState(() => window.matchMedia('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true);
  const [error, setError] = useState('');
  useEffect(() => {
    const ready = () => setInstall(pendingInstall);
    const done = () => { setInstalled(true); pendingInstall = null; setInstall(null); };
    window.addEventListener('kampus-install-ready', ready);
    window.addEventListener('appinstalled', done);
    return () => { window.removeEventListener('kampus-install-ready', ready); window.removeEventListener('appinstalled', done); };
  }, []);
  async function installApp() {
    if (!install) return;
    try {
      await install.prompt();
      if ((await install.userChoice).outcome === 'accepted') setInstalled(true);
      pendingInstall = null; setInstall(null);
    } catch { setError('Otwórz menu przeglądarki i wybierz „Dodaj do ekranu głównego”.'); }
  }
  return <div className="install-content">
    <div className="install-hero"><span className="large-icon"><Smartphone size={30} /></span><h3>Twój plan. Zawsze pod ręką.</h3><p>Dodaj Kampus do ekranu głównego. Otwieraj jak aplikację, także bez internetu po zapisaniu planu.</p></div>
    {installed ? <div className="notice success"><Check size={18} />Kampus jest uruchomiony jako aplikacja.</div>
      : install && <button className="button primary full" onClick={installApp}><Download size={18} />Zainstaluj Kampus</button>}
    <div className="install-platform"><span className="platform-icon">A</span><div><h4>Android · Chrome</h4><p>Otwórz menu <strong>⋮</strong> i wybierz <strong>Dodaj do ekranu głównego → Zainstaluj</strong>.</p></div></div>
    <div className="install-platform"><Share size={22} /><div><h4>iPhone · Safari</h4><p>Stuknij <strong>Udostępnij</strong>, potem <strong>Do ekranu początkowego → Dodaj</strong>.</p></div></div>
    {!window.isSecureContext && <div className="notice warning">Ten adres HTTP pozwala przetestować plan. Pełna instalacja i tryb offline wymagają opublikowania aplikacji pod adresem HTTPS.</div>}
    {error && <p role="alert" className="error-text">{error}</p>}
    <p className="small muted">Nie potrzebujesz konta ani sklepu z aplikacjami. Dostępność instalacji zależy od przeglądarki.</p>
  </div>;
}
