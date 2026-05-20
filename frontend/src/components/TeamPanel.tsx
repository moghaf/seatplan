import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { Team } from '../types';
import { api } from '../api';

interface Props {
  teams: Team[];
  functionId: number;
  onUpdate: () => void;
}

export function TeamPanel({ teams, functionId, onUpdate }: Props) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState<Team | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3B82F6');

  const handleCreate = async () => {
    if (!name.trim()) return;
    await api.teams.create({ name: name.trim(), color, functionId });
    setName('');
    setColor('#3B82F6');
    onUpdate();
  };

  const handleUpdate = async () => {
    if (!editing || !name.trim()) return;
    await api.teams.update(editing.id, { name: name.trim(), color, functionId });
    setEditing(null);
    setName('');
    setColor('#3B82F6');
    onUpdate();
  };

  const handleDelete = async (id: number) => {
    await api.teams.delete(id);
    onUpdate();
  };

  const startEdit = (team: Team) => {
    setEditing(team);
    setName(team.name);
    setColor(team.color);
  };

  return (
    <div className="bg-white dark:bg-gray-800/80 rounded-2xl shadow-lg p-6">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
        {t('teamPanel.title')}
      </h2>

      <div className="space-y-2 mb-4">
        {teams.map(team => (
          <div key={team.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 group transition-colors">
            <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: team.color }} />
            <span className="flex-1 text-sm font-medium dark:text-gray-200">{team.name}</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">{team.members?.length || 0}</span>
            <button onClick={() => startEdit(team)} className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Pencil size={14} className="text-gray-400 dark:text-gray-500 hover:text-blue-500" />
            </button>
            <button onClick={() => handleDelete(team.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 size={14} className="text-gray-400 dark:text-gray-500 hover:text-red-500" />
            </button>
          </div>
        ))}
      </div>

      <div className="border-t dark:border-gray-700 pt-4">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          {editing ? t('backoffice.editTeam') : t('backoffice.newTeam')}
        </p>
        <div className="flex gap-2 mb-3">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={editing ? t('backoffice.updateName') : t('backoffice.teamName')}
            className="flex-1 min-w-0 px-3 py-2.5 text-sm border dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:bg-gray-700 dark:text-white"
            onKeyDown={e => e.key === 'Enter' && (editing ? handleUpdate() : handleCreate())}
          />
          <label className="relative w-10 h-10 rounded-xl cursor-pointer overflow-hidden border dark:border-gray-600 flex-shrink-0 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
            <div className="absolute inset-0" style={{ backgroundColor: color }} />
            <input
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </label>
        </div>
        <div className="flex gap-2">
          <button
            onClick={editing ? handleUpdate : handleCreate}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-xl transition-all
              bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md hover:shadow-lg"
          >
            <Plus size={16} />
            {editing ? t('backoffice.updateTeam') : t('backoffice.addTeam')}
          </button>
          {editing && (
            <button onClick={() => { setEditing(null); setName(''); setColor('#3B82F6'); }}
              className="px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              {t('backoffice.cancel')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
