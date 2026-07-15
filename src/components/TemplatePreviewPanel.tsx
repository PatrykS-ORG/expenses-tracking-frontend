import { CheckCircle2, Eye, Monitor, Smartphone } from 'lucide-react';

type PreviewMode = 'web' | 'mobile';

export type PreviewSelection = {
  name: string;
  isActiveUserTemplate: boolean;
};

type TemplatePreviewPanelProps = {
  selection: PreviewSelection | null;
  busy: boolean;
  onUseTemplate: () => void;
  useTemplateLabel: string;
  selectTemplateHintLabel: string;
  activeTemplateNoteLabel: string;
  previewMode: PreviewMode;
  onPreviewModeChange: (mode: PreviewMode) => void;
  showSamples: boolean;
  onShowSamplesChange: (checked: boolean) => void;
  exampleDataLabel: string;
  previewModeWebLabel: string;
  previewModeMobileLabel: string;
  previewTitle: string;
  previewHtml: string;
};

export function TemplatePreviewPanel({
  selection,
  busy,
  onUseTemplate,
  useTemplateLabel,
  selectTemplateHintLabel,
  activeTemplateNoteLabel,
  previewMode,
  onPreviewModeChange,
  showSamples,
  onShowSamplesChange,
  exampleDataLabel,
  previewModeWebLabel,
  previewModeMobileLabel,
  previewTitle,
  previewHtml,
}: TemplatePreviewPanelProps) {
  return (
    <section className="rounded-lg border bg-white p-5 shadow-sm">
      {!selection ? (
        <p className="text-sm text-gray-500">{selectTemplateHintLabel}</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{selection.name}</h2>
              {selection.isActiveUserTemplate && (
                <span className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {activeTemplateNoteLabel}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy || selection.isActiveUserTemplate}
                onClick={onUseTemplate}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {useTemplateLabel}
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-md border p-1">
              <PreviewButton
                active={previewMode === 'web'}
                onClick={() => onPreviewModeChange('web')}
                icon={<Monitor className="h-4 w-4" />}
                label={previewModeWebLabel}
              />
              <PreviewButton
                active={previewMode === 'mobile'}
                onClick={() => onPreviewModeChange('mobile')}
                icon={<Smartphone className="h-4 w-4" />}
                label={previewModeMobileLabel}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Eye className="h-4 w-4" />
              <input
                type="checkbox"
                checked={showSamples}
                onChange={(event) => onShowSamplesChange(event.target.checked)}
              />
              {exampleDataLabel}
            </label>
          </div>
          <div
            className={`mx-auto mt-4 overflow-hidden rounded-lg border bg-white ${
              previewMode === 'mobile' ? 'max-w-[390px]' : 'w-full'
            }`}
          >
            <iframe
              title={previewTitle}
              srcDoc={previewHtml}
              sandbox=""
              className="h-[650px] w-full"
            />
          </div>
        </>
      )}
    </section>
  );
}

function PreviewButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded px-3 py-1.5 text-sm ${
        active ? 'bg-blue-600 text-white' : 'text-gray-600'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
