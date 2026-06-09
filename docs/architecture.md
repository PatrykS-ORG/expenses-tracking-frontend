# Frontend architecture

## System context

Spendwell frontend is a React SPA (Vite) that:

- authenticates users with Supabase Auth,
- calls backend GraphQL for templates, settings, file upload, and receipt scanning,
- guides users through onboarding → upload → dashboard workflow,
- provides a receipt scanner page for OCR-based expense entry.

```mermaid
flowchart TB
  subgraph browser [Browser]
    Pages[Pages_Routes]
    Store[Zustand_Stores]
    Services[services_layer]
    SupaLib[lib_supabase]
  end
  subgraph remote [Remote]
    SupaAuth[Supabase_Auth]
    Backend[NestJS_API]
  end
  Pages --> Store
  Pages --> Services
  Store --> SupaLib
  SupaLib --> SupaAuth
  Services -->|"Bearer access_token"| Backend
```

## Routes and guards

Defined in `src/App.tsx`:

| Path            | Condition      | Render              |
| --------------- | -------------- | ------------------- |
| `/`             | session exists | `Dashboard`         |
| `/`             | no session     | redirect to `/auth` |
| `/auth`         | no session     | `Auth`              |
| `/auth`         | session exists | redirect to `/`     |
| `/onboarding`   | session exists | `Onboarding`        |
| `/onboarding`   | no session     | redirect to `/auth` |
| `/receipt-scan` | session exists | `ReceiptScanner`    |
| `/receipt-scan` | no session     | redirect to `/auth` |

Onboarding success navigates to `/?setup=upload` to highlight the upload step. Dashboard links to `/receipt-scan` for receipt-based expense entry.

## State management

| Store                | File                              | Responsibility                            |
| -------------------- | --------------------------------- | ----------------------------------------- |
| `useAuthStore`       | `src/store/useAuthStore.ts`       | session, user, bootstrapping, sign-out    |
| `useOnboardingStore` | `src/store/useOnboardingStore.ts` | questionnaire state + template generation |

Page-level local state is used in `Dashboard` for:

- selected template,
- selected data source (`FILE_UPLOAD` / `NEXTCLOUD`),
- upload form status,
- test-email form status.

## Backend communication pattern

`src/services/onboarding.service.ts` is the API gateway for dashboard/onboarding flows.

### GraphQL operations

- `generateTemplate`
- `myTemplates`
- `myTemplateSettings`
- `createTemplate`
- `updateTemplate`
- `deleteTemplate`
- `setActiveTemplate`
- `updateDataSource`
- `sendTestEmail`
- `approveReceiptExpenses`
- `uploadExpenseFile`
- `currentExpenseFile`
- `overwriteCurrentExpenseFile`
- `scanReceipt`

### URL strategy

- `GRAPHQL_URL = VITE_API_URL || http://localhost:3000/graphql`

All backend calls go through this endpoint. File uploads use base64-encoded mutation inputs (`ExpenseFileUploadInput`, `ScanReceiptInput`).

## Dashboard flow

`Dashboard` combines:

- template gallery (predefined + user templates),
- active template switch,
- source selector:
  - Upload file (`.txt`, `.csv`)
  - Preview/edit current uploaded file content and save overwrite
  - Nextcloud path,
- test-email trigger,
- link to receipt scanner (`/receipt-scan`).

`myTemplateSettings` response is mapped to:

- `dataSourceType`,
- `nextcloudFilePath`,
- `uploadedFilePath`.

## Receipt scanner flow

`ReceiptScanner` page (`/receipt-scan`):

1. User selects a receipt image (JPEG/PNG/WEBP, max 2MB) and submits for scan.
2. `scanReceipt()` sends the image as a GraphQL mutation with base64 payload.
3. Extracted text is shown in an editable textarea; user can correct OCR/AI output.
4. `approveReceiptExpenses()` sends the edited text via GraphQL mutation.
5. On success, navigates to `/` (expenses appended to the uploaded file on the backend).

## Onboarding flow

1. User fills questionnaire.
2. Frontend calls `generateTemplate`.
3. On success, navigate to `/?setup=upload`.
4. Dashboard prompts user to upload expense file immediately.

## Local template data

Predefined templates are bundled in `src/data/predefinedTemplates.*` and can be converted into persisted user templates when selected.

## UI stack

- Tailwind classes inline
- Lucide icons
- No additional component library

See also [conventions.md](./conventions.md).
