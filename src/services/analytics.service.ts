import type {
  CreateManualSummaryInput,
  SummaryAnalytics,
  SummaryCategoryKey,
  UpdateManualSummaryInput,
} from '../types/analytics.types';

interface GraphQLError {
  message?: string;
}

interface GraphQLResponse<TData> {
  data?: TData;
  errors?: GraphQLError[];
}

const GRAPHQL_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000/graphql';

const SUMMARY_FIELDS = `
  id
  period
  source
  currency
  salaryCents
  totalExpensesCents
  savingsCents
  savingsMessage
  categories {
    name
    totalCents
    items {
      name
      amountCents
    }
  }
  createdAt
  updatedAt
`;

async function graphqlRequest<TData>(
  accessToken: string,
  query: string,
  variables?: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<TData> {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ query, variables }),
    signal,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    console.error('GraphQL HTTP error:', errorData);
    throw new Error('GraphQL request failed');
  }

  const { data, errors } = (await res.json()) as GraphQLResponse<TData>;
  if (errors && errors.length > 0) {
    throw new Error(errors[0].message || 'GraphQL operation failed');
  }

  if (!data) {
    throw new Error('GraphQL response contained no data');
  }

  return data;
}

export async function getMySummaries(
  accessToken: string,
  signal?: AbortSignal,
): Promise<SummaryAnalytics[]> {
  const data = await graphqlRequest<{ mySummaries?: SummaryAnalytics[] }>(
    accessToken,
    `
      query MySummaries {
        mySummaries {
          ${SUMMARY_FIELDS}
        }
      }
    `,
    undefined,
    signal,
  );
  return data.mySummaries ?? [];
}

export async function getMySummary(
  accessToken: string,
  month: string,
  signal?: AbortSignal,
): Promise<SummaryAnalytics | null> {
  const data = await graphqlRequest<{ mySummary?: SummaryAnalytics | null }>(
    accessToken,
    `
      query MySummary($month: String!) {
        mySummary(month: $month) {
          ${SUMMARY_FIELDS}
        }
      }
    `,
    { month },
    signal,
  );
  return data.mySummary ?? null;
}

export async function getSummaryCategoryKeys(
  accessToken: string,
  signal?: AbortSignal,
): Promise<SummaryCategoryKey[] | null> {
  try {
    const data = await graphqlRequest<{
      summaryCategoryKeys?: SummaryCategoryKey[];
    }>(
      accessToken,
      `
        query SummaryCategoryKeys {
          summaryCategoryKeys
        }
      `,
      undefined,
      signal,
    );
    return data.summaryCategoryKeys ?? null;
  } catch {
    // The backend field is optional; fall back to the frontend catalog.
    return null;
  }
}

export async function createManualSummary(
  accessToken: string,
  input: CreateManualSummaryInput,
): Promise<SummaryAnalytics> {
  const data = await graphqlRequest<{
    createManualSummary?: SummaryAnalytics;
  }>(
    accessToken,
    `
      mutation CreateManualSummary($input: CreateManualSummaryInput!) {
        createManualSummary(input: $input) {
          ${SUMMARY_FIELDS}
        }
      }
    `,
    { input },
  );

  if (!data.createManualSummary) {
    throw new Error('Failed to create manual summary');
  }

  return data.createManualSummary;
}

export async function updateManualSummary(
  accessToken: string,
  input: UpdateManualSummaryInput,
): Promise<SummaryAnalytics> {
  const data = await graphqlRequest<{
    updateManualSummary?: SummaryAnalytics;
  }>(
    accessToken,
    `
      mutation UpdateManualSummary($input: UpdateManualSummaryInput!) {
        updateManualSummary(input: $input) {
          ${SUMMARY_FIELDS}
        }
      }
    `,
    { input },
  );

  if (!data.updateManualSummary) {
    throw new Error('Failed to update manual summary');
  }

  return data.updateManualSummary;
}
