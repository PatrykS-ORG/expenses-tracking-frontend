import { Mail, Shield } from 'lucide-react';

export type SettingsTab = 'account' | 'summary';

type SettingsTabsProps = {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  accountLabel: string;
  summaryLabel: string;
};

export function SettingsTabs({
  activeTab,
  onTabChange,
  accountLabel,
  summaryLabel,
}: SettingsTabsProps) {
  return (
    <aside className="space-y-1 rounded-lg border bg-white p-3 shadow-sm">
      <TabButton
        tab="account"
        activeTab={activeTab}
        onTabChange={onTabChange}
        icon={<Shield className="h-4 w-4" />}
        label={accountLabel}
      />
      <TabButton
        tab="summary"
        activeTab={activeTab}
        onTabChange={onTabChange}
        icon={<Mail className="h-4 w-4" />}
        label={summaryLabel}
      />
    </aside>
  );
}

function TabButton({
  tab,
  activeTab,
  onTabChange,
  icon,
  label,
}: {
  tab: SettingsTab;
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onTabChange(tab)}
      className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium ${
        activeTab === tab
          ? 'bg-blue-50 text-blue-700'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
