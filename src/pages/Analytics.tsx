import type { FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays } from 'lucide-react';
import { DashboardAlerts } from '../components/DashboardAlerts';
import { AnalyticsCharts } from '../components/analytics/AnalyticsCharts';
import { CategoryExpenseForm } from '../components/analytics/CategoryExpenseForm';
import { CategorySuggestionsModal } from '../components/analytics/CategorySuggestionsModal';
import { ExpenseFormSaveBar } from '../components/analytics/ExpenseFormSaveBar';
import { ManualSummaryForm } from '../components/analytics/ManualSummaryForm';
import {
  applyCategorySuggestions,
  buildCurrentMonthExpensesPayload,
  buildManualSummaryCategories,
  categoryFormStateFromCurrentMonth,
  categoryFormStateFromSummary,
  emptyCategoryFormState,
  type CategoryFormState,
  type UnassignedExpenseItem,
} from '../components/analytics/manualSummaryFormState';
import { SummaryDetailPanel } from '../components/analytics/SummaryDetailPanel';
import { buildLiveSummaryFromCategories } from '../lib/analyticsCharts';
import {
  currentMonthInTimezone,
  formatPeriodLabel,
  isPeriodBefore,
  listEndedPeriods,
  previousPeriod,
} from '../lib/period';
import { amountStringToCents, centsToAmountString } from '../lib/money';
import {
  getCurrentMonthExpenses,
  getSummarySchedule,
  getTemplateDashboard,
  saveCurrentMonthExpenses,
  suggestExpenseCategories,
  type ExpenseCategorySuggestion,
} from '../services/onboarding.service';
import {
  createManualSummary,
  getMySummaries,
  getMySummary,
  updateManualSummary,
} from '../services/analytics.service';
import type {
  SummaryAnalytics,
  SummaryCategoryKey,
} from '../types/analytics.types';
import { useAuthStore } from '../store/useAuthStore';
import { runWithBlockingLoader } from '../store/useBlockingLoaderStore';
import { useUnsavedChangesWarning } from '../store/useUnsavedChangesStore';

type ViewMode = 'detail' | 'create' | 'edit';

export function Analytics() {
  const { t, i18n } = useTranslation();
  const { session } = useAuthStore();
  const token = session?.access_token;
  const locale = i18n.resolvedLanguage ?? 'pl';

  const [timezone, setTimezone] = useState('Europe/Warsaw');
  const [currency, setCurrency] = useState('PLN');
  const [summaries, setSummaries] = useState<SummaryAnalytics[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedSummary, setSelectedSummary] =
    useState<SummaryAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [busy, setBusy] = useState(false);
  const [suggestBusy, setSuggestBusy] = useState(false);
  const [pendingSuggestions, setPendingSuggestions] = useState<
    ExpenseCategorySuggestion[] | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('detail');
  const [profileSalaryCents, setProfileSalaryCents] = useState<number | null>(
    null,
  );
  const [salaryAmount, setSalaryAmount] = useState('');
  const [savingsMessage, setSavingsMessage] = useState('');
  const [categories, setCategories] = useState<CategoryFormState>(
    emptyCategoryFormState(),
  );
  const [unassigned, setUnassigned] = useState<UnassignedExpenseItem[]>([]);
  const [currentMonthSavedSnapshot, setCurrentMonthSavedSnapshot] =
    useState('');
  const [currentMonthChartSummary, setCurrentMonthChartSummary] =
    useState<SummaryAnalytics | null>(null);

  const currentPeriod = useMemo(
    () => currentMonthInTimezone(timezone),
    [timezone],
  );
  const previousMonth = useMemo(
    () => previousPeriod(currentPeriod),
    [currentPeriod],
  );
  const endedPeriods = useMemo(
    () => listEndedPeriods(currentPeriod),
    [currentPeriod],
  );
  const isCurrentMonth =
    selectedPeriod !== '' && selectedPeriod === currentPeriod;

  const categoryLabel = useCallback(
    (key: SummaryCategoryKey) => t(`analytics.categories.${key}`),
    [t],
  );

  const canCreateForPeriod =
    selectedPeriod !== '' &&
    isPeriodBefore(selectedPeriod, currentPeriod) &&
    !selectedSummary;

  const currentMonthSnapshot = useCallback(
    (
      nextCategories: CategoryFormState,
      nextUnassigned: UnassignedExpenseItem[],
    ) =>
      JSON.stringify(
        buildCurrentMonthExpensesPayload(nextCategories, nextUnassigned),
      ),
    [],
  );

  const buildCurrentMonthLiveSummary = useCallback(
    (
      nextCategories: CategoryFormState,
      nextUnassigned: UnassignedExpenseItem[],
      period = currentPeriod,
    ) =>
      buildLiveSummaryFromCategories({
        period,
        currency,
        salaryCents: profileSalaryCents ?? 0,
        categories: nextCategories,
        unassigned: nextUnassigned,
      }),
    [currency, currentPeriod, profileSalaryCents],
  );

  const liveSummary = useMemo(() => {
    if (!isCurrentMonth) return null;
    return buildCurrentMonthLiveSummary(categories, unassigned, selectedPeriod);
  }, [
    buildCurrentMonthLiveSummary,
    categories,
    isCurrentMonth,
    selectedPeriod,
    unassigned,
  ]);

  const chartSummary = isCurrentMonth ? liveSummary : selectedSummary;

  // Keep MoM in sync while editing the current month; otherwise use last loaded snapshot.
  useEffect(() => {
    if (liveSummary) {
      setCurrentMonthChartSummary(liveSummary);
    }
  }, [liveSummary]);

  /** Persisted ended-month rows plus the in-progress month for MoM bars. */
  const chartsSummaries = useMemo(() => {
    if (!currentMonthChartSummary) return summaries;
    return [
      ...summaries.filter(
        (summary) => summary.period !== currentMonthChartSummary.period,
      ),
      currentMonthChartSummary,
    ];
  }, [currentMonthChartSummary, summaries]);

  const momThroughPeriod = currentMonthChartSummary
    ? currentPeriod
    : previousMonth;

  const resetForm = useCallback(
    (summary: SummaryAnalytics | null) => {
      if (!summary) {
        setSalaryAmount(
          profileSalaryCents != null && profileSalaryCents > 0
            ? centsToAmountString(profileSalaryCents)
            : '',
        );
        setSavingsMessage('');
        setCategories(emptyCategoryFormState());
        return;
      }

      setSalaryAmount(centsToAmountString(summary.salaryCents));
      setSavingsMessage(summary.savingsMessage ?? '');
      setCategories(categoryFormStateFromSummary(summary));
    },
    [profileSalaryCents],
  );

  const applyCurrentMonthExpenses = useCallback(
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
      setCurrentMonthSavedSnapshot(
        currentMonthSnapshot(parsed.categories, parsed.unassigned),
      );
      setCurrentMonthChartSummary(
        buildCurrentMonthLiveSummary(parsed.categories, parsed.unassigned),
      );
    },
    [buildCurrentMonthLiveSummary, currentMonthSnapshot],
  );

  const refreshSummaries = useCallback(async () => {
    if (!token) return;
    const rows = await getMySummaries(token);
    setSummaries(rows);
  }, [token]);

  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();

    const bootstrap = async () => {
      setLoading(true);
      setError(null);
      try {
        const [schedule, rows, dashboard] = await Promise.all([
          getSummarySchedule(token, controller.signal),
          getMySummaries(token, controller.signal),
          getTemplateDashboard(token, controller.signal),
        ]);
        if (controller.signal.aborted) return;

        setTimezone(schedule.timezone);
        setCurrency(schedule.currency);
        setSummaries(rows);
        setProfileSalaryCents(dashboard.salaryCents);

        const current = currentMonthInTimezone(schedule.timezone);
        const defaultPeriod = previousPeriod(current);
        setSelectedPeriod(defaultPeriod);

        // Prefetch current-month expenses so MoM includes the in-progress bar
        // even when the selector defaults to the previous month.
        try {
          const currentExpenses = await getCurrentMonthExpenses(
            token,
            controller.signal,
          );
          if (controller.signal.aborted) return;
          const parsed = categoryFormStateFromCurrentMonth(currentExpenses);
          setCurrentMonthChartSummary(
            buildLiveSummaryFromCategories({
              period: current,
              currency: schedule.currency,
              salaryCents: dashboard.salaryCents ?? 0,
              categories: parsed.categories,
              unassigned: parsed.unassigned,
            }),
          );
        } catch {
          // Charts can still render ended months without the live overlay.
        }
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : t('analytics.loadError'),
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void bootstrap();
    return () => controller.abort();
  }, [t, token]);

  useEffect(() => {
    if (!token || !selectedPeriod || loading) return;

    const controller = new AbortController();

    const loadMonth = async () => {
      setLoadingMonth(true);
      setError(null);
      try {
        if (selectedPeriod === currentMonthInTimezone(timezone)) {
          const expenses = await getCurrentMonthExpenses(
            token,
            controller.signal,
          );
          if (controller.signal.aborted) return;
          setSelectedSummary(null);
          applyCurrentMonthExpenses(expenses);
          setViewMode('detail');
          return;
        }

        const summary = await getMySummary(
          token,
          selectedPeriod,
          controller.signal,
        );
        if (controller.signal.aborted) return;

        setSelectedSummary(summary);
        setUnassigned([]);
        resetForm(summary);
        setViewMode('detail');
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : t('analytics.loadError'),
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoadingMonth(false);
        }
      }
    };

    void loadMonth();
    return () => controller.abort();
  }, [
    applyCurrentMonthExpenses,
    loading,
    resetForm,
    selectedPeriod,
    t,
    timezone,
    token,
  ]);

  const handlePeriodChange = (period: string) => {
    setSuccess(null);
    setError(null);
    setViewMode('detail');
    setSelectedSummary(null);
    setSelectedPeriod(period);
  };

  const handleCreateClick = () => {
    resetForm(null);
    setViewMode('create');
  };

  const handleEditClick = () => {
    resetForm(selectedSummary);
    setViewMode('edit');
  };

  const handleCancelForm = () => {
    resetForm(selectedSummary);
    setViewMode('detail');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    void runWithBlockingLoader(async () => {
      if (!token || !selectedPeriod || isCurrentMonth) return;

      setBusy(true);
      setError(null);
      setSuccess(null);
      const isEdit = viewMode === 'edit';

      try {
        const payload = {
          period: selectedPeriod,
          salaryAmount: salaryAmount.trim(),
          categories: buildManualSummaryCategories(categories),
          savingsMessage: savingsMessage.trim() || null,
        };

        const saved = isEdit
          ? await updateManualSummary(token, payload)
          : await createManualSummary(token, payload);

        setSelectedSummary(saved);
        resetForm(saved);
        setViewMode('detail');
        await refreshSummaries();
        setSuccess(
          isEdit ? t('analytics.updateSuccess') : t('analytics.createSuccess'),
        );
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : t('analytics.saveError'),
        );
      } finally {
        setBusy(false);
      }
    }, t('common.saving'));
  };

  const handleSaveCurrentMonth = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    void runWithBlockingLoader(async () => {
      if (!token) return;
      setBusy(true);
      setError(null);
      setSuccess(null);
      try {
        const payload = buildCurrentMonthExpensesPayload(
          categories,
          unassigned,
        );
        const saved = await saveCurrentMonthExpenses(token, payload);
        applyCurrentMonthExpenses(saved);
        setSuccess(t('analytics.currentMonthSaveSuccess'));
      } catch (saveError) {
        setError(
          saveError instanceof Error
            ? saveError.message
            : t('analytics.saveError'),
        );
      } finally {
        setBusy(false);
      }
    }, t('common.saving'));
  };

  const handleSuggestCategories = () => {
    if (!token) return;
    setSuggestBusy(true);
    setError(null);
    void runWithBlockingLoader(async () => {
      const payload = buildCurrentMonthExpensesPayload(categories, unassigned);
      const saved = await saveCurrentMonthExpenses(token, payload);
      const parsed = categoryFormStateFromCurrentMonth(saved);
      setCategories(parsed.categories);
      setUnassigned(parsed.unassigned);
      setCurrentMonthSavedSnapshot(
        currentMonthSnapshot(parsed.categories, parsed.unassigned),
      );

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

  const currentMonthDirty =
    isCurrentMonth &&
    currentMonthSnapshot(categories, unassigned) !== currentMonthSavedSnapshot;
  useUnsavedChangesWarning(currentMonthDirty);

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-gray-900">
        {t('analytics.title')}
      </h1>
      <p className="mt-1 text-sm text-gray-600">{t('analytics.subtitle')}</p>

      <DashboardAlerts error={error} success={success} />

      <div className="mt-6 space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <label className="flex flex-wrap items-center gap-3 text-sm font-medium text-gray-700">
            <CalendarDays className="h-4 w-4 text-gray-500" />
            {t('analytics.monthLabel')}
            <select
              value={selectedPeriod}
              onChange={(event) => handlePeriodChange(event.target.value)}
              className="min-w-48 rounded-md border px-3 py-2 font-normal"
            >
              <option value={currentPeriod}>
                {t('analytics.currentMonthOption', {
                  month: formatPeriodLabel(currentPeriod, locale),
                })}
              </option>
              {endedPeriods.map((period) => (
                <option key={period} value={period}>
                  {formatPeriodLabel(period, locale)}
                </option>
              ))}
            </select>
          </label>
        </section>

        <AnalyticsCharts
          summaries={chartsSummaries}
          selectedSummary={chartSummary}
          selectedPeriod={selectedPeriod}
          throughPeriod={momThroughPeriod}
          loadingMonth={loadingMonth}
          locale={locale}
          currency={currency}
          t={t}
          categoryLabel={categoryLabel}
        />

        {loadingMonth ? (
          <div className="flex items-center justify-center rounded-2xl border border-gray-200 bg-white p-12 shadow-sm">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
          </div>
        ) : isCurrentMonth ? (
          <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {t('analytics.currentMonthTitle')}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {t('analytics.currentMonthMessage')}
              </p>
              {profileSalaryCents != null && profileSalaryCents > 0 && (
                <p className="mt-2 text-sm text-gray-700">
                  {t('analytics.incomeLabel')}:{' '}
                  {centsToAmountString(profileSalaryCents)} {currency}
                </p>
              )}
              {liveSummary && (
                <div className="mt-1 space-y-1 text-sm text-gray-700">
                  <p>
                    {t('analytics.expensesLabel')}:{' '}
                    {centsToAmountString(liveSummary.consumptionSpentCents)}{' '}
                    {currency}
                    {unassigned.some(
                      (item) =>
                        item.name.trim() &&
                        amountStringToCents(item.amount) > 0,
                    ) && (
                      <span className="text-amber-700">
                        {' '}
                        ({t('analytics.includesUnassigned')})
                      </span>
                    )}
                  </p>
                  <p>
                    {t('analytics.investedLabel')}:{' '}
                    {centsToAmountString(liveSummary.investedCents)} {currency}
                  </p>
                  <p>
                    {t('analytics.savingsLabel')}:{' '}
                    {centsToAmountString(liveSummary.savingsCents)} {currency}
                  </p>
                </div>
              )}
            </div>

            <form onSubmit={handleSaveCurrentMonth}>
              <ExpenseFormSaveBar
                dirty={currentMonthDirty}
                busy={busy || suggestBusy}
                unsavedLabel={t('dashboard.unsavedFileChanges')}
                savedLabel={t('dashboard.fileSaved')}
                saveLabel={t('common.save')}
              />
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
            </form>
          </section>
        ) : selectedSummary && viewMode === 'detail' ? (
          <SummaryDetailPanel
            summary={selectedSummary}
            locale={locale}
            sourceLabel={t('analytics.sourceLabel')}
            sourceManualLabel={t('analytics.sourceManual')}
            sourceScheduledLabel={t('analytics.sourceScheduled')}
            incomeLabel={t('analytics.incomeLabel')}
            expensesLabel={t('analytics.expensesLabel')}
            investedLabel={t('analytics.investedLabel')}
            savingsLabel={t('analytics.savingsLabel')}
            narrativeLabel={t('analytics.narrativeLabel')}
            categoriesTitle={t('analytics.categoriesTitle')}
            categoryLabel={categoryLabel}
            lineItemsLabel={t('analytics.lineItemsLabel')}
            editLabel={t('analytics.editButton')}
            onEdit={handleEditClick}
          />
        ) : selectedSummary && viewMode === 'edit' ? (
          <ManualSummaryForm
            period={selectedPeriod}
            salaryAmount={salaryAmount}
            savingsMessage={savingsMessage}
            categories={categories}
            busy={busy}
            submitLabel={t('common.save')}
            salaryLabel={t('analytics.salaryLabel')}
            savingsMessageLabel={t('analytics.savingsMessageLabel')}
            categoriesTitle={t('analytics.categoriesTitle')}
            categoryLabel={categoryLabel}
            categoryTotalLabel={t('analytics.categoryTotalLabel')}
            lineItemsLabel={t('analytics.lineItemsLabel')}
            itemNameLabel={t('analytics.itemNameLabel')}
            itemAmountLabel={t('analytics.itemAmountLabel')}
            addLineItemLabel={t('analytics.addLineItem')}
            removeLineItemLabel={t('analytics.removeLineItem')}
            moveToCategoryLabel={t('dashboard.moveToCategory')}
            onSalaryAmountChange={setSalaryAmount}
            onSavingsMessageChange={setSavingsMessage}
            onCategoriesChange={setCategories}
            onSubmit={handleSubmit}
            onCancel={handleCancelForm}
            cancelLabel={t('analytics.cancelEdit')}
          />
        ) : canCreateForPeriod && viewMode === 'create' ? (
          <ManualSummaryForm
            period={selectedPeriod}
            salaryAmount={salaryAmount}
            savingsMessage={savingsMessage}
            categories={categories}
            busy={busy}
            submitLabel={t('analytics.createButton')}
            salaryLabel={t('analytics.salaryLabel')}
            savingsMessageLabel={t('analytics.savingsMessageLabel')}
            categoriesTitle={t('analytics.categoriesTitle')}
            categoryLabel={categoryLabel}
            categoryTotalLabel={t('analytics.categoryTotalLabel')}
            lineItemsLabel={t('analytics.lineItemsLabel')}
            itemNameLabel={t('analytics.itemNameLabel')}
            itemAmountLabel={t('analytics.itemAmountLabel')}
            addLineItemLabel={t('analytics.addLineItem')}
            removeLineItemLabel={t('analytics.removeLineItem')}
            moveToCategoryLabel={t('dashboard.moveToCategory')}
            onSalaryAmountChange={setSalaryAmount}
            onSavingsMessageChange={setSavingsMessage}
            onCategoriesChange={setCategories}
            onSubmit={handleSubmit}
          />
        ) : canCreateForPeriod ? (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('analytics.emptyOlderTitle')}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {t('analytics.emptyOlderMessage', {
                month: formatPeriodLabel(selectedPeriod, locale),
              })}
            </p>
            <button
              type="button"
              onClick={handleCreateClick}
              className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white"
            >
              {t('analytics.createButton')}
            </button>
          </section>
        ) : null}
      </div>

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
    </main>
  );
}
