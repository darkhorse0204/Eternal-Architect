# 🏛️ The Eternal Architect

> **Quackathon 2026** · Track 01: Software — The Sentient Workspace
> Built with **Enter Pro** + **Parcle** persistent memory layer
> **Demo Link** : https://www.loom.com/share/06f0e6d9257241ea8a9d5ffdbc3866d8

---

## What is this?

The Eternal Architect is a **living constitutional law system** for software teams.

Every architectural decision your team makes — framework choice, database pick, API style, infrastructure rule — gets codified as a **Law**. Before anyone writes code, they describe what they're building and the system checks it against every past decision using **Parcle's AI memory**. Conflicts are caught before a single line is written.

---

## The Problem it Solves

AI coding assistants are stateless. They forget every decision your team made last month. A developer in Month 6 can unknowingly add Firebase when the team decided on Supabase in Month 1. The Eternal Architect prevents this — it remembers everything, forever.

---

## Features

- 🏛️ **Constitution** — All architectural laws in one place, with health score
- ➕ **Propose Law** — Add new laws, auto-checked for conflicts before enacting
- 🛡️ **Conflict Checker** — Describe what you want to build, get instant AI verdict
- 📜 **Audit Log** — Permanent record of every decision and violation
- 📊 **Health Report** — Live health score, category pie chart, most contested law
- ⚙️ **Settings** — Connect your Parcle API key for AI-powered memory

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Server State | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Database | Supabase (PostgreSQL) |
| AI Memory | Parcle API |
| Charts | Recharts |
| Icons | Lucide React |

---

## How to Run

### 1. Clone the repo

```bash
git clone https://github.com/darkhorse0204/Eternal-Architect.git
cd Eternal-Architect
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up the database

Go to your [Supabase SQL Editor](https://supabase.com/dashboard) and run:

```sql
-- Create laws table
CREATE TABLE IF NOT EXISTS public.laws (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  category     TEXT NOT NULL,
  rationale    TEXT NOT NULL DEFAULT '',
  weight       TEXT NOT NULL DEFAULT 'STANDARD',
  depends_on   TEXT[] NOT NULL DEFAULT '{}',
  health       TEXT NOT NULL DEFAULT 'HEALTHY',
  check_count  INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create audit_log table
CREATE TABLE IF NOT EXISTS public.audit_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type  TEXT NOT NULL,
  title        TEXT NOT NULL,
  details      JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.laws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Allow public read + write
CREATE POLICY "public_read_laws"    ON public.laws FOR SELECT USING (true);
CREATE POLICY "public_insert_laws"  ON public.laws FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_laws"  ON public.laws FOR UPDATE USING (true);
CREATE POLICY "public_read_audit"   ON public.audit_log FOR SELECT USING (true);
CREATE POLICY "public_insert_audit" ON public.audit_log FOR INSERT WITH CHECK (true);
```

### 4. Start the dev server

```bash
npm run dev
```

App runs at **http://localhost:5173**

### 5. Connect Parcle (Optional but Recommended)

1. Get your API key from [hackathon.parcle.ai](https://hackathon.parcle.ai)
2. Open the app → click **Settings**
3. Paste your key → click **Save**

Without a key, the app uses a local keyword-matching fallback. It never breaks.

---

## How Parcle is Used

Every time a law is enacted, this call is made to Parcle:

```
POST https://api.parcle.ai/v1/ingest/dialog
```

This stores the law as a semantic memory — title, rationale, weight, category.

Every time a conflict check runs:

```
POST https://api.parcle.ai/v1/search
```

Parcle searches all stored memories semantically and returns whether the proposed feature contradicts any past decision.

---

## Conflict Detection

Two modes run in priority order:

1. **Parcle AI** (semantic) — understands meaning, not just keywords
2. **Local fallback** — keyword matching against law titles and categories

Check states:
- ✅ **CLEAR** — safe to build
- ⚠️ **CONFLICT** — violates one law
- 🔀 **CASCADE** — violates multiple laws simultaneously

---

## Health Score

```
score = 100 - (conflicts × 15) - (amendments × 5) + (cancelled_builds × 2)
```

Starts at 100. Degrades with violations. Rewards responsible cancellations.

---

## Built For

**Quackathon 2026** · June 20–21, 2026
Track 01: Software — The Sentient Workspace (Parcle + Enter Pro)
