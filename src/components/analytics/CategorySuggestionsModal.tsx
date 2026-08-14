import { useEffect, useMemo } from 'react';
import type { SummaryCategoryKey } from '../../types/analytics.types';
import { CANONICAL_CATEGORY_KEYS } from '../../types/analytics.types';
import type { ExpenseCategorySuggestion } from '../../services/onboarding.service';

type CategorySuggestionsModalProps = {
  open: boolean;
  suggestions: ExpenseCategorySuggestion[];
  categoryLabel: (key: SummaryCategoryKey) => string;
  title: string;
  description: string;
  acceptLabel: string;
  declineLabel: string;
  emptyLabel: string;
  itemAmountLabel: string;
  onAccept: () => void;
  onDecline: () => void;
};

export function CategorySuggestionsModal({
  open,
  suggestions,
  categoryLabel,
  title,
  description,
  acceptLabel,
  declineLabel,
  emptyLabel,
  itemAmountLabel,
  onAccept,
  onDecline,
}: CategorySuggestionsModalProps) {
  const grouped = useMemo(() => {
    const byKey = new Map<SummaryCategoryKey, ExpenseCategorySuggestion[]>();

    for (const suggestion of suggestions) {
      if (
        !CANONICAL_CATEGORY_KEYS.includes(
          suggestion.categoryKey as SummaryCategoryKey,
        )
      ) {
        continue;
      }
      const key = suggestion.categoryKey as SummaryCategoryKey;
      const list = byKey.get(key) ?? [];
      list.push(suggestion);
      byKey.set(key, list);
    }

    return CANONICAL_CATEGORY_KEYS.filter((key) => byKey.has(key)).map(
      (key) => ({
        key,
        items: byKey.get(key)!,
      }),
    );
  }, [suggestions]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onDecline();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onDecline]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-gray-900/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-suggestions-title"
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
      >
        <div className="border-b border-gray-100 px-5 py-4">
          <h2
            id="category-suggestions-title"
            className="text-lg font-semibold text-gray-900"
          >
            {title}
          </h2>
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {grouped.length === 0 ? (
            <p className="text-sm text-gray-600">{emptyLabel}</p>
          ) : (
            <div className="space-y-4">
              {grouped.map((group) => (
                <div key={group.key}>
                  <h3 className="text-sm font-medium text-gray-900">
                    {categoryLabel(group.key)}
                  </h3>
                  <ul className="mt-2 divide-y divide-gray-100 rounded-md border border-gray-200">
                    {group.items.map((item, index) => (
                      <li
                        key={`${group.key}-${item.name}-${item.amount}-${index}`}
                        className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                      >
                        <span className="min-w-0 truncate text-gray-800">
                          {item.name}
                        </span>
                        <span className="shrink-0 tabular-nums text-gray-600">
                          <span className="sr-only">{itemAmountLabel}: </span>
                          {item.amount}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-gray-100 px-5 py-4">
          <button
            type="button"
            onClick={onDecline}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            {declineLabel}
          </button>
          <button
            type="button"
            onClick={onAccept}
            disabled={suggestions.length === 0}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {acceptLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
