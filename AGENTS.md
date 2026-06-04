# AGENTS.md — expenses-tracking-frontend

React 19 + Vite 6 SPA for **ExpenseAI**: personalized monthly expense email summaries. Users authenticate via Supabase Auth; the app will add onboarding, template management, and calls to the NestJS backend using the Supabase access token.

**Status:** Auth, routing, and a placeholder dashboard exist. No API layer, pages folder, or tests yet. See [PLAN.md](./PLAN.md) for the full product roadmap.

## Prerequisites

- **Node.js** `24.16.0` (see `.nvmrc`)
- **pnpm** (only package manager — do not use npm or yarn)
- Supabase project (same as backend)
- Copy `.env.example` to `.env` and fill in values

## Commands

| Command | Purpose |
|---------|---------|
| `pnpm install` | Install dependencies |
| `pnpm run dev` | Vite dev server (default `http://localhost:5173`) |
| `pnpm run build` | `tsc -b` + production build to `dist/` |
| `pnpm run preview` | Serve production build locally |
| `pnpm run lint` | ESLint 9 flat config |

## Directory structure

```
src/
├── App.tsx           # Router, auth guards
├── main.tsx          # React root
├── index.css         # Tailwind directives
├── components/       # Reusable UI (Auth.tsx)
├── pages/            # Route-level views (Dashboard, Onboarding)
├── services/         # Backend API services (onboarding.service.ts)
├── store/            # Zustand stores (useAuthStore.ts, useOnboardingStore.ts)
├── types/            # Shared TypeScript types (onboarding.types.ts)
├── lib/              # Shared clients (supabase.ts)
├── assets/           # Static assets
└── vite-env.d.ts

docs/                 # architecture, conventions, tech-stack
public/               # Static files served as-is
```

**Planned folders** (create as features land):

| Folder | Purpose |
|--------|---------|
| `hooks/` | Custom hooks (`useTemplates`, etc.) |

## Key architectural decisions

- **Vite + React 19** with TypeScript strict mode (`tsconfig.app.json`).
- **Supabase Auth** — singleton client in `src/lib/supabase.ts`; session via `useAuthStore`.
- **Zustand** — one store per domain; avoid Redux/Context for global state.
- **React Router 7** — route guards based on `session` from the auth store.
- **Tailwind CSS 3** — utility classes inline; `lucide-react` for icons.
- **Polish UI copy** — user-facing strings in Polish unless specified otherwise.

## Related documentation

| File | Contents |
|------|----------|
| [PLAN.md](./PLAN.md) | Product requirements and todos (Polish) |
| [docs/tech-stack.md](./docs/tech-stack.md) | Libraries and versions |
| [docs/architecture.md](./docs/architecture.md) | Routing, state, data flow, auth |
| [docs/conventions.md](./docs/conventions.md) | Component patterns and how-to guides |
| [.env.example](./.env.example) | Required `VITE_*` variables |
| [.cursor/rules/react-conventions.mdc](./.cursor/rules/react-conventions.mdc) | Always-on Cursor rules |

## Pairing with the backend

Repo: `expenses-tracking-backend` (sibling project). For authenticated API calls (when implemented):

```typescript
const token = session?.access_token
await fetch(`${import.meta.env.VITE_API_URL}/profile`, {
  headers: { Authorization: `Bearer ${token}` },
})
```

Centralize this in `src/services/` — do not scatter raw `fetch` in components.

## Common pitfalls

- Do **not** call `supabase.auth` directly from components for session state — use `useAuthStore` (login/signup may use Supabase in `Auth.tsx` until moved to a service).
- Do **not** use npm/yarn — only `pnpm`.
- `package.json` name is still `temp-front` (scaffold); app branding is **ExpenseAI**.
- `src/App.css` exists but is unused — prefer Tailwind in components.
- Only `VITE_*` env vars are exposed to the browser — never put secrets in `.env`.
- No test runner configured yet — add Vitest when introducing tests.
