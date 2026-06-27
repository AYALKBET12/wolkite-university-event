import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative z-10 w-full ${maxWidth} bg-white rounded-[var(--radius-card)] shadow-xl max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-paper-line)] sticky top-0 bg-white">
          <h3 className="font-[var(--font-display)] font-bold text-lg text-[var(--color-ink)]">{title}</h3>
          <button onClick={onClose} className="text-[var(--color-ink)]/50 hover:text-[var(--color-ink)] p-1" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
