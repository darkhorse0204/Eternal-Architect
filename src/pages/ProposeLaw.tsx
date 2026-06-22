import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle, Loader2 } from 'lucide-react';
import {
  getLaws,
  storeLaw,
  checkConflict,
  generateLawId,
} from '../lib/api';
import type { CheckResult, Category, Weight } from '../lib/types';

const CATEGORIES: Category[] = [
  'Framework',
  'Database',
  'Auth',
  'API Style',
  'Infra',
  'Pattern',
];

const WEIGHTS: Weight[] = ['CRITICAL', 'STANDARD', 'FLEXIBLE'];

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string(),
  category: z.enum(['Framework', 'Database', 'Auth', 'API Style', 'Infra', 'Pattern']),
  rationale: z.string(),
  weight: z.enum(['CRITICAL', 'STANDARD', 'FLEXIBLE']),
  depends_on: z.array(z.string()),
});

type FormValues = z.infer<typeof schema>;

export function ProposeLaw() {
  const queryClient = useQueryClient();
  const lawsQuery = useQuery({ queryKey: ['laws'], queryFn: getLaws });
  const laws = lawsQuery.data ?? [];

  const [conflict, setConflict] = useState<CheckResult | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      category: 'Framework',
      rationale: '',
      weight: 'STANDARD',
      depends_on: [],
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const probe = `${values.title}. ${values.description} ${values.rationale}`.trim();
      const check = await checkConflict(probe, laws);

      if (check.state === 'CONFLICT' || check.state === 'CASCADE') {
        return { blocked: true as const, check };
      }

      const id = generateLawId(laws);
      await storeLaw({
        id,
        title: values.title,
        description: values.description,
        category: values.category,
        rationale: values.rationale,
        weight: values.weight,
        depends_on: values.depends_on,
      });
      return { blocked: false as const, id };
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['audit'] });
      queryClient.invalidateQueries({ queryKey: ['laws'] });
      if (res.blocked) {
        setConflict(res.check);
        toast.error('Proposed law conflicts with the Constitution.');
      } else {
        setConflict(null);
        toast.success(`${res.id} enacted into the Constitution.`);
        reset();
      }
    },
    onError: () => toast.error('Failed to propose law. Please try again.'),
  });

  const busy = submitMutation.isPending;

  return (
    <div className="max-w-3xl space-y-8">
      <header>
        <h1 className="font-display text-2xl font-bold text-gradient">Propose a Law</h1>
        <p className="mt-2 text-sm text-slate-400">
          New laws are checked against the Constitution before being enacted.
        </p>
      </header>

      <form
        onSubmit={handleSubmit((v) => {
          setConflict(null);
          submitMutation.mutate(v);
        })}
        className="glass-card space-y-5 p-7"
      >
        <Field label="Title" error={errors.title?.message}>
          <input
            {...register('title')}
            placeholder="e.g. Use React Query for server state"
            className="input"
          />
        </Field>

        <Field label="Description">
          <textarea
            {...register('description')}
            rows={2}
            placeholder="What this law governs..."
            className="input resize-y"
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Category">
            <select {...register('category')} className="input">
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Weight">
            <select {...register('weight')} className="input">
              {WEIGHTS.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Rationale">
          <textarea
            {...register('rationale')}
            rows={3}
            placeholder="Why this decision matters..."
            className="input resize-y"
          />
        </Field>

        <Field label="Depends on">
          <select
            {...register('depends_on')}
            multiple
            className="input h-32"
          >
            {laws.map((l) => (
              <option key={l.id} value={l.id}>
                {l.id} — {l.title}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            Hold Ctrl/Cmd to select multiple.
          </p>
        </Field>

        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Checking & enacting…
            </>
          ) : (
            'Propose Law'
          )}
        </button>
      </form>

      {conflict && (
        <div className="glass-card glow-conflict space-y-3 p-6">
          <div className="flex items-center gap-2 text-danger">
            <AlertTriangle size={20} />
            <h2 className="text-lg font-bold">
              Cannot enact — conflict detected
            </h2>
          </div>
          <p className="text-sm text-slate-300">{conflict.answer}</p>
          {conflict.violatedLaw && (
            <div className="rounded-lg border border-danger/30 bg-danger/5 p-3">
              <span className="font-mono text-xs text-slate-400">
                {conflict.violatedLaw.id}
              </span>{' '}
              <span className="text-sm font-semibold text-slate-100">
                {conflict.violatedLaw.title}
              </span>
            </div>
          )}
          <p className="text-xs text-slate-500">
            Resolve the conflict via the Conflict Checker's Amendment Protocol,
            then propose again.
          </p>
        </div>
      )}
    </div>
  );
}

interface FieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}

function Field({ label, error, children }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </label>
  );
}
