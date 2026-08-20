import type { ReactNode } from 'react';
import type { TFunction } from 'i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  CATEGORY_CHART_COLORS,
  formatCompactAmount,
} from '../../lib/analyticsCharts';
import {
  BUDGET_VS_ACTUAL_COLORS,
  EXTRA_EXPENSE_SLICE_KEY,
  buildBudgetDonutData,
  buildBudgetVsActualData,
  type BudgetDonutSliceKey,
} from '../../lib/budgetCharts';
import type { SummaryCategoryKey } from '../../types/analytics.types';
import type {
  BudgetCategory,
  ExtraExpenseCutSummary,
} from '../../types/budget.types';

type BudgetChartsProps = {
  planned: readonly BudgetCategory[];
  actualCents: Partial<Record<SummaryCategoryKey, number>>;
  cutSummary?: ExtraExpenseCutSummary | null;
  loadingActual?: boolean;
  locale: string;
  currency: string;
  t: TFunction;
  categoryLabel: (key: SummaryCategoryKey) => string;
};

function formatTooltipValue(
  value: number | string | undefined,
  currency: string,
  locale: string,
): string {
  const amount = typeof value === 'number' ? value : Number(value ?? 0);
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-base font-semibold tracking-tight text-gray-900">
        {title}
      </h2>
      <div className="mt-4 min-h-0 flex-1">{children}</div>
    </section>
  );
}

export function BudgetCharts({
  planned,
  actualCents,
  cutSummary,
  loadingActual = false,
  locale,
  currency,
  t,
  categoryLabel,
}: BudgetChartsProps) {
  const donut = buildBudgetDonutData(planned, cutSummary);
  const vsActual = buildBudgetVsActualData(planned, actualCents, cutSummary);
  const vsActualChart = vsActual.map((point) => ({
    ...point,
    label: categoryLabel(point.key),
  }));
  const sliceLabel = (key: BudgetDonutSliceKey) =>
    key === EXTRA_EXPENSE_SLICE_KEY
      ? t('budget.extraExpense.chartSlice')
      : categoryLabel(key);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ChartCard title={t('budget.plannedAllocation')}>
        {donut.slices.length > 0 ? (
          <>
            <div className="relative mx-auto h-64 w-full max-w-sm">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donut.slices}
                    dataKey="value"
                    nameKey="key"
                    cx="50%"
                    cy="50%"
                    innerRadius="62%"
                    outerRadius="88%"
                    paddingAngle={2}
                    stroke="none"
                  >
                    {donut.slices.map((slice) => (
                      <Cell key={slice.key} fill={slice.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, _name, item) => {
                      const key = (
                        item?.payload as { key?: BudgetDonutSliceKey }
                      )?.key;
                      return [
                        formatTooltipValue(value as number, currency, locale),
                        key ? sliceLabel(key) : '',
                      ];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-semibold tabular-nums text-gray-900">
                  {formatCompactAmount(donut.total, locale)}
                </span>
                <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  {t('analytics.chartTotal')}
                </span>
              </div>
            </div>
            <ul className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              {donut.slices.map((slice) => {
                const percentLabel =
                  slice.percent < 10
                    ? slice.percent.toFixed(1)
                    : String(Math.round(slice.percent));
                return (
                  <li
                    key={slice.key}
                    className="flex items-center gap-2 text-xs text-gray-600"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: slice.color }}
                      aria-hidden
                    />
                    <span>
                      {sliceLabel(slice.key)}{' '}
                      <span className="tabular-nums text-gray-400">
                        ({percentLabel}%)
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <div className="flex h-64 items-center justify-center px-4 text-center">
            <p className="text-sm text-gray-500">{t('budget.plannedEmpty')}</p>
          </div>
        )}
      </ChartCard>

      <ChartCard title={t('budget.vsActual')}>
        {loadingActual ? (
          <div className="flex h-96 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
          </div>
        ) : vsActualChart.length > 0 ? (
          <>
            <div className="h-96 w-full overflow-visible">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={vsActualChart}
                  margin={{ top: 8, right: 16, left: 8, bottom: 12 }}
                  barCategoryGap="24%"
                  barGap={4}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    angle={-40}
                    textAnchor="end"
                    height="auto"
                    tickMargin={10}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    width={56}
                    tickFormatter={(value: number) =>
                      formatCompactAmount(value, locale, currency)
                    }
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      formatTooltipValue(value as number, currency, locale),
                      name === 'planned'
                        ? t('budget.planned')
                        : t('budget.actual'),
                    ]}
                    labelFormatter={(label) => String(label)}
                    contentStyle={{
                      borderRadius: 12,
                      borderColor: '#e5e7eb',
                      fontSize: 12,
                    }}
                  />
                  <Bar
                    dataKey="planned"
                    name="planned"
                    fill={BUDGET_VS_ACTUAL_COLORS.planned}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
                  <Bar
                    dataKey="actual"
                    name="actual"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  >
                    {vsActualChart.map((point) => (
                      <Cell
                        key={point.key}
                        fill={
                          point.overBudget
                            ? BUDGET_VS_ACTUAL_COLORS.overBudget
                            : CATEGORY_CHART_COLORS[point.key]
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              <li className="flex items-center gap-2 text-xs text-gray-600">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: BUDGET_VS_ACTUAL_COLORS.planned }}
                  aria-hidden
                />
                {t('budget.planned')}
              </li>
              <li className="flex items-center gap-2 text-xs text-gray-600">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: CATEGORY_CHART_COLORS.Groceries }}
                  aria-hidden
                />
                {t('budget.actual')}
              </li>
              <li className="flex items-center gap-2 text-xs text-gray-600">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor: BUDGET_VS_ACTUAL_COLORS.overBudget,
                  }}
                  aria-hidden
                />
                {t('budget.overBudget')}
              </li>
            </ul>
          </>
        ) : (
          <div className="flex h-64 items-center justify-center px-4 text-center">
            <p className="text-sm text-gray-500">{t('budget.vsActualEmpty')}</p>
          </div>
        )}
      </ChartCard>
    </div>
  );
}
