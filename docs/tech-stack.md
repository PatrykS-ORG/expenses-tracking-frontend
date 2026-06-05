# Frontend tech stack

## Core

- React 19
- Vite 6
- TypeScript 5.8

## Routing and state

- `react-router-dom` 7
- `zustand` 5

## Styling and UI

- Tailwind CSS 3
- PostCSS + Autoprefixer
- `lucide-react` icons

## Auth and backend communication

- Supabase JS (`@supabase/supabase-js`) for authentication/session lifecycle.
- Backend API calls through `src/services/onboarding.service.ts`:
  - GraphQL (`/graphql`) for templates/settings
  - REST (`/api/data-sources/upload`) for multipart file upload

## Quality and tooling

- ESLint 9 + TypeScript ESLint
- Vite build (`tsc -b && vite build`)
- pnpm as package manager
