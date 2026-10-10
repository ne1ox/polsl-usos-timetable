import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

export default function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return <dialog className="modal" ref={ref} onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="modal-content">
      <div className="section-heading"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Zamknij"><X size={20} /></button></div>
      {children}
    </div>
  </dialog>;
}
