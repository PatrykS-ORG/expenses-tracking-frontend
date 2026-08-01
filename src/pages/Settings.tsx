import type { FormEvent } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import {
  deleteMyAccount,
  getSummarySchedule,
  getTemplateDashboard,
  sendSummaryNow,
  updateSummarySchedule,
  type SummaryCurrency,
  type SummaryEmailLanguage,
} from '../services/onboarding.service';
import { SettingsTabs, type SettingsTab } from '../components/SettingsTabs';
import { SettingsAlerts } from '../components/SettingsAlerts';
import { AccountSettingsPanel } from '../components/AccountSettingsPanel';
import { SummarySettingsPanel } from '../components/SummarySettingsPanel';
import { runWithBlockingLoader } from '../store/useBlockingLoaderStore';

const currencies: SummaryCurrency[] = [
  'PLN',
  'EUR',
  'USD',
  'GBP',
  'CHF',
  'CZK',
  'UAH',
];
const timezones = ['Europe/Warsaw', 'Europe/London', 'Europe/Berlin', 'UTC'];

export function Settings() {
  const { t } = useTranslation();
  const { user, session, signOut } = useAuthStore();
  const [tab, setTab] = useState<SettingsTab>('account');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [day, setDay] = useState(1);
  const [hour, setHour] = useState(8);
  const [timezone, setTimezone] = useState('Europe/Warsaw');
  const [emailLanguage, setEmailLanguage] =
    useState<SummaryEmailLanguage>('PL');
  const [currency, setCurrency] = useState<SummaryCurrency>('PLN');
  const [nextSummaryAt, setNextSummaryAt] = useState<string | null>(null);

  const token = session?.access_token;
  const primaryProvider = user?.app_metadata.provider as string | undefined;
  const hasOAuthIdentity =
    user?.identities?.some((identity) => identity.provider !== 'email') ??
    false;
  const isOAuthUser =
    hasOAuthIdentity ||
    (primaryProvider !== undefined && primaryProvider !== 'email');
  const notify = (message: string) => {
    setError(null);
    setSuccess(message);
  };
  const fail = useCallback(
    (value: unknown) => {
      setSuccess(null);
      setError(
        value instanceof Error ? value.message : t('settings.saveError'),
      );
    },
    [t],
  );

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      try {
        const [dashboard, schedule] = await Promise.all([
          getTemplateDashboard(token),
          getSummarySchedule(token),
        ]);
        setActiveTemplateId(dashboard.activeTemplateId);
        setEnabled(schedule.enabled);
        setDay(schedule.scheduleDay);
        setHour(schedule.scheduleHour);
        setTimezone(schedule.timezone);
        setEmailLanguage(schedule.emailLanguage);
        setCurrency(schedule.currency);
        setNextSummaryAt(schedule.nextSummaryAt);
      } catch (loadError) {
        fail(loadError);
      }
    };
    void load();
  }, [fail, token]);

  const run = async (action: () => Promise<void>, loaderMessage?: string) => {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await runWithBlockingLoader(action, loaderMessage);
    } catch (actionError) {
      fail(actionError);
    } finally {
      setBusy(false);
    }
  };

  const handlePasswordChangeSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void run(async () => {
      if (!user?.email || isOAuthUser) return;
      const { error: validationError } = await supabase.auth.signInWithPassword(
        {
          email: user.email,
          password: currentPassword,
        },
      );
      if (validationError) {
        throw new Error(t('settings.currentPasswordInvalid'));
      }
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;
      setCurrentPassword('');
      setNewPassword('');
      notify(t('settings.passwordUpdated'));
    }, t('common.saving'));
  };

  const handleDeleteAccount = () =>
    void run(async () => {
      if (!token) return;
      await deleteMyAccount(token);
      await signOut();
    }, t('common.processing'));

  const handleSummarySubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void run(async () => {
      if (!token) return;
      const result = await updateSummarySchedule(token, {
        enabled,
        scheduleDay: day,
        scheduleHour: hour,
        timezone,
        emailLanguage,
        currency,
        nextSummaryAt,
      });
      setNextSummaryAt(result.nextSummaryAt);
      notify(t('dashboard.summaryScheduleSaved'));
    }, t('common.saving'));
  };

  const handleSendSummaryNow = () =>
    void run(async () => {
      if (!token) return;
      await sendSummaryNow(token);
      notify(t('settings.summarySent'));
    }, t('common.sending'));

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-gray-900">
        {t('settings.title')}
      </h1>
      <p className="mt-1 text-sm text-gray-600">{t('settings.subtitle')}</p>
      <div className="mt-6 grid gap-6 md:grid-cols-[220px_1fr]">
        <SettingsTabs
          activeTab={tab}
          onTabChange={setTab}
          accountLabel={t('settings.account')}
          summaryLabel={t('settings.summary')}
        />
        <div className="space-y-4">
          <SettingsAlerts error={error} success={success} />

          {tab === 'account' && (
            <AccountSettingsPanel
              email={user?.email ?? null}
              isOAuthUser={isOAuthUser}
              busy={busy}
              currentPassword={currentPassword}
              newPassword={newPassword}
              deleteConfirmation={deleteConfirmation}
              onCurrentPasswordChange={setCurrentPassword}
              onNewPasswordChange={setNewPassword}
              onDeleteConfirmationChange={setDeleteConfirmation}
              onChangePasswordSubmit={handlePasswordChangeSubmit}
              onDeleteAccount={handleDeleteAccount}
              profileLabel={t('settings.profile')}
              emailLabel={t('auth.emailLabel')}
              oauthManagedAccountLabel={t('settings.oauthManagedAccount')}
              currentPasswordLabel={t('settings.currentPassword')}
              newPasswordLabel={t('settings.newPassword')}
              changePasswordLabel={t('settings.changePassword')}
              dangerZoneLabel={t('settings.dangerZone')}
              deleteDescriptionLabel={t('settings.deleteDescription', {
                email: user?.email,
              })}
              deleteAccountLabel={t('settings.deleteAccount')}
            />
          )}

          {tab === 'summary' && (
            <SummarySettingsPanel
              busy={busy}
              activeTemplateId={activeTemplateId}
              enabled={enabled}
              day={day}
              hour={hour}
              timezone={timezone}
              emailLanguage={emailLanguage}
              currency={currency}
              nextSummaryAt={nextSummaryAt}
              timezones={timezones}
              currencies={currencies}
              onEnabledChange={setEnabled}
              onDayChange={setDay}
              onHourChange={setHour}
              onTimezoneChange={setTimezone}
              onEmailLanguageChange={setEmailLanguage}
              onCurrencyChange={setCurrency}
              onSubmit={handleSummarySubmit}
              onSendNow={handleSendSummaryNow}
              summaryTitle={t('settings.summary')}
              summaryEnabledLabel={t('dashboard.summaryEnabledLabel')}
              summaryDayLabel={t('dashboard.summaryDayLabel')}
              summaryHourLabel={t('dashboard.summaryHourLabel')}
              summaryTimezoneLabel={t('dashboard.summaryTimezoneLabel')}
              summaryEmailLanguageLabel={t(
                'dashboard.summaryEmailLanguageLabel',
              )}
              currencyLabel={t('settings.currency')}
              summaryNextSendLabel={t('dashboard.summaryNextSendLabel')}
              saveLabel={t('common.save')}
              sendSummaryNowTitle={t('settings.sendSummaryNow')}
              sendSummaryNowDescription={t(
                'settings.sendSummaryNowDescription',
                {
                  email: user?.email,
                },
              )}
              sendingLabel={t('common.sending')}
              sendLabel={t('common.send')}
            />
          )}
        </div>
      </div>
    </main>
  );
}
