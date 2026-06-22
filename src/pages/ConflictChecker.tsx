import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { CheckCircle2, AlertTriangle, GitBranch, Loader2 } from 'lucide-react';
import { getLaws, checkConflict, storeAudit } from '../lib/api';
import type { CheckResult } from '../lib/types';

export function ConflictChecker() {
  const queryClient = useQueryClient();
  const lawsQuery = useQuery({ queryKey: ['laws'], queryFn: getLaws });
  const laws = lawsQuery.data ?? [];

  const [feature, setFeature] = useState('');
  const [result, setResult] = useState<CheckResult | null>(null);
  const [amendmentReason, setAmendmentReason] = useState('');

  const checkMutation = useMutation({
    mutationFn: () => checkConflict(feature.trim(), laws),
    onSuccess: (res) => {
      setResult(res);
      queryClient.invalidateQueries({ queryKey: ['audit'] });
      queryClient.invalidateQueries({ queryKey: ['laws'] });
    },
    onError: () => toast.error('Check failed. Please try again.'),
  });

  const actionMutation = useMutation({
    mutationFn: async (kind: 'override' | 'amend' | 'cancel') => {
      if (kind === 'override' && result?.violatedLaw) {
        await storeAudit('OVERRIDE_LOGGED', feature.trim(), {
          law: result.violatedLaw.id,
        });
      } else if (kind === 'amend' && result?.violatedLaw) {
        await storeAudit('AMENDMENT_PROPOSED', feature.trim(), {
          law: result.violatedLaw.id,
          reason: amendmentReason.trim(),
        });
      } else if (kind === 'cancel') {
        await storeAudit('BUILD_CANCELLED', feature.trim(), {
          law: result?.violatedLaw?.id ?? null,
        });
      }
      return kind;
    },
    onSuccess: (kind) => {
      queryClient.invalidateQueries({ queryKey: ['audit'] });
      if (kind === 'override') toast.success('Override logged. Proceed with caution.');
      if (kind === 'amend') toast.success('Amendment proposed for review.');
      if (kind === 'cancel') toast.success('Build cancelled. Health score preserved.');
      setResult(null);
      setFeature('');
      setAmendmentReason('');
    },
    onError: () => toast.error('Action failed. Please try again.'),
  });

  const busy = checkMutation.isPending;

  return (
    <div className="max-w-3xl space-y-8">
      <header>
        <h1 className="font-display text-2xl font-bold text-gradient">Conflict Checker</h1>
        <p className="mt-2 text-sm text-slate-400">
          Run a proposed build past The Eternal Architect before you write code.
        </p>
      </header>

      <div className="glass-card space-y-5 p-7">
        <textarea
          value={feature}
          onChange={(e) => setFeature(e.target.value)}
          placeholder="Describe what you're about to build..."
          rows={4}
          className="input resize-y"
        />
        <button
          type="button"
          disabled={busy || feature.trim().length === 0}
          onClick={() => {
            setResult(null);
            checkMutation.mutate();
          }}
          className="btn-primary"
        >
          {busy ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Consulting the Architect…
            </>
          ) : (
            'Run Architect Check'
          )}
        </button>
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {result.state === 'CLEAR' && (
            <ClearCard result={result} />
          )}

          {result.state === 'CONFLICT' && (
            <ConflictCard
              result={result}
              amendmentReason={amendmentReason}
              setAmendmentReason={setAmendmentReason}
              onOverride={() => actionMutation.mutate('override')}
              onAmend={() => actionMutation.mutate('amend')}
              onCancel={() => actionMutation.mutate('cancel')}
              actionBusy={actionMutation.isPending}
            />
          )}

          {result.state === 'CASCADE' && (
            <CascadeCard
              result={result}
              onCancel={() => actionMutation.mutate('cancel')}
              actionBusy={actionMutation.isPending}
            />
          )}
        </motion.div>
      )}
    </div>
  );
}

function ClearCard({ result }: { result: CheckResult }) {
  return (
    <div className="glass-card glow-clear space-y-3 p-6">
      <div className="flex items-center gap-2 text-success">
        <CheckCircle2 size={22} />
        <h2 className="text-lg font-bold">
          ✅ Cleared by The Eternal Architect
        </h2>
      </div>
      <p className="text-sm text-slate-300">{result.answer}</p>
      {result.cascadeLaws && result.cascadeLaws.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Laws consulted
          </p>
          <div className="flex flex-wrap gap-1.5">
            {result.cascadeLaws.map((l) => (
              <span
                key={l.id}
                className="rounded bg-success/10 px-2 py-0.5 font-mono text-xs text-success"
              >
                {l.id} · {l.title}
              </span>
            ))}
          </div>
        </div>
      )}
      <p className="text-xs text-slate-500">
        Confidence: {(result.confidence * 100).toFixed(0)}%
      </p>
    </div>
  );
}

interface ConflictCardProps {
  result: CheckResult;
  amendmentReason: string;
  setAmendmentReason: (v: string) => void;
  onOverride: () => void;
  onAmend: () => void;
  onCancel: () => void;
  actionBusy: boolean;
}

function ConflictCard({
  result,
  amendmentReason,
  setAmendmentReason,
  onOverride,
  onAmend,
  onCancel,
  actionBusy,
}: ConflictCardProps) {
  const law = result.violatedLaw;
  const canOverride = law?.weight === 'FLEXIBLE';

  return (
    <div className="glass-card glow-conflict space-y-4 p-6">
      <div className="flex items-center gap-2 text-danger">
        <AlertTriangle size={22} />
        <h2 className="text-lg font-bold">⚠️ LAW VIOLATION DETECTED</h2>
      </div>

      <p className="text-sm text-slate-300">{result.answer}</p>

      {law && (
        <div className="rounded-lg border border-danger/30 bg-danger/5 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-semibold text-slate-400">
              {law.id}
            </span>
            <span className="rounded bg-danger/15 px-2 py-0.5 text-[10px] font-bold text-danger">
              {law.weight}
            </span>
            <span className="text-sm font-semibold text-slate-100">
              {law.title}
            </span>
          </div>
          {law.rationale && (
            <p className="mt-2 text-sm italic text-slate-400">
              {law.rationale}
            </p>
          )}
        </div>
      )}

      <div className="space-y-4 border-t border-slate-800 pt-4">
        <h3 className="text-sm font-bold uppercase tracking-wide text-warning">
          Amendment Protocol
        </h3>

        {canOverride ? (
          <button
            type="button"
            disabled={actionBusy}
            onClick={onOverride}
            className="w-full rounded-lg border border-warning/50 bg-warning/10 px-4 py-2.5 text-sm font-semibold text-warning transition-colors hover:bg-warning/20 disabled:opacity-50"
          >
            Override (FLEXIBLE law — proceed anyway)
          </button>
        ) : (
          <p className="text-xs text-slate-500">
            This law is{' '}
            <span className="font-semibold text-danger">
              {law?.weight ?? 'CRITICAL'}
            </span>{' '}
            — override is not permitted. Propose an amendment or cancel.
          </p>
        )}

        <div className="space-y-2">
          <textarea
            value={amendmentReason}
            onChange={(e) => setAmendmentReason(e.target.value)}
            placeholder="Reason for amending this law..."
            rows={3}
            className="input resize-y"
          />
          <button
            type="button"
            disabled={actionBusy || amendmentReason.trim().length === 0}
            onClick={onAmend}
            className="w-full rounded-lg border border-purple-500/50 bg-purple-500/10 px-4 py-2.5 text-sm font-semibold text-purple-300 transition-colors hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Propose Amendment
          </button>
        </div>

        <button
          type="button"
          disabled={actionBusy}
          onClick={onCancel}
          className="w-full rounded-lg border border-success/50 bg-success/10 px-4 py-2.5 text-sm font-semibold text-success transition-colors hover:bg-success/20 disabled:opacity-50"
        >
          Cancel Build ↑ Health Score
        </button>
      </div>
    </div>
  );
}

interface CascadeCardProps {
  result: CheckResult;
  onCancel: () => void;
  actionBusy: boolean;
}

function CascadeCard({ result, onCancel, actionBusy }: CascadeCardProps) {
  return (
    <div className="glass-card glow-cascade space-y-4 p-6">
      <div className="flex items-center gap-2 text-warning">
        <GitBranch size={22} />
        <h2 className="text-lg font-bold">⚠️ CASCADE WARNING</h2>
      </div>

      <p className="text-sm text-slate-300">{result.answer}</p>

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Affected dependent laws
        </p>
        <div className="space-y-2">
          {(result.cascadeLaws ?? []).map((l) => (
            <div
              key={l.id}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3"
            >
              <span className="font-mono text-xs font-semibold text-slate-400">
                {l.id}
              </span>
              <span className="rounded bg-warning/15 px-2 py-0.5 text-[10px] font-bold text-warning">
                {l.weight}
              </span>
              <span className="text-sm text-slate-200">{l.title}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        disabled={actionBusy}
        onClick={onCancel}
        className="w-full rounded-lg border border-success/50 bg-success/10 px-4 py-2.5 text-sm font-semibold text-success transition-colors hover:bg-success/20 disabled:opacity-50"
      >
        Cancel Build ↑ Health Score
      </button>
    </div>
  );
}
