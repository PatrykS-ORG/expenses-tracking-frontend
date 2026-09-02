import { Plus } from 'lucide-react';
import type { SavingsGoalEvent } from '../../types/savingsGoals.types';

type EventTabsProps = {
  events: SavingsGoalEvent[];
  selectedId: string | null;
  busy?: boolean;
  addLabel: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
};

export function EventTabs({
  events,
  selectedId,
  busy = false,
  addLabel,
  onSelect,
  onAdd,
}: EventTabsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {events.map((event) => {
        const isActive = event.id === selectedId;
        return (
          <button
            key={event.id}
            type="button"
            disabled={busy}
            onClick={() => onSelect(event.id)}
            className={`rounded-md px-3 py-2 text-sm font-medium disabled:opacity-50 ${
              isActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            {event.name}
          </button>
        );
      })}
      <button
        type="button"
        disabled={busy}
        onClick={onAdd}
        className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
        {addLabel}
      </button>
    </div>
  );
}
