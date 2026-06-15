export const TEMPLATE_PLACEHOLDER_KEYS = [
  'userName',
  'currentMonth',
  'salaryAmount',
  'totalExpenses',
  'savingsAmount',
  'savingsMessage',
  'expensesList',
] as const;

export type TemplatePlaceholderKey = (typeof TEMPLATE_PLACEHOLDER_KEYS)[number];

const EXAMPLE_SALARY_PLN = 6500;
const EXAMPLE_EXPENSE_AMOUNTS_PLN = [1240, 300, 100, 486.5] as const;
const EXAMPLE_TOTAL_EXPENSES_PLN = EXAMPLE_EXPENSE_AMOUNTS_PLN.reduce(
  (sum, amount) => sum + amount,
  0,
);
const EXAMPLE_REMAINING_PLN = EXAMPLE_SALARY_PLN - EXAMPLE_TOTAL_EXPENSES_PLN;

function resolveLocale(locale?: string): 'en' | 'pl' {
  return locale?.startsWith('en') ? 'en' : 'pl';
}

function formatPlnAmountPl(amount: number): string {
  const [integerPart, fractionalPart] = amount.toFixed(2).split('.');
  const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${groupedInteger},${fractionalPart} zł`;
}

function formatPlnAmountEn(amount: number): string {
  return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PLN`;
}

function buildExpensesListHtml(
  formatAmount: (amount: number) => string,
  locale: 'en' | 'pl',
): string {
  const labels =
    locale === 'en'
      ? {
          foodHome: 'Food & home',
          groceries: 'Groceries',
          household: 'Household supplies',
          entertainment: 'Entertainment',
          squash: 'Squash',
          bowling: 'Bowling',
          dance: 'Ballroom dance',
          gifts: 'Gifts & occasions',
          birthdayGift: 'Birthday gift',
          transport: 'Transport',
          fuelCommute: 'Fuel & commute',
          total: 'Total expenses',
        }
      : {
          foodHome: 'Żywność i dom',
          groceries: 'Zakupy spożywcze',
          household: 'Chemia i drogeria',
          entertainment: 'Rozrywka',
          squash: 'Squash',
          bowling: 'Kręgle',
          dance: 'Taniec towarzyski',
          gifts: 'Prezenty i okazje',
          birthdayGift: 'Prezent urodzinowy',
          transport: 'Transport',
          fuelCommute: 'Paliwo i komunikacja',
          total: 'Razem wydatki',
        };

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="expenses-table" style="border-collapse:collapse;width:100%;min-width:260px;font-size:13px;">
  <tr>
    <td style="padding:14px 8px 4px 0;font-weight:700;color:#14532d;border-top:2px solid #10b981;font-size:14px;vertical-align:top;">${labels.foodHome}</td>
    <td align="right" class="amount-cell num" style="padding:14px 0 4px;font-weight:700;color:#14532d;border-top:2px solid #10b981;font-size:14px;white-space:nowrap;vertical-align:top;">${formatAmount(1240)}</td>
  </tr>
  <tr>
    <td style="padding:3px 8px 3px 16px;color:#4d7c0f;vertical-align:top;">${labels.groceries}</td>
    <td align="right" class="amount-cell num" style="padding:3px 0;color:#166534;white-space:nowrap;vertical-align:top;">${formatAmount(890)}</td>
  </tr>
  <tr>
    <td style="padding:3px 8px 8px 16px;color:#4d7c0f;vertical-align:top;">${labels.household}</td>
    <td align="right" class="amount-cell num" style="padding:3px 0 8px 0;color:#166534;white-space:nowrap;vertical-align:top;">${formatAmount(350)}</td>
  </tr>
  <tr>
    <td style="padding:14px 8px 4px 0;font-weight:700;color:#14532d;border-top:2px solid #10b981;font-size:14px;vertical-align:top;">${labels.entertainment}</td>
    <td align="right" class="amount-cell num" style="padding:14px 0 4px;font-weight:700;color:#14532d;border-top:2px solid #10b981;font-size:14px;white-space:nowrap;vertical-align:top;">${formatAmount(300)}</td>
  </tr>
  <tr>
    <td style="padding:3px 8px 3px 16px;color:#4d7c0f;vertical-align:top;">${labels.squash}</td>
    <td align="right" class="amount-cell num" style="padding:3px 0;color:#166534;white-space:nowrap;vertical-align:top;">${formatAmount(50)}</td>
  </tr>
  <tr>
    <td style="padding:3px 8px 3px 16px;color:#4d7c0f;vertical-align:top;">${labels.bowling}</td>
    <td align="right" class="amount-cell num" style="padding:3px 0;color:#166534;white-space:nowrap;vertical-align:top;">${formatAmount(150)}</td>
  </tr>
  <tr>
    <td style="padding:3px 8px 8px 16px;color:#4d7c0f;vertical-align:top;">${labels.dance}</td>
    <td align="right" class="amount-cell num" style="padding:3px 0 8px 0;color:#166534;white-space:nowrap;vertical-align:top;">${formatAmount(100)}</td>
  </tr>
  <tr>
    <td style="padding:14px 8px 4px 0;font-weight:700;color:#14532d;border-top:2px solid #10b981;font-size:14px;vertical-align:top;">${labels.gifts}</td>
    <td align="right" class="amount-cell num" style="padding:14px 0 4px;font-weight:700;color:#14532d;border-top:2px solid #10b981;font-size:14px;white-space:nowrap;vertical-align:top;">${formatAmount(100)}</td>
  </tr>
  <tr>
    <td style="padding:3px 8px 8px 16px;color:#4d7c0f;vertical-align:top;">${labels.birthdayGift}</td>
    <td align="right" class="amount-cell num" style="padding:3px 0 8px 0;color:#166534;white-space:nowrap;vertical-align:top;">${formatAmount(100)}</td>
  </tr>
  <tr>
    <td style="padding:14px 8px 4px 0;font-weight:700;color:#14532d;border-top:2px solid #10b981;font-size:14px;vertical-align:top;">${labels.transport}</td>
    <td align="right" class="amount-cell num" style="padding:14px 0 4px;font-weight:700;color:#14532d;border-top:2px solid #10b981;font-size:14px;white-space:nowrap;vertical-align:top;">${formatAmount(486.5)}</td>
  </tr>
  <tr>
    <td style="padding:3px 8px 8px 16px;color:#4d7c0f;vertical-align:top;">${labels.fuelCommute}</td>
    <td align="right" class="amount-cell num" style="padding:3px 0 8px 0;color:#166534;white-space:nowrap;vertical-align:top;">${formatAmount(486.5)}</td>
  </tr>
  <tr>
    <td style="padding:16px 8px 4px 0;font-weight:800;color:#14532d;border-top:2px dashed #10b981;font-size:14px;vertical-align:top;">${labels.total}</td>
    <td align="right" class="amount-cell num" style="padding:16px 0 4px;font-weight:800;color:#14532d;border-top:2px dashed #10b981;font-size:14px;white-space:nowrap;vertical-align:top;">${formatAmount(EXAMPLE_TOTAL_EXPENSES_PLN)}</td>
  </tr>
</table>`;
}

function displayNameFromEmail(
  email: string | null | undefined,
  locale?: string,
): string {
  const fallback =
    resolveLocale(locale) === 'en' ? 'Jane Smith' : 'Anna Kowalska';
  if (!email) {
    return fallback;
  }
  const localPart = email.split('@')[0]?.trim();
  if (!localPart) {
    return fallback;
  }
  const words = localPart
    .replace(/[._-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) {
    return fallback;
  }
  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function getExampleTemplateValues(
  userEmail?: string | null,
  locale?: string,
): Record<TemplatePlaceholderKey, string> {
  const lang = resolveLocale(locale);
  const formatAmount = lang === 'en' ? formatPlnAmountEn : formatPlnAmountPl;
  const totalExpensesFormatted = formatAmount(EXAMPLE_TOTAL_EXPENSES_PLN);
  const salaryFormatted = formatAmount(EXAMPLE_SALARY_PLN);
  const remainingFormatted = formatAmount(EXAMPLE_REMAINING_PLN);
  const now = new Date(2026, 5, 1);
  const currentMonth =
    lang === 'en'
      ? now.toLocaleString('en-US', { month: 'long', year: 'numeric' })
      : now.toLocaleString('pl-PL', { month: 'long', year: 'numeric' });

  const savingsMessage =
    lang === 'en'
      ? `Salary was ${salaryFormatted}, expenses ${totalExpensesFormatted} — ${remainingFormatted} left for the month. Groceries and fuel were the largest budget items.`
      : `Wypłata wyniosła ${salaryFormatted}, wydatki ${totalExpensesFormatted} — na koncie miesiąca zostało ${remainingFormatted}. Największy udział w budżecie miały zakupy spożywcze i paliwo.`;

  return {
    userName: displayNameFromEmail(userEmail, locale),
    currentMonth,
    salaryAmount: salaryFormatted,
    totalExpenses: totalExpensesFormatted,
    savingsAmount: `+ ${remainingFormatted}`,
    savingsMessage,
    expensesList: buildExpensesListHtml(formatAmount, lang),
  };
}

export function applyTemplatePreviewSamples(
  html: string,
  values: Record<TemplatePlaceholderKey, string>,
): string {
  let result = html;
  for (const key of TEMPLATE_PLACEHOLDER_KEYS) {
    const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    result = result.replace(pattern, values[key]);
  }
  return result;
}
