# Frontend Tech Stack

This document outlines the core technologies, libraries, and tools used in the `expenses-tracking-frontend` application.

## Core Framework
- **[React](https://react.dev/) (v19)**: The core UI library used for building component-based user interfaces.
- **[Vite](https://vitejs.dev/) (v6)**: Next-generation frontend tooling used as the build tool and development server, ensuring fast HMR and optimized builds.
- **[TypeScript](https://www.typescriptlang.org/) (v5.8)**: Used for static type checking to improve code reliability and developer experience.

## State Management & Routing
- **[Zustand](https://zustand-demo.pmnd.rs/) (v5)**: A small, fast, and scalable barebones state-management solution used for managing global application state.
- **[React Router DOM](https://reactrouter.com/) (v7)**: Used for handling application routing and navigation.

## Styling & UI
- **[Tailwind CSS](https://tailwindcss.com/) (v3)**: A utility-first CSS framework for rapid UI development and styling.
- **[PostCSS](https://postcss.org/) & [Autoprefixer](https://github.com/postcss/autoprefixer)**: Used for transforming CSS with JavaScript plugins and adding vendor prefixes.
- **[Lucide React](https://lucide.dev/) (v1.17)**: A beautiful and consistent icon toolkit used throughout the application.

## Backend Integration & Authentication
- **[Supabase JS](https://supabase.com/docs/reference/javascript/introduction)**: The official Supabase client used for backend integrations. We specifically use it for **automatic authentication**, handling user sign-ups, logins, and seamless session management (via `onAuthStateChange`). It automatically persists the authentication state locally and provides secure JWTs for making authenticated requests to our NestJS backend.

## Linting & Code Quality
- **[ESLint](https://eslint.org/) (v9)**: Pluggable JavaScript linter to enforce coding standards and find problems. Configured with plugins for React hooks and React refresh.
- **[TypeScript ESLint](https://typescript-eslint.io/)**: Used to integrate TypeScript with ESLint.
