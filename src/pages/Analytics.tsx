import type { FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays } from 'lucide-react';
import { DashboardAlerts } from '../components/DashboardAlerts';
import { AnalyticsCharts } from '../components/analytics/AnalyticsCharts';
import {
  ManualSummaryForm,
  buildManualSummaryCategories,
  categoryFormStateFromSummary,
  emptyCategoryFormState,
  type CategoryFormState,
} from '../components/analytics/ManualSummaryForm';
import { SummaryDetailPanel } from '../components/analytics/SummaryDetailPanel';
import {
  currentMonthInTimezone,
  formatPeriodLabel,
  isPeriodBefore,
  listEndedPeriods,
  previousPeriod,
} from '../lib/period';
import { centsToAmountString } from '../lib/money';
import { getSummarySchedule } from '../services/onboarding.service';
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('detail');
  const [salaryAmount, setSalaryAmount] = useState('');
  const [savingsMessage, setSavingsMessage] = useState('');
  const [categories, setCategories] = useState<CategoryFormState>(
    emptyCategoryFormState(),
  );

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

  const categoryLabel = useCallback(
    (key: SummaryCategoryKey) => t(`analytics.categories.${key}`),
    [t],
  );

  const canCreateForPeriod =
    selectedPeriod !== '' &&
    isPeriodBefore(selectedPeriod, previousMonth) &&
    !selectedSummary;

  const isScheduledPending =
    selectedPeriod !== '' &&
    selectedPeriod === previousMonth &&
    !selectedSummary;

  const resetForm = useCallback((summary: SummaryAnalytics | null) => {
    if (!summary) {
      setSalaryAmount('');
      setSavingsMessage('');
      setCategories(emptyCategoryFormState());
      return;
    }

    setSalaryAmount(centsToAmountString(summary.salaryCents));
    setSavingsMessage(summary.savingsMessage ?? '');
    setCategories(categoryFormStateFromSummary(summary));
  }, []);

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
        const [schedule, rows] = await Promise.all([
          getSummarySchedule(token, controller.signal),
          getMySummaries(token, controller.signal),
        ]);
        if (controller.signal.aborted) return;

        setTimezone(schedule.timezone);
        setCurrency(schedule.currency);
        setSummaries(rows);

        const current = currentMonthInTimezone(schedule.timezone);
        const defaultPeriod = previousPeriod(current);
        setSelectedPeriod(defaultPeriod);
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
      try {
        const summary = await getMySummary(
          token,
          selectedPeriod,
          controller.signal,
        );
        if (controller.signal.aborted) return;

        setSelectedSummary(summary);
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
  }, [loading, resetForm, selectedPeriod, t, token]);

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
      if (!token || !selectedPeriod) return;

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
              {endedPeriods.map((period) => (
                <option key={period} value={period}>
                  {formatPeriodLabel(period, locale)}
                </option>
              ))}
            </select>
          </label>
        </section>

        <AnalyticsCharts
          summaries={summaries}
          selectedSummary={selectedSummary}
          selectedPeriod={selectedPeriod}
          throughPeriod={previousMonth}
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
        ) : selectedSummary && viewMode === 'detail' ? (
          <SummaryDetailPanel
            summary={selectedSummary}
            locale={locale}
            sourceLabel={t('analytics.sourceLabel')}
            sourceManualLabel={t('analytics.sourceManual')}
            sourceScheduledLabel={t('analytics.sourceScheduled')}
            incomeLabel={t('analytics.incomeLabel')}
            expensesLabel={t('analytics.expensesLabel')}
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
            onSalaryAmountChange={setSalaryAmount}
            onSavingsMessageChange={setSavingsMessage}
            onCategoriesChange={setCategories}
            onSubmit={handleSubmit}
            onCancel={handleCancelForm}
            cancelLabel={t('analytics.cancelEdit')}
          />
        ) : isScheduledPending ? (
          <section className="rounded-2xl border border-blue-100 bg-blue-50/60 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('analytics.scheduledPendingTitle')}
            </h2>
            <p className="mt-2 text-sm text-gray-700">
              {t('analytics.scheduledPendingMessage', {
                month: formatPeriodLabel(selectedPeriod, locale),
              })}
            </p>
          </section>
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
    </main>
  );
}
