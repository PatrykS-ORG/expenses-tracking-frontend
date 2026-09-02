import type {
  AddSavingsGoalContributionInput,
  CreateSavingsGoalEventInput,
  CreateSavingsGoalItemInput,
  SavingsGoalEvent,
  UpdateSavingsGoalEventInput,
  UpdateSavingsGoalItemInput,
} from '../types/savingsGoals.types';

interface GraphQLError {
  message?: string;
}

interface GraphQLResponse<TData> {
  data?: TData;
  errors?: GraphQLError[];
}

const GRAPHQL_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000/graphql';

const SAVINGS_GOAL_FIELDS = `
  id
  name
  currency
  targetDate
  totalTargetCents
  totalSavedCents
  progressPercent
  createdAt
  updatedAt
  items {
    id
    name
    targetAmountCents
    targetDate
    sortOrder
    savedCents
    remainingCents
    progressPercent
    monthlySuggestionCents
    createdAt
    updatedAt
    contributions {
      id
      amountCents
      occurredOn
      note
      createdAt
    }
  }
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

function requireEvent(
  event: SavingsGoalEvent | null | undefined,
  message: string,
): SavingsGoalEvent {
  if (!event) {
    throw new Error(message);
  }
  return event;
}

export async function getMySavingsGoals(
  accessToken: string,
  signal?: AbortSignal,
): Promise<SavingsGoalEvent[]> {
  const data = await graphqlRequest<{ mySavingsGoals?: SavingsGoalEvent[] }>(
    accessToken,
    `
      query MySavingsGoals {
        mySavingsGoals {
          ${SAVINGS_GOAL_FIELDS}
        }
      }
    `,
    undefined,
    signal,
  );
  return data.mySavingsGoals ?? [];
}

export async function createSavingsGoalEvent(
  accessToken: string,
  input: CreateSavingsGoalEventInput,
): Promise<SavingsGoalEvent> {
  const data = await graphqlRequest<{
    createSavingsGoalEvent?: SavingsGoalEvent;
  }>(
    accessToken,
    `
      mutation CreateSavingsGoalEvent($input: CreateSavingsGoalEventInput!) {
        createSavingsGoalEvent(input: $input) {
          ${SAVINGS_GOAL_FIELDS}
        }
      }
    `,
    { input },
  );
  return requireEvent(data.createSavingsGoalEvent, 'Failed to create event');
}

export async function updateSavingsGoalEvent(
  accessToken: string,
  id: string,
  input: UpdateSavingsGoalEventInput,
): Promise<SavingsGoalEvent> {
  const data = await graphqlRequest<{
    updateSavingsGoalEvent?: SavingsGoalEvent;
  }>(
    accessToken,
    `
      mutation UpdateSavingsGoalEvent(
        $id: String!
        $input: UpdateSavingsGoalEventInput!
      ) {
        updateSavingsGoalEvent(id: $id, input: $input) {
          ${SAVINGS_GOAL_FIELDS}
        }
      }
    `,
    { id, input },
  );
  return requireEvent(data.updateSavingsGoalEvent, 'Failed to update event');
}

export async function deleteSavingsGoalEvent(
  accessToken: string,
  id: string,
): Promise<boolean> {
  const data = await graphqlRequest<{ deleteSavingsGoalEvent?: boolean }>(
    accessToken,
    `
      mutation DeleteSavingsGoalEvent($id: String!) {
        deleteSavingsGoalEvent(id: $id)
      }
    `,
    { id },
  );
  return data.deleteSavingsGoalEvent === true;
}

export async function createSavingsGoalItem(
  accessToken: string,
  eventId: string,
  input: CreateSavingsGoalItemInput,
): Promise<SavingsGoalEvent> {
  const data = await graphqlRequest<{
    createSavingsGoalItem?: SavingsGoalEvent;
  }>(
    accessToken,
    `
      mutation CreateSavingsGoalItem(
        $eventId: String!
        $input: CreateSavingsGoalItemInput!
      ) {
        createSavingsGoalItem(eventId: $eventId, input: $input) {
          ${SAVINGS_GOAL_FIELDS}
        }
      }
    `,
    { eventId, input },
  );
  return requireEvent(data.createSavingsGoalItem, 'Failed to create sub-goal');
}

export async function updateSavingsGoalItem(
  accessToken: string,
  id: string,
  input: UpdateSavingsGoalItemInput,
): Promise<SavingsGoalEvent> {
  const data = await graphqlRequest<{
    updateSavingsGoalItem?: SavingsGoalEvent;
  }>(
    accessToken,
    `
      mutation UpdateSavingsGoalItem(
        $id: String!
        $input: UpdateSavingsGoalItemInput!
      ) {
        updateSavingsGoalItem(id: $id, input: $input) {
          ${SAVINGS_GOAL_FIELDS}
        }
      }
    `,
    { id, input },
  );
  return requireEvent(data.updateSavingsGoalItem, 'Failed to update sub-goal');
}

export async function deleteSavingsGoalItem(
  accessToken: string,
  id: string,
): Promise<SavingsGoalEvent> {
  const data = await graphqlRequest<{
    deleteSavingsGoalItem?: SavingsGoalEvent;
  }>(
    accessToken,
    `
      mutation DeleteSavingsGoalItem($id: String!) {
        deleteSavingsGoalItem(id: $id) {
          ${SAVINGS_GOAL_FIELDS}
        }
      }
    `,
    { id },
  );
  return requireEvent(data.deleteSavingsGoalItem, 'Failed to delete sub-goal');
}

export async function addSavingsGoalContribution(
  accessToken: string,
  itemId: string,
  input: AddSavingsGoalContributionInput,
): Promise<SavingsGoalEvent> {
  const data = await graphqlRequest<{
    addSavingsGoalContribution?: SavingsGoalEvent;
  }>(
    accessToken,
    `
      mutation AddSavingsGoalContribution(
        $itemId: String!
        $input: AddSavingsGoalContributionInput!
      ) {
        addSavingsGoalContribution(itemId: $itemId, input: $input) {
          ${SAVINGS_GOAL_FIELDS}
        }
      }
    `,
    { itemId, input },
  );
  return requireEvent(
    data.addSavingsGoalContribution,
    'Failed to add contribution',
  );
}

export async function deleteSavingsGoalContribution(
  accessToken: string,
  id: string,
): Promise<SavingsGoalEvent> {
  const data = await graphqlRequest<{
    deleteSavingsGoalContribution?: SavingsGoalEvent;
  }>(
    accessToken,
    `
      mutation DeleteSavingsGoalContribution($id: String!) {
        deleteSavingsGoalContribution(id: $id) {
          ${SAVINGS_GOAL_FIELDS}
        }
      }
    `,
    { id },
  );
  return requireEvent(
    data.deleteSavingsGoalContribution,
    'Failed to delete contribution',
  );
}
