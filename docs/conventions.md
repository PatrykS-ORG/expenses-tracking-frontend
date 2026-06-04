# Frontend coding conventions

## File and folder naming

| Kind | Convention | Example |
|------|------------|---------|
| Component file | PascalCase `.tsx` | `Auth.tsx`, `TemplateCard.tsx` |
| Store file | camelCase with `use` prefix | `useAuthStore.ts` |
| Hook file | camelCase `use*.ts` | `useTemplates.ts` |
| Service file | kebab-case or camelCase | `templates.service.ts` |
| Types | `*.types.ts` or co-located interface | `template.types.ts` |

## Component file structure

```tsx
// 1. Imports (react, router, store, components, types)
import { useState } from 'react'
import type { SomeProps } from '../types/some'

// 2. Types
interface CardProps {
  title: string
}

// 3. Component (named export)
export function Card({ title }: CardProps) {
  return <div className="...">{title}</div>
}
```

- Prefer **named exports** for components.
- Default export only for `App.tsx` (and similar entry wrappers).

## Imports

- Use `import type` for type-only imports.
- Relative paths within `src/` (`../store/useAuthStore`).
- No path aliases configured in Vite yet.

## Styling

- Tailwind utilities on elements; avoid inline `style={{}}` except dynamic values.
- Responsive prefixes: `sm:`, `md:`, `lg:` as needed.
- Reuse layout patterns from `Auth.tsx` and the provisional dashboard nav.

## Icons

Import from `lucide-react` only:

```tsx
import { Wallet, LogOut } from 'lucide-react'
```

## Auth conventions

| Action | Where |
|--------|--------|
| Read `session` / `user` | `useAuthStore` in components |
| Initialize session | `App.tsx` → `initialize()` once |
| Sign out | `useAuthStore.signOut()` |
| Sign in / sign up | `Auth.tsx` today → move to `services/auth.service.ts` |

Never duplicate `onAuthStateChange` listeners outside the auth store.

## API services (when adding)

Create `src/services/api-client.ts` (optional base) and feature services:

```typescript
// services/templates.service.ts — illustrative
export async function listTemplates(accessToken: string) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/templates`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error('Failed to load templates')
  return res.json()
}
```

Stores call services; pages call stores or thin hooks.

## Error handling in UI

Until a toast library is chosen:

- Form errors: local `useState` string (see `Auth.tsx`).
- Page-level errors: store field `error: string | null` or dedicated error boundary later.
- Show user messages in **Polish**.

## Loading states

- Global auth boot: full-screen spinner in `App.tsx` while `isLoading`.
- Page/feature: button `disabled` + spinner, or skeleton in the content area.
- Store flags: `isLoading`, `isSubmitting` per async action.

## Accessibility

- Use semantic HTML (`button`, `label`, `nav`, `main`).
- Associate `<label>` with inputs; meaningful `type` on inputs.
- Icon-only buttons: add `aria-label` (Polish or English per product choice).
- Focus states: rely on Tailwind `focus:` utilities.

## Language

- **UI strings:** Polish (e.g. "Zaloguj się", "Wyloguj").
- **Code:** English identifiers and comments.

## How to add a new page/route

1. Create `src/pages/MyPage.tsx` with a named export.
2. Add `<Route path="/my-page" element={...} />` in `App.tsx`.
3. Apply auth guard: wrap with session check or a small `ProtectedRoute` component.
4. Add nav link in layout if needed.
5. Document the route in [architecture.md](./architecture.md).

## How to add a new Zustand store

1. Create `src/store/useXStore.ts`.
2. Define a typed interface for state + actions.
3. Use `create<State>()((set, get) => ({ ... }))`.
4. Call services inside actions; avoid Supabase/fetch in components.
5. Export selectors sparingly for performance if the store grows.

## How to add a new API function

1. Add function under `src/services/<feature>.service.ts`.
2. Accept `accessToken` or read from a passed-in session object — do not import the store inside services.
3. Throw or return typed errors for the store to map to UI messages.
4. Add types in `src/types/` if shared across pages.

## Forms

Current pattern in `Auth.tsx`:

- Local `useState` for fields and errors.
- `async` submit handler with try/catch.
- Display `error` above the form.

For larger forms (onboarding), consider splitting into steps and validating per step before calling the backend.

## Linting & TypeScript

- ESLint flat config: `eslint.config.js`
- Strict TS: `strict`, `noUnusedLocals`, `verbatimModuleSyntax`
- Run `pnpm run lint` before finishing changes.

## Package manager

Always **`pnpm`**. See [package.json](../package.json) for scripts.

## Scaffold cleanup (known debt)

- Rename `package.json` `"name"` from `temp-front` when convenient.
- Remove or use `src/App.css`.
- Update `index.html` title from "Vite + React + TS" to ExpenseAI.
