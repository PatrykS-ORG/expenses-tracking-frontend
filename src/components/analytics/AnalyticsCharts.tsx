import type { ReactNode } from 'react';
import type { TFunction } from 'i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  buildCategoryDonutData,
  buildMomChartData,
  buildMonthlySavingsChartData,
  buildYtdSavesVsSpent,
  CHART_SERIES_COLORS,
  findMostExpensiveExpense,
  formatCompactAmount,
  formatMomRangeCaption,
} from '../../lib/analyticsCharts';
import { formatCentsAsCurrency } from '../../lib/money';
import { EARLIEST_PERIOD, formatPeriodLabel } from '../../lib/period';
import type {
  SummaryAnalytics,
  SummaryCategoryKey,
} from '../../types/analytics.types';

type AnalyticsChartsProps = {
  summaries: SummaryAnalytics[];
  selectedSummary: SummaryAnalytics | null;
  selectedPeriod: string;
  /** Last ended calendar month (previous month in user TZ). */
  throughPeriod: string;
  loadingMonth?: boolean;
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
  caption,
  children,
}: {
  title: string;
  caption?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-base font-semibold tracking-tight text-gray-900">
        {title}
      </h2>
      <div className="mt-4 min-h-0 flex-1">{children}</div>
      {caption ? <p className="mt-4 text-xs text-gray-400">{caption}</p> : null}
    </section>
  );
}

function SeriesLegend({
  items,
}: {
  items: { color: string; label: string }[];
}) {
  return (
    <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
      {items.map((item) => (
        <li
          key={item.label}
          className="flex items-center gap-2 text-xs text-gray-600"
        >
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: item.color }}
            aria-hidden
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

export function AnalyticsCharts({
  summaries,
  selectedSummary,
  selectedPeriod,
  throughPeriod,
  loadingMonth = false,
  locale,
  currency,
  t,
  categoryLabel,
}: AnalyticsChartsProps) {
  // Include in-progress live months (id starts with live-) so MoM works before
  // any SummaryAnalytics row exists.
  if (summaries.length === 0 && !selectedSummary) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-500">
          {t('analytics.noDataForCharts')}
        </p>
      </section>
    );
  }

  const momData = buildMomChartData(summaries, locale, {
    fromPeriod: EARLIEST_PERIOD,
    throughPeriod,
  });
  const ytdRange = { fromPeriod: EARLIEST_PERIOD, throughPeriod };
  const ytd = buildYtdSavesVsSpent(summaries, ytdRange);
  const mostExpensive = findMostExpensiveExpense(summaries, ytdRange);
  const monthlySavingsData = buildMonthlySavingsChartData(
    summaries,
    locale,
    ytdRange,
  );
  const chartCurrency = selectedSummary?.currency ?? currency;
  const periodLabel = selectedPeriod
    ? formatPeriodLabel(selectedPeriod, locale)
    : '';
  const donut = selectedSummary
    ? buildCategoryDonutData(selectedSummary)
    : { slices: [], total: 0 };
  const momCaption = t('analytics.chartsMomCaption', {
    range: formatMomRangeCaption(momData, locale),
  });
  const monthlySavingsCaption = t('analytics.chartsMonthlySavingsCaption', {
    range: formatMomRangeCaption(monthlySavingsData, locale),
  });
  const ytdCaption = t('analytics.chartsYtdCaption', {
    from: formatPeriodLabel(EARLIEST_PERIOD, locale),
    through: formatPeriodLabel(throughPeriod, locale),
  });
  const mostExpensiveCaption = mostExpensive
    ? t('analytics.chartsYtdMostExpensive', {
        name: mostExpensive.name,
        amount: formatCentsAsCurrency(
          mostExpensive.amountCents,
          chartCurrency,
          locale,
        ),
        month: formatPeriodLabel(mostExpensive.period, locale),
      })
    : t('analytics.chartsYtdMostExpensiveEmpty');
  const categoryCaption = selectedSummary
    ? t('analytics.chartsCategoryCaption', {
        source: selectedSummary.id.startsWith('live-')
          ? t('analytics.sourceInProgress')
          : selectedSummary.source === 'MANUAL'
            ? t('analytics.sourceManual')
            : t('analytics.sourceScheduled'),
        period: selectedSummary.period,
        currency: selectedSummary.currency,
      })
    : undefined;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ChartCard
        title={t('analytics.chartsCategoryTitle', { month: periodLabel })}
        caption={categoryCaption}
      >
        {loadingMonth ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
          </div>
        ) : selectedSummary && donut.slices.length > 0 ? (
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
                        item?.payload as { key?: SummaryCategoryKey }
                      )?.key;
                      return [
                        formatTooltipValue(
                          value as number,
                          chartCurrency,
                          locale,
                        ),
                        key ? categoryLabel(key) : '',
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
                      {categoryLabel(slice.key)}{' '}
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
            <p className="text-sm text-gray-500">
              {t('analytics.chartsCategoryEmpty', { month: periodLabel })}
            </p>
          </div>
        )}
      </ChartCard>

      <ChartCard title={t('analytics.chartsYtdTitle')} caption={ytdCaption}>
        {ytd.slices.length > 0 ? (
          <>
            <div className="relative mx-auto h-64 w-full max-w-sm">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ytd.slices}
                    dataKey="value"
                    nameKey="key"
                    cx="50%"
                    cy="50%"
                    innerRadius="62%"
                    outerRadius="88%"
                    paddingAngle={2}
                    stroke="none"
                  >
                    {ytd.slices.map((slice) => (
                      <Cell key={slice.key} fill={slice.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, _name, item) => {
                      const key = (
                        item?.payload as { key?: 'savings' | 'spent' }
                      )?.key;
                      return [
                        formatTooltipValue(
                          value as number,
                          chartCurrency,
                          locale,
                        ),
                        key === 'savings'
                          ? t('analytics.chartsYtdSavings')
                          : t('analytics.chartsYtdSpent'),
                      ];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-semibold tabular-nums text-gray-900">
                  {formatCompactAmount(ytd.spentCents / 100, locale)}
                </span>
                <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  {t('analytics.chartsYtdSpent')}
                </span>
              </div>
            </div>
            <ul className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              {ytd.slices.map((slice) => {
                const percentLabel =
                  slice.percent < 10
                    ? slice.percent.toFixed(1)
                    : String(Math.round(slice.percent));
                const amountCents =
                  slice.key === 'savings' ? ytd.savingsCents : ytd.spentCents;
                const label =
                  slice.key === 'savings'
                    ? t('analytics.chartsYtdSavings')
                    : t('analytics.chartsYtdSpent');
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
                      {label}{' '}
                      <span className="tabular-nums text-gray-500">
                        {formatCentsAsCurrency(
                          amountCents,
                          chartCurrency,
                          locale,
                        )}
                      </span>{' '}
                      <span className="tabular-nums text-gray-400">
                        ({percentLabel}%)
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
            {ytd.savingsCents < 0 &&
            !ytd.slices.some((slice) => slice.key === 'savings') ? (
              <p className="mt-2 text-center text-xs text-gray-500">
                {t('analytics.chartsYtdSavings')}{' '}
                <span className="tabular-nums">
                  {formatCentsAsCurrency(
                    ytd.savingsCents,
                    chartCurrency,
                    locale,
                  )}
                </span>
              </p>
            ) : null}
          </>
        ) : (
          <div className="flex h-64 items-center justify-center px-4 text-center">
            <p className="text-sm text-gray-500">
              {t('analytics.chartsYtdEmpty')}
            </p>
          </div>
        )}
        <p className="mt-4 text-sm text-gray-600">{mostExpensiveCaption}</p>
      </ChartCard>

      <ChartCard title={t('analytics.chartsMomTitle')} caption={momCaption}>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={momData}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              barCategoryGap="24%"
              barGap={4}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e7eb"
                vertical={false}
              />
              <XAxis
                dataKey="periodLabel"
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={8}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                width={56}
                tickFormatter={(value: number) =>
                  formatCompactAmount(value, locale, chartCurrency)
                }
              />
              <Tooltip
                formatter={(value, name) => {
                  if (value == null) return ['—', ''];
                  return [
                    formatTooltipValue(value as number, chartCurrency, locale),
                    name === 'income'
                      ? t('analytics.chartIncome', { currency: chartCurrency })
                      : t('analytics.chartExpenses', {
                          currency: chartCurrency,
                        }),
                  ];
                }}
                labelFormatter={(label) => String(label)}
                contentStyle={{
                  borderRadius: 12,
                  borderColor: '#e5e7eb',
                  fontSize: 12,
                }}
              />
              <Bar
                dataKey="expenses"
                name="expenses"
                fill={CHART_SERIES_COLORS.expenses}
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="income"
                name="income"
                fill={CHART_SERIES_COLORS.income}
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <SeriesLegend
          items={[
            {
              color: CHART_SERIES_COLORS.expenses,
              label: t('analytics.chartExpenses', { currency: chartCurrency }),
            },
            {
              color: CHART_SERIES_COLORS.income,
              label: t('analytics.chartIncome', { currency: chartCurrency }),
            },
          ]}
        />
        {summaries.length < 2 ? (
          <p className="mt-2 text-center text-xs text-gray-400">
            {t('analytics.chartsMomSparseHint')}
          </p>
        ) : null}
      </ChartCard>

      <ChartCard
        title={t('analytics.chartsMonthlySavingsTitle')}
        caption={monthlySavingsCaption}
      >
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlySavingsData}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              barCategoryGap="28%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e7eb"
                vertical={false}
              />
              <XAxis
                dataKey="periodLabel"
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={8}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                width={56}
                tickFormatter={(value: number) =>
                  formatCompactAmount(value, locale, chartCurrency)
                }
              />
              <ReferenceLine y={0} stroke="#d1d5db" />
              <Tooltip
                formatter={(value) => [
                  formatTooltipValue(value as number, chartCurrency, locale),
                  t('analytics.chartsMonthlySavings', {
                    currency: chartCurrency,
                  }),
                ]}
                labelFormatter={(label) => String(label)}
                contentStyle={{
                  borderRadius: 12,
                  borderColor: '#e5e7eb',
                  fontSize: 12,
                }}
              />
              <Bar
                dataKey="savings"
                name="savings"
                maxBarSize={48}
                radius={[6, 6, 0, 0]}
              >
                {monthlySavingsData.map((point) => (
                  <Cell
                    key={point.period}
                    fill={
                      point.savings < 0
                        ? '#f87171'
                        : CHART_SERIES_COLORS.savings
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <SeriesLegend
          items={[
            {
              color: CHART_SERIES_COLORS.savings,
              label: t('analytics.chartsMonthlySavings', {
                currency: chartCurrency,
              }),
            },
          ]}
        />
      </ChartCard>
    </div>
  );
}
