import type { FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays } from 'lucide-react';
import { DashboardAlerts } from '../components/DashboardAlerts';
import { ExpenseFormSaveBar } from '../components/analytics/ExpenseFormSaveBar';
import { BudgetCategoryForm } from '../components/budget/BudgetCategoryForm';
import { BudgetCharts } from '../components/budget/BudgetCharts';
import { ExtraExpenseSection } from '../components/budget/ExtraExpenseSection';
import { actualCentsFromCurrentMonth } from '../lib/budgetCharts';
import {
  currentMonthInTimezone,
  formatPeriodLabel,
  shiftPeriod,
} from '../lib/period';
import {
  getCurrentMonthExpenses,
  getSummarySchedule,
} from '../services/onboarding.service';
import {
  getMyMonthlyBudget,
  saveMonthlyBudget,
} from '../services/budget.service';
import type { SummaryCategoryKey } from '../types/analytics.types';
import {
  budgetToExtraExpenseForm,
  budgetToFormAmounts,
  computeCutSummary,
  emptyBudgetFormAmounts,
  emptyExtraExpenseForm,
  extraExpenseFormToInput,
  formAmountsToCategories,
  type BudgetFormAmounts,
  type ExtraExpenseForm,
} from '../types/budget.types';
import { useAuthStore } from '../store/useAuthStore';
import { runWithBlockingLoader } from '../store/useBlockingLoaderStore';
import { useUnsavedChangesWarning } from '../store/useUnsavedChangesStore';

function snapshotOf(
  amounts: BudgetFormAmounts,
  extraExpense: ExtraExpenseForm,
): string {
  return JSON.stringify({ amounts, extraExpense });
}

export function BudgetPlanner() {
  const { t, i18n } = useTranslation();
  const { session } = useAuthStore();
  const token = session?.access_token;
  const locale = i18n.resolvedLanguage ?? 'pl';

  const [currency, setCurrency] = useState('PLN');
  const [timezone, setTimezone] = useState('Europe/Warsaw');
  const [amounts, setAmounts] = useState<BudgetFormAmounts>(
    emptyBudgetFormAmounts(),
  );
  const [extraExpense, setExtraExpense] = useState<ExtraExpenseForm>(
    emptyExtraExpenseForm(),
  );
  const [savedSnapshot, setSavedSnapshot] = useState(
    snapshotOf(emptyBudgetFormAmounts(), emptyExtraExpenseForm()),
  );
  const [actualCents, setActualCents] = useState<
    Partial<Record<SummaryCategoryKey, number>>
  >({});
  const [loading, setLoading] = useState(true);
  const [loadingActual, setLoadingActual] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const categoryLabel = useCallback(
    (key: SummaryCategoryKey) => t(`analytics.categories.${key}`),
    [t],
  );

  const planned = useMemo(() => formAmountsToCategories(amounts), [amounts]);
  const cutSummary = useMemo(
    () => computeCutSummary(amounts, extraExpense),
    [amounts, extraExpense],
  );
  const nextMonthLabel = useMemo(
    () =>
      formatPeriodLabel(
        shiftPeriod(currentMonthInTimezone(timezone), 1),
        locale,
      ),
    [locale, timezone],
  );
  const dirty = snapshotOf(amounts, extraExpense) !== savedSnapshot;
  useUnsavedChangesWarning(dirty);

  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();

    const bootstrap = async () => {
      setLoading(true);
      setError(null);
      try {
        const [budget, schedule] = await Promise.all([
          getMyMonthlyBudget(token, controller.signal),
          getSummarySchedule(token, controller.signal),
        ]);
        if (controller.signal.aborted) return;

        const nextAmounts = budgetToFormAmounts(budget);
        const nextExtraExpense = budgetToExtraExpenseForm(budget);
        setCurrency(budget?.currency ?? schedule.currency);
        setTimezone(schedule.timezone);
        setAmounts(nextAmounts);
        setExtraExpense(nextExtraExpense);
        setSavedSnapshot(snapshotOf(nextAmounts, nextExtraExpense));
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : t('budget.loadError'),
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
    if (!token || loading) return;

    const controller = new AbortController();

    const loadActual = async () => {
      setLoadingActual(true);
      try {
        const expenses = await getCurrentMonthExpenses(
          token,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setActualCents(actualCentsFromCurrentMonth(expenses));
      } catch {
        if (controller.signal.aborted) return;
        setActualCents({});
      } finally {
        if (!controller.signal.aborted) {
          setLoadingActual(false);
        }
      }
    };

    void loadActual();
    return () => controller.abort();
  }, [loading, token]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    void runWithBlockingLoader(async () => {
      if (!token) return;
      setBusy(true);
      setError(null);
      setSuccess(null);
      try {
        const saved = await saveMonthlyBudget(token, {
          currency,
          categories: formAmountsToCategories(amounts),
          extraExpense: extraExpenseFormToInput(extraExpense),
        });
        const nextAmounts = budgetToFormAmounts(saved);
        const nextExtraExpense = budgetToExtraExpenseForm(saved);
        setCurrency(saved.currency);
        setAmounts(nextAmounts);
        setExtraExpense(nextExtraExpense);
        setSavedSnapshot(snapshotOf(nextAmounts, nextExtraExpense));
        setSuccess(t('budget.saveSuccess'));
      } catch (saveError) {
        setError(
          saveError instanceof Error
            ? saveError.message
            : t('budget.saveError'),
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
        {t('budget.title')}
      </h1>
      <p className="mt-1 text-sm text-gray-600">{t('budget.subtitle')}</p>
      <p className="mt-3 flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
        <CalendarDays
          className="mt-0.5 h-4 w-4 shrink-0 text-blue-600"
          aria-hidden
        />
        {t('budget.planningForNextMonth', { month: nextMonthLabel })}
      </p>

      <DashboardAlerts error={error} success={success} />

      <form className="mt-6" onSubmit={handleSubmit}>
        <ExpenseFormSaveBar
          dirty={dirty}
          busy={busy}
          unsavedLabel={t('budget.unsaved')}
          savedLabel={t('budget.saved')}
          saveLabel={t('common.save')}
        />
        <div className="space-y-6">
          <ExtraExpenseSection
            form={extraExpense}
            summary={cutSummary}
            busy={busy}
            locale={locale}
            currency={currency}
            onChange={setExtraExpense}
          />
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <BudgetCategoryForm
              amounts={amounts}
              busy={busy}
              categoriesTitle={t('budget.categoriesTitle')}
              amountLabel={t('budget.amountLabel')}
              totalLabel={t('budget.totalBudget')}
              categoryLabel={categoryLabel}
              extraExpense={extraExpense}
              cutSummary={cutSummary}
              cutLabel={t('budget.extraExpense.cutLabel')}
              cutPlaceholder={t('budget.extraExpense.cutPlaceholder')}
              locale={locale}
              currency={currency}
              onChange={setAmounts}
              onExtraExpenseChange={setExtraExpense}
            />
          </section>
          <BudgetCharts
            planned={planned}
            actualCents={actualCents}
            cutSummary={extraExpense.enabled ? cutSummary : undefined}
            loadingActual={loadingActual}
            locale={locale}
            currency={currency}
            t={t}
            categoryLabel={categoryLabel}
          />
        </div>
      </form>
    </main>
  );
}
