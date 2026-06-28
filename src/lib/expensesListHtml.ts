export interface ExpenseCategoryItem {
  name: string;
  amount: string;
}

export interface ExpenseCategory {
  name: string;
  total: string;
  items: ExpenseCategoryItem[];
}

export type ExpensesListLanguage = 'pl' | 'en';

const COLORS = {
  primaryDark: '#1B4332',
  primaryMedium: '#2D6A4F',
  primaryLight: '#40916C',
  textSecondary: '#6C757D',
  itemText: '#495057',
  progressTrack: '#E9ECEF',
  border: '#DEE2E6',
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function parseAmountToNumber(value: string): number | null {
  if (!value?.trim()) {
    return null;
  }

  const cleaned = value.replace(/[^\d,.\-\s]/g, '').trim();
  if (!cleaned) {
    return null;
  }

  const noSpaces = cleaned.replace(/\s/g, '');
  let normalized = noSpaces;

  if (noSpaces.includes(',') && noSpaces.includes('.')) {
    const lastComma = noSpaces.lastIndexOf(',');
    const lastDot = noSpaces.lastIndexOf('.');
    normalized =
      lastComma > lastDot
        ? noSpaces.replace(/\./g, '').replace(',', '.')
        : noSpaces.replace(/,/g, '');
  } else if (noSpaces.includes(',')) {
    normalized = noSpaces.replace(',', '.');
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function calculateSalaryPercentage(
  categoryTotal: number,
  salaryTotal: number,
): number {
  if (salaryTotal <= 0) {
    return 0;
  }

  const raw = (categoryTotal / salaryTotal) * 100;
  return Math.min(100, Math.round(raw * 10) / 10);
}

export function formatSalaryPercentage(
  percentage: number,
  language: ExpensesListLanguage = 'pl',
): string {
  const formatted =
    language === 'en'
      ? percentage.toFixed(1)
      : percentage.toFixed(1).replace('.', ',');

  return `${formatted}%`;
}

function getSalaryShareLabel(language: ExpensesListLanguage): string {
  return language === 'en' ? 'of salary' : 'wypłaty';
}

function resolvePercentageBase(
  salaryAmount?: string,
  totalExpenses?: string,
): number | null {
  const salaryNumeric = salaryAmount?.trim()
    ? parseAmountToNumber(salaryAmount)
    : null;
  if (salaryNumeric !== null && salaryNumeric > 0) {
    return salaryNumeric;
  }

  const totalNumeric = totalExpenses?.trim()
    ? parseAmountToNumber(totalExpenses)
    : null;
  if (totalNumeric !== null && totalNumeric > 0) {
    return totalNumeric;
  }

  return null;
}

function buildProgressBar(percentage: number): string {
  const clamped = Math.max(0, Math.min(100, percentage));
  const barWidth = clamped <= 0 ? 0 : Math.max(clamped, 4);

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 4px 0;">
  <tr>
    <td style="background-color:${COLORS.progressTrack};border-radius:6px;height:10px;padding:0;line-height:0;font-size:0;">
      <table role="presentation" width="${barWidth}%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <td style="background-color:${COLORS.primaryMedium};border-radius:6px;height:10px;line-height:0;font-size:0;">&nbsp;</td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

export function buildExpensesListHtml(
  categories: ExpenseCategory[],
  totalExpenses: string,
  totalLabel = 'Razem',
  salaryAmount?: string,
  language: ExpensesListLanguage = 'pl',
): string {
  const percentageBase = resolvePercentageBase(salaryAmount, totalExpenses);
  const salaryShareLabel = getSalaryShareLabel(language);
  const rows: string[] = [];

  const categoryNameCell = `padding:16px 8px 6px 0;font-weight:700;color:${COLORS.primaryDark};font-size:14px;vertical-align:top;`;
  const categoryAmountCell = `padding:16px 0 4px;font-weight:700;color:${COLORS.primaryDark};font-size:14px;white-space:nowrap;vertical-align:top;text-align:right;`;
  const categoryPercentCell = `padding:0 0 6px;font-weight:600;color:${COLORS.primaryMedium};font-size:12px;white-space:nowrap;vertical-align:top;text-align:right;line-height:1.3;`;
  const itemCell = `padding:4px 8px 4px 12px;color:${COLORS.itemText};font-size:13px;vertical-align:top;`;
  const itemAmountCell = `padding:4px 0;color:${COLORS.textSecondary};font-size:13px;white-space:nowrap;vertical-align:top;text-align:right;`;
  const lastItemCell = `padding:4px 8px 14px 12px;color:${COLORS.itemText};font-size:13px;vertical-align:top;`;
  const lastItemAmountCell = `padding:4px 0 14px 0;color:${COLORS.textSecondary};font-size:13px;white-space:nowrap;vertical-align:top;text-align:right;`;
  const totalCell = `padding:18px 8px 4px 0;font-weight:800;color:${COLORS.primaryDark};border-top:2px dashed ${COLORS.primaryLight};font-size:14px;vertical-align:top;`;
  const totalAmountCell = `padding:18px 0 4px;font-weight:800;color:${COLORS.primaryDark};border-top:2px dashed ${COLORS.primaryLight};font-size:14px;white-space:nowrap;vertical-align:top;text-align:right;`;

  for (const category of categories) {
    const categoryNumeric = parseAmountToNumber(category.total);
    const percentage =
      percentageBase !== null && categoryNumeric !== null
        ? calculateSalaryPercentage(categoryNumeric, percentageBase)
        : null;

    const percentageLabel =
      percentage !== null
        ? `${formatSalaryPercentage(percentage, language)} ${salaryShareLabel}`
        : '';

    rows.push(`  <tr>
    <td style="${categoryNameCell}">${escapeHtml(category.name)}</td>
    <td style="${categoryAmountCell}">${escapeHtml(category.total)}</td>
  </tr>`);

    if (percentageLabel) {
      rows.push(`  <tr>
    <td style="padding:0;"></td>
    <td style="${categoryPercentCell}">${escapeHtml(percentageLabel)}</td>
  </tr>`);
    }

    if (percentage !== null) {
      rows.push(`  <tr>
    <td colspan="2" style="padding:0 0 10px 0;">${buildProgressBar(percentage)}</td>
  </tr>`);
    }

    category.items.forEach((item, index) => {
      const isLast = index === category.items.length - 1;
      rows.push(`  <tr>
    <td style="${isLast ? lastItemCell : itemCell}"><span style="color:${COLORS.primaryLight};padding-right:8px;">&#8226;</span>${escapeHtml(item.name)}</td>
    <td style="${isLast ? lastItemAmountCell : itemAmountCell}">${escapeHtml(item.amount)}</td>
  </tr>`);
    });
  }

  rows.push(`  <tr>
    <td style="${totalCell}">${escapeHtml(totalLabel)}</td>
    <td style="${totalAmountCell}">${escapeHtml(totalExpenses)}</td>
  </tr>`);

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="expenses-table" style="border-collapse:collapse;width:100%;min-width:260px;font-family:Arial,Helvetica,sans-serif;font-size:13px;border:1px solid ${COLORS.border};border-radius:8px;overflow:hidden;table-layout:fixed;">
  <colgroup>
    <col style="width:62%;" />
    <col style="width:38%;" />
  </colgroup>
${rows.join('\n')}
</table>`;
}
