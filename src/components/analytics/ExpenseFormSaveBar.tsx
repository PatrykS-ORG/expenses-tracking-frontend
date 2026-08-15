type ExpenseFormSaveBarProps = {
  dirty: boolean;
  busy?: boolean;
  unsavedLabel: string;
  savedLabel: string;
  saveLabel: string;
};

/** Sticky save controls so long category forms stay actionable without scrolling. */
export function ExpenseFormSaveBar({
  dirty,
  busy = false,
  unsavedLabel,
  savedLabel,
  saveLabel,
}: ExpenseFormSaveBarProps) {
  return (
    <div className="sticky top-0 z-10 -mx-1 mb-4 flex items-center justify-between gap-3 border-b border-gray-200 bg-white/95 px-1 py-3 backdrop-blur">
      <p className={`text-xs ${dirty ? 'text-amber-700' : 'text-gray-500'}`}>
        {dirty ? unsavedLabel : savedLabel}
      </p>
      <button
        type="submit"
        disabled={busy || !dirty}
        className="rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
      >
        {saveLabel}
      </button>
    </div>
  );
}
