import { useQuery } from '@tanstack/react-query';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { AlertTriangle, ShieldCheck, GitPullRequest, Scroll } from 'lucide-react';
import { getLaws, getAuditLog, computeHealthScore } from '../lib/api';
import { HealthRing } from '../components/HealthRing';
import { CATEGORY_COLORS } from '../components/LawCard';
import type { Category } from '../lib/types';

export function HealthReport() {
  const lawsQuery = useQuery({ queryKey: ['laws'], queryFn: getLaws });
  const auditQuery = useQuery({ queryKey: ['audit'], queryFn: getAuditLog });

  const laws = lawsQuery.data ?? [];
  const audit = auditQuery.data ?? [];
  const health = computeHealthScore(audit);

  const conflicts = audit.filter((a) => a.action_type === 'CONFLICT_DETECTED').length;
  const prevented = audit.filter((a) => a.action_type === 'BUILD_CANCELLED').length;
  const amendments = audit.filter((a) => a.action_type === 'AMENDMENT_PROPOSED').length;

  const categoryData = (Object.keys(CATEGORY_COLORS) as Category[])
    .map((cat) => ({
      name: cat,
      value: laws.filter((l) => l.category === cat).length,
      color: CATEGORY_COLORS[cat],
    }))
    .filter((d) => d.value > 0);

  const mostContested =
    laws.length > 0
      ? laws.reduce((a, b) =>
          (a.check_count ?? 0) >= (b.check_count ?? 0) ? a : b,
        )
      : null;

  return (
    <div className="space-y-10">
      <header className="glass-card flex flex-col items-center gap-8 p-8 sm:flex-row">
        <HealthRing score={health} size={140} stroke={12} />
        <div className="text-center sm:text-left">
          <h1 className="font-display text-2xl font-bold text-gradient">Health Report</h1>
          <p className="mt-1.5 text-sm text-slate-400">
            The living state of your architectural Constitution.
          </p>
          <p className="mt-4 text-sm text-slate-300">
            Overall health:{' '}
            <span className="font-mono text-lg font-bold text-success">
              {health}
            </span>{' '}
            / 100
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        <StatCard
          label="Conflicts Detected"
          value={conflicts}
          icon={<AlertTriangle size={18} />}
          color="#f43f5e"
        />
        <StatCard
          label="Violations Prevented"
          value={prevented}
          icon={<ShieldCheck size={18} />}
          color="#22d3ae"
          highlight
        />
        <StatCard
          label="Amendments Proposed"
          value={amendments}
          icon={<GitPullRequest size={18} />}
          color="#a855f7"
        />
        <StatCard
          label="Total Laws"
          value={laws.length}
          icon={<Scroll size={18} />}
          color="#6d8cff"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="glass-card flex flex-col p-6">
          <h2 className="mb-6 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Laws by Category
          </h2>
          {categoryData.length === 0 ? (
            <div className="flex flex-1 min-h-[280px] flex-col items-center justify-center gap-2 text-center">
              <Scroll size={24} className="text-slate-600" />
              <p className="text-sm text-slate-500">
                No laws yet — categories will appear here.
              </p>
            </div>
          ) : (
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={45}
                    paddingAngle={2}
                  >
                    {categoryData.map((d) => (
                      <Cell key={d.name} fill={d.color} stroke="#0d1526" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#0d1526',
                      border: '1px solid #1e293b',
                      borderRadius: 8,
                      color: '#e2e8f0',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12, color: '#94a3b8' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="glass-card flex flex-col p-6">
          <h2 className="mb-6 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Most Contested Law
          </h2>
          {mostContested && (mostContested.check_count ?? 0) > 0 ? (
            <div className="flex flex-1 min-h-[280px] flex-col justify-center space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-slate-400">
                  {mostContested.id}
                </span>
                <span className="rounded bg-warning/15 px-2 py-0.5 text-[10px] font-bold text-warning">
                  {mostContested.weight}
                </span>
              </div>
              <h3 className="font-display text-lg font-semibold text-slate-100">
                {mostContested.title}
              </h3>
              {mostContested.rationale && (
                <p className="text-sm italic text-slate-400">
                  {mostContested.rationale}
                </p>
              )}
              <p className="text-sm text-slate-300">
                Challenged{' '}
                <span className="font-mono font-bold text-warning">
                  {mostContested.check_count}
                </span>{' '}
                time{mostContested.check_count === 1 ? '' : 's'}.
              </p>
            </div>
          ) : (
            <div className="flex flex-1 min-h-[280px] flex-col items-center justify-center gap-2 text-center">
              <ShieldCheck size={24} className="text-slate-600" />
              <p className="text-sm text-slate-500">
                No laws have been contested yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  highlight?: boolean;
}

function StatCard({ label, value, icon, color, highlight }: StatCardProps) {
  return (
    <div
      className={`glass-card flex min-h-[128px] flex-col justify-between p-5 transition-transform duration-200 hover:-translate-y-0.5 ${highlight ? 'glow-clear' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </span>
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}1f`, color }}
        >
          {icon}
        </div>
      </div>
      <span className="font-display text-3xl font-bold text-slate-100">
        {value}
      </span>
    </div>
  );
}
