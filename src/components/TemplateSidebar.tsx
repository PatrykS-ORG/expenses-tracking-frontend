import { CheckCircle2, Sparkles, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export type TemplateListItem = {
  id: string;
  name: string;
};

type TemplateSidebarProps = {
  templatesTitle: string;
  userTemplatesCountLabel: string;
  generateNewLabel: string;
  myTemplatesLabel: string;
  predefinedLabel: string;
  loadingTemplatesLabel: string;
  loading: boolean;
  userTemplates: TemplateListItem[];
  predefinedTemplates: TemplateListItem[];
  selectedId: string | null;
  activeId: string | null;
  onSelectTemplate: (id: string) => void;
  onDeleteTemplate: (template: TemplateListItem) => void;
};

export function TemplateSidebar({
  templatesTitle,
  userTemplatesCountLabel,
  generateNewLabel,
  myTemplatesLabel,
  predefinedLabel,
  loadingTemplatesLabel,
  loading,
  userTemplates,
  predefinedTemplates,
  selectedId,
  activeId,
  onSelectTemplate,
  onDeleteTemplate,
}: TemplateSidebarProps) {
  return (
    <section className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold">{templatesTitle}</h2>
          <p className="text-xs text-gray-500">{userTemplatesCountLabel}</p>
        </div>
        <Link
          to="/onboarding"
          className="inline-flex items-center gap-1 text-sm font-medium text-purple-700"
        >
          <Sparkles className="h-4 w-4" />
          {generateNewLabel}
        </Link>
      </div>
      {loading ? (
        <p className="mt-4 text-sm text-gray-500">{loadingTemplatesLabel}</p>
      ) : (
        <div className="mt-4 space-y-5">
          <TemplateGroup
            title={myTemplatesLabel}
            templates={userTemplates}
            selectedId={selectedId}
            activeId={activeId}
            onSelect={onSelectTemplate}
            onDelete={onDeleteTemplate}
          />
          <TemplateGroup
            title={predefinedLabel}
            templates={predefinedTemplates}
            selectedId={selectedId}
            activeId={null}
            onSelect={onSelectTemplate}
          />
        </div>
      )}
    </section>
  );
}

function TemplateGroup({
  title,
  templates,
  selectedId,
  activeId,
  onSelect,
  onDelete,
}: {
  title: string;
  templates: TemplateListItem[];
  selectedId: string | null;
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete?: (template: TemplateListItem) => void;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </h3>
      <div className="mt-2 space-y-2">
        {templates.map((template) => (
          <div
            key={template.id}
            className={`flex items-center gap-2 rounded-md border p-2 ${
              selectedId === template.id ? 'border-blue-400 bg-blue-50' : ''
            }`}
          >
            <button
              type="button"
              onClick={() => onSelect(template.id)}
              className="min-w-0 flex-1 truncate text-left text-sm"
            >
              {template.name}
              {template.id === activeId && (
                <CheckCircle2 className="ml-2 inline h-4 w-4 text-emerald-600" />
              )}
            </button>
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(template)}
                className="rounded p-1 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
