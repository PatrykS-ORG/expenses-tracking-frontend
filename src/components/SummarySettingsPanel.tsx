import type { FormEvent } from 'react';
import type {
  SummaryCurrency,
  SummaryEmailLanguage,
} from '../services/onboarding.service';

type SummarySettingsPanelProps = {
  busy: boolean;
  activeTemplateId: string | null;
  enabled: boolean;
  day: number;
  hour: number;
  timezone: string;
  emailLanguage: SummaryEmailLanguage;
  currency: SummaryCurrency;
  nextSummaryAt: string | null;
  timezones: string[];
  currencies: SummaryCurrency[];
  onEnabledChange: (value: boolean) => void;
  onDayChange: (value: number) => void;
  onHourChange: (value: number) => void;
  onTimezoneChange: (value: string) => void;
  onEmailLanguageChange: (value: SummaryEmailLanguage) => void;
  onCurrencyChange: (value: SummaryCurrency) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSendNow: () => void;
  summaryTitle: string;
  summaryEnabledLabel: string;
  summaryDayLabel: string;
  summaryHourLabel: string;
  summaryTimezoneLabel: string;
  summaryEmailLanguageLabel: string;
  currencyLabel: string;
  summaryNextSendLabel: string;
  saveLabel: string;
  sendSummaryNowTitle: string;
  sendSummaryNowDescription: string;
  sendingLabel: string;
  sendLabel: string;
};

export function SummarySettingsPanel({
  busy,
  activeTemplateId,
  enabled,
  day,
  hour,
  timezone,
  emailLanguage,
  currency,
  nextSummaryAt,
  timezones,
  currencies,
  onEnabledChange,
  onDayChange,
  onHourChange,
  onTimezoneChange,
  onEmailLanguageChange,
  onCurrencyChange,
  onSubmit,
  onSendNow,
  summaryTitle,
  summaryEnabledLabel,
  summaryDayLabel,
  summaryHourLabel,
  summaryTimezoneLabel,
  summaryEmailLanguageLabel,
  currencyLabel,
  summaryNextSendLabel,
  saveLabel,
  sendSummaryNowTitle,
  sendSummaryNowDescription,
  sendingLabel,
  sendLabel,
}: SummarySettingsPanelProps) {
  return (
    <section className="space-y-4 rounded-lg border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">{summaryTitle}</h2>
      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={enabled}
            disabled={!activeTemplateId}
            onChange={(event) => onEnabledChange(event.target.checked)}
          />
          {summaryEnabledLabel}
        </label>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-sm">
            {summaryDayLabel}
            <input
              type="number"
              min={1}
              max={28}
              value={day}
              onChange={(event) => onDayChange(Number(event.target.value))}
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </label>
          <label className="text-sm">
            {summaryHourLabel}
            <input
              type="number"
              min={0}
              max={23}
              value={hour}
              onChange={(event) => onHourChange(Number(event.target.value))}
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </label>
          <label className="text-sm">
            {summaryTimezoneLabel}
            <select
              value={timezone}
              onChange={(event) => onTimezoneChange(event.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2"
            >
              {timezones.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            {summaryEmailLanguageLabel}
            <select
              value={emailLanguage}
              onChange={(event) =>
                onEmailLanguageChange(
                  event.target.value as SummaryEmailLanguage,
                )
              }
              className="mt-1 w-full rounded-md border px-3 py-2"
            >
              <option value="PL">PL</option>
              <option value="EN">EN</option>
            </select>
          </label>
          <label className="text-sm">
            {currencyLabel}
            <select
              value={currency}
              onChange={(event) =>
                onCurrencyChange(event.target.value as SummaryCurrency)
              }
              className="mt-1 w-full rounded-md border px-3 py-2"
            >
              {currencies.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>
        {nextSummaryAt && (
          <p className="text-xs text-gray-500">
            {summaryNextSendLabel}: {new Date(nextSummaryAt).toLocaleString()}
          </p>
        )}
        <button
          disabled={busy}
          className="rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {saveLabel}
        </button>
      </form>
      <div className="space-y-2 border-t pt-4">
        <h3 className="text-sm font-medium text-gray-700">
          {sendSummaryNowTitle}
        </h3>
        <p className="text-sm text-gray-500">{sendSummaryNowDescription}</p>
        <button
          type="button"
          disabled={busy || !activeTemplateId}
          onClick={onSendNow}
          className="rounded-md bg-emerald-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {busy ? sendingLabel : sendLabel}
        </button>
      </div>
    </section>
  );
}
