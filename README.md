# Life OS

Version 1 of a personal Life OS web app for tracking health, sleep, habits, school, finances, and daily reflection.

## Stack

- Next.js with TypeScript
- Tailwind CSS
- Supabase client scaffold for auth and database
- Mock seed data for Version 1

## Features

- Dashboard with sleep/recovery, habit completion, school progress, finances, and a daily report
- Supabase magic-link auth screen scaffold
- WHOOP section with mock sleep, recovery, HRV, resting heart rate, and strain trends
- Habit creation, editing, deletion, completion, streaks, and completion percentage
- School goals/classes with tasks, deadlines, priority, progress, and completion toggles
- Manual financial tracking for income, expenses, savings, categories, monthly balance, category spending, and savings progress
- Rule-based daily report with a TODO marker for future OpenAI API integration
- Supabase schema for users, WHOOP metrics, habits, habit logs, school goals, school tasks, financial transactions, and daily reports

## Getting Started

1. Install dependencies:

```bash
npm install
```

Or, if you prefer pnpm:

```bash
pnpm install
```

2. Copy the environment example:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

3. Add Supabase credentials to `.env.local` when you are ready to connect a real project.

4. Start the app:

```bash
npm run dev
```

With pnpm:

```bash
pnpm dev
```

5. Open `http://localhost:3000`.

## Quality Checks

```bash
npm run typecheck
npm run lint
npm run build
```

## Supabase Setup

1. Create a Supabase project.
2. Copy your project URL and anonymous key into `.env.local`.
3. Run `lib/supabase-schema.sql` in the Supabase SQL editor.
4. Connect the page state to Supabase queries and mutations.

Version 1 uses mock data first so the app is usable before auth, WHOOP OAuth, bank APIs, or AI reports are connected.

## File Structure

```text
app/
  page.tsx              Dashboard
  health/page.tsx       WHOOP mock metrics and trends
  habits/page.tsx       Habit CRUD and completion tracking
  school/page.tsx       School goals and tasks
  finances/page.tsx     Manual transaction tracking
  reports/page.tsx      Rule-based daily report
  auth/page.tsx         Supabase magic-link auth scaffold
  settings/page.tsx     WHOOP/Supabase setup placeholders
components/
  AppShell.tsx          Responsive navigation layout
  MiniBarChart.tsx      Simple chart component
  ProgressBar.tsx       Progress visualization
  ReportCard.tsx        Report section card
  SectionHeader.tsx     Page heading
  StatCard.tsx          Dashboard metric card
lib/
  calculations.ts       Shared dashboard calculations
  mock-data.ts          Version 1 seed data
  report.ts             Rule-based report generator
  supabase.ts           Supabase client scaffold
  supabase-schema.sql   Database table design
  types.ts              Shared TypeScript types
```

## Next Steps

- Add Supabase auth screens.
- Persist habits, goals, tasks, and transactions to Supabase.
- Add WHOOP OAuth and sync jobs.
- Replace rule-based reports with OpenAI-generated reports after user consent and data permissions are defined.
## WHOOP Token Storage Setup

Run this SQL file in the Supabase SQL editor:

```text
lib/whoop-tokens-schema.sql
```

The table is `public.whoop_tokens`. It keeps RLS enabled and intentionally creates no public read/write policies because WHOOP tokens are sensitive.

For durable token storage in Vercel, add this server-only environment variable:

```text
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Keep `SUPABASE_SERVICE_ROLE_KEY` private. Do not expose it in client code. If it is missing, the app falls back to temporary in-memory token storage for Version 1.


## Habit Storage Setup

Run this SQL file in the Supabase SQL editor:

```text
lib/habits-schema.sql
```

It creates `public.habits` and `public.habit_completions` for persistent per-user habit tracking. The app reads and writes these tables through authenticated server routes, using the logged-in Supabase user id for `user_id`.

Required server environment variable:

```text
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Keep `SUPABASE_SERVICE_ROLE_KEY` private. The habits tables have RLS enabled and intentionally do not expose direct browser policies in Version 1.

## School Storage Setup

Run this SQL file in the Supabase SQL editor:

```text
lib/school-schema.sql
```

It creates `public.school_goals` and `public.school_tasks` for persistent per-user classes, goals, deadlines, priorities, task status, and progress. The app reads and writes these tables through authenticated server routes, using the logged-in Supabase user id for `user_id`.

Required server environment variable:

```text
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Keep `SUPABASE_SERVICE_ROLE_KEY` private. The school tables have RLS enabled and intentionally do not expose direct browser policies in Version 1.

## Finance Storage Setup

Run this SQL file in the Supabase SQL editor:

```text
lib/finance-schema.sql
```

It creates `public.finance_accounts`, `public.finance_transactions`, and `public.finance_goals` for persistent per-user accounts, manual transactions, budgets/savings tracking, and goal progress. The app reads and writes these tables through authenticated server routes, using the logged-in Supabase user id for `user_id`.

Required server environment variable:

```text
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Keep `SUPABASE_SERVICE_ROLE_KEY` private. The finance tables have RLS enabled and intentionally do not expose direct browser policies in Version 1.

## Goal Tracking Setup

Run this SQL file in the Supabase SQL editor:

```text
lib/goals-schema.sql
```

It creates `public.goals` and `public.goal_milestones` for persistent per-user long-term goals, progress values, categories, target dates, statuses, and milestone tracking. The app reads and writes these tables through authenticated server routes, using the logged-in Supabase user id for `user_id`.

Required server environment variable:

```text
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Keep `SUPABASE_SERVICE_ROLE_KEY` private. The goal tables have RLS enabled and intentionally do not expose direct browser policies in Version 1.

## Google Calendar Setup

Run this SQL file in the Supabase SQL editor:

```text
lib/calendar-schema.sql
```

It creates `public.google_calendar_tokens` and `public.calendar_events` for per-user Google Calendar token storage and cached schedule events. The app reads and writes these tables through authenticated server routes, using the logged-in Supabase user id as `owner_id`.

Add these server environment variables in Vercel and `.env.local`:

```text
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

In Google Cloud Console, register this OAuth redirect URI:

```text
https://life-os-app-lime.vercel.app/api/google/callback
```

Keep `GOOGLE_CLIENT_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` private. The calendar token table has RLS enabled and intentionally exposes no browser policies in Version 1.
