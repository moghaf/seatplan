import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { Seat } from '../types';
import { api } from '../api';

interface Props {
  seats: Seat[];
  functionId: number;
  onUpdate: () => void;
}

export function SeatPanel({ seats, functionId, onUpdate }: Props) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState<Seat | null>(null);
  const [name, setName] = useState('');

  const reset = () => { setEditing(null); setName(''); };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    if (editing) {
      await api.seats.update(editing.id, name.trim(), functionId);
    } else {
      await api.seats.create(name.trim(), functionId);
    }
    reset();
    onUpdate();
  };

  const handleDelete = async (id: number) => {
    await api.seats.delete(id);
    onUpdate();
  };

  return (
    <div className="bg-white dark:bg-gray-800/80 rounded-2xl shadow-lg p-6">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
        {t('seatPanel.title')}
      </h2>

      <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
        {seats.map(seat => (
          <div key={seat.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 group transition-colors">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-100 to-orange-200 dark:from-amber-900/40 dark:to-orange-900/40 flex items-center justify-center text-xs font-bold text-amber-700 dark:text-amber-300">
              {seat.name}
            </div>
            <span className="flex-1 text-sm font-medium dark:text-gray-200">{seat.name}</span>
            <button onClick={() => { setEditing(seat); setName(seat.name); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Pencil size={14} className="text-gray-400 dark:text-gray-500 hover:text-amber-500" />
            </button>
            <button onClick={() => handleDelete(seat.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 size={14} className="text-gray-400 dark:text-gray-500 hover:text-red-500" />
            </button>
          </div>
        ))}
        {seats.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">{t('backoffice.noSeats')}</p>
        )}
      </div>

      <div className="border-t dark:border-gray-700 pt-4 space-y-3">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {editing ? t('backoffice.editSeat') : t('backoffice.newSeat')}
        </p>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={editing ? t('backoffice.updateName') : t('backoffice.seatName')}
          className="w-full px-3 py-2.5 text-sm border dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 dark:bg-gray-700 dark:text-white"
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        />
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-xl transition-all
              bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-md hover:shadow-lg"
          >
            <Plus size={16} />
            {editing ? t('backoffice.updateSeat') : t('backoffice.addSeat')}
          </button>
          {editing && (
            <button onClick={reset} className="px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              {t('backoffice.cancel')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
