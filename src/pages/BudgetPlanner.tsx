import type { FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardAlerts } from '../components/DashboardAlerts';
import { ExpenseFormSaveBar } from '../components/analytics/ExpenseFormSaveBar';
import { BudgetCategoryForm } from '../components/budget/BudgetCategoryForm';
import { BudgetCharts } from '../components/budget/BudgetCharts';
import { actualCentsFromCurrentMonth } from '../lib/budgetCharts';
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
  budgetToFormAmounts,
  emptyBudgetFormAmounts,
  formAmountsToCategories,
  type BudgetFormAmounts,
} from '../types/budget.types';
import { useAuthStore } from '../store/useAuthStore';
import { runWithBlockingLoader } from '../store/useBlockingLoaderStore';
import { useUnsavedChangesWarning } from '../store/useUnsavedChangesStore';

function snapshotOf(amounts: BudgetFormAmounts): string {
  return JSON.stringify(amounts);
}

export function BudgetPlanner() {
  const { t, i18n } = useTranslation();
  const { session } = useAuthStore();
  const token = session?.access_token;
  const locale = i18n.resolvedLanguage ?? 'pl';

  const [currency, setCurrency] = useState('PLN');
  const [amounts, setAmounts] = useState<BudgetFormAmounts>(
    emptyBudgetFormAmounts(),
  );
  const [savedSnapshot, setSavedSnapshot] = useState(
    snapshotOf(emptyBudgetFormAmounts()),
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
  const dirty = snapshotOf(amounts) !== savedSnapshot;
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
        setCurrency(budget?.currency ?? schedule.currency);
        setAmounts(nextAmounts);
        setSavedSnapshot(snapshotOf(nextAmounts));
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
        });
        const nextAmounts = budgetToFormAmounts(saved);
        setCurrency(saved.currency);
        setAmounts(nextAmounts);
        setSavedSnapshot(snapshotOf(nextAmounts));
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
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <BudgetCategoryForm
              amounts={amounts}
              busy={busy}
              categoriesTitle={t('budget.categoriesTitle')}
              amountLabel={t('budget.amountLabel')}
              totalLabel={t('budget.totalBudget')}
              categoryLabel={categoryLabel}
              onChange={setAmounts}
            />
          </section>
          <BudgetCharts
            planned={planned}
            actualCents={actualCents}
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
