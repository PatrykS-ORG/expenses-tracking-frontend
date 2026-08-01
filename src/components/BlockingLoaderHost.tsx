import { useEffect, useState } from 'react';
import { useBlocker } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useBlockingLoaderStore } from '../store/useBlockingLoaderStore';

export function BlockingLoaderHost() {
  const { t } = useTranslation();
  const isActive = useBlockingLoaderStore((state) => state.isActive);
  const message = useBlockingLoaderStore((state) => state.message);
  const reset = useBlockingLoaderStore((state) => state.reset);
  const [leavePromptOpen, setLeavePromptOpen] = useState(false);

  const blocker = useBlocker(isActive);

  useEffect(() => {
    if (!isActive) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isActive]);

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setLeavePromptOpen(true);
    }
  }, [blocker.state]);

  useEffect(() => {
    if (!isActive) {
      setLeavePromptOpen(false);
    }
  }, [isActive]);

  const handleStay = () => {
    setLeavePromptOpen(false);
    if (blocker.state === 'blocked') {
      blocker.reset();
    }
  };

  const handleLeave = () => {
    setLeavePromptOpen(false);
    reset();
    if (blocker.state === 'blocked') {
      blocker.proceed();
    }
  };

  if (!isActive && !leavePromptOpen) {
    return null;
  }

  return (
    <>
      {isActive && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40"
          role="alertdialog"
          aria-busy="true"
          aria-live="assertive"
          aria-label={message ?? t('common.pleaseWait')}
        >
          <div className="flex flex-col items-center gap-3 rounded-lg bg-white px-6 py-5 shadow-lg">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <p className="text-sm font-medium text-gray-800">
              {message ?? t('common.pleaseWait')}
            </p>
            <p className="text-xs text-gray-500">{t('common.doNotCloseTab')}</p>
          </div>
        </div>
      )}

      {leavePromptOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-gray-900/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-confirm-title"
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
          >
            <h2
              id="leave-confirm-title"
              className="text-lg font-semibold text-gray-900"
            >
              {t('common.leaveWhileLoadingTitle')}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {t('common.leaveWhileLoadingBody')}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleStay}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {t('common.stay')}
              </button>
              <button
                type="button"
                onClick={handleLeave}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                {t('common.leaveAnyway')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
