import predefinedTemplatesEn from './predefinedTemplates.en.json';
import predefinedTemplatesPl from './predefinedTemplates.pl.json';

export interface PredefinedTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
}

export const PREDEFINED_TEMPLATE_ID_PREFIX = 'predefined-';

function resolveLocale(locale?: string): 'en' | 'pl' {
  return locale?.startsWith('en') ? 'en' : 'pl';
}

export function getPredefinedTemplates(locale?: string): PredefinedTemplate[] {
  return resolveLocale(locale) === 'en'
    ? (predefinedTemplatesEn as PredefinedTemplate[])
    : (predefinedTemplatesPl as PredefinedTemplate[]);
}

export function isPredefinedTemplateId(
  templateId: string | null | undefined,
): boolean {
  return (
    typeof templateId === 'string' &&
    templateId.startsWith(PREDEFINED_TEMPLATE_ID_PREFIX)
  );
}

export function getPredefinedTemplate(
  templateId: string,
  locale?: string,
): PredefinedTemplate | undefined {
  return getPredefinedTemplates(locale).find(
    (template) => template.id === templateId,
  );
}
