import type { FormEvent } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SummaryCurrency } from '../../services/onboarding.service';
import type { SavingsGoalEventForm } from '../../types/savingsGoals.types';

type EventFormProps = {
  initial: SavingsGoalEventForm;
  currencies: SummaryCurrency[];
  busy?: boolean;
  submitLabel: string;
  onSubmit: (form: SavingsGoalEventForm) => void;
  onCancel: () => void;
};

export function EventForm({
  initial,
  currencies,
  busy = false,
  submitLabel,
  onSubmit,
  onCancel,
}: EventFormProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState(initial);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-gray-700 sm:col-span-2">
          {t('savingsGoals.eventNameLabel')}
          <input
            type="text"
            required
            maxLength={100}
            value={form.name}
            disabled={busy}
            onChange={(change) =>
              setForm({ ...form, name: change.target.value })
            }
            className="mt-1 w-full rounded-md border px-3 py-2 disabled:bg-gray-50"
            placeholder={t('savingsGoals.eventNamePlaceholder')}
          />
        </label>
        <label className="text-sm text-gray-700">
          {t('savingsGoals.currencyLabel')}
          <select
            value={form.currency}
            disabled={busy}
            onChange={(change) =>
              setForm({ ...form, currency: change.target.value })
            }
            className="mt-1 w-full rounded-md border px-3 py-2 disabled:bg-gray-50"
          >
            {currencies.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-gray-700">
          {t('savingsGoals.targetDateLabel')}
          <input
            type="date"
            value={form.targetDate}
            disabled={busy}
            onChange={(change) =>
              setForm({ ...form, targetDate: change.target.value })
            }
            className="mt-1 w-full rounded-md border px-3 py-2 disabled:bg-gray-50"
          />
        </label>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        {t('savingsGoals.targetDateOptional')}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitLabel}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onCancel}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
          {t('common.cancel')}
        </button>
      </div>
    </form>
  );
}
