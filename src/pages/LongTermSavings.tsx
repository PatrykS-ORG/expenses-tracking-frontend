import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardAlerts } from '../components/DashboardAlerts';
import { EventForm } from '../components/savings/EventForm';
import { EventPanel } from '../components/savings/EventPanel';
import { EventTabs } from '../components/savings/EventTabs';
import { ItemForm } from '../components/savings/ItemForm';
import { SubGoalCard } from '../components/savings/SubGoalCard';
import {
  getSummarySchedule,
  type SummaryCurrency,
} from '../services/onboarding.service';
import {
  addSavingsGoalContribution,
  createSavingsGoalEvent,
  createSavingsGoalItem,
  deleteSavingsGoalContribution,
  deleteSavingsGoalEvent,
  deleteSavingsGoalItem,
  getMySavingsGoals,
  updateSavingsGoalEvent,
  updateSavingsGoalItem,
} from '../services/savingsGoals.service';
import { useAuthStore } from '../store/useAuthStore';
import { runWithBlockingLoader } from '../store/useBlockingLoaderStore';
import {
  contributionFormToInput,
  emptySavingsGoalEventForm,
  emptySavingsGoalItemForm,
  eventFormToCreateInput,
  eventFormToUpdateInput,
  eventToForm,
  itemFormToCreateInput,
  itemFormToUpdateInput,
  itemToForm,
  type SavingsGoalContributionForm,
  type SavingsGoalEvent,
  type SavingsGoalEventForm,
  type SavingsGoalItemForm,
} from '../types/savingsGoals.types';

const CURRENCIES: SummaryCurrency[] = [
  'PLN',
  'EUR',
  'USD',
  'GBP',
  'CHF',
  'CZK',
  'UAH',
];

function replaceEvent(
  events: SavingsGoalEvent[],
  updated: SavingsGoalEvent,
): SavingsGoalEvent[] {
  const exists = events.some((event) => event.id === updated.id);
  if (!exists) {
    return [...events, updated];
  }
  return events.map((event) => (event.id === updated.id ? updated : event));
}

export function LongTermSavings() {
  const { t, i18n } = useTranslation();
  const { session } = useAuthStore();
  const token = session?.access_token;
  const locale = i18n.resolvedLanguage ?? 'pl';

  const [events, setEvents] = useState<SavingsGoalEvent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [defaultCurrency, setDefaultCurrency] =
    useState<SummaryCurrency>('PLN');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState(false);
  const [creatingItem, setCreatingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedId) ?? null,
    [events, selectedId],
  );
  const editingItem = selectedEvent?.items.find(
    (item) => item.id === editingItemId,
  );

  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();

    const bootstrap = async () => {
      setLoading(true);
      setError(null);
      try {
        const [nextEvents, schedule] = await Promise.all([
          getMySavingsGoals(token, controller.signal),
          getSummarySchedule(token, controller.signal),
        ]);
        if (controller.signal.aborted) return;
        setEvents(nextEvents);
        setDefaultCurrency(schedule.currency);
        setSelectedId((current) => {
          if (current && nextEvents.some((event) => event.id === current)) {
            return current;
          }
          return nextEvents[0]?.id ?? null;
        });
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : t('savingsGoals.loadError'),
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void bootstrap();
    return () => controller.abort();
  }, [t, token]);

  const runMutation = async (
    action: () => Promise<void>,
    successKey: string,
  ): Promise<boolean> => {
    if (!token) return false;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await runWithBlockingLoader(action, t('common.saving'));
      setSuccess(t(successKey));
      return true;
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : t('savingsGoals.saveError'),
      );
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleCreateEvent = (form: SavingsGoalEventForm) => {
    void runMutation(async () => {
      if (!token) return;
      const created = await createSavingsGoalEvent(
        token,
        eventFormToCreateInput(form),
      );
      setEvents((current) => replaceEvent(current, created));
      setSelectedId(created.id);
      setCreatingEvent(false);
    }, 'savingsGoals.createSuccess');
  };

  const handleUpdateEvent = (form: SavingsGoalEventForm) => {
    if (!selectedId) return;
    void runMutation(async () => {
      if (!token) return;
      const updated = await updateSavingsGoalEvent(
        token,
        selectedId,
        eventFormToUpdateInput(form),
      );
      setEvents((current) => replaceEvent(current, updated));
      setEditingEvent(false);
    }, 'savingsGoals.updateSuccess');
  };

  const handleDeleteEvent = () => {
    if (!selectedEvent) return;
    if (
      !window.confirm(
        t('savingsGoals.deleteEventConfirm', { name: selectedEvent.name }),
      )
    ) {
      return;
    }
    void runMutation(async () => {
      if (!token) return;
      await deleteSavingsGoalEvent(token, selectedEvent.id);
      setEvents((current) =>
        current.filter((event) => event.id !== selectedEvent.id),
      );
      setSelectedId((currentId) => {
        if (currentId !== selectedEvent.id) {
          return currentId;
        }
        const remaining = events.filter(
          (event) => event.id !== selectedEvent.id,
        );
        return remaining[0]?.id ?? null;
      });
      setEditingEvent(false);
      setCreatingItem(false);
      setEditingItemId(null);
    }, 'savingsGoals.deleteSuccess');
  };

  const handleCreateItem = (form: SavingsGoalItemForm) => {
    if (!selectedId) return;
    void runMutation(async () => {
      if (!token) return;
      const updated = await createSavingsGoalItem(
        token,
        selectedId,
        itemFormToCreateInput(form),
      );
      setEvents((current) => replaceEvent(current, updated));
      setCreatingItem(false);
    }, 'savingsGoals.createSuccess');
  };

  const handleUpdateItem = (form: SavingsGoalItemForm) => {
    if (!editingItemId) return;
    void runMutation(async () => {
      if (!token) return;
      const updated = await updateSavingsGoalItem(
        token,
        editingItemId,
        itemFormToUpdateInput(form),
      );
      setEvents((current) => replaceEvent(current, updated));
      setEditingItemId(null);
    }, 'savingsGoals.updateSuccess');
  };

  const handleDeleteItem = (itemId: string, name: string) => {
    if (!window.confirm(t('savingsGoals.deleteItemConfirm', { name }))) {
      return;
    }
    void runMutation(async () => {
      if (!token) return;
      const updated = await deleteSavingsGoalItem(token, itemId);
      setEvents((current) => replaceEvent(current, updated));
      setEditingItemId((current) => (current === itemId ? null : current));
    }, 'savingsGoals.deleteSuccess');
  };

  const handleAddContribution = (
    itemId: string,
    form: SavingsGoalContributionForm,
  ) => {
    return runMutation(async () => {
      if (!token) return;
      const updated = await addSavingsGoalContribution(
        token,
        itemId,
        contributionFormToInput(form),
      );
      setEvents((current) => replaceEvent(current, updated));
    }, 'savingsGoals.createSuccess');
  };

  const handleDeleteContribution = (id: string) => {
    if (!window.confirm(t('savingsGoals.deleteContributionConfirm'))) {
      return;
    }
    void runMutation(async () => {
      if (!token) return;
      const updated = await deleteSavingsGoalContribution(token, id);
      setEvents((current) => replaceEvent(current, updated));
    }, 'savingsGoals.deleteSuccess');
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-gray-900">
        {t('savingsGoals.title')}
      </h1>
      <p className="mt-1 text-sm text-gray-600">{t('savingsGoals.subtitle')}</p>

      <DashboardAlerts error={error} success={success} />

      <div className="mt-6">
        <EventTabs
          events={events}
          selectedId={creatingEvent ? null : selectedId}
          busy={busy}
          addLabel={t('savingsGoals.addEvent')}
          onSelect={(id) => {
            setSelectedId(id);
            setCreatingEvent(false);
            setEditingEvent(false);
            setCreatingItem(false);
            setEditingItemId(null);
          }}
          onAdd={() => {
            setCreatingEvent(true);
            setEditingEvent(false);
            setCreatingItem(false);
            setEditingItemId(null);
          }}
        />
      </div>

      <div className="mt-6 space-y-4">
        {creatingEvent ? (
          <EventForm
            key="create-event"
            initial={emptySavingsGoalEventForm(defaultCurrency)}
            currencies={CURRENCIES}
            busy={busy}
            submitLabel={t('savingsGoals.createEvent')}
            onSubmit={handleCreateEvent}
            onCancel={() => setCreatingEvent(false)}
          />
        ) : null}

        {!creatingEvent && selectedEvent && editingEvent ? (
          <EventForm
            key={`edit-event-${selectedEvent.id}`}
            initial={eventToForm(selectedEvent)}
            currencies={CURRENCIES}
            busy={busy}
            submitLabel={t('savingsGoals.saveEvent')}
            onSubmit={handleUpdateEvent}
            onCancel={() => setEditingEvent(false)}
          />
        ) : null}

        {!creatingEvent && selectedEvent && !editingEvent ? (
          <EventPanel
            event={selectedEvent}
            locale={locale}
            busy={busy}
            onEdit={() => {
              setEditingEvent(true);
              setCreatingItem(false);
              setEditingItemId(null);
            }}
            onDelete={handleDeleteEvent}
            onAddItem={() => {
              setCreatingItem(true);
              setEditingItemId(null);
            }}
            formSlot={
              creatingItem ? (
                <ItemForm
                  key="create-item"
                  initial={emptySavingsGoalItemForm()}
                  busy={busy}
                  submitLabel={t('savingsGoals.createItem')}
                  onSubmit={handleCreateItem}
                  onCancel={() => setCreatingItem(false)}
                />
              ) : null
            }
          >
            {selectedEvent.items.map((item) =>
              editingItemId === item.id && editingItem ? (
                <ItemForm
                  key={`edit-item-${item.id}`}
                  initial={itemToForm(editingItem)}
                  busy={busy}
                  submitLabel={t('savingsGoals.saveItem')}
                  onSubmit={handleUpdateItem}
                  onCancel={() => setEditingItemId(null)}
                />
              ) : (
                <SubGoalCard
                  key={item.id}
                  item={item}
                  currency={selectedEvent.currency}
                  locale={locale}
                  busy={busy}
                  onEdit={() => {
                    setCreatingItem(false);
                    setEditingItemId(item.id);
                  }}
                  onDelete={() => handleDeleteItem(item.id, item.name)}
                  onAddContribution={(form) =>
                    handleAddContribution(item.id, form)
                  }
                  onDeleteContribution={handleDeleteContribution}
                />
              ),
            )}
          </EventPanel>
        ) : null}

        {!creatingEvent && !selectedEvent ? (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-600">{t('savingsGoals.empty')}</p>
          </section>
        ) : null}
      </div>
    </main>
  );
}
