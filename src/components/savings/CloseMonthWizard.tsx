import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { EventForm } from './EventForm';
import { EventTabs } from './EventTabs';
import { ItemForm } from './ItemForm';
import {
  formatCentsAsCurrency,
  centsToAmountString,
  amountStringToCents,
} from '../../lib/money';
import { formatPeriodLabel } from '../../lib/period';
import { closeMonth } from '../../services/monthClose.service';
import {
  createSavingsGoalEvent,
  createSavingsGoalItem,
  getMySavingsGoals,
} from '../../services/savingsGoals.service';
import type { SummaryCurrency } from '../../services/onboarding.service';
import {
  clampAllocationInput,
  isValidAllocationAmount,
  remainingToAllocate,
  type MonthCloseAllocationDraft,
  type MonthClosureStatus,
} from '../../types/monthClose.types';
import {
  emptySavingsGoalEventForm,
  emptySavingsGoalItemForm,
  eventFormToCreateInput,
  itemFormToCreateInput,
  type SavingsGoalEvent,
  type SavingsGoalEventForm,
  type SavingsGoalItemForm,
} from '../../types/savingsGoals.types';

const ERROR_CODES = [
  'MONTH_NOT_CLOSED',
  'AMOUNT_MISMATCH',
  'CURRENCY_MISMATCH',
  'PERIOD_MISMATCH',
  'ALREADY_CLOSED',
  'EMPTY_ALLOCATIONS',
] as const;

type CloseMonthWizardProps = {
  token: string;
  status: MonthClosureStatus;
  locale: string;
  onDismiss: () => void;
  onClosed: () => void;
};

export function CloseMonthWizard({
  token,
  status,
  locale,
  onDismiss,
  onClosed,
}: CloseMonthWizardProps) {
  const { t } = useTranslation();
  const [events, setEvents] = useState<SavingsGoalEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [allocations, setAllocations] = useState<MonthCloseAllocationDraft[]>(
    [],
  );
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [creatingItem, setCreatingItem] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remainingCents = remainingToAllocate(
    status.freeSavingsCents,
    allocations,
  );
  const compatibleEvents = useMemo(
    () => events.filter((event) => event.currency === status.currency),
    [events, status.currency],
  );
  const disabledIds = useMemo(
    () =>
      new Set(
        events
          .filter((event) => event.currency !== status.currency)
          .map((event) => event.id),
      ),
    [events, status.currency],
  );
  const selectedEvent =
    compatibleEvents.find((event) => event.id === selectedEventId) ?? null;
  const selectedItem =
    selectedEvent?.items.find((item) => item.id === selectedItemId) ?? null;

  const mapError = useCallback(
    (cause: unknown) => {
      const message = cause instanceof Error ? cause.message : '';
      if (ERROR_CODES.includes(message as (typeof ERROR_CODES)[number])) {
        return t(`monthClose.errors.${message}`);
      }
      return t('monthClose.closeError');
    },
    [t],
  );

  const loadEvents = useCallback(async () => {
    const rows = await getMySavingsGoals(token);
    setEvents(rows);
    return rows;
  }, [token]);

  useEffect(() => {
    void loadEvents()
      .then((rows) => {
        const firstCompatible = rows.find(
          (event) => event.currency === status.currency,
        );
        setSelectedEventId(firstCompatible?.id ?? null);
        setSelectedItemId(firstCompatible?.items[0]?.id ?? null);
      })
      .catch((loadError) => setError(mapError(loadError)))
      .finally(() => setLoading(false));
  }, [loadEvents, mapError, status.currency]);

  useEffect(() => {
    if (remainingCents > 0) {
      setAmount(centsToAmountString(remainingCents));
    } else {
      setAmount('');
    }
  }, [remainingCents, selectedItemId]);

  const handleSelectEvent = (id: string) => {
    setSelectedEventId(id);
    const event = events.find((row) => row.id === id);
    setSelectedItemId(event?.items[0]?.id ?? null);
    setCreatingEvent(false);
    setCreatingItem(false);
  };

  const handleCreateEvent = async (form: SavingsGoalEventForm) => {
    setBusy(true);
    setError(null);
    try {
      const created = await createSavingsGoalEvent(token, {
        ...eventFormToCreateInput(form),
        currency: status.currency,
      });
      const rows = await loadEvents();
      setCreatingEvent(false);
      setSelectedEventId(created.id);
      const fresh = rows.find((event) => event.id === created.id);
      setSelectedItemId(fresh?.items[0]?.id ?? null);
    } catch (cause) {
      setError(mapError(cause));
    } finally {
      setBusy(false);
    }
  };

  const handleCreateItem = async (form: SavingsGoalItemForm) => {
    if (!selectedEventId) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await createSavingsGoalItem(
        token,
        selectedEventId,
        itemFormToCreateInput(form),
      );
      const rows = await loadEvents();
      setCreatingItem(false);
      setSelectedEventId(updated.id);
      const fresh = rows.find((event) => event.id === updated.id);
      const lastItem = fresh?.items[fresh.items.length - 1];
      setSelectedItemId(lastItem?.id ?? null);
    } catch (cause) {
      setError(mapError(cause));
    } finally {
      setBusy(false);
    }
  };

  const handleAmountChange = (value: string) => {
    setAmount(clampAllocationInput(value, remainingCents));
    setError(null);
  };

  const handleAddAllocation = () => {
    if (!selectedEvent || !selectedItem) return;
    const amountCents = amountStringToCents(amount);
    if (!isValidAllocationAmount(amountCents, remainingCents)) {
      setError(t('monthClose.invalidAmount'));
      return;
    }
    setAllocations((current) => [
      ...current,
      {
        id: `${selectedItem.id}-${current.length}`,
        itemId: selectedItem.id,
        eventId: selectedEvent.id,
        eventName: selectedEvent.name,
        itemName: selectedItem.name,
        amountCents,
      },
    ]);
    setError(null);
  };

  const handleCloseMonth = async () => {
    if (remainingCents !== 0) return;
    setBusy(true);
    setError(null);
    try {
      await closeMonth(
        token,
        status.period,
        allocations.map((allocation) => ({
          itemId: allocation.itemId,
          amountCents: allocation.amountCents,
        })),
      );
      onClosed();
    } catch (cause) {
      setError(mapError(cause));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {t('monthClose.wizardTitle', {
                month: formatPeriodLabel(status.period, locale),
              })}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {t('monthClose.wizardSubtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
            aria-label={t('common.cancel')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          {t('monthClose.remaining', {
            amount: formatCentsAsCurrency(
              remainingCents,
              status.currency,
              locale,
            ),
          })}
        </div>

        {error && (
          <div className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {allocations.length > 0 && (
          <ul className="mt-4 space-y-2">
            {allocations.map((allocation) => (
              <li
                key={allocation.id}
                className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm"
              >
                <span>
                  {allocation.eventName} / {allocation.itemName}:{' '}
                  {formatCentsAsCurrency(
                    allocation.amountCents,
                    status.currency,
                    locale,
                  )}
                </span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    setAllocations((current) =>
                      current.filter((row) => row.id !== allocation.id),
                    )
                  }
                  className="text-red-600 hover:underline disabled:opacity-50"
                >
                  {t('common.delete')}
                </button>
              </li>
            ))}
          </ul>
        )}

        {loading ? (
          <div className="mt-6 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <EventTabs
              events={events}
              selectedId={selectedEventId}
              busy={busy}
              addLabel={t('savingsGoals.addEvent')}
              disabledIds={disabledIds}
              disabledTitle={t('monthClose.currencyMismatchHint', {
                currency: status.currency,
              })}
              onSelect={handleSelectEvent}
              onAdd={() => {
                setCreatingEvent(true);
                setCreatingItem(false);
              }}
            />

            {creatingEvent ? (
              <EventForm
                initial={emptySavingsGoalEventForm(status.currency)}
                currencies={[status.currency as SummaryCurrency]}
                busy={busy}
                submitLabel={t('savingsGoals.createEvent')}
                onSubmit={handleCreateEvent}
                onCancel={() => setCreatingEvent(false)}
              />
            ) : !selectedEvent ? (
              <p className="text-sm text-gray-600">
                {t('monthClose.noCompatibleEvents', {
                  currency: status.currency,
                })}
              </p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {selectedEvent.items.map((item) => {
                    const isActive = item.id === selectedItemId;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={busy}
                        onClick={() => setSelectedItemId(item.id)}
                        className={`rounded-md border px-3 py-2 text-left text-sm disabled:opacity-50 ${
                          isActive
                            ? 'border-blue-500 bg-blue-50 text-blue-800'
                            : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="block font-medium">{item.name}</span>
                        <span className="block text-xs text-gray-500">
                          {t('savingsGoals.progressLabel', {
                            saved: formatCentsAsCurrency(
                              item.savedCents,
                              status.currency,
                              locale,
                            ),
                            target: formatCentsAsCurrency(
                              item.targetAmountCents,
                              status.currency,
                              locale,
                            ),
                          })}
                        </span>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setCreatingItem(true)}
                    className="rounded-md px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
                  >
                    {t('savingsGoals.addItem')}
                  </button>
                </div>

                {creatingItem ? (
                  <ItemForm
                    initial={emptySavingsGoalItemForm()}
                    busy={busy}
                    submitLabel={t('savingsGoals.createItem')}
                    onSubmit={handleCreateItem}
                    onCancel={() => setCreatingItem(false)}
                  />
                ) : selectedItem ? (
                  <div className="space-y-2">
                    {isValidAllocationAmount(
                      amountStringToCents(amount),
                      remainingCents,
                    ) &&
                      amountStringToCents(amount) >
                        selectedItem.remainingCents &&
                      selectedItem.remainingCents >= 0 && (
                        <p className="text-xs text-amber-800">
                          {t('monthClose.overshootWarning')}
                        </p>
                      )}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                      <label className="min-w-0 flex-1 text-sm text-gray-700">
                        {t('monthClose.amountLabel')}
                        <input
                          type="text"
                          inputMode="decimal"
                          value={amount}
                          disabled={busy || remainingCents <= 0}
                          onChange={(event) =>
                            handleAmountChange(event.target.value)
                          }
                          className="mt-1 w-full rounded-md border px-3 py-2 disabled:bg-gray-50"
                        />
                      </label>
                      <button
                        type="button"
                        disabled={
                          busy ||
                          remainingCents <= 0 ||
                          !isValidAllocationAmount(
                            amountStringToCents(amount),
                            remainingCents,
                          )
                        }
                        onClick={handleAddAllocation}
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {t('monthClose.addAllocation')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">
                    {t('monthClose.noSubGoals')}
                  </p>
                )}
              </>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onDismiss}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            disabled={busy || remainingCents !== 0 || allocations.length === 0}
            onClick={() => void handleCloseMonth()}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {t('monthClose.closeButton')}
          </button>
        </div>
      </div>
    </div>
  );
}
