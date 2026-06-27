export function Field({ label, htmlFor, error, hint, children }) {
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-semibold text-[var(--color-ink)] mb-1.5">
          {label}
        </label>
      )}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-[var(--color-ink-soft)]/70">{hint}</p>}
      {error && <p className="mt-1 text-xs font-medium text-[var(--color-urgent)]">{error}</p>}
    </div>
  );
}

const baseInputClasses = `
  w-full px-3.5 py-2.5 rounded-[var(--radius-card)] bg-white
  border border-[var(--color-paper-line)] text-[var(--color-ink)]
  placeholder:text-[var(--color-ink)]/40
  focus:outline-none focus:ring-2 focus:ring-[var(--color-terracotta)] focus:border-[var(--color-terracotta)]
  transition-colors duration-150
  disabled:bg-black/5 disabled:cursor-not-allowed
`;

export function Input({ error, className = '', ...props }) {
  return (
    <input
      className={`${baseInputClasses} ${error ? 'border-[var(--color-urgent)]' : ''} ${className}`}
      {...props}
    />
  );
}

export function Textarea({ error, className = '', ...props }) {
  return (
    <textarea
      className={`${baseInputClasses} ${error ? 'border-[var(--color-urgent)]' : ''} ${className}`}
      {...props}
    />
  );
}

export function Select({ error, className = '', children, ...props }) {
  return (
    <select
      className={`${baseInputClasses} ${error ? 'border-[var(--color-urgent)]' : ''} ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
