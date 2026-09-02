import type { FormEvent } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SavingsGoalItemForm } from '../../types/savingsGoals.types';

type ItemFormProps = {
  initial: SavingsGoalItemForm;
  busy?: boolean;
  submitLabel: string;
  onSubmit: (form: SavingsGoalItemForm) => void;
  onCancel: () => void;
};

export function ItemForm({
  initial,
  busy = false,
  submitLabel,
  onSubmit,
  onCancel,
}: ItemFormProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState(initial);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-200 bg-gray-50 p-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-gray-700 sm:col-span-2">
          {t('savingsGoals.itemNameLabel')}
          <input
            type="text"
            required
            maxLength={100}
            value={form.name}
            disabled={busy}
            onChange={(change) =>
              setForm({ ...form, name: change.target.value })
            }
            className="mt-1 w-full rounded-md border bg-white px-3 py-2 disabled:bg-gray-50"
            placeholder={t('savingsGoals.itemNamePlaceholder')}
          />
        </label>
        <label className="text-sm text-gray-700">
          {t('savingsGoals.itemAmountLabel')}
          <input
            type="text"
            inputMode="decimal"
            required
            value={form.amount}
            disabled={busy}
            onChange={(change) =>
              setForm({ ...form, amount: change.target.value })
            }
            className="mt-1 w-full rounded-md border bg-white px-3 py-2 disabled:bg-gray-50"
            placeholder="0.00"
          />
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
            className="mt-1 w-full rounded-md border bg-white px-3 py-2 disabled:bg-gray-50"
          />
        </label>
      </div>
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
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
          {t('common.cancel')}
        </button>
      </div>
    </form>
  );
}
