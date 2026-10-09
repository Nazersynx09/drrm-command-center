import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import type { Theme } from '@/lib/theme';

type Props = { title: string; children: ReactNode; onClose: () => void; t: Theme };

export function Modal({ title, children, onClose, t }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md rounded-2xl border shadow-2xl p-5 ${t.panelBg} ${t.panelBorder}`}
      >
        <div className="flex justify-between items-start mb-4">
          <h3 className={`text-sm font-black ${t.pageText}`}>{title}</h3>
          <button onClick={onClose} aria-label="Close">
            <X size={16} className={t.body} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
