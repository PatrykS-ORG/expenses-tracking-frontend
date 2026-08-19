import type {
  MonthlyBudget,
  SaveMonthlyBudgetInput,
} from '../types/budget.types';

interface GraphQLError {
  message?: string;
}

interface GraphQLResponse<TData> {
  data?: TData;
  errors?: GraphQLError[];
}

const GRAPHQL_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000/graphql';

const BUDGET_FIELDS = `
  id
  currency
  categories {
    key
    amountCents
  }
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

export async function getMyMonthlyBudget(
  accessToken: string,
  signal?: AbortSignal,
): Promise<MonthlyBudget | null> {
  const data = await graphqlRequest<{ myMonthlyBudget?: MonthlyBudget | null }>(
    accessToken,
    `
      query MyMonthlyBudget {
        myMonthlyBudget {
          ${BUDGET_FIELDS}
        }
      }
    `,
    undefined,
    signal,
  );
  return data.myMonthlyBudget ?? null;
}

export async function saveMonthlyBudget(
  accessToken: string,
  input: SaveMonthlyBudgetInput,
): Promise<MonthlyBudget> {
  const data = await graphqlRequest<{ saveMonthlyBudget?: MonthlyBudget }>(
    accessToken,
    `
      mutation SaveMonthlyBudget($input: SaveMonthlyBudgetInput!) {
        saveMonthlyBudget(input: $input) {
          ${BUDGET_FIELDS}
        }
      }
    `,
    { input },
  );

  if (!data.saveMonthlyBudget) {
    throw new Error('Failed to save monthly budget');
  }

  return data.saveMonthlyBudget;
}
