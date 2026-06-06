# AGENTS.md — expenses-tracking-frontend

React 19 + Vite SPA for **ExpenseAI**.

Implemented frontend scope:

- Supabase authentication (`useAuthStore`)
- Route guards (`/`, `/auth`, `/onboarding`)
- Onboarding questionnaire + AI template generation
- Dashboard template selection/activation
- Data-source selection (`FILE_UPLOAD` / `NEXTCLOUD`)
- Expense file upload via backend REST endpoint
- Receipt scanner page (`/receipt-scan`) with image OCR scan and expense approval
- Test-email trigger via GraphQL

## Prerequisites

- Node.js `24.16.0`
- pnpm
- `.env` with Supabase and backend API values

## Commands

| Command | Purpose |
|---|---|
| `pnpm install` | Install dependencies |
| `pnpm run dev` | Start Vite dev server |
| `pnpm run build` | Type-check and build |
| `pnpm run lint` | Run ESLint |
| `pnpm run preview` | Preview production build |

## Directory structure

```
src/
├── App.tsx
├── main.tsx
├── components/              # Auth component
├── pages/                   # Dashboard, Onboarding, ReceiptScanner
├── services/                # onboarding.service.ts
├── store/                   # useAuthStore, useOnboardingStore
├── lib/                     # supabase singleton + preview helpers
├── data/                    # predefined template catalog
├── types/                   # shared TS types
└── index.css
```

## Key architecture notes

- Backend communication is centralized in `services/onboarding.service.ts`.
- Service layer mixes:
  - GraphQL operations for templates/settings/email/receipt approval
  - REST multipart upload for `POST /api/data-sources/upload` and `POST /api/receipts/scan`
- `VITE_API_URL` defaults to `http://localhost:3000/graphql`; REST base URL is derived by removing `/graphql`.
- Onboarding redirects to `/?setup=upload` so users complete file upload immediately.

## Environment variables

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL` 

## Common pitfalls

- Do not call backend directly from components; use services.
- Do not put secrets in frontend `.env` (`VITE_*` values are public).
- Keep user-facing messages in Polish.

See `docs/architecture.md` and `docs/conventions.md` for implementation details.
