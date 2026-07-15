type SettingsAlertsProps = {
  error: string | null;
  success: string | null;
};

export function SettingsAlerts({ error, success }: SettingsAlertsProps) {
  return (
    <>
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {success}
        </div>
      )}
    </>
  );
}
