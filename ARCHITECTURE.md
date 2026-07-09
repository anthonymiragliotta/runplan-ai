ARCHITECTURE.md

RunPlan AI — Architecture Document

1. Architecture Summary

RunPlan AI is a mobile-first Progressive Web App built with Next.js, React, TypeScript, Tailwind CSS, Supabase, and OpenAI structured outputs.

The architecture separates the app into five main layers:

1. Presentation layer
2. Application state layer
3. Domain logic layer
4. Persistence layer
5. AI parsing layer

The calendar is the source of truth. AI-generated changes are converted into structured workout updates, previewed, validated, and then applied to the plan.

2. Recommended Tech Stack

Front End

* Next.js App Router
* React
* TypeScript
* Tailwind CSS
* shadcn/ui
* Lucide icons

Data

* Supabase Postgres
* Supabase Auth
* Supabase client SDK

AI

* OpenAI API
* Structured JSON output
* Server-side parsing route

Charts

* Recharts

Deployment

* GitHub
* Vercel
* Supabase hosted project

PWA

* next-pwa or equivalent service worker setup
* Web app manifest
* App icons in /public

3. Repository Structure

runplan-ai/
├── app/
│   ├── page.tsx
│   ├── layout.tsx
│   ├── globals.css
│   ├── plan/
│   │   └── page.tsx
│   ├── metrics/
│   │   └── page.tsx
│   ├── settings/
│   │   └── page.tsx
│   └── api/
│       └── parse-plan/
│           └── route.ts
│
├── components/
│   ├── calendar/
│   │   ├── WeeklyCalendar.tsx
│   │   ├── DayCard.tsx
│   │   ├── WeekNavigator.tsx
│   │   └── WorkoutEditSheet.tsx
│   ├── plan-entry/
│   │   ├── PlanEntryBox.tsx
│   │   ├── ParsedPreview.tsx
│   │   └── ApplyChangesButton.tsx
│   ├── metrics/
│   │   ├── WeeklySummaryCard.tsx
│   │   ├── MileageTrendChart.tsx
│   │   ├── RiskFlags.tsx
│   │   └── MetricsTable.tsx
│   ├── navigation/
│   │   └── BottomNav.tsx
│   └── ui/
│
├── lib/
│   ├── calculations/
│   │   ├── weeklyMetrics.ts
│   │   ├── riskFlags.ts
│   │   └── workoutClassification.ts
│   ├── dates/
│   │   ├── weekUtils.ts
│   │   ├── resolveWorkoutDate.ts
│   │   └── raceCountdown.ts
│   ├── ai/
│   │   └── parseCommand.ts
│   ├── plan/
│   │   └── applyCommand.ts
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   └── validation/
│       └── workoutValidation.ts
│
├── types/
│   ├── workout.ts
│   ├── week.ts
│   ├── plan.ts
│   ├── metrics.ts
│   └── commands.ts
│
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── DATA_MODEL.md
│   ├── CALCULATIONS.md
│   ├── AI_PARSER.md
│   └── UI_GUIDELINES.md
│
├── public/
│   ├── manifest.json
│   ├── icon-192.png
│   └── icon-512.png
│
├── supabase/
│   └── migrations/
│
├── tests/
│   ├── weeklyMetrics.test.ts
│   ├── riskFlags.test.ts
│   └── parserNormalization.test.ts
│
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── README.md

4. Core Domain Model

4.1 Plan

A plan represents one race build.

export type Plan = {
  id: string;
  userId: string;
  raceName: string;
  raceDate: string;
  createdAt: string;
  updatedAt: string;
};

4.2 Workout

A workout represents the planned activity for one day.

export type WorkoutType =
  | "Easy"
  | "Recovery"
  | "Long Run"
  | "Tempo"
  | "Threshold"
  | "Intervals"
  | "Track"
  | "Hill Repeats"
  | "Marathon Pace"
  | "Progression"
  | "Fartlek"
  | "Race"
  | "Shakeout"
  | "Peloton"
  | "Bike"
  | "Cross Training"
  | "Strength"
  | "Rest"
  | "Custom";
export type Workout = {
  id: string;
  planId: string;
  date: string;
  workoutType: WorkoutType;
  title: string;
  miles: number;
  speedMiles: number;
  isLongRun: boolean;
  isCrossTraining: boolean;
  isStrength: boolean;
  isRest: boolean;
  details: WorkoutDetails;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

4.3 Workout Details

export type WorkoutDetails = {
  warmupMiles?: number;
  cooldownMiles?: number;
  tempoMiles?: number;
  thresholdMiles?: number;
  marathonPaceMiles?: number;
  intervalReps?: number;
  intervalDistance?: string;
  intervalRecovery?: string;
  paceStart?: string;
  paceEnd?: string;
  durationMinutes?: number;
  description?: string;
};

4.4 Weekly Metrics

export type WeeklyMetrics = {
  weekStartDate: string;
  weekEndDate: string;
  totalMiles: number;
  speedMiles: number;
  speedPercentage: number;
  longRunMiles: number;
  longRunPercentage: number;
  runningDays: number;
  restDays: number;
  crossTrainingDays: number;
  strengthDays: number;
  mileageChangePercentage?: number;
  riskFlags: RiskFlag[];
};

4.5 Risk Flag

export type RiskFlag = {
  id: string;
  severity: "info" | "warning" | "high";
  type:
    | "MILEAGE_JUMP"
    | "LONG_RUN_SHARE"
    | "SPEED_SHARE"
    | "NO_REST_DAY"
    | "MULTIPLE_QUALITY_DAYS"
    | "LONG_RUN_JUMP"
    | "MISSING_LONG_RUN";
  message: string;
};

5. Database Schema

5.1 plans

create table plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  race_name text not null,
  race_date date not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

5.2 workouts

create table workouts (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references plans(id) on delete cascade,
  date date not null,
  workout_type text not null,
  title text not null,
  miles numeric not null default 0,
  speed_miles numeric not null default 0,
  is_long_run boolean not null default false,
  is_cross_training boolean not null default false,
  is_strength boolean not null default false,
  is_rest boolean not null default false,
  details jsonb not null default '{}',
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(plan_id, date)
);

5.3 Row-Level Security

Enable RLS on all user-owned tables.

Rules:

* Users can select their own plans.
* Users can insert their own plans.
* Users can update their own plans.
* Users can delete their own plans.
* Users can access workouts only through plans they own.

6. Application Flow

6.1 Creating a Plan Entry

1. User enters natural language plan.
2. Client sends text, active plan ID, and visible week start date to /api/parse-plan.
3. Server sends parsing request to OpenAI.
4. Server validates structured response.
5. Server returns normalized changes.
6. Client displays preview.
7. User confirms.
8. Client writes changes to Supabase.
9. Calendar reloads local state.
10. Metrics recalculate.

6.2 Manual Editing

1. User taps workout card.
2. Edit sheet opens.
3. User changes fields.
4. Client validates input.
5. Client updates Supabase.
6. Calendar state updates.
7. Metrics recalculate.

6.3 Navigation

1. App computes current Monday–Sunday week.
2. User navigates forward/backward by week.
3. Client queries workouts for selected week.
4. Calendar displays existing workouts or empty day cards.

7. AI Parsing Architecture

7.1 API Route

Endpoint:

POST /api/parse-plan

Request:

type ParsePlanRequest = {
  planId: string;
  inputText: string;
  activeWeekStartDate: string;
  existingWorkouts: Workout[];
  raceDate: string;
};

Response:

type ParsePlanResponse = {
  intent: ParserIntent;
  confidence: number;
  changes: ParsedWorkoutChange[];
  previewSummary: string;
  ambiguities: string[];
  warnings: string[];
};

7.2 Parser Intents

export type ParserIntent =
  | "CREATE_OR_UPDATE_WEEK"
  | "EDIT_WORKOUT"
  | "MOVE_WORKOUT"
  | "DELETE_WORKOUT"
  | "SWAP_WORKOUTS"
  | "SCALE_WEEK"
  | "UNKNOWN";

7.3 Parsed Workout Change

export type ParsedWorkoutChange = {
  operation: "create" | "update" | "delete" | "move";
  sourceDate?: string;
  targetDate: string;
  workout?: Partial<Workout>;
  explanation: string;
};

7.4 Parser Prompt Requirements

The system prompt must instruct the model to:

* Return JSON only.
* Never invent workouts.
* Use the active week when the user gives days without dates.
* Resolve Monday–Sunday based on the active week.
* Preserve existing workouts unless explicitly changed.
* Count only quality portions as speed miles.
* Treat warmups and cooldowns as running mileage but not speed mileage.
* Mark Peloton/bike as cross-training.
* Mark lift/strength as strength.
* Mark off/rest as rest.
* Include ambiguity notes when unclear.

8. Calculation Layer

All calculations live in lib/calculations.

Do not calculate metrics inside React components except for display formatting.

8.1 Weekly Mileage

totalMiles = sum(workouts.filter(isRunningWorkout).map(w => w.miles))

8.2 Speed Percentage

speedPercentage = totalMiles === 0 ? 0 : speedMiles / totalMiles

Display as percentage rounded to one decimal.

8.3 Long Run Percentage

longRunPercentage = totalMiles === 0 ? 0 : longRunMiles / totalMiles

Display as percentage rounded to one decimal.

8.4 Long Run Determination

Priority:

1. Explicit isLongRun === true
2. Highest-mileage running workout in the week
3. Zero if no running workouts

8.5 Risk Flag Calculation

Risk flags should be deterministic and test-covered.

Thresholds:

* Weekly mileage increase greater than 15%
* Long-run percentage greater than 35%
* Speed percentage greater than 20%
* Rest days equals zero
* Quality workout days greater than two
* Long run increase greater than two miles from previous week

9. State Management

Use simple React state for local UI state.

Use Supabase as persistent source.

Potential structure:

* useCurrentPlan
* useWorkoutsForWeek
* useWeeklyMetrics
* useApplyParsedChanges
* useWorkoutEditor

Avoid over-engineering with Redux.

React Query or TanStack Query may be used if helpful.

10. UI Architecture

10.1 Layout

Mobile-first layout.

Maximum content width:

* Mobile: full width
* Desktop: centered max width around 480–640px

Use bottom navigation on mobile.

10.2 Calendar

WeeklyCalendar owns:

* selected week
* ordered days
* workout cards
* summary footer

DayCard displays:

* day name
* date
* workout type badge
* mileage
* title
* details preview

WorkoutEditSheet handles:

* manual editing
* validation
* save/cancel

10.3 Plan Entry

PlanEntryBox handles:

* natural language text
* parse button
* loading state
* error state

ParsedPreview handles:

* proposed changes
* metrics preview
* warnings
* confirm/cancel

10.4 Metrics

MileageTrendChart uses Recharts.

Data source:

* all workouts between current date and race date grouped by Monday–Sunday week

11. Date Handling

Use a date utility library such as date-fns.

Rules:

* Week starts Monday.
* Store dates as ISO strings.
* Display dates in user-friendly format.
* Never rely on browser locale alone for week start logic.

Core utilities:

* getMonday(date)
* getSunday(date)
* getWeekDays(weekStartDate)
* groupWorkoutsByWeek(workouts)
* getWeeksUntilRace(startDate, raceDate)

12. PWA Architecture

Required files:

* public/manifest.json
* public/icon-192.png
* public/icon-512.png
* service worker setup
* theme color
* app metadata

Manifest requirements:

{
  "name": "RunPlan AI",
  "short_name": "RunPlan",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#0f172a",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}

13. Environment Variables

Required:

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=

The OpenAI key must only be used server-side.

Never expose the OpenAI key in client code.

14. Security

* Use Supabase RLS.
* Keep OpenAI calls server-side.
* Validate parser output before applying changes.
* Confirm destructive updates.
* Never trust client-provided user IDs.
* Sanitize user inputs where needed.

15. Testing Strategy

15.1 Unit Tests

Required tests:

* Weekly mileage calculation
* Speed percentage calculation
* Long-run percentage calculation
* Long-run identification
* Risk flag generation
* Parser normalization
* Date grouping by Monday–Sunday week

15.2 Integration Tests

Recommended:

* Parse plan entry into preview
* Apply preview to Supabase
* Edit workout manually
* Metrics update after edit

15.3 Manual QA

Test on:

* iPhone Safari
* iPhone home-screen PWA
* Desktop Chrome
* Vercel production deployment

16. Deployment

16.1 Local Development

npm install
npm run dev

16.2 Supabase

Steps:

1. Create Supabase project.
2. Run migrations.
3. Enable RLS.
4. Configure auth.
5. Add environment variables.

16.3 Vercel

Steps:

1. Push repo to GitHub.
2. Import repo into Vercel.
3. Add environment variables.
4. Deploy.
5. Open deployment URL on iPhone.
6. Add to Home Screen.

17. Implementation Phases

Phase 1 — Foundation

* Create Next.js app
* Configure TypeScript
* Configure Tailwind
* Add shadcn/ui
* Set up routing
* Add mobile shell
* Add bottom navigation
* Add PWA manifest

Phase 2 — Data Model

* Add types
* Add Supabase schema
* Add Supabase client
* Add CRUD functions for plans and workouts
* Seed default Chicago Marathon 2026 plan

Phase 3 — Calendar

* Build weekly calendar
* Add day cards
* Add week navigation
* Add manual workout editor
* Save edits

Phase 4 — Metrics

* Implement calculation utilities
* Add weekly summary
* Add risk flags
* Add mileage trend chart
* Add test coverage

Phase 5 — AI Text Parser

* Add /api/parse-plan
* Add parser schema
* Add parser prompt
* Add parsed preview
* Add apply changes flow
* Add validation

Phase 6 — Polish

* Improve mobile UX
* Add loading states
* Add empty states
* Add error handling
* Test on iPhone
* Deploy to Vercel

18. Engineering Principles

* Keep domain logic out of components.
* Keep parser output separate from saved workout data.
* Preview AI changes before save.
* Prefer boring, maintainable code.
* Avoid premature abstraction.
* Optimize for mobile first.
* Build the smallest useful app before adding intelligence.
