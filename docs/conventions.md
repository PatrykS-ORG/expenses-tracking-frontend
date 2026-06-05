# Frontend coding conventions

## File naming

| Kind | Convention | Example |
|---|---|---|
| Component file | PascalCase `.tsx` | `Dashboard.tsx` |
| Store file | camelCase `use*.ts` | `useAuthStore.ts` |
| Service file | `<feature>.service.ts` | `onboarding.service.ts` |
| Types file | `*.types.ts` | `template.types.ts` |

## Component conventions

- Functional components only.
- Named exports for pages/components.
- Keep route-level orchestration in `src/pages/`.
- Use local state for page-scoped UI behavior; use stores for session/domain state.

## Service layer conventions

- Never call backend directly from components.
- Centralize backend calls in `src/services/`.
- Attach `Authorization: Bearer ${accessToken}` for protected calls.
- Keep one env entry point (`VITE_API_URL`) and derive REST base URL when needed.

### Mixed API style

`onboarding.service.ts` intentionally mixes:

- GraphQL requests for template/settings operations.
- REST requests for expense file upload + file preview/edit save.

This is expected and should stay in the service layer.

## Form handling

- Local `useState` for form inputs and button loading flags.
- `try/catch` in submit handlers with user-visible Polish error messages.
- Disable submit buttons during pending requests.

## Error/loading patterns

- Global app bootstrap loading: `App.tsx` spinner.
- Page-scoped loading and errors live in page state unless shared broadly.
- Keep messages concise and user-facing in Polish.

## Routing

- Guard all authenticated pages with session checks in `App.tsx`.
- For post-onboarding setup states, query params are allowed (`/?setup=upload`).

## Styling and icons

- Tailwind utility classes inline in JSX.
- Use only `lucide-react` for icons.

## How to add a page

1. Create `src/pages/NewPage.tsx`.
2. Add route in `App.tsx` with session guard if needed.
3. If backend calls are needed, add functions in `src/services/`.
4. Update [architecture.md](./architecture.md) for route/data-flow changes.

## How to add a service function

1. Add typed request/response shape.
2. Use shared `graphqlRequest` helper or `fetch` for REST.
3. Throw meaningful `Error` for UI consumption.
4. Avoid importing stores inside services.
