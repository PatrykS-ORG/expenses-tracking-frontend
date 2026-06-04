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
  nextcloud_file_path: string | null
}

export interface DashboardData {
  templates: Template[]
  activeTemplateId: string | null
  nextcloudFilePath: string | null
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/graphql'

async function graphqlRequest<TData>(
  accessToken: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<TData> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ query, variables }),
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

export async function getTemplateDashboard(accessToken: string): Promise<DashboardData> {
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
          nextcloud_file_path
        }
      }
    `,
  )

  return {
    templates: data.myTemplates ?? [],
    activeTemplateId: data.myTemplateSettings?.active_template_id ?? null,
    nextcloudFilePath: data.myTemplateSettings?.nextcloud_file_path ?? null,
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
  const data = await graphqlRequest<{ updateNextcloudFilePath?: boolean }>(
    accessToken,
    `
      mutation UpdateNextcloudFilePath($input: UpdateNextcloudFilePathInput!) {
        updateNextcloudFilePath(input: $input)
      }
    `,
    {
      input: {
        nextcloudFilePath,
      },
    },
  )

  if (!data.updateNextcloudFilePath) {
    throw new Error('Nie udało się zapisać ścieżki Nextcloud')
  }
}
