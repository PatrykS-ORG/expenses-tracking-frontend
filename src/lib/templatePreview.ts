import { buildExpensesListHtml } from './expensesListHtml';

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

const EXAMPLE_SALARY_PLN = 8500;
const EXAMPLE_CATEGORIES_PLN = [
  { name: 'Żywność i dom', total: 1450, items: [890, 350, 210] },
  { name: 'Transport', total: 986.5, items: [620, 186.5, 180] },
  { name: 'Rozrywka', total: 420, items: [220, 200] },
  {
    name: 'Rachunki i subskrypcje',
    total: 1873.95,
    items: [1450, 223.95, 200],
  },
  { name: 'Zdrowie', total: 500, items: [500] },
] as const;
const EXAMPLE_TOTAL_EXPENSES_PLN = EXAMPLE_CATEGORIES_PLN.reduce(
  (sum, category) => sum + category.total,
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

function getExampleCategories(locale: 'en' | 'pl') {
  if (locale === 'en') {
    return [
      {
        name: 'Food & home',
        total: '1,450.00 PLN',
        items: [
          { name: 'Groceries', amount: '890.00 PLN' },
          { name: 'Household supplies', amount: '350.00 PLN' },
          { name: 'Drugstore', amount: '210.00 PLN' },
        ],
      },
      {
        name: 'Transport',
        total: '986.50 PLN',
        items: [
          { name: 'Fuel', amount: '620.00 PLN' },
          { name: 'Public transport', amount: '186.50 PLN' },
          { name: 'Parking', amount: '180.00 PLN' },
        ],
      },
      {
        name: 'Entertainment',
        total: '420.00 PLN',
        items: [
          { name: 'Restaurants & cafes', amount: '220.00 PLN' },
          { name: 'Sports & hobbies', amount: '200.00 PLN' },
        ],
      },
      {
        name: 'Bills & subscriptions',
        total: '1,873.95 PLN',
        items: [
          { name: 'Rent & utilities', amount: '1,450.00 PLN' },
          { name: 'Phone & internet', amount: '223.95 PLN' },
          { name: 'Streaming services', amount: '200.00 PLN' },
        ],
      },
      {
        name: 'Health',
        total: '500.00 PLN',
        items: [{ name: 'Pharmacy & medical', amount: '500.00 PLN' }],
      },
    ];
  }

  return [
    {
      name: 'Żywność i dom',
      total: '1 450,00 zł',
      items: [
        { name: 'Zakupy spożywcze', amount: '890,00 zł' },
        { name: 'Chemia i drogeria', amount: '350,00 zł' },
        { name: 'Artykuły gospodarstwa domowego', amount: '210,00 zł' },
      ],
    },
    {
      name: 'Transport',
      total: '986,50 zł',
      items: [
        { name: 'Paliwo', amount: '620,00 zł' },
        { name: 'Komunikacja miejska', amount: '186,50 zł' },
        { name: 'Parking', amount: '180,00 zł' },
      ],
    },
    {
      name: 'Rozrywka',
      total: '420,00 zł',
      items: [
        { name: 'Restauracje i kawiarnie', amount: '220,00 zł' },
        { name: 'Sport i hobby', amount: '200,00 zł' },
      ],
    },
    {
      name: 'Rachunki i subskrypcje',
      total: '1 873,95 zł',
      items: [
        { name: 'Czynsz i media', amount: '1 450,00 zł' },
        { name: 'Telefon i internet', amount: '223,95 zł' },
        { name: 'Subskrypcje streamingowe', amount: '200,00 zł' },
      ],
    },
    {
      name: 'Zdrowie',
      total: '500,00 zł',
      items: [{ name: 'Apteka i lekarz', amount: '500,00 zł' }],
    },
  ];
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
      ? 'The largest share of your salary went to Bills & subscriptions (22.0%), driven mainly by rent. Your single most expensive item was Rent & utilities at 1,450.00 PLN. For the quickest savings, look at Entertainment (420.00 PLN) — cutting one restaurant visit could free up 200+ PLN next month.'
      : 'Największą część wypłaty pochłonęły Rachunki i subskrypcje (22,0%) — tu dominuje czynsz. Najdroższy pojedynczy wydatek to Czynsz i media — 1 450,00 zł. Najszybciej zaoszczędzisz w kategorii Rozrywka (420,00 zł) — rezygnacja z jednej wizyty w restauracji to ponad 200 zł mniej w następnym miesiącu.';

  return {
    userName: displayNameFromEmail(userEmail, locale),
    currentMonth,
    salaryAmount: salaryFormatted,
    totalExpenses: totalExpensesFormatted,
    savingsAmount: remainingFormatted,
    savingsMessage,
    expensesList: buildExpensesListHtml(
      getExampleCategories(lang),
      totalExpensesFormatted,
      lang === 'en' ? 'Total' : 'Razem',
      salaryFormatted,
      lang,
    ),
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
