import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2, ScrollText, WifiOff } from 'lucide-react';
import { getLaws, getAuditLog, computeHealthScore } from '../lib/api';
import { HealthRing } from '../components/HealthRing';
import { LawCard } from '../components/LawCard';

export function Constitution() {
  const lawsQuery = useQuery({ queryKey: ['laws'], queryFn: getLaws });
  const auditQuery = useQuery({ queryKey: ['audit'], queryFn: getAuditLog });

  const laws = lawsQuery.data ?? [];
  const health = computeHealthScore(auditQuery.data ?? []);

  return (
    <div className="space-y-8">
      <header className="glass-card flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-center">
        <HealthRing score={health} size={96} />
        <div className="text-center sm:text-left">
          <h1 className="font-display text-2xl font-bold text-gradient">
            The Constitution
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Every architectural decision, codified as law.
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-4 text-sm sm:justify-start">
            <span className="text-slate-300">
              <span className="font-mono text-lg font-bold text-primary">
                {laws.length}
              </span>{' '}
              active laws
            </span>
            <span className="text-slate-300">
              Constitution health:{' '}
              <span className="font-mono font-bold text-success">{health}</span>
            </span>
          </div>
        </div>
      </header>

      {lawsQuery.isLoading && (
        <div className="glass-card flex flex-col items-center gap-3 py-16 text-slate-400">
          <Loader2 size={28} className="animate-spin text-primary" />
          <p className="text-sm">Loading laws…</p>
        </div>
      )}

      {lawsQuery.isError && (
        <div className="glass-card glow-conflict flex flex-col items-center gap-2 py-16 text-center">
          <WifiOff size={28} className="text-danger" />
          <p className="text-sm font-semibold text-danger">
            Failed to load laws
          </p>
          <p className="text-xs text-slate-500">
            Check your connection and try again.
          </p>
        </div>
      )}

      {!lawsQuery.isLoading && !lawsQuery.isError && laws.length === 0 && (
        <div className="glass-card flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ScrollText size={22} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">
              No laws yet
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Propose the first one to start the Constitution.
            </p>
          </div>
        </div>
      )}

      {!lawsQuery.isLoading && !lawsQuery.isError && laws.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {laws.map((law, i) => (
            <motion.div
              key={law.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
            >
              <LawCard law={law} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
