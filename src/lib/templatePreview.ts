export const TEMPLATE_PLACEHOLDER_KEYS = [
  'userName',
  'currentMonth',
  'salaryAmount',
  'totalExpenses',
  'savingsAmount',
  'savingsMessage',
  'expensesList',
] as const

export type TemplatePlaceholderKey = (typeof TEMPLATE_PLACEHOLDER_KEYS)[number]

/** Przykładowe kwoty — suma wydatków i „pozostało” liczone z wypłaty. */
const EXAMPLE_SALARY_PLN = 6500
const EXAMPLE_EXPENSE_AMOUNTS_PLN = [1240, 300, 100, 486.5] as const
const EXAMPLE_TOTAL_EXPENSES_PLN = EXAMPLE_EXPENSE_AMOUNTS_PLN.reduce((sum, amount) => sum + amount, 0)
const EXAMPLE_REMAINING_PLN = EXAMPLE_SALARY_PLN - EXAMPLE_TOTAL_EXPENSES_PLN

function formatPlnAmount(amount: number): string {
  const [integerPart, fractionalPart] = amount.toFixed(2).split('.')
  const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${groupedInteger},${fractionalPart} zł`
}

const EXAMPLE_EXPENSES_LIST_HTML = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="expenses-table" style="border-collapse:collapse;width:100%;min-width:260px;font-size:13px;">
  <tr>
    <td style="padding:14px 8px 4px 0;font-weight:700;color:#14532d;border-top:2px solid #10b981;font-size:14px;vertical-align:top;">Żywność i dom</td>
    <td align="right" class="amount-cell num" style="padding:14px 0 4px;font-weight:700;color:#14532d;border-top:2px solid #10b981;font-size:14px;white-space:nowrap;vertical-align:top;">1 240,00 zł</td>
  </tr>
  <tr>
    <td style="padding:3px 8px 3px 16px;color:#4d7c0f;vertical-align:top;">Zakupy spożywcze</td>
    <td align="right" class="amount-cell num" style="padding:3px 0;color:#166534;white-space:nowrap;vertical-align:top;">890,00 zł</td>
  </tr>
  <tr>
    <td style="padding:3px 8px 8px 16px;color:#4d7c0f;vertical-align:top;">Chemia i drogeria</td>
    <td align="right" class="amount-cell num" style="padding:3px 0 8px 0;color:#166534;white-space:nowrap;vertical-align:top;">350,00 zł</td>
  </tr>
  <tr>
    <td style="padding:14px 8px 4px 0;font-weight:700;color:#14532d;border-top:2px solid #10b981;font-size:14px;vertical-align:top;">Rozrywka</td>
    <td align="right" class="amount-cell num" style="padding:14px 0 4px;font-weight:700;color:#14532d;border-top:2px solid #10b981;font-size:14px;white-space:nowrap;vertical-align:top;">300,00 zł</td>
  </tr>
  <tr>
    <td style="padding:3px 8px 3px 16px;color:#4d7c0f;vertical-align:top;">Squash</td>
    <td align="right" class="amount-cell num" style="padding:3px 0;color:#166534;white-space:nowrap;vertical-align:top;">50,00 zł</td>
  </tr>
  <tr>
    <td style="padding:3px 8px 3px 16px;color:#4d7c0f;vertical-align:top;">Kręgle</td>
    <td align="right" class="amount-cell num" style="padding:3px 0;color:#166534;white-space:nowrap;vertical-align:top;">150,00 zł</td>
  </tr>
  <tr>
    <td style="padding:3px 8px 8px 16px;color:#4d7c0f;vertical-align:top;">Taniec towarzyski</td>
    <td align="right" class="amount-cell num" style="padding:3px 0 8px 0;color:#166534;white-space:nowrap;vertical-align:top;">100,00 zł</td>
  </tr>
  <tr>
    <td style="padding:14px 8px 4px 0;font-weight:700;color:#14532d;border-top:2px solid #10b981;font-size:14px;vertical-align:top;">Prezenty i okazje</td>
    <td align="right" class="amount-cell num" style="padding:14px 0 4px;font-weight:700;color:#14532d;border-top:2px solid #10b981;font-size:14px;white-space:nowrap;vertical-align:top;">100,00 zł</td>
  </tr>
  <tr>
    <td style="padding:3px 8px 8px 16px;color:#4d7c0f;vertical-align:top;">Prezent urodzinowy</td>
    <td align="right" class="amount-cell num" style="padding:3px 0 8px 0;color:#166534;white-space:nowrap;vertical-align:top;">100,00 zł</td>
  </tr>
  <tr>
    <td style="padding:14px 8px 4px 0;font-weight:700;color:#14532d;border-top:2px solid #10b981;font-size:14px;vertical-align:top;">Transport</td>
    <td align="right" class="amount-cell num" style="padding:14px 0 4px;font-weight:700;color:#14532d;border-top:2px solid #10b981;font-size:14px;white-space:nowrap;vertical-align:top;">486,50 zł</td>
  </tr>
  <tr>
    <td style="padding:3px 8px 8px 16px;color:#4d7c0f;vertical-align:top;">Paliwo i komunikacja</td>
    <td align="right" class="amount-cell num" style="padding:3px 0 8px 0;color:#166534;white-space:nowrap;vertical-align:top;">486,50 zł</td>
  </tr>
  <tr>
    <td style="padding:16px 8px 4px 0;font-weight:800;color:#14532d;border-top:2px dashed #10b981;font-size:14px;vertical-align:top;">Razem wydatki</td>
    <td align="right" class="amount-cell num" style="padding:16px 0 4px;font-weight:800;color:#14532d;border-top:2px dashed #10b981;font-size:14px;white-space:nowrap;vertical-align:top;">${formatPlnAmount(EXAMPLE_TOTAL_EXPENSES_PLN)}</td>
  </tr>
</table>`

function displayNameFromEmail(email: string | null | undefined): string {
  if (!email) {
    return 'Anna Kowalska'
  }
  const localPart = email.split('@')[0]?.trim()
  if (!localPart) {
    return 'Anna Kowalska'
  }
  const words = localPart.replace(/[._-]+/g, ' ').split(/\s+/).filter(Boolean)
  if (words.length === 0) {
    return 'Anna Kowalska'
  }
  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
}

export function getExampleTemplateValues(userEmail?: string | null): Record<TemplatePlaceholderKey, string> {
  const totalExpensesFormatted = formatPlnAmount(EXAMPLE_TOTAL_EXPENSES_PLN)
  const salaryFormatted = formatPlnAmount(EXAMPLE_SALARY_PLN)
  const remainingFormatted = formatPlnAmount(EXAMPLE_REMAINING_PLN)

  return {
    userName: displayNameFromEmail(userEmail),
    currentMonth: 'czerwiec 2026',
    salaryAmount: salaryFormatted,
    totalExpenses: totalExpensesFormatted,
    savingsAmount: `+ ${remainingFormatted}`,
    savingsMessage: `Wypłata wyniosła ${salaryFormatted}, wydatki ${totalExpensesFormatted} — na koncie miesiąca zostało ${remainingFormatted}. Największy udział w budżecie miały zakupy spożywcze i paliwo.`,
    expensesList: EXAMPLE_EXPENSES_LIST_HTML,
  }
}

export function applyTemplatePreviewSamples(
  html: string,
  values: Record<TemplatePlaceholderKey, string>,
): string {
  let result = html
  for (const key of TEMPLATE_PLACEHOLDER_KEYS) {
    const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g')
    result = result.replace(pattern, values[key])
  }
  return result
}
