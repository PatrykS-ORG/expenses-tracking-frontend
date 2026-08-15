import { useEffect, useState } from 'react';
import { useBlocker } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useBlockingLoaderStore } from '../store/useBlockingLoaderStore';
import { useUnsavedChangesStore } from '../store/useUnsavedChangesStore';

type LeaveReason = 'loading' | 'unsaved' | null;

export function BlockingLoaderHost() {
  const { t } = useTranslation();
  const isActive = useBlockingLoaderStore((state) => state.isActive);
  const message = useBlockingLoaderStore((state) => state.message);
  const resetLoader = useBlockingLoaderStore((state) => state.reset);
  const hasUnsavedChanges = useUnsavedChangesStore(
    (state) => state.hasUnsavedChanges,
  );
  const [leavePromptOpen, setLeavePromptOpen] = useState(false);
  const [leaveReason, setLeaveReason] = useState<LeaveReason>(null);

  const shouldBlock = isActive || hasUnsavedChanges;
  const blocker = useBlocker(shouldBlock);

  useEffect(() => {
    if (!shouldBlock) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [shouldBlock]);

  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    setLeaveReason(isActive ? 'loading' : 'unsaved');
    setLeavePromptOpen(true);
  }, [blocker.state, isActive]);

  // Form was saved while the leave dialog was open — dismiss without navigating.
  useEffect(() => {
    if (shouldBlock || !leavePromptOpen) return;
    setLeavePromptOpen(false);
    setLeaveReason(null);
    if (blocker.state === 'blocked') {
      blocker.reset();
    }
  }, [blocker, leavePromptOpen, shouldBlock]);

  const handleStay = () => {
    setLeavePromptOpen(false);
    setLeaveReason(null);
    if (blocker.state === 'blocked') {
      blocker.reset();
    }
  };

  const handleLeave = () => {
    setLeavePromptOpen(false);
    setLeaveReason(null);
    // Proceed while still blocked; clearing dirty/loader first can cancel navigation.
    if (blocker.state === 'blocked') {
      blocker.proceed();
    }
    if (isActive) {
      resetLoader();
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
              {leaveReason === 'unsaved'
                ? t('common.leaveUnsavedTitle')
                : t('common.leaveWhileLoadingTitle')}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {leaveReason === 'unsaved'
                ? t('common.leaveUnsavedBody')
                : t('common.leaveWhileLoadingBody')}
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
