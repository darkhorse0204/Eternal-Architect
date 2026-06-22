import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2, History } from 'lucide-react';
import { getAuditLog } from '../lib/api';
import type { ActionType } from '../lib/types';

const ACTION_STYLES: Record<ActionType, { label: string; className: string }> = {
  LAW_ADDED: { label: 'LAW ADDED', className: 'bg-primary/15 text-primary' },
  CONFLICT_DETECTED: {
    label: 'CONFLICT',
    className: 'bg-danger/15 text-danger',
  },
  AMENDMENT_PROPOSED: {
    label: 'AMENDMENT',
    className: 'bg-purple-500/15 text-purple-300',
  },
  OVERRIDE_LOGGED: {
    label: 'OVERRIDE',
    className: 'bg-warning/15 text-warning',
  },
  BUILD_CANCELLED: {
    label: 'BUILD CANCELLED',
    className: 'bg-success/15 text-success',
  },
  CHECK_PASSED: { label: 'CHECK PASSED', className: 'bg-slate-700/50 text-slate-300' },
};

function formatTime(ts: string): string {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleString();
}

export function AuditLog() {
  const auditQuery = useQuery({ queryKey: ['audit'], queryFn: getAuditLog });
  const entries = auditQuery.data ?? [];

  return (
    <div className="max-w-3xl space-y-8">
      <header>
        <h1 className="font-display text-2xl font-bold text-gradient">Audit Log</h1>
        <p className="mt-2 text-sm text-slate-400">
          A permanent record of every decision and conflict.
        </p>
      </header>

      {auditQuery.isLoading && (
        <div className="glass-card flex flex-col items-center gap-3 py-16 text-slate-400">
          <Loader2 size={28} className="animate-spin text-primary" />
          <p className="text-sm">Loading history…</p>
        </div>
      )}

      {!auditQuery.isLoading && entries.length === 0 && (
        <div className="glass-card flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <History size={22} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">
              No activity recorded yet
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Propose a law or run a conflict check to populate the log.
            </p>
          </div>
        </div>
      )}

      <ol className="relative space-y-3 border-l border-slate-800 pl-5">
        {entries.map((entry, i) => {
          const style =
            ACTION_STYLES[entry.action_type] ?? {
              label: entry.action_type,
              className: 'bg-slate-700/50 text-slate-300',
            };
          return (
            <motion.li
              key={entry.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.4) }}
              className="glass-card relative p-4"
            >
              <span className="absolute -left-[26px] top-5 h-2.5 w-2.5 rounded-full bg-gradient-to-br from-primary to-accent ring-4 ring-bg" />
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold tracking-wide ${style.className}`}
                >
                  {style.label}
                </span>
                <span className="text-sm font-medium text-slate-200">
                  {entry.title}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                {formatTime(entry.created_at)}
              </p>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
