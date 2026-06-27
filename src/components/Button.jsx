const VARIANTS = {
  primary: 'bg-[var(--color-terracotta)] text-white hover:bg-[var(--color-terracotta-soft)]',
  secondary: 'bg-[var(--color-ink)] text-white hover:bg-[var(--color-ink-soft)]',
  outline: 'border-2 border-[var(--color-ink)] text-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-white',
  ghost: 'text-[var(--color-ink)] hover:bg-black/5',
  danger: 'bg-[var(--color-urgent)] text-white hover:opacity-90',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  disabled = false,
  loading = false,
  ...props
}) {
  const sizeClasses = size === 'sm' ? 'px-3 py-1.5 text-sm' : size === 'lg' ? 'px-6 py-3 text-base' : 'px-4 py-2.5 text-sm';

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`
        font-semibold rounded-[var(--radius-card)] transition-colors duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        inline-flex items-center justify-center gap-2
        ${VARIANTS[variant]} ${sizeClasses} ${className}
      `}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
