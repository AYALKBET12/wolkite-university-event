export function Card({ children, className = '' }) {
  return (
    <div
      className={`bg-[var(--color-paper)] rounded-[var(--radius-card)] border border-[var(--color-paper-line)] shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function Alert({ variant = 'info', children, className = '' }) {
  const styles = {
    info: 'bg-[var(--color-ink)]/5 border-[var(--color-ink)]/20 text-[var(--color-ink)]',
    error: 'bg-[var(--color-urgent)]/10 border-[var(--color-urgent)]/30 text-[var(--color-urgent)]',
    success: 'bg-[var(--color-ink-soft)]/10 border-[var(--color-ink-soft)]/30 text-[var(--color-ink-soft)]',
    warning: 'bg-[var(--color-gold)]/15 border-[var(--color-gold)]/40 text-[#8a5d10]',
  };

  return (
    <div className={`rounded-[var(--radius-card)] border px-4 py-3 text-sm font-medium ${styles[variant]} ${className}`}>
      {children}
    </div>
  );
}
