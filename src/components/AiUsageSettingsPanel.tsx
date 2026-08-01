import type {
  AiUsageLogEntry,
  AiUsageSummary,
} from '../services/onboarding.service';

type AiUsageSettingsPanelProps = {
  summary: AiUsageSummary | null;
  entries: AiUsageLogEntry[];
  loading: boolean;
  busy: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  title: string;
  usedLabel: string;
  remainingLabel: string;
  limitLabel: string;
  resetsLabel: string;
  emptyLogLabel: string;
  loadMoreLabel: string;
  loadingLabel: string;
  dateColumn: string;
  actionColumn: string;
  triggerColumn: string;
  tokensColumn: string;
  creditsColumn: string;
  statusColumn: string;
  successLabel: string;
  failedLabel: string;
  actionLabels: Record<AiUsageLogEntry['action'], string>;
  triggerLabels: Record<AiUsageLogEntry['trigger'], string>;
};

export function AiUsageSettingsPanel({
  summary,
  entries,
  loading,
  busy,
  hasMore,
  onLoadMore,
  title,
  usedLabel,
  remainingLabel,
  limitLabel,
  resetsLabel,
  emptyLogLabel,
  loadMoreLabel,
  loadingLabel,
  dateColumn,
  actionColumn,
  triggerColumn,
  tokensColumn,
  creditsColumn,
  statusColumn,
  successLabel,
  failedLabel,
  actionLabels,
  triggerLabels,
}: AiUsageSettingsPanelProps) {
  const usedPercent =
    summary && summary.limit > 0
      ? Math.min(100, Math.round((summary.used / summary.limit) * 100))
      : 0;

  return (
    <section className="space-y-6 rounded-lg border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>

      {summary && (
        <div className="space-y-3 rounded-md border border-blue-100 bg-blue-50/60 p-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-sm text-gray-600">{usedLabel}</p>
              <p className="text-2xl font-semibold text-gray-900">
                {summary.used}
                <span className="text-base font-normal text-gray-500">
                  {' '}
                  / {summary.limit}
                </span>
              </p>
            </div>
            <div className="text-right text-sm text-gray-600">
              <p>
                {remainingLabel}:{' '}
                <span className="font-medium text-gray-900">
                  {summary.remaining}
                </span>
              </p>
              <p>
                {limitLabel}:{' '}
                <span className="font-medium text-gray-900">
                  {summary.limit}
                </span>
              </p>
              <p className="text-xs text-gray-500">
                {resetsLabel}:{' '}
                {new Date(summary.periodEnd).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-blue-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{ width: `${usedPercent}%` }}
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead>
            <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <th className="px-2 py-2">{dateColumn}</th>
              <th className="px-2 py-2">{actionColumn}</th>
              <th className="px-2 py-2">{triggerColumn}</th>
              <th className="px-2 py-2">{tokensColumn}</th>
              <th className="px-2 py-2">{creditsColumn}</th>
              <th className="px-2 py-2">{statusColumn}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {entries.length === 0 && !loading ? (
              <tr>
                <td colSpan={6} className="px-2 py-6 text-center text-gray-500">
                  {emptyLogLabel}
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id} className="text-gray-700">
                  <td className="whitespace-nowrap px-2 py-2">
                    {new Date(entry.createdAt).toLocaleString()}
                  </td>
                  <td className="px-2 py-2">{actionLabels[entry.action]}</td>
                  <td className="px-2 py-2">{triggerLabels[entry.trigger]}</td>
                  <td className="whitespace-nowrap px-2 py-2">
                    {entry.totalTokens.toLocaleString()}
                  </td>
                  <td className="px-2 py-2">{entry.creditsUsed}</td>
                  <td className="px-2 py-2">
                    <span
                      className={
                        entry.success
                          ? 'rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700'
                          : 'rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700'
                      }
                    >
                      {entry.success ? successLabel : failedLabel}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {loading && <p className="text-sm text-gray-500">{loadingLabel}</p>}

      {hasMore && (
        <button
          type="button"
          disabled={busy || loading}
          onClick={onLoadMore}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {loadMoreLabel}
        </button>
      )}
    </section>
  );
}
