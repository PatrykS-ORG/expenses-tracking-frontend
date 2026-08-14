import { useCallback, useEffect, useState } from 'react';
import { ScanSearch, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CategoryExpenseForm } from './analytics/CategoryExpenseForm';
import { CategorySuggestionsModal } from './analytics/CategorySuggestionsModal';
import {
  applyCategorySuggestions,
  buildCurrentMonthExpensesPayload,
  categoryFormStateFromCurrentMonth,
  emptyCategoryFormState,
  type CategoryFormState,
  type UnassignedExpenseItem,
} from './analytics/manualSummaryFormState';
import { featureFlags } from '../lib/featureFlags';
import { centsToAmountString } from '../lib/money';
import {
  getCurrentMonthExpenses,
  getTemplateDashboard,
  saveCurrentMonthExpenses,
  suggestExpenseCategories,
  updateDataSource,
  updateSalary,
  uploadExpenseFile,
  type DataSourceType,
  type ExpenseCategorySuggestion,
} from '../services/onboarding.service';
import type { SummaryCategoryKey } from '../types/analytics.types';
import { useAuthStore } from '../store/useAuthStore';
import { runWithBlockingLoader } from '../store/useBlockingLoaderStore';

export function ExpenseSourcePanel() {
  const { t } = useTranslation();
  const token = useAuthStore((state) => state.session?.access_token);
  const [dataSourceType, setDataSourceType] =
    useState<DataSourceType>('FILE_UPLOAD');
  const [nextcloudPath, setNextcloudPath] = useState('');
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryFormState>(
    emptyCategoryFormState(),
  );
  const [unassigned, setUnassigned] = useState<UnassignedExpenseItem[]>([]);
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [salaryAmount, setSalaryAmount] = useState('');
  const [savedSalaryAmount, setSavedSalaryAmount] = useState('');
  const [salaryReady, setSalaryReady] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [suggestBusy, setSuggestBusy] = useState(false);
  const [pendingSuggestions, setPendingSuggestions] = useState<
    ExpenseCategorySuggestion[] | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const categoryLabel = useCallback(
    (key: SummaryCategoryKey) => t(`analytics.categories.${key}`),
    [t],
  );

  const snapshotKey = useCallback(
    (
      nextCategories: CategoryFormState,
      nextUnassigned: UnassignedExpenseItem[],
    ) =>
      JSON.stringify(
        buildCurrentMonthExpensesPayload(nextCategories, nextUnassigned),
      ),
    [],
  );

  const applySalaryCents = useCallback((salaryCents: number | null) => {
    const formatted =
      salaryCents != null && salaryCents > 0
        ? centsToAmountString(salaryCents)
        : '';
    setSalaryAmount(formatted);
    setSavedSalaryAmount(formatted);
    setSalaryReady(true);
  }, []);

  const applyExpenses = useCallback(
    (payload: {
      categories: Array<{
        key: string;
        items: Array<{ name: string; amount: string }>;
      }>;
      unassigned: Array<{ name: string; amount: string }>;
    }) => {
      const parsed = categoryFormStateFromCurrentMonth(payload);
      setCategories(parsed.categories);
      setUnassigned(parsed.unassigned);
      setSavedSnapshot(snapshotKey(parsed.categories, parsed.unassigned));
    },
    [snapshotKey],
  );

  const refreshDashboardMeta = useCallback(async () => {
    if (!token) return;
    const dashboard = await getTemplateDashboard(token);
    setDataSourceType(dashboard.dataSourceType);
    setNextcloudPath(dashboard.nextcloudFilePath ?? '');
    setUploadedFilePath(dashboard.uploadedFilePath);
    applySalaryCents(dashboard.salaryCents);
    return dashboard;
  }, [applySalaryCents, token]);

  const load = useCallback(async () => {
    if (!token) return;
    await refreshDashboardMeta();
    const expenses = await getCurrentMonthExpenses(token);
    applyExpenses(expenses);
  }, [applyExpenses, refreshDashboardMeta, token]);

  useEffect(() => {
    void load().catch((loadError) =>
      setError(
        loadError instanceof Error
          ? loadError.message
          : t('dashboard.fetchFileError'),
      ),
    );
  }, [load, t]);

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
          : t('dashboard.dataSourceSaveError'),
      );
    } finally {
      setBusy(false);
    }
  };

  const selectSource = (type: DataSourceType) => {
    setDataSourceType(type);
    if (type === 'FILE_UPLOAD' && uploadedFilePath && token) {
      void run(async () => {
        await updateDataSource(token, 'FILE_UPLOAD');
        await load();
      }, t('dashboard.switchedToUpload'));
    }
  };

  const handleSuggestCategories = () => {
    if (!token) return;
    setSuggestBusy(true);
    setError(null);
    void runWithBlockingLoader(async () => {
      // Persist current edits first so AI sees the latest unassigned lines.
      const payload = buildCurrentMonthExpensesPayload(categories, unassigned);
      const saved = await saveCurrentMonthExpenses(token, payload);
      const parsed = categoryFormStateFromCurrentMonth(saved);
      setCategories(parsed.categories);
      setUnassigned(parsed.unassigned);
      setSavedSnapshot(snapshotKey(parsed.categories, parsed.unassigned));

      const suggestions = await suggestExpenseCategories(token);
      setPendingSuggestions(suggestions);
    }, t('dashboard.suggestingCategories'))
      .catch((suggestError) => {
        setError(
          suggestError instanceof Error
            ? suggestError.message
            : t('dashboard.suggestCategoriesError'),
        );
      })
      .finally(() => setSuggestBusy(false));
  };

  const handleAcceptSuggestions = () => {
    if (!pendingSuggestions) return;
    const merged = applyCategorySuggestions(
      categories,
      unassigned,
      pendingSuggestions,
    );
    setCategories(merged.categories);
    setUnassigned(merged.unassigned);
    setPendingSuggestions(null);
    setSuccess(t('dashboard.categoriesSuggested'));
  };

  const handleDeclineSuggestions = () => {
    setPendingSuggestions(null);
    setSuccess(t('dashboard.categoriesSuggestionDeclined'));
  };

  const salaryMissing = salaryReady && savedSalaryAmount.trim() === '';
  const salaryDirty = salaryAmount.trim() !== savedSalaryAmount.trim();
  const expensesDirty = snapshotKey(categories, unassigned) !== savedSnapshot;

  return (
    <section
      id="expense-source"
      className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {t('dashboard.dataSourceTitle')}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {featureFlags.nextcloud
              ? t('dashboard.dataSourceDesc')
              : t('dashboard.dataSourceDescUploadOnly')}
          </p>
        </div>
        <Link
          to="/receipt-scan"
          className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
        >
          <ScanSearch className="h-4 w-4" />
          {t('dashboard.scanReceipt')}
        </Link>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
          {success}
        </div>
      )}
      {salaryMissing && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {t('dashboard.salaryMissingWarning')}
        </div>
      )}

      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          void run(async () => {
            if (!token || !salaryAmount.trim()) return;
            const savedCents = await updateSalary(token, salaryAmount.trim());
            applySalaryCents(savedCents);
          }, t('dashboard.salarySaved'));
        }}
      >
        <label className="min-w-0 flex-1 text-sm text-gray-700">
          {t('dashboard.salaryLabel')}
          <input
            type="number"
            inputMode="decimal"
            required
            value={salaryAmount}
            onChange={(event) => setSalaryAmount(event.target.value)}
            placeholder={t('dashboard.salaryPlaceholder')}
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={busy || !salaryAmount.trim() || !salaryDirty}
          className="rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {t('common.save')}
        </button>
      </form>
      <p className="mt-1 text-xs text-gray-500">{t('dashboard.salaryHint')}</p>

      {featureFlags.nextcloud && (
        <div className="mt-4 flex gap-2">
          {(['FILE_UPLOAD', 'NEXTCLOUD'] as DataSourceType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => selectSource(type)}
              className={`rounded-md border px-3 py-2 text-sm ${
                dataSourceType === type
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : ''
              }`}
            >
              {type === 'FILE_UPLOAD' ? t('dashboard.uploadFile') : 'Nextcloud'}
            </button>
          ))}
        </div>
      )}

      {dataSourceType === 'NEXTCLOUD' && featureFlags.nextcloud ? (
        <form
          className="mt-4 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void run(async () => {
              if (!token) return;
              await updateDataSource(token, 'NEXTCLOUD', nextcloudPath);
              await load();
            }, t('dashboard.nextcloudSaved'));
          }}
        >
          <input
            value={nextcloudPath}
            onChange={(event) => setNextcloudPath(event.target.value)}
            placeholder="/shared/expenses/2026-07.txt"
            className="w-full rounded-md border px-3 py-2"
          />
          <button
            disabled={busy || !nextcloudPath.trim()}
            className="rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {t('common.save')}
          </button>
        </form>
      ) : (
        <div className="mt-4 space-y-3">
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                if (!token || !selectedFile) return;
                await uploadExpenseFile(token, selectedFile);
                setSelectedFile(null);
                await refreshDashboardMeta();
                const expenses = await getCurrentMonthExpenses(token);
                applyExpenses(expenses);
              }, t('dashboard.fileUploaded'));
            }}
          >
            <input
              type="file"
              accept=".txt,.csv,text/plain,text/csv"
              onChange={(event) =>
                setSelectedFile(event.target.files?.[0] ?? null)
              }
              className="w-full rounded-md border px-3 py-2"
            />
            <button
              disabled={busy || !selectedFile}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              {t('common.upload')}
            </button>
          </form>
          {uploadedFilePath && (
            <p className="text-xs text-gray-500">
              {t('dashboard.currentFile')} {uploadedFilePath}
            </p>
          )}

          <p className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
            {t('dashboard.expenseCategoriesHint')}
          </p>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                if (!token) return;
                const payload = buildCurrentMonthExpensesPayload(
                  categories,
                  unassigned,
                );
                const saved = await saveCurrentMonthExpenses(token, payload);
                applyExpenses(saved);
                await refreshDashboardMeta();
              }, t('dashboard.expenseFileSaved'));
            }}
          >
            <CategoryExpenseForm
              categories={categories}
              unassigned={unassigned}
              showUnassigned
              autoTotalFromItems
              busy={busy || suggestBusy}
              suggestBusy={suggestBusy}
              categoriesTitle={t('analytics.categoriesTitle')}
              categoryLabel={categoryLabel}
              categoryTotalLabel={t('analytics.categoryTotalLabel')}
              lineItemsLabel={t('analytics.lineItemsLabel')}
              itemNameLabel={t('analytics.itemNameLabel')}
              itemAmountLabel={t('analytics.itemAmountLabel')}
              addLineItemLabel={t('analytics.addLineItem')}
              removeLineItemLabel={t('analytics.removeLineItem')}
              unassignedTitle={t('dashboard.unassignedTitle')}
              unassignedHint={t('dashboard.unassignedHint')}
              moveToCategoryLabel={t('dashboard.moveToCategory')}
              suggestCategoriesLabel={t('dashboard.suggestCategories')}
              addUnassignedLabel={t('dashboard.addUnassigned')}
              onCategoriesChange={setCategories}
              onUnassignedChange={setUnassigned}
              onSuggestCategories={handleSuggestCategories}
            />

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs text-gray-500">
                {expensesDirty
                  ? t('dashboard.unsavedFileChanges')
                  : t('dashboard.fileSaved')}
              </p>
              <button
                disabled={busy || suggestBusy || !expensesDirty}
                className="rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
              >
                {t('common.save')}
              </button>
            </div>
          </form>
        </div>
      )}

      <CategorySuggestionsModal
        open={pendingSuggestions !== null}
        suggestions={pendingSuggestions ?? []}
        categoryLabel={categoryLabel}
        title={t('dashboard.suggestReviewTitle')}
        description={t('dashboard.suggestReviewDescription')}
        acceptLabel={t('dashboard.suggestAccept')}
        declineLabel={t('dashboard.suggestDecline')}
        emptyLabel={t('dashboard.suggestEmpty')}
        itemAmountLabel={t('analytics.itemAmountLabel')}
        onAccept={handleAcceptSuggestions}
        onDecline={handleDeclineSuggestions}
      />
    </section>
  );
}
