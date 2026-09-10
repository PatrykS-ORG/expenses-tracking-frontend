import { getTestNowIso } from '../lib/testNow';
import { graphqlHeaders } from '../lib/graphqlHeaders';
import type {
  MonthCloseAllocation,
  MonthClosureStatus,
} from '../types/monthClose.types';

interface GraphQLError {
  message?: string;
}

interface GraphQLResponse<TData> {
  data?: TData;
  errors?: GraphQLError[];
}

const GRAPHQL_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000/graphql';

const STATUS_FIELDS = `
  needsClosure
  period
  currentPeriod
  freeSavingsCents
  salaryCents
  totalExpensesCents
  currency
`;

async function graphqlRequest<TData>(
  accessToken: string,
  query: string,
  variables?: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<TData> {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: graphqlHeaders(accessToken),
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

export async function getMonthClosureStatus(
  accessToken: string,
  signal?: AbortSignal,
): Promise<MonthClosureStatus> {
  const data = await graphqlRequest<{
    monthClosureStatus?: MonthClosureStatus;
  }>(
    accessToken,
    `
      query MonthClosureStatus($testNow: String) {
        monthClosureStatus(testNow: $testNow) {
          ${STATUS_FIELDS}
        }
      }
    `,
    { testNow: getTestNowIso() },
    signal,
  );
  if (!data.monthClosureStatus) {
    throw new Error('Failed to load month closure status');
  }
  return data.monthClosureStatus;
}

export async function closeMonth(
  accessToken: string,
  period: string,
  allocations: MonthCloseAllocation[],
): Promise<MonthClosureStatus> {
  const data = await graphqlRequest<{ closeMonth?: MonthClosureStatus }>(
    accessToken,
    `
      mutation CloseMonth($input: CloseMonthInput!) {
        closeMonth(input: $input) {
          ${STATUS_FIELDS}
        }
      }
    `,
    {
      input: {
        period,
        allocations,
        testNow: getTestNowIso(),
      },
    },
  );
  if (!data.closeMonth) {
    throw new Error('Failed to close month');
  }
  return data.closeMonth;
}
