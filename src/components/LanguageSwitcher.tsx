import { useTranslation } from 'react-i18next';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'pl';

  const switchTo = (lng: 'en' | 'pl') => {
    void i18n.changeLanguage(lng);
  };

  return (
    <div className="inline-flex rounded-md border border-gray-200 bg-gray-50 p-0.5 text-xs font-medium">
      <button
        type="button"
        onClick={() => switchTo('en')}
        className={`rounded px-2 py-1 transition-colors ${
          current === 'en'
            ? 'bg-white text-blue-700 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
        aria-pressed={current === 'en'}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => switchTo('pl')}
        className={`rounded px-2 py-1 transition-colors ${
          current === 'pl'
            ? 'bg-white text-blue-700 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
        aria-pressed={current === 'pl'}
      >
        PL
      </button>
    </div>
  );
}
