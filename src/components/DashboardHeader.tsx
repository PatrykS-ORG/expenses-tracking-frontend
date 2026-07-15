import { Link } from 'react-router-dom';

type DashboardHeaderProps = {
  title: string;
  subtitle: string;
  openSettingsLabel: string;
  showUploadSuccess: boolean;
  setupUploadSuccessLabel: string;
  dataSourceTitle: string;
};

export function DashboardHeader({
  title,
  subtitle,
  openSettingsLabel,
  showUploadSuccess,
  setupUploadSuccessLabel,
  dataSourceTitle,
}: DashboardHeaderProps) {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
        </div>
        <Link
          to="/settings"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {openSettingsLabel}
        </Link>
      </div>
      {showUploadSuccess && (
        <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
          {setupUploadSuccessLabel}{' '}
          <a className="font-semibold underline" href="#expense-source">
            {dataSourceTitle}
          </a>
        </div>
      )}
    </>
  );
}
