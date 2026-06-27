import { CATEGORY_COLOR_VAR } from '../utils/constants';

export default function CategoryTag({ category, label }) {
  const colorVar = CATEGORY_COLOR_VAR[category] || '--color-cat-admin';

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-black/[0.035]">
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: `var(${colorVar})` }}
      />
      <span style={{ color: `var(${colorVar})` }}>{label}</span>
    </span>
  );
}
