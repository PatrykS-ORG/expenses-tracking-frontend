import predefinedTemplatesData from './predefinedTemplates.json'

export interface PredefinedTemplate {
  id: string
  name: string
  description: string
  content: string
}

export const PREDEFINED_TEMPLATE_ID_PREFIX = 'predefined-'

export const predefinedTemplates: PredefinedTemplate[] =
  predefinedTemplatesData as PredefinedTemplate[]

export function isPredefinedTemplateId(templateId: string | null | undefined): boolean {
  return typeof templateId === 'string' && templateId.startsWith(PREDEFINED_TEMPLATE_ID_PREFIX)
}

export function getPredefinedTemplate(templateId: string): PredefinedTemplate | undefined {
  return predefinedTemplates.find((template) => template.id === templateId)
}
