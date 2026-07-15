type DashboardAlertsProps = {
  error: string | null;
  success: string | null;
};

export function DashboardAlerts({ error, success }: DashboardAlertsProps) {
  return (
    <>
      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {success}
        </div>
      )}
    </>
  );
}
