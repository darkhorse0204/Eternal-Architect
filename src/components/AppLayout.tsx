import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Scroll,
  PlusCircle,
  ShieldCheck,
  History,
  Activity,
  Settings as SettingsIcon,
  Menu,
  X,
  Landmark,
} from 'lucide-react';
import { clsx } from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';

const NAV = [
  { to: '/', label: 'Constitution', icon: Scroll, end: true },
  { to: '/propose', label: 'Propose Law', icon: PlusCircle, end: false },
  { to: '/check', label: 'Conflict Checker', icon: ShieldCheck, end: false },
  { to: '/audit', label: 'Audit Log', icon: History, end: false },
  { to: '/health', label: 'Health Report', icon: Activity, end: false },
  { to: '/settings', label: 'Settings', icon: SettingsIcon, end: false },
];

export function AppLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-bg text-slate-200">
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between border-b border-white/5 bg-surface/90 px-4 py-3 backdrop-blur-xl md:hidden">
        <span className="flex items-center gap-2 font-display text-sm font-bold text-gradient">
          <Landmark size={18} className="text-primary" />
          THE ETERNAL ARCHITECT
        </span>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="rounded-md p-1 text-slate-300 hover:bg-white/5"
          aria-label="Toggle navigation"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed z-40 flex h-screen w-64 flex-col transform border-r border-white/5 bg-surface/95 backdrop-blur-xl transition-transform duration-200 md:static md:h-screen md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="hidden shrink-0 px-6 pb-6 pt-7 md:block">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
              <Landmark size={18} className="text-white" />
            </div>
            <h1 className="font-display text-[15px] font-bold leading-tight text-gradient">
              THE ETERNAL
              <br />
              ARCHITECT
            </h1>
          </div>
          <p className="mt-3 pl-0.5 text-xs text-slate-500">
            Architectural Constitution
          </p>
        </div>

        <div className="mx-6 hidden h-px shrink-0 bg-gradient-to-r from-white/10 to-transparent md:block" />

        <nav className="mt-16 flex-1 space-y-1.5 overflow-y-auto px-3 py-2 md:mt-5">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                clsx(
                  'group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'text-white'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/20 to-accent/10 ring-1 ring-primary/40"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <Icon
                    size={18}
                    className={clsx(
                      'relative z-10 shrink-0 transition-colors',
                      isActive ? 'text-primary' : 'group-hover:text-primary',
                    )}
                  />
                  <span className="relative z-10">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="hidden shrink-0 px-6 py-5 md:block">
          <div className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5 text-[11px] text-slate-500">
            Every decision, codified.
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Main content */}
      <main className="flex-1 overflow-x-hidden px-4 pb-16 pt-20 md:px-12 md:pt-12 lg:px-16">
        <div className="mx-auto max-w-[1600px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
