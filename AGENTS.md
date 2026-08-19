# AGENTS.md — expenses-tracking-frontend

React 19 + Vite SPA for **Spendwell**.

Implemented frontend scope:

- Supabase authentication (`useAuthStore`)
- Route guards (`/`, `/auth`, `/onboarding`, `/receipt-scan`, `/analytics`, `/budget`, `/settings`)
- Onboarding questionnaire + AI template generation
- Dashboard template selection/activation
- Dashboard template preview: web/mobile toggle with touch-like drag-to-scroll simulation
- Data-source selection (`FILE_UPLOAD` / `NEXTCLOUD`)
- Expense file upload via backend GraphQL mutations
- Receipt scanner page (`/receipt-scan`) with image OCR scan and expense approval
- Settings page (`/settings`): account, summary schedule, AI usage credits/audit
- Budget planner (`/budget`): reusable monthly category amounts + planned vs actual charts
- Test-email trigger via GraphQL

## Prerequisites

- Node.js `24.16.0`
- pnpm
- `.env` with Supabase and backend API values

## Commands

| Command                 | Purpose                                         |
| ----------------------- | ----------------------------------------------- |
| `pnpm install`          | Install dependencies                            |
| `pnpm run dev`          | Start Vite dev server                           |
| `pnpm run build`        | i18n check, type-check, and build               |
| `pnpm run lint`         | ESLint + Prettier check + i18n key parity check |
| `pnpm run lint:fix`     | Auto-fix ESLint and Prettier issues             |
| `pnpm run format`       | Format all files with Prettier                  |
| `pnpm run format:check` | Verify Prettier formatting without writing      |
| `pnpm i18n:check`       | Verify `en`/`pl` locale files stay in sync      |
| `pnpm run preview`      | Preview production build                        |

A Husky pre-commit hook runs `lint-staged` (ESLint + Prettier) on staged files before each commit.

## Releases / changelog

- Root `CHANGELOG.md` is updated automatically on push to `production` (see `.github/workflows/release.yml`).
- Prefer Conventional Commits (`feat:`, `fix:`) so release notes categorize correctly.
- Do not hand-edit changelog sections in feature PRs.

## Directory structure

```
src/
├── App.tsx
├── main.tsx
├── components/              # Settings panels, analytics, budget, shared UI
├── pages/                   # Dashboard, Onboarding, ReceiptScanner, Analytics, BudgetPlanner, Settings
├── services/                # GraphQL API layer
├── store/                   # useAuthStore, useOnboardingStore, useBlockingLoaderStore
├── lib/                     # supabase singleton + chart/money helpers
├── locales/                 # en/pl translation.json
├── data/                    # predefined template catalog
├── types/                   # shared TS types
└── index.css

scripts/
├── apply-template-responsive.mjs   # injects mobile-responsive CSS/classes into predefinedTemplates.pl.json
└── build-en-templates.mjs          # regenerates predefinedTemplates.en.json from the PL source
```

Run both `scripts/` files after editing `predefinedTemplates.pl.json` by hand — the EN catalog is generated, not hand-maintained.

## Key architecture notes

- Backend communication is centralized in `services/*.service.ts`.
- Service layer mixes:
  - GraphQL operations for templates/settings/email/receipt approval/AI usage
  - GraphQL mutations with base64 file inputs for expense upload and receipt scan
- `VITE_API_URL` defaults to `http://localhost:3000/graphql`.
- Onboarding redirects to `/?setup=upload` so users complete file upload immediately.
- Settings AI usage tab loads `myAiUsageSummary` + `myAiUsageLog` on tab activation.

## Environment variables

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL`

## Common pitfalls

- Do not call backend directly from components; use services.
- Do not put secrets in frontend `.env` (`VITE_*` values are public).
- Keep user-facing strings in both `en` and `pl` locale files (`pnpm i18n:check`).

See `docs/architecture.md` and `docs/conventions.md` for implementation details.
