import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ImagePlus, Save, ScanSearch } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import {
  approveReceiptExpenses,
  scanReceipt,
} from '../services/onboarding.service';
import { runWithBlockingLoader } from '../store/useBlockingLoaderStore';

export function ReceiptScanner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { session } = useAuthStore();
  const [selectedReceiptFile, setSelectedReceiptFile] = useState<File | null>(
    null,
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [lastScannedText, setLastScannedText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedReceiptFile) {
      setPreviewUrl(null);
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(selectedReceiptFile);
    setPreviewUrl(nextPreviewUrl);
    return () => URL.revokeObjectURL(nextPreviewUrl);
  }, [selectedReceiptFile]);

  const hasUnsavedReceiptChanges = useMemo(
    () => extractedText.trim().length > 0 && extractedText !== lastScannedText,
    [extractedText, lastScannedText],
  );

  const handleScanReceipt = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session?.access_token || !selectedReceiptFile) {
      return;
    }

    setError(null);
    setSuccess(null);
    setIsScanning(true);
    try {
      const { extractedText: nextExtractedText } = await runWithBlockingLoader(
        () => scanReceipt(session.access_token, selectedReceiptFile),
        t('receiptScanner.scanning'),
      );
      setExtractedText(nextExtractedText);
      setLastScannedText(nextExtractedText);
      if (nextExtractedText === 'NO_EXPENSES_FOUND') {
        setSuccess(t('receiptScanner.noExpensesFound'));
      } else {
        setSuccess(t('receiptScanner.expensesRead'));
      }
    } catch (scanError) {
      const message =
        scanError instanceof Error
          ? scanError.message
          : t('receiptScanner.scanError');
      setError(message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleApproveReceipt = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!session?.access_token) {
      return;
    }

    setError(null);
    setSuccess(null);
    setIsApproving(true);
    try {
      await runWithBlockingLoader(
        () => approveReceiptExpenses(session.access_token, extractedText),
        t('common.saving'),
      );
      navigate('/');
    } catch (approveError) {
      const message =
        approveError instanceof Error
          ? approveError.message
          : t('receiptScanner.saveError');
      setError(message);
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div>
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {t('receiptScanner.title')}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {t('receiptScanner.subtitle')}
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('common.backToDashboardShort')}
          </Link>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('receiptScanner.step1Title')}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {t('receiptScanner.step1Desc')}
          </p>
          <form onSubmit={handleScanReceipt} className="mt-4 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setSelectedReceiptFile(file);
                  setExtractedText('');
                  setLastScannedText('');
                  setError(null);
                  setSuccess(null);
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={isScanning || !selectedReceiptFile}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ScanSearch className="h-4 w-4" />
                {isScanning
                  ? t('receiptScanner.scanning')
                  : t('receiptScanner.scanButton')}
              </button>
            </div>

            <div className="overflow-hidden rounded-md border border-gray-200 bg-gray-50">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={t('receiptScanner.previewAlt')}
                  className="max-h-[420px] w-full object-contain"
                />
              ) : (
                <div className="flex h-44 items-center justify-center text-sm text-gray-500">
                  <span className="inline-flex items-center gap-2">
                    <ImagePlus className="h-4 w-4" />
                    {t('receiptScanner.selectFileHint')}
                  </span>
                </div>
              )}
            </div>
          </form>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('receiptScanner.step2Title')}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {t('receiptScanner.step2Desc')}
          </p>

          <form onSubmit={handleApproveReceipt} className="mt-4 space-y-3">
            <textarea
              value={extractedText}
              onChange={(event) => setExtractedText(event.target.value)}
              rows={12}
              placeholder={t('receiptScanner.textareaPlaceholder')}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p
                className={`text-xs ${hasUnsavedReceiptChanges ? 'text-amber-700' : 'text-gray-500'}`}
              >
                {hasUnsavedReceiptChanges
                  ? t('receiptScanner.unsavedChanges')
                  : t('receiptScanner.readyToApprove')}
              </p>
              <button
                type="submit"
                disabled={isApproving || !extractedText.trim()}
                className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {isApproving ? t('common.saving') : t('receiptScanner.approve')}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
