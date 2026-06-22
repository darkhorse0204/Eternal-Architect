import { useState } from 'react';
import { toast } from 'sonner';
import { KeyRound, Save, Trash2, Sparkles, HardDrive } from 'lucide-react';

const STORAGE_KEY = 'PARCLE_API_KEY';

function readKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

export function Settings() {
  const [key, setKey] = useState<string>(readKey);
  const [hasKey, setHasKey] = useState<boolean>(() => readKey().length > 0);

  const save = () => {
    const trimmed = key.trim();
    if (trimmed.length === 0) {
      toast.error('Enter a key before saving.');
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, trimmed);
      setHasKey(true);
      toast.success('Parcle API key saved. AI memory enabled.');
    } catch {
      toast.error('Could not save key to local storage.');
    }
  };

  const clear = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setKey('');
      setHasKey(false);
      toast.success('Key cleared. Using local fallback.');
    } catch {
      toast.error('Could not clear key.');
    }
  };

  return (
    <div className="max-w-3xl space-y-10">
      <header>
        <h1 className="font-display text-2xl font-bold text-gradient">Settings</h1>
        <p className="mt-2 text-sm text-slate-400">
          Configure the AI memory layer that powers conflict detection.
        </p>
      </header>

      <div className="glass-card space-y-5 p-7">
        <label className="block">
          <span className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <KeyRound size={14} />
            Parcle API Key
          </span>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Paste your Parcle API key..."
            className="input py-3"
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={save} className="btn-primary">
            <Save size={16} />
            Save
          </button>
          <button type="button" onClick={clear} className="btn-ghost">
            <Trash2 size={16} />
            Clear
          </button>
        </div>

        <div
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            hasKey
              ? 'border-success/40 bg-success/10 text-success'
              : 'border-slate-700 bg-slate-800/40 text-slate-400'
          }`}
        >
          {hasKey
            ? 'Status: Parcle AI memory active.'
            : 'Status: No key set — using local fallback.'}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="glass-card space-y-3 p-6">
          <div className="flex items-center gap-2.5 text-primary">
            <Sparkles size={18} />
            <h2 className="text-sm font-semibold">With a key</h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-400">
            Conflict checks use <strong className="text-slate-200">Parcle AI memory</strong> — semantic
            search over every prior architectural decision, catching subtle
            contradictions and cascade risks across your laws.
          </p>
        </div>

        <div className="glass-card space-y-3 p-6">
          <div className="flex items-center gap-2.5 text-slate-300">
            <HardDrive size={18} />
            <h2 className="text-sm font-semibold">Without a key</h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-400">
            The app falls back to a <strong className="text-slate-200">local keyword matcher</strong>{' '}
            against law titles and categories. Fully functional and never
            crashes — just less semantically aware.
          </p>
        </div>
      </div>
    </div>
  );
}
