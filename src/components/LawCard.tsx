import { clsx } from 'clsx';
import { Link2, Activity } from 'lucide-react';
import type { Law, Weight, Category } from '../lib/types';

const WEIGHT_STYLES: Record<Weight, string> = {
  CRITICAL: 'bg-danger/15 text-danger border border-danger/40',
  STANDARD: 'bg-primary/15 text-primary border border-primary/40',
  FLEXIBLE: 'bg-success/15 text-success border border-success/40',
};

const CARD_GLOW: Record<Weight, string> = {
  CRITICAL: 'hover:shadow-[0_0_32px_-8px_rgba(244,63,94,0.35)]',
  STANDARD: 'hover:shadow-[0_0_32px_-8px_rgba(109,140,255,0.35)]',
  FLEXIBLE: 'hover:shadow-[0_0_32px_-8px_rgba(34,211,174,0.35)]',
};

const BORDER_CLASS: Record<Weight, string> = {
  CRITICAL: 'border-critical',
  STANDARD: 'border-standard',
  FLEXIBLE: 'border-flexible',
};

export const CATEGORY_COLORS: Record<Category, string> = {
  Framework: '#8b5cf6',
  Database: '#06b6d4',
  Auth: '#f59e0b',
  'API Style': '#ec4899',
  Infra: '#10b981',
  Pattern: '#3b82f6',
};

function categoryBadgeStyle(category: Category): React.CSSProperties {
  const color = CATEGORY_COLORS[category] ?? '#64748b';
  return {
    color,
    backgroundColor: `${color}22`,
    border: `1px solid ${color}55`,
  };
}

interface LawCardProps {
  law: Law;
}

export function LawCard({ law }: LawCardProps) {
  return (
    <div
      className={clsx(
        'glass-card flex h-full flex-col gap-3 p-5 transition-transform duration-200 hover:-translate-y-0.5',
        BORDER_CLASS[law.weight],
        CARD_GLOW[law.weight],
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs font-semibold text-slate-400">
          {law.id}
        </span>
        <span
          className={clsx(
            'rounded px-2 py-0.5 text-[10px] font-bold tracking-wide',
            WEIGHT_STYLES[law.weight],
          )}
        >
          {law.weight}
        </span>
        <span
          className="rounded px-2 py-0.5 text-[10px] font-semibold"
          style={categoryBadgeStyle(law.category)}
        >
          {law.category}
        </span>
      </div>

      <h3 className="font-display text-lg font-semibold text-slate-100">{law.title}</h3>

      {law.description && (
        <p className="text-sm text-slate-400">{law.description}</p>
      )}

      {law.rationale && (
        <p className="border-l-2 border-slate-700 pl-3 text-sm italic text-slate-300">
          {law.rationale}
        </p>
      )}

      {law.depends_on && law.depends_on.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <Link2 size={13} className="text-slate-500" />
          {law.depends_on.map((dep) => (
            <span
              key={dep}
              className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400"
            >
              {dep}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center gap-1.5 pt-1 text-xs text-slate-500">
        <Activity size={13} />
        Checked {law.check_count ?? 0} time
        {(law.check_count ?? 0) === 1 ? '' : 's'}
      </div>
    </div>
  );
}
