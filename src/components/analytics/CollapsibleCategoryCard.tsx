import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';

type CollapsibleCategoryCardProps = {
  expanded: boolean;
  onToggle: () => void;
  title: ReactNode;
  toggleAriaLabel: string;
  contentId: string;
  trailing?: ReactNode;
  trailingAlign?: 'center' | 'end';
  children?: ReactNode;
};

export function CollapsibleCategoryCard({
  expanded,
  onToggle,
  title,
  toggleAriaLabel,
  contentId,
  trailing,
  trailingAlign = 'end',
  children,
}: CollapsibleCategoryCardProps) {
  const hasBody = Boolean(children);

  return (
    <div className="rounded-md border border-gray-200 p-4">
      <div
        className={`flex flex-wrap gap-3 ${
          trailingAlign === 'center' ? 'items-center' : 'items-end'
        }`}
      >
        {hasBody ? (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-controls={contentId}
            aria-label={toggleAriaLabel}
            className="flex min-w-40 flex-1 items-center gap-2 text-left text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200 ease-out motion-reduce:transition-none ${
                expanded ? 'rotate-0' : '-rotate-90'
              }`}
            />
            <span className="min-w-0">{title}</span>
          </button>
        ) : (
          <div className="min-w-40 flex-1 text-sm font-medium text-gray-700">
            {title}
          </div>
        )}
        {trailing}
      </div>
      {hasBody && (
        <div
          id={contentId}
          role="region"
          aria-hidden={!expanded}
          inert={!expanded}
          className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${
            expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="space-y-3 pt-3">{children}</div>
          </div>
        </div>
      )}
    </div>
  );
}
