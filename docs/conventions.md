# Frontend coding conventions

## File naming

| Kind           | Convention             | Example                 |
| -------------- | ---------------------- | ----------------------- |
| Component file | PascalCase `.tsx`      | `Dashboard.tsx`         |
| Store file     | camelCase `use*.ts`    | `useAuthStore.ts`       |
| Service file   | `<feature>.service.ts` | `onboarding.service.ts` |
| Types file     | `*.types.ts`           | `template.types.ts`     |

## Component conventions

- Functional components only.
- Named exports for pages/components.
- Keep route-level orchestration in `src/pages/`.
- Use local state for page-scoped UI behavior; use stores for session/domain state.

## Service layer conventions

- Never call backend directly from components.
- Centralize backend calls in `src/services/`.
- Attach `Authorization: Bearer ${accessToken}` for protected calls.
- Keep one env entry point (`VITE_API_URL`).

### API style

`onboarding.service.ts` uses GraphQL for all backend operations, including file uploads encoded as base64 in mutation inputs.

## Form handling

- Local `useState` for form inputs and button loading flags.
- `try/catch` in submit handlers with user-visible Polish error messages.
- Disable submit buttons during pending requests.

## Commit messages (changelog)

Use [Conventional Commits](https://www.conventionalcommits.org/) so production releases can categorize `CHANGELOG.md` entries:

| Prefix  | Changelog section |
| ------- | ----------------- |
| `feat:` | Features          |
| `fix:`  | Bug Fixes         |
| other   | Other             |

Examples: `feat: separate salary field`, `fix: show updated expense file after save`.

Do not edit `CHANGELOG.md` in feature PRs — `.github/workflows/release.yml` prepends sections on each push to `production`. See the docs repo: `processes/release-and-changelog.md`.

## Error/loading patterns

- Global app bootstrap loading: `App.tsx` spinner.
- User-triggered mutations use the shared blocking loader (`runWithBlockingLoader` + `BlockingLoaderHost`):
  - full-screen semi-transparent overlay while the request runs,
  - `beforeunload` confirmation when closing the browser/tab,
  - in-app navigation blocked with a leave-confirm modal.
- Keep local `busy` / button disabled flags for the triggering control.
- Page-scoped loading and errors for initial data fetches live in page state (no blocking overlay).
- Keep messages concise and user-facing in Polish.

## Routing

- Guard all authenticated pages with session checks in `App.tsx`.
- For post-onboarding setup states, query params are allowed (`/?setup=upload`).

## Styling and icons

- Tailwind utility classes inline in JSX.
- Use only `lucide-react` for icons.

## Interactive iframe previews

For features that let a user manipulate content rendered inside an `<iframe srcDoc>` (e.g. the dashboard's mobile template preview):

- Use the **Pointer Events API** (`onPointerDown`/`onPointerMove`/`onPointerUp`/`onPointerCancel`) rather than separate mouse/touch handlers — it unifies mouse, touch, and pen input.
- Put a transparent overlay `<div>` on top of the iframe to capture the gesture; call `setPointerCapture`/`releasePointerCapture` so dragging keeps working even if the pointer leaves the overlay's bounds.
- Never assume the iframe's top-level document is what needs to scroll. Resolve the actual scrollable element per axis (e.g. via `elementFromPoint` + walking up checking computed `overflow-x`/`overflow-y` and `scrollWidth`/`scrollHeight`), since templates may nest their own `overflow: auto` containers.
- Mouse-wheel forwarding needs a **native** `addEventListener('wheel', handler, { passive: false })` — React's synthetic wheel handler is passive by default and silently ignores `preventDefault()`.
- Keep these interactions purely presentational (parent-side scripting via `sandbox="allow-same-origin"`); do not add `allow-scripts` to run code inside the previewed content.

## How to add a page

1. Create `src/pages/NewPage.tsx`.
2. Add route in `App.tsx` with session guard if needed.
3. If backend calls are needed, add functions in `src/services/`.
4. Update [architecture.md](./architecture.md) for route/data-flow changes.

## How to add a service function

1. Add typed request/response shape.
2. Use the shared `graphqlRequest` helper.
3. Throw meaningful `Error` for UI consumption.
4. Avoid importing stores inside services.
