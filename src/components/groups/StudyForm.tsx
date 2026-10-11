import { useState } from 'react';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { suggestPrefix } from '../../../api/programmes';
import type { StudyConfig } from '../../lib/profile';
import ProgrammePicker from './ProgrammePicker';

interface Props {
  initial: StudyConfig;
  busy: boolean;
  onSubmit: (config: StudyConfig) => Promise<boolean>;
  onClose: () => void;
  canCancel: boolean;
}

export default function StudyForm({ initial, busy, onSubmit, onClose, canCancel }: Props) {
  const [config, setConfig] = useState(initial);
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        if (await onSubmit(config)) {
          onClose();
        }
      }}
      className="panel p-5 sm:p-7"
    >
      <h2 className="mb-2 text-xl">Jakie studia, taki plan</h2>
      <p className="mb-6 text-muted">
        Wybierz kierunek i cykl. Za chwilę dobierzesz grupy do swoich zajęć.
      </p>
      <fieldset disabled={busy} className="space-y-5">
        <ProgrammePicker
          value={config.programme}
          onChange={(programme) =>
            setConfig({
              ...config,
              programme,
              prefix: suggestPrefix(programme.id, config.semester),
            })
          }
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <label>
            <span className="field-label">Semestr studiów</span>
            <select
              className="field"
              value={config.semester}
              onChange={(event) => {
                const semester = Number(event.target.value);
                setConfig({
                  ...config,
                  semester,
                  prefix: suggestPrefix(config.programme.id, semester),
                });
              }}
            >
              {Array.from({ length: 12 }, (_, index) => (
                <option key={index} value={index + 1}>
                  {index + 1}. semestr
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="field-label">Cykl zajęć</span>
            <input
              className="field"
              value={config.term}
              onChange={(event) => setConfig({ ...config, term: event.target.value })}
              required
              pattern="[0-9]{4}/[0-9]{4}-[ZL]"
              placeholder="2026/2027-Z"
            />
            <span className="mt-2 block text-sm text-muted">Z — zimowy, L — letni.</span>
          </label>
        </div>
        <details className="rounded-xl bg-subtle p-4" open={!config.prefix || undefined}>
          <summary className="text-sm font-medium">Kod przedmiotów i opcje zaawansowane</summary>
          <label className="mt-4 block">
            <span className="field-label">Początek kodu przedmiotów w USOS</span>
            <input
              className="field font-mono"
              value={config.prefix}
              onChange={(event) => setConfig({ ...config, prefix: event.target.value })}
              required
              maxLength={100}
            />
          </label>
          <p className="mt-2 text-sm text-muted">
            Kod podpowiadamy na podstawie kierunku. Jeśli brakuje zajęć, sprawdź ich kod w USOS i
            popraw go tutaj.
          </p>
        </details>
        <div className="flex flex-wrap justify-end gap-3">
          {canCancel && (
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Anuluj
            </button>
          )}
          <button type="submit" className="btn btn-primary">
            {busy ? <LoaderCircle className="animate-spin" size={19} /> : <ArrowRight size={19} />}
            Pobierz przedmioty
          </button>
        </div>
      </fieldset>
    </form>
  );
}
