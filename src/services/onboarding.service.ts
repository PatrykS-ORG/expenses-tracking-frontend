import type { OnboardingPreferences } from '../types/onboarding.types';
import type { Template } from '../types/template.types';

interface GraphQLError {
  message?: string;
}

interface GraphQLResponse<TData> {
  data?: TData;
  errors?: GraphQLError[];
}

interface TemplateSettings {
  active_template_id: string | null;
  data_source_type: DataSourceType;
  nextcloud_file_path: string | null;
  uploaded_file_path: string | null;
}

export type DataSourceType = 'FILE_UPLOAD' | 'NEXTCLOUD';

export interface DashboardData {
  templates: Template[];
  activeTemplateId: string | null;
  dataSourceType: DataSourceType;
  nextcloudFilePath: string | null;
  uploadedFilePath: string | null;
}

export type SummaryEmailLanguage = 'PL' | 'EN';
export type SummaryCurrency =
  | 'PLN'
  | 'EUR'
  | 'USD'
  | 'GBP'
  | 'CHF'
  | 'CZK'
  | 'UAH';

export interface SummaryScheduleSettings {
  enabled: boolean;
  scheduleDay: number;
  scheduleHour: number;
  timezone: string;
  emailLanguage: SummaryEmailLanguage;
  currency: SummaryCurrency;
  nextSummaryAt: string | null;
}

export interface CurrentExpenseFile {
  dataSourceType: 'FILE_UPLOAD';
  uploadedFilePath: string;
  bucket: string;
  uploadedAt?: string;
  originalFileName?: string;
  content: string;
}

export interface ReceiptScanResult {
  extractedText: string;
}

const GRAPHQL_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000/graphql';

async function fileToUploadInput(file: File): Promise<{
  fileName: string;
  mimeType: string;
  contentBase64: string;
}> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }

  return {
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    contentBase64: btoa(binary),
  };
}

async function graphqlRequest<TData>(
  accessToken: string,
  query: string,
  variables?: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<TData> {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ query, variables }),
    signal,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    console.error('GraphQL HTTP error:', errorData);
    throw new Error('Błąd połączenia z serwerem GraphQL');
  }

  const { data, errors } = (await res.json()) as GraphQLResponse<TData>;
  if (errors && errors.length > 0) {
    throw new Error(errors[0].message || 'Błąd operacji GraphQL');
  }

  if (!data) {
    throw new Error('Serwer nie zwrócił danych');
  }

  return data;
}

export async function generateTemplate(
  preferences: OnboardingPreferences,
  accessToken: string,
): Promise<Template> {
  const query = `
    mutation GenerateTemplate($input: GenerateTemplateInput!) {
      generateTemplate(input: $input) {
        id
        name
        content
        created_at
      }
    }
  `;

  const variables = {
    input: {
      tone: preferences.tone,
      detailLevel: preferences.detailLevel,
      focus: preferences.focus,
      visualStyle: preferences.visualStyle,
    },
  };

  const data = await graphqlRequest<{ generateTemplate?: Template }>(
    accessToken,
    query,
    variables,
  );

  const template = data.generateTemplate;
  if (!template?.content) {
    throw new Error('Serwer nie zwrócił wygenerowanego szablonu HTML.');
  }

  return template;
}

export async function getMyTemplates(
  accessToken: string,
): Promise<Pick<Template, 'id' | 'name'>[]> {
  const query = `
    query MyTemplates {
      myTemplates {
        id
        name
      }
    }
  `;
  const data = await graphqlRequest<{
    myTemplates?: Pick<Template, 'id' | 'name'>[];
  }>(accessToken, query);
  return data.myTemplates ?? [];
}

export async function getTemplateDashboard(
  accessToken: string,
  signal?: AbortSignal,
): Promise<DashboardData> {
  const data = await graphqlRequest<{
    myTemplates?: Template[];
    myTemplateSettings?: TemplateSettings;
  }>(
    accessToken,
    `
      query TemplateDashboard {
        myTemplates {
          id
          user_id
          name
          content
          created_at
        }
        myTemplateSettings {
          active_template_id
          data_source_type
          nextcloud_file_path
          uploaded_file_path
        }
      }
    `,
    undefined,
    signal,
  );

  return {
    templates: data.myTemplates ?? [],
    activeTemplateId: data.myTemplateSettings?.active_template_id ?? null,
    dataSourceType: data.myTemplateSettings?.data_source_type ?? 'FILE_UPLOAD',
    nextcloudFilePath: data.myTemplateSettings?.nextcloud_file_path ?? null,
    uploadedFilePath: data.myTemplateSettings?.uploaded_file_path ?? null,
  };
}

export async function createTemplate(
  accessToken: string,
  name: string,
  content: string,
): Promise<Template> {
  const data = await graphqlRequest<{ createTemplate?: Template }>(
    accessToken,
    `
      mutation CreateTemplate($input: CreateTemplateInput!) {
        createTemplate(input: $input) {
          id
          user_id
          name
          content
          created_at
        }
      }
    `,
    {
      input: {
        name,
        content,
      },
    },
  );

  if (!data.createTemplate) {
    throw new Error('Nie udało się utworzyć szablonu');
  }

  return data.createTemplate;
}

export async function updateTemplate(
  accessToken: string,
  templateId: string,
  name: string,
  content: string,
): Promise<Template> {
  const data = await graphqlRequest<{ updateTemplate?: Template }>(
    accessToken,
    `
      mutation UpdateTemplate($input: UpdateTemplateInput!) {
        updateTemplate(input: $input) {
          id
          user_id
          name
          content
          created_at
        }
      }
    `,
    {
      input: {
        templateId,
        name,
        content,
      },
    },
  );

  if (!data.updateTemplate) {
    throw new Error('Nie udało się zaktualizować szablonu');
  }

  return data.updateTemplate;
}

export async function deleteTemplate(
  accessToken: string,
  templateId: string,
): Promise<void> {
  const data = await graphqlRequest<{ deleteTemplate?: boolean }>(
    accessToken,
    `
      mutation DeleteTemplate($templateId: String!) {
        deleteTemplate(templateId: $templateId)
      }
    `,
    { templateId },
  );

  if (!data.deleteTemplate) {
    throw new Error('Nie udało się usunąć szablonu');
  }
}

export async function setActiveTemplate(
  accessToken: string,
  templateId: string,
): Promise<void> {
  const data = await graphqlRequest<{ setActiveTemplate?: boolean }>(
    accessToken,
    `
      mutation SetActiveTemplate($templateId: String!) {
        setActiveTemplate(templateId: $templateId)
      }
    `,
    { templateId },
  );

  if (!data.setActiveTemplate) {
    throw new Error('Nie udało się ustawić aktywnego szablonu');
  }
}

export async function updateNextcloudFilePath(
  accessToken: string,
  nextcloudFilePath: string,
): Promise<void> {
  await updateDataSource(accessToken, 'NEXTCLOUD', nextcloudFilePath);
}

export async function updateDataSource(
  accessToken: string,
  dataSourceType: DataSourceType,
  nextcloudFilePath?: string,
): Promise<void> {
  const data = await graphqlRequest<{ updateDataSource?: boolean }>(
    accessToken,
    `
      mutation UpdateDataSource($input: UpdateDataSourceInput!) {
        updateDataSource(input: $input)
      }
    `,
    {
      input: {
        dataSourceType,
        nextcloudFilePath,
      },
    },
  );

  if (!data.updateDataSource) {
    throw new Error('Nie udało się zaktualizować źródła danych');
  }
}

export async function uploadExpenseFile(
  accessToken: string,
  file: File,
): Promise<void> {
  const input = await fileToUploadInput(file);
  await graphqlRequest<{ uploadExpenseFile?: { uploadedFilePath: string } }>(
    accessToken,
    `
      mutation UploadExpenseFile($input: ExpenseFileUploadInput!) {
        uploadExpenseFile(input: $input) {
          uploadedFilePath
        }
      }
    `,
    { input },
  );
}

export async function getCurrentExpenseFile(
  accessToken: string,
): Promise<CurrentExpenseFile> {
  const data = await graphqlRequest<{
    currentExpenseFile?: CurrentExpenseFile;
  }>(
    accessToken,
    `
      query CurrentExpenseFile {
        currentExpenseFile {
          dataSourceType
          uploadedFilePath
          bucket
          uploadedAt
          originalFileName
          content
        }
      }
    `,
  );

  if (!data.currentExpenseFile) {
    throw new Error('Nie udało się pobrać pliku wydatków');
  }

  return data.currentExpenseFile;
}

export async function overwriteCurrentExpenseFile(
  accessToken: string,
  content: string,
  uploadedFilePath?: string | null,
): Promise<void> {
  const fileName = uploadedFilePath?.split('/').pop() || 'expenses.txt';
  const mimeType = fileName.toLowerCase().endsWith('.csv')
    ? 'text/csv'
    : 'text/plain';
  const file = new File([content], fileName, { type: mimeType });
  const input = await fileToUploadInput(file);

  await graphqlRequest<{
    overwriteCurrentExpenseFile?: { uploadedFilePath: string };
  }>(
    accessToken,
    `
      mutation OverwriteCurrentExpenseFile($input: ExpenseFileUploadInput!) {
        overwriteCurrentExpenseFile(input: $input) {
          uploadedFilePath
        }
      }
    `,
    { input },
  );
}

export async function sendTestEmail(
  accessToken: string,
  recipientEmail: string,
): Promise<void> {
  const data = await graphqlRequest<{ sendTestEmail?: boolean }>(
    accessToken,
    `
      mutation SendTestEmail($input: SendTestEmailInput!) {
        sendTestEmail(input: $input)
      }
    `,
    {
      input: {
        recipientEmail,
      },
    },
  );

  if (!data.sendTestEmail) {
    throw new Error('Nie udało się wysłać testowego e-maila');
  }
}

export async function sendSummaryNow(accessToken: string): Promise<void> {
  const data = await graphqlRequest<{ sendSummaryNow?: boolean }>(
    accessToken,
    `
      mutation SendSummaryNow {
        sendSummaryNow
      }
    `,
  );

  if (!data.sendSummaryNow) {
    throw new Error('Failed to send expense summary');
  }
}

export async function getSummarySchedule(
  accessToken: string,
): Promise<SummaryScheduleSettings> {
  const data = await graphqlRequest<{
    mySummarySchedule?: SummaryScheduleSettings;
  }>(
    accessToken,
    `
      query MySummarySchedule {
        mySummarySchedule {
          enabled
          scheduleDay
          scheduleHour
          timezone
          emailLanguage
          currency
          nextSummaryAt
        }
      }
    `,
  );

  if (!data.mySummarySchedule) {
    throw new Error('Nie udało się pobrać harmonogramu podsumowań');
  }

  return data.mySummarySchedule;
}

export async function updateSummarySchedule(
  accessToken: string,
  input: SummaryScheduleSettings,
): Promise<SummaryScheduleSettings> {
  const data = await graphqlRequest<{
    updateSummarySchedule?: SummaryScheduleSettings;
  }>(
    accessToken,
    `
      mutation UpdateSummarySchedule($input: UpdateSummaryScheduleInput!) {
        updateSummarySchedule(input: $input) {
          enabled
          scheduleDay
          scheduleHour
          timezone
          emailLanguage
          currency
          nextSummaryAt
        }
      }
    `,
    {
      input: {
        enabled: input.enabled,
        scheduleDay: input.scheduleDay,
        scheduleHour: input.scheduleHour,
        timezone: input.timezone,
        emailLanguage: input.emailLanguage,
        currency: input.currency,
      },
    },
  );

  if (!data.updateSummarySchedule) {
    throw new Error('Nie udało się zapisać harmonogramu podsumowań');
  }

  return data.updateSummarySchedule;
}

export async function scanReceipt(
  accessToken: string,
  file: File,
): Promise<ReceiptScanResult> {
  const input = await fileToUploadInput(file);
  const data = await graphqlRequest<{ scanReceipt?: ReceiptScanResult }>(
    accessToken,
    `
      mutation ScanReceipt($input: ScanReceiptInput!) {
        scanReceipt(input: $input) {
          extractedText
        }
      }
    `,
    { input },
  );

  if (!data.scanReceipt) {
    throw new Error('Nie udało się zeskanować paragonu');
  }

  return data.scanReceipt;
}

export async function approveReceiptExpenses(
  accessToken: string,
  text: string,
): Promise<void> {
  const trimmedText = text.trim();
  if (!trimmedText) {
    throw new Error('Treść wydatków nie może być pusta');
  }

  await graphqlRequest<{ approveReceiptExpenses?: boolean }>(
    accessToken,
    `
      mutation ApproveReceiptExpenses($input: ApproveReceiptExpensesInput!) {
        approveReceiptExpenses(input: $input)
      }
    `,
    { input: { text: trimmedText } },
  );
}

export async function deleteMyAccount(accessToken: string): Promise<void> {
  const data = await graphqlRequest<{ deleteMyAccount?: boolean }>(
    accessToken,
    `
      mutation DeleteMyAccount {
        deleteMyAccount
      }
    `,
  );

  if (!data.deleteMyAccount) {
    throw new Error('Failed to delete account');
  }
}
