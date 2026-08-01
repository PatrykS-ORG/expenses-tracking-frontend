import { useCallback, useEffect, useState } from 'react';
import { ScanSearch, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { featureFlags } from '../lib/featureFlags';
import {
  getCurrentExpenseFile,
  getTemplateDashboard,
  overwriteCurrentExpenseFile,
  updateDataSource,
  uploadExpenseFile,
  type DataSourceType,
} from '../services/onboarding.service';
import { useAuthStore } from '../store/useAuthStore';
import { runWithBlockingLoader } from '../store/useBlockingLoaderStore';

export function ExpenseSourcePanel() {
  const { t } = useTranslation();
  const token = useAuthStore((state) => state.session?.access_token);
  const [dataSourceType, setDataSourceType] =
    useState<DataSourceType>('FILE_UPLOAD');
  const [nextcloudPath, setNextcloudPath] = useState('');
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [savedContent, setSavedContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const refreshDashboardMeta = useCallback(async () => {
    if (!token) return;
    const dashboard = await getTemplateDashboard(token);
    setDataSourceType(dashboard.dataSourceType);
    setNextcloudPath(dashboard.nextcloudFilePath ?? '');
    setUploadedFilePath(dashboard.uploadedFilePath);
    return dashboard;
  }, [token]);

  const load = useCallback(async () => {
    if (!token) return;
    const dashboard = await refreshDashboardMeta();
    if (!dashboard?.uploadedFilePath) return;
    const file = await getCurrentExpenseFile(token);
    setFileContent(file.content);
    setSavedContent(file.content);
  }, [refreshDashboardMeta, token]);

  useEffect(() => {
    void load().catch((loadError) =>
      setError(
        loadError instanceof Error
          ? loadError.message
          : t('dashboard.fetchFileError'),
      ),
    );
  }, [load, t]);

  const run = async (action: () => Promise<void>, message: string) => {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await runWithBlockingLoader(action, t('common.processing'));
      setSuccess(message);
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : t('dashboard.dataSourceSaveError'),
      );
    } finally {
      setBusy(false);
    }
  };

  const selectSource = (type: DataSourceType) => {
    setDataSourceType(type);
    if (type === 'FILE_UPLOAD' && uploadedFilePath && token) {
      void run(async () => {
        await updateDataSource(token, 'FILE_UPLOAD');
        await load();
      }, t('dashboard.switchedToUpload'));
    }
  };

  return (
    <section
      id="expense-source"
      className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {t('dashboard.dataSourceTitle')}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {featureFlags.nextcloud
              ? t('dashboard.dataSourceDesc')
              : t('dashboard.dataSourceDescUploadOnly')}
          </p>
        </div>
        <Link
          to="/receipt-scan"
          className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
        >
          <ScanSearch className="h-4 w-4" />
          {t('dashboard.scanReceipt')}
        </Link>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {featureFlags.nextcloud && (
        <div className="mt-4 flex gap-2">
          {(['FILE_UPLOAD', 'NEXTCLOUD'] as DataSourceType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => selectSource(type)}
              className={`rounded-md border px-3 py-2 text-sm ${
                dataSourceType === type
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : ''
              }`}
            >
              {type === 'FILE_UPLOAD' ? t('dashboard.uploadFile') : 'Nextcloud'}
            </button>
          ))}
        </div>
      )}

      {dataSourceType === 'NEXTCLOUD' && featureFlags.nextcloud ? (
        <form
          className="mt-4 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void run(async () => {
              if (!token) return;
              await updateDataSource(token, 'NEXTCLOUD', nextcloudPath);
              await load();
            }, t('dashboard.nextcloudSaved'));
          }}
        >
          <input
            value={nextcloudPath}
            onChange={(event) => setNextcloudPath(event.target.value)}
            placeholder="/shared/expenses/2026-07.txt"
            className="w-full rounded-md border px-3 py-2"
          />
          <button
            disabled={busy || !nextcloudPath.trim()}
            className="rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {t('common.save')}
          </button>
        </form>
      ) : (
        <div className="mt-4 space-y-3">
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                if (!token || !selectedFile) return;
                const uploadedText = await selectedFile.text();
                await uploadExpenseFile(token, selectedFile);
                setSelectedFile(null);
                setFileContent(uploadedText);
                setSavedContent(uploadedText);
                await refreshDashboardMeta();
              }, t('dashboard.fileUploaded'));
            }}
          >
            <input
              type="file"
              accept=".txt,.csv,text/plain,text/csv"
              onChange={(event) =>
                setSelectedFile(event.target.files?.[0] ?? null)
              }
              className="w-full rounded-md border px-3 py-2"
            />
            <button
              disabled={busy || !selectedFile}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              {t('common.upload')}
            </button>
          </form>
          {uploadedFilePath && (
            <p className="text-xs text-gray-500">
              {t('dashboard.currentFile')} {uploadedFilePath}
            </p>
          )}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                if (!token || !fileContent.trim()) return;
                const contentToSave = fileContent;
                await overwriteCurrentExpenseFile(
                  token,
                  contentToSave,
                  uploadedFilePath,
                );
                // Keep local content — a storage re-fetch can return a stale cached copy.
                setFileContent(contentToSave);
                setSavedContent(contentToSave);
                await refreshDashboardMeta();
              }, t('dashboard.expenseFileSaved'));
            }}
          >
            <p className="mb-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
              {t('dashboard.expenseFileFormatHint')}
            </p>
            <textarea
              value={fileContent}
              onChange={(event) => setFileContent(event.target.value)}
              rows={12}
              placeholder={t('dashboard.expenseTextareaPlaceholder')}
              className="w-full rounded-md border px-3 py-2 font-mono text-sm"
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-xs text-gray-500">
                {fileContent !== savedContent
                  ? t('dashboard.unsavedFileChanges')
                  : t('dashboard.fileSaved')}
              </p>
              <button
                disabled={
                  busy || !fileContent.trim() || fileContent === savedContent
                }
                className="rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
              >
                {t('common.save')}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
