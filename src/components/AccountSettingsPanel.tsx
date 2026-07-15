import type { FormEvent } from 'react';
import { AlertTriangle } from 'lucide-react';

type AccountSettingsPanelProps = {
  email: string | null;
  isOAuthUser: boolean;
  busy: boolean;
  currentPassword: string;
  newPassword: string;
  deleteConfirmation: string;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onDeleteConfirmationChange: (value: string) => void;
  onChangePasswordSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDeleteAccount: () => void;
  profileLabel: string;
  emailLabel: string;
  oauthManagedAccountLabel: string;
  currentPasswordLabel: string;
  newPasswordLabel: string;
  changePasswordLabel: string;
  dangerZoneLabel: string;
  deleteDescriptionLabel: string;
  deleteAccountLabel: string;
};

export function AccountSettingsPanel({
  email,
  isOAuthUser,
  busy,
  currentPassword,
  newPassword,
  deleteConfirmation,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onDeleteConfirmationChange,
  onChangePasswordSubmit,
  onDeleteAccount,
  profileLabel,
  emailLabel,
  oauthManagedAccountLabel,
  currentPasswordLabel,
  newPasswordLabel,
  changePasswordLabel,
  dangerZoneLabel,
  deleteDescriptionLabel,
  deleteAccountLabel,
}: AccountSettingsPanelProps) {
  return (
    <>
      <section className="space-y-4 rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">{profileLabel}</h2>
        <div className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700">
          <span className="font-medium">{emailLabel}:</span> {email}
        </div>
        {isOAuthUser && (
          <p className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
            {oauthManagedAccountLabel}
          </p>
        )}
        <form
          className="space-y-3 border-t pt-4"
          onSubmit={onChangePasswordSubmit}
        >
          <label className="block text-sm">
            <span className="mb-1 block">{currentPasswordLabel}</span>
            <input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              disabled={busy || isOAuthUser}
              onChange={(event) => onCurrentPasswordChange(event.target.value)}
              className="w-full rounded-md border px-3 py-2 disabled:bg-gray-100"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block">{newPasswordLabel}</span>
            <input
              type="password"
              minLength={6}
              autoComplete="new-password"
              value={newPassword}
              disabled={busy || isOAuthUser}
              onChange={(event) => onNewPasswordChange(event.target.value)}
              className="w-full rounded-md border px-3 py-2 disabled:bg-gray-100"
            />
          </label>
          <button
            disabled={
              busy || isOAuthUser || !currentPassword || newPassword.length < 6
            }
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {changePasswordLabel}
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-red-200 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-red-700">
          <AlertTriangle className="h-5 w-5" />
          {dangerZoneLabel}
        </h2>
        <p className="mt-2 text-sm text-gray-600">{deleteDescriptionLabel}</p>
        <input
          value={deleteConfirmation}
          disabled={busy || isOAuthUser}
          onChange={(event) => onDeleteConfirmationChange(event.target.value)}
          className="mt-3 w-full rounded-md border border-red-200 px-3 py-2 disabled:bg-gray-100"
        />
        <button
          type="button"
          disabled={busy || isOAuthUser || deleteConfirmation !== email}
          onClick={onDeleteAccount}
          className="mt-3 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {deleteAccountLabel}
        </button>
      </section>
    </>
  );
}
