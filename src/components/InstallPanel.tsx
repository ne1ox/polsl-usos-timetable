import { useEffect, useState } from 'react';
import { Check, Download, Share, Smartphone } from 'lucide-react';

interface InstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
let pendingInstall: InstallEvent | null = null;
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  pendingInstall = event as InstallEvent;
  window.dispatchEvent(new Event('kampus-install-ready'));
});

export default function InstallPanel() {
  const [install, setInstall] = useState(pendingInstall);
  const [installed, setInstalled] = useState(
    () =>
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true,
  );
  const [error, setError] = useState('');
  useEffect(() => {
    const ready = () => setInstall(pendingInstall);
    const done = () => {
      setInstalled(true);
      pendingInstall = null;
      setInstall(null);
    };
    window.addEventListener('kampus-install-ready', ready);
    window.addEventListener('appinstalled', done);
    return () => {
      window.removeEventListener('kampus-install-ready', ready);
      window.removeEventListener('appinstalled', done);
    };
  }, []);
  async function installApp() {
    if (!install) {
      return;
    }
    try {
      await install.prompt();
      if ((await install.userChoice).outcome === 'accepted') {
        setInstalled(true);
      }
      pendingInstall = null;
      setInstall(null);
    } catch {
      setError('Otwórz menu przeglądarki i wybierz „Dodaj do ekranu głównego”.');
    }
  }
  return (
    <section className="panel p-6">
      <Smartphone className="mb-4 text-primary-text" size={27} />
      <h2 className="text-xl">Plan zawsze pod ręką</h2>
      <p className="mt-2 text-muted">
        Dodaj Kampus do ekranu telefonu. Pobrany wcześniej plan będzie dostępny również offline.
      </p>
      {installed && (
        <p className="notice mt-5">
          <Check size={19} />
          Kampus działa jako aplikacja.
        </p>
      )}
      {!installed && install && (
        <button className="btn btn-primary mt-5" onClick={() => void installApp()}>
          <Download size={19} />
          Zainstaluj Kampus
        </button>
      )}
      <div className="mt-6 space-y-5 border-t border-line pt-5">
        <div>
          <h3>Android · Chrome</h3>
          <p className="mt-1 text-sm text-muted">
            W menu przeglądarki wybierz „Dodaj do ekranu głównego”, a następnie „Zainstaluj”.
          </p>
        </div>
        <div>
          <h3 className="flex items-center gap-2">
            <Share size={17} />
            iPhone · Safari
          </h3>
          <p className="mt-1 text-sm text-muted">
            Stuknij „Udostępnij”, potem „Do ekranu początkowego” i „Dodaj”.
          </p>
        </div>
      </div>
      {!window.isSecureContext && (
        <p className="notice notice-warning mt-5">
          Instalacja i tryb offline na telefonie wymagają adresu HTTPS.
        </p>
      )}
      {error && (
        <p role="alert" className="notice notice-warning mt-5">
          {error}
        </p>
      )}
    </section>
  );
}
