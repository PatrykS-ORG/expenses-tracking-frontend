import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';
import {
  createTemplate,
  deleteTemplate,
  getTemplateDashboard,
  setActiveTemplate,
} from '../services/onboarding.service';
import {
  getPredefinedTemplate,
  getPredefinedTemplates,
  type PredefinedTemplate,
} from '../data/predefinedTemplates';
import {
  applyTemplatePreviewSamples,
  getExampleTemplateValues,
} from '../lib/templatePreview';
import { MAX_USER_TEMPLATES, type Template } from '../types/template.types';
import { ExpenseSourcePanel } from '../components/ExpenseSourcePanel';
import { DashboardHeader } from '../components/DashboardHeader';
import { DashboardAlerts } from '../components/DashboardAlerts';
import {
  TemplateSidebar,
  type TemplateListItem,
} from '../components/TemplateSidebar';
import {
  TemplatePreviewPanel,
  type PreviewSelection,
} from '../components/TemplatePreviewPanel';
import { runWithBlockingLoader } from '../store/useBlockingLoaderStore';

type Selection =
  | { kind: 'predefined'; template: PredefinedTemplate }
  | { kind: 'user'; template: Template };
type PreviewMode = 'web' | 'mobile';

export function Dashboard() {
  const { t, i18n } = useTranslation();
  const { user, session } = useAuthStore();
  const location = useLocation();
  const locale = i18n.resolvedLanguage ?? 'pl';
  const predefined = useMemo(() => getPredefinedTemplates(locale), [locale]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('web');
  const [showSamples, setShowSamples] = useState(true);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const showUploadSuccess = useMemo(
    () => new URLSearchParams(location.search).get('setup') === 'upload',
    [location.search],
  );

  const selection = useMemo<Selection | null>(() => {
    if (!selectedId) return null;
    const readyMade = getPredefinedTemplate(selectedId, locale);
    if (readyMade) return { kind: 'predefined', template: readyMade };
    const custom = templates.find((item) => item.id === selectedId);
    return custom ? { kind: 'user', template: custom } : null;
  }, [locale, selectedId, templates]);

  const displayedContent = selection?.template.content ?? '';
  const selectedTemplate = useMemo<PreviewSelection | null>(() => {
    if (!selection) return null;
    return {
      name: selection.template.name,
      isActiveUserTemplate:
        selection.kind === 'user' && selection.template.id === activeId,
    };
  }, [activeId, selection]);
  const previewHtml = useMemo(
    () =>
      showSamples
        ? applyTemplatePreviewSamples(
            displayedContent,
            getExampleTemplateValues(user?.email, locale),
          )
        : displayedContent,
    [displayedContent, locale, showSamples, user?.email],
  );

  const load = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const data = await getTemplateDashboard(session.access_token);
      setTemplates(data.templates);
      setActiveId(data.activeTemplateId);
      setSelectedId((current) =>
        current && data.templates.some((item) => item.id === current)
          ? current
          : (data.activeTemplateId ??
            data.templates[0]?.id ??
            predefined[0]?.id ??
            null),
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : t('dashboard.fetchDashboardError'),
      );
    } finally {
      setLoading(false);
    }
  }, [predefined, session?.access_token, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (action: () => Promise<void>, message: string) => {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await runWithBlockingLoader(action, t('common.processing'));
      setSuccess(message);
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : t('dashboard.applyTemplateError'),
      );
    } finally {
      setBusy(false);
    }
  };

  const chooseTemplate = (id: string) => {
    setSelectedId(id);
  };

  const useSelected = () =>
    void run(async () => {
      if (!session?.access_token || !selection) return;
      if (selection.kind === 'predefined') {
        if (templates.length >= MAX_USER_TEMPLATES) {
          throw new Error(
            t('dashboard.templateLimitReached', {
              max: MAX_USER_TEMPLATES,
            }),
          );
        }
        const created = await createTemplate(
          session.access_token,
          selection.template.name,
          selection.template.content,
        );
        await setActiveTemplate(session.access_token, created.id);
        setSelectedId(created.id);
      } else {
        await setActiveTemplate(session.access_token, selection.template.id);
      }
      await load();
    }, t('dashboard.activeTemplateSet'));

  const useTemplateLabel = selectedTemplate?.isActiveUserTemplate
    ? t('dashboard.templateActive')
    : t('dashboard.useTemplate');

  const handleDeleteTemplate = (template: TemplateListItem) => {
    if (
      !session?.access_token ||
      !window.confirm(t('dashboard.deleteConfirm', { name: template.name }))
    ) {
      return;
    }
    void run(async () => {
      await deleteTemplate(session.access_token, template.id);
      await load();
    }, t('dashboard.templateDeleted'));
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <DashboardHeader
        title={t('navigation.dashboard')}
        subtitle={t('dashboard.overviewSubtitle')}
        openSettingsLabel={t('dashboard.openSettings')}
        showUploadSuccess={showUploadSuccess}
        setupUploadSuccessLabel={t('dashboard.setupUploadSuccess')}
        dataSourceTitle={t('dashboard.dataSourceTitle')}
      />
      <DashboardAlerts error={error} success={success} />

      <ExpenseSourcePanel />

      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
        <TemplateSidebar
          templatesTitle={t('dashboard.templatesTitle')}
          userTemplatesCountLabel={t('dashboard.userTemplatesCount', {
            count: templates.length,
            max: MAX_USER_TEMPLATES,
          })}
          generateNewLabel={t('dashboard.generateNew')}
          myTemplatesLabel={t('dashboard.myTemplates')}
          predefinedLabel={t('dashboard.predefined')}
          loadingTemplatesLabel={t('dashboard.loadingTemplates')}
          loading={loading}
          userTemplates={templates}
          predefinedTemplates={predefined}
          selectedId={selectedId}
          activeId={activeId}
          onSelectTemplate={chooseTemplate}
          onDeleteTemplate={handleDeleteTemplate}
        />

        <TemplatePreviewPanel
          selection={selectedTemplate}
          busy={busy}
          onUseTemplate={useSelected}
          useTemplateLabel={useTemplateLabel}
          selectTemplateHintLabel={t('dashboard.selectTemplateHint')}
          activeTemplateNoteLabel={t('dashboard.activeTemplateNote')}
          previewMode={previewMode}
          onPreviewModeChange={(mode) => setPreviewMode(mode)}
          showSamples={showSamples}
          onShowSamplesChange={(checked) => setShowSamples(checked)}
          exampleDataLabel={t('dashboard.exampleData')}
          previewModeWebLabel={t('dashboard.previewModeWeb')}
          previewModeMobileLabel={t('dashboard.previewModeMobile')}
          previewTitle={t('dashboard.previewTitle')}
          previewHtml={previewHtml}
        />
      </div>
    </main>
  );
}
