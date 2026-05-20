import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Key } from 'lucide-react';
import type { Team, TeamMember, UserInfo } from '../types';
import { api } from '../api';

interface Props {
  teams: Team[];
  members: TeamMember[];
  onUpdate: () => void;
}

export function MemberPanel({ teams, members, onUpdate }: Props) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [teamId, setTeamId] = useState(teams[0]?.id || 0);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    api.auth.list().then(setUsers);
  }, []);

  const linkedUser = editing ? users.find(u => u.teamMemberId === editing.id) : null;
  const reset = () => { setEditing(null); setName(''); setRole(''); setShowPassword(false); setNewPassword(''); };

  const handleCreate = async () => {
    if (!name.trim() || !teamId) return;
    await api.members.create({ name: name.trim(), role: role.trim() || null, teamId });
    setName('');
    setRole('');
    onUpdate();
  };

  const handleUpdate = async () => {
    if (!editing || !name.trim() || !teamId) return;
    await api.members.update(editing.id, { name: name.trim(), role: role.trim() || null, teamId });
    if (linkedUser && newPassword.trim()) {
      await api.auth.setPassword(linkedUser.id, newPassword.trim());
    }
    reset();
    onUpdate();
  };

  const handleDelete = async (id: number) => {
    await api.members.delete(id);
    onUpdate();
  };

  const startEdit = (m: TeamMember) => {
    setEditing(m);
    setName(m.name);
    setRole(m.role || '');
    setTeamId(m.teamId);
  };

  return (
    <div className="bg-white dark:bg-gray-800/80 rounded-2xl shadow-lg p-6">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-gray-100">
        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
        {t('memberPanel.title')}
      </h2>

      <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
        {members.map(m => {
          const team = teams.find(t => t.id === m.teamId);
          const hasLogin = users.some(u => u.teamMemberId === m.id);
          return (
            <div key={m.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 group transition-colors">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold
                bg-gradient-to-br from-emerald-400 to-teal-500">
                {m.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate dark:text-gray-200">{m.name}</div>
                <div className="text-xs text-gray-400 dark:text-gray-500">
                  {team?.name}{m.role ? ` · ${m.role}` : ''}
                </div>
              </div>
              {hasLogin && (
                <span className="text-[10px] text-violet-400 font-medium">{t('memberPanel.hasLogin')}</span>
              )}
              <button onClick={() => startEdit(m)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Pencil size={14} className="text-gray-400 dark:text-gray-500 hover:text-emerald-500" />
              </button>
              <button onClick={() => handleDelete(m.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 size={14} className="text-gray-400 dark:text-gray-500 hover:text-red-500" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="border-t dark:border-gray-700 pt-4 space-y-3">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {editing ? t('backoffice.editMember') : t('backoffice.newMember')}
        </p>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={editing ? t('backoffice.updateName') : t('backoffice.memberName')}
          className="w-full px-3 py-2.5 text-sm border dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:bg-gray-700 dark:text-white"
          onKeyDown={e => e.key === 'Enter' && (editing ? handleUpdate() : handleCreate())}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            value={role}
            onChange={e => setRole(e.target.value)}
            placeholder={t('backoffice.role')}
            className="w-full px-3 py-2.5 text-sm border dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:bg-gray-700 dark:text-white"
          />
          <select
            value={teamId}
            onChange={e => setTeamId(Number(e.target.value))}
            className="w-full px-3 py-2.5 text-sm border dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 bg-white dark:bg-gray-700 dark:text-white"
          >
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        {editing && linkedUser && (
          <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-violet-700 dark:text-violet-300 flex items-center gap-1.5">
              <Key size={12} /> {t('memberPanel.passwordFor', { username: linkedUser.username })}
            </p>
            {showPassword ? (
              <div className="flex gap-2">
                <input
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder={t('changePassword.newPassword')}
                  type="password"
                  className="flex-1 px-3 py-2 text-sm border dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 dark:bg-gray-700 dark:text-white"
                  autoFocus
                />
                <button
                  onClick={() => { setShowPassword(false); setNewPassword(''); }}
                  className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-xl bg-white dark:bg-gray-700 border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  {t('backoffice.cancel')}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowPassword(true)}
                className="flex items-center justify-center gap-1.5 w-full px-3 py-2 text-sm font-medium text-violet-700 dark:text-violet-300 rounded-xl bg-white dark:bg-gray-800 border border-violet-200 dark:border-violet-800 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors"
              >
                <Key size={14} /> {t('memberPanel.resetPassword')}
              </button>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={editing ? handleUpdate : handleCreate}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-xl transition-all
              bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md hover:shadow-lg"
          >
            <Plus size={16} />
            {editing ? t('backoffice.updateMember') : t('backoffice.addMember')}
          </button>
          {editing && (
            <button onClick={reset}
              className="px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              {t('backoffice.cancel')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
