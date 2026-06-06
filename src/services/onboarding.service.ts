import type { OnboardingPreferences } from '../types/onboarding.types'
import type { Template } from '../types/template.types'

interface GraphQLError {
  message?: string
}

interface GraphQLResponse<TData> {
  data?: TData
  errors?: GraphQLError[]
}

interface TemplateSettings {
  active_template_id: string | null
  data_source_type: DataSourceType
  nextcloud_file_path: string | null
  uploaded_file_path: string | null
}

export type DataSourceType = 'FILE_UPLOAD' | 'NEXTCLOUD'

export interface DashboardData {
  templates: Template[]
  activeTemplateId: string | null
  dataSourceType: DataSourceType
  nextcloudFilePath: string | null
  uploadedFilePath: string | null
}

export interface CurrentExpenseFile {
  dataSourceType: 'FILE_UPLOAD'
  uploadedFilePath: string
  bucket: string
  uploadedAt?: string
  originalFileName?: string
  content: string
}

export interface ReceiptScanResult {
  extractedText: string
}

const GRAPHQL_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/graphql'
const API_BASE_URL = GRAPHQL_URL.endsWith('/graphql')
  ? GRAPHQL_URL.slice(0, -'/graphql'.length)
  : GRAPHQL_URL

async function readRestError(response: Response): Promise<string> {
  const raw = await response.text().catch(() => '')
  if (!raw) {
    return 'Nie udało się wykonać operacji'
  }

  try {
    const asJson = JSON.parse(raw) as unknown
    if (asJson && typeof asJson === 'object' && 'message' in asJson) {
      const message = asJson.message
      if (typeof message === 'string') {
        return message
      }
      if (Array.isArray(message)) {
        return message.filter((item): item is string => typeof item === 'string').join(', ')
      }
    }
  } catch {
    // Keep raw text fallback for non-JSON responses.
  }

  return raw
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
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => null)
    console.error('GraphQL HTTP error:', errorData)
    throw new Error('Błąd połączenia z serwerem GraphQL')
  }

  const { data, errors } = (await res.json()) as GraphQLResponse<TData>
  if (errors && errors.length > 0) {
    throw new Error(errors[0].message || 'Błąd operacji GraphQL')
  }

  if (!data) {
    throw new Error('Serwer nie zwrócił danych')
  }

  return data
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
  )

  const template = data.generateTemplate
  if (!template?.content) {
    throw new Error('Serwer nie zwrócił wygenerowanego szablonu HTML.')
  }

  return template
}

export async function getMyTemplates(accessToken: string): Promise<Pick<Template, 'id' | 'name'>[]> {
  const query = `
    query MyTemplates {
      myTemplates {
        id
        name
      }
    }
  `;
  const data = await graphqlRequest<{ myTemplates?: Pick<Template, 'id' | 'name'>[] }>(
    accessToken,
    query,
  )
  return data.myTemplates ?? []
}

export async function getTemplateDashboard(
  accessToken: string,
  signal?: AbortSignal,
): Promise<DashboardData> {
  const data = await graphqlRequest<{
    myTemplates?: Template[]
    myTemplateSettings?: TemplateSettings
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
  )

  return {
    templates: data.myTemplates ?? [],
    activeTemplateId: data.myTemplateSettings?.active_template_id ?? null,
    dataSourceType: data.myTemplateSettings?.data_source_type ?? 'FILE_UPLOAD',
    nextcloudFilePath: data.myTemplateSettings?.nextcloud_file_path ?? null,
    uploadedFilePath: data.myTemplateSettings?.uploaded_file_path ?? null,
  }
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
  )

  if (!data.createTemplate) {
    throw new Error('Nie udało się utworzyć szablonu')
  }

  return data.createTemplate
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
  )

  if (!data.updateTemplate) {
    throw new Error('Nie udało się zaktualizować szablonu')
  }

  return data.updateTemplate
}

export async function deleteTemplate(accessToken: string, templateId: string): Promise<void> {
  const data = await graphqlRequest<{ deleteTemplate?: boolean }>(
    accessToken,
    `
      mutation DeleteTemplate($templateId: String!) {
        deleteTemplate(templateId: $templateId)
      }
    `,
    { templateId },
  )

  if (!data.deleteTemplate) {
    throw new Error('Nie udało się usunąć szablonu')
  }
}

export async function setActiveTemplate(accessToken: string, templateId: string): Promise<void> {
  const data = await graphqlRequest<{ setActiveTemplate?: boolean }>(
    accessToken,
    `
      mutation SetActiveTemplate($templateId: String!) {
        setActiveTemplate(templateId: $templateId)
      }
    `,
    { templateId },
  )

  if (!data.setActiveTemplate) {
    throw new Error('Nie udało się ustawić aktywnego szablonu')
  }
}

export async function updateNextcloudFilePath(
  accessToken: string,
  nextcloudFilePath: string,
): Promise<void> {
  await updateDataSource(accessToken, 'NEXTCLOUD', nextcloudFilePath)
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
  )

  if (!data.updateDataSource) {
    throw new Error('Nie udało się zaktualizować źródła danych')
  }
}

export async function uploadExpenseFile(accessToken: string, file: File): Promise<void> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE_URL}/api/data-sources/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  })

  if (!response.ok) {
    throw new Error(await readRestError(response))
  }
}

export async function getCurrentExpenseFile(accessToken: string): Promise<CurrentExpenseFile> {
  const response = await fetch(`${API_BASE_URL}/api/data-sources/upload/current`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(await readRestError(response))
  }

  return (await response.json()) as CurrentExpenseFile
}

export async function overwriteCurrentExpenseFile(
  accessToken: string,
  content: string,
  uploadedFilePath: string,
): Promise<void> {
  const fileName = uploadedFilePath.split('/').pop() || 'expenses.txt'
  const mimeType = fileName.toLowerCase().endsWith('.csv') ? 'text/csv' : 'text/plain'
  const file = new File([content], fileName, { type: mimeType })
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE_URL}/api/data-sources/upload/current`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  })

  if (!response.ok) {
    throw new Error(await readRestError(response))
  }
}

export async function sendTestEmail(accessToken: string, recipientEmail: string): Promise<void> {
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
  )

  if (!data.sendTestEmail) {
    throw new Error('Nie udało się wysłać testowego e-maila')
  }
}

export async function scanReceipt(accessToken: string, file: File): Promise<ReceiptScanResult> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE_URL}/api/receipts/scan`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  })

  if (!response.ok) {
    throw new Error(await readRestError(response))
  }

  return (await response.json()) as ReceiptScanResult
}

export async function approveReceiptExpenses(accessToken: string, text: string): Promise<void> {
  const trimmedText = text.trim()
  if (!trimmedText) {
    throw new Error('Treść wydatków nie może być pusta')
  }

  await graphqlRequest<{ approveReceiptExpenses?: boolean }>(
    accessToken,
    `
      mutation ApproveReceiptExpenses($input: ApproveReceiptExpensesInput!) {
        approveReceiptExpenses(input: $input)
      }
    `,
    { input: { text: trimmedText } },
  )
}
