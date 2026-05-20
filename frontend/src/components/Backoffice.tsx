import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Pencil, ArrowLeft, Key, Users, Table, Palette, Calendar } from 'lucide-react';
import { api } from '../api';
import type { WorkFunction, Team, TeamMember, Seat, UserInfo, Holiday } from '../types';

const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

interface Props {
  functions: WorkFunction[];
  onBack: () => void;
  onUpdate: () => void;
}

export function Backoffice({ functions, onBack, onUpdate }: Props) {
  const { t } = useTranslation();
  const [activeFn, setActiveFn] = useState<WorkFunction | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [allMembers, setAllMembers] = useState<TeamMember[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [tab, setTab] = useState<'teams' | 'members' | 'seats' | 'users' | 'holidays'>('teams');

  const selectFn = async (fn: WorkFunction) => {
    setActiveFn(fn);
    const [t, m, s] = await Promise.all([
      api.teams.list(fn.id),
      api.members.list(fn.id),
      api.seats.list(fn.id),
    ]);
    setTeams(t);
    setMembers(m);
    setSeats(s);
  };

  const selectUsers = async () => {
    const [u, m] = await Promise.all([api.auth.list(), api.members.list()]);
    setUsers(u);
    setAllMembers(m);
  };

  useEffect(() => {
    if (tab === 'users') selectUsers();
  }, [tab]);

  const tabConfig = [
    { key: 'teams' as const, label: t('backoffice.navTeams'), icon: Palette, activeClass: 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-sm' },
    { key: 'members' as const, label: t('backoffice.navMembers'), icon: Users, activeClass: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm' },
    { key: 'seats' as const, label: t('backoffice.navSeats'), icon: Table, activeClass: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800/80 rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <ArrowLeft size={18} className="text-gray-500 dark:text-gray-400" />
          </button>
          <h2 className="text-lg font-bold dark:text-gray-100">{t('backoffice.title')}</h2>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-56 flex-shrink-0">
            <h3 className="text-sm font-bold mb-3 dark:text-gray-200">{t('backoffice.functions')}</h3>
            <div className="space-y-1 mb-3 max-h-64 overflow-y-auto">
              {functions.map(fn => (
                <button
                  key={fn.id}
                  onClick={() => { selectFn(fn); setTab('teams'); }}
                  className={`w-full text-start px-3 py-2.5 rounded-xl text-sm transition-colors dark:text-gray-300 ${
                    activeFn?.id === fn.id ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 font-medium' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {fn.name}
                </button>
              ))}
            </div>
            <AddFunctionForm onUpdate={onUpdate} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex gap-2 mb-4 overflow-x-auto">
              {tabConfig.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  disabled={!activeFn}
                  className={`flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-xl font-medium transition-colors whitespace-nowrap ${
                    tab === t.key ? t.activeClass : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  } ${!activeFn ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <t.icon size={14} />
                  {t.label}
                </button>
              ))}
              <button
                onClick={() => setTab('users')}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-xl font-medium transition-colors whitespace-nowrap ${
                  tab === 'users' ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Key size={14} /> {t('backoffice.users')}
              </button>
              <button
                onClick={async () => { setTab('holidays'); setHolidays(await api.holidays.list()); }}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-xl font-medium transition-colors whitespace-nowrap ${
                  tab === 'holidays' ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Calendar size={14} /> {t('backoffice.holidays')}
              </button>
            </div>

            {tab === 'teams' && activeFn && (
              <TeamsSection teams={teams} functionId={activeFn.id} onUpdate={() => { onUpdate(); selectFn(activeFn); }} />
            )}
            {tab === 'members' && activeFn && (
              <MembersSection members={members} teams={teams} onUpdate={() => { onUpdate(); selectFn(activeFn); }} />
            )}
            {tab === 'seats' && activeFn && (
              <SeatsSection seats={seats} functionId={activeFn.id} onUpdate={() => { onUpdate(); selectFn(activeFn); }} />
            )}
            {tab === 'holidays' && (
              <HolidaysSection holidays={holidays} onUpdate={async () => setHolidays(await api.holidays.list())} />
            )}
            {tab === 'users' && (
              <UsersSection users={users} allMembers={allMembers} onUpdate={selectUsers} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TeamsSection({ teams, functionId, onUpdate }: { teams: Team[]; functionId: number; onUpdate: () => void }) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState<Team | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3B82F6');

  const reset = () => { setEditing(null); setName(''); setColor('#3B82F6'); };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    if (editing) {
      await api.teams.update(editing.id, { name: name.trim(), color, functionId });
    } else {
      await api.teams.create({ name: name.trim(), color, functionId });
    }
    reset();
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
    <div className="bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
      <h3 className="text-sm font-bold mb-4 flex items-center gap-2 dark:text-gray-100">
        <span className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
        {t('backoffice.navTeams')}
      </h3>

      <div className="space-y-1.5 mb-4 max-h-64 overflow-y-auto">
        {teams.map(team => (
          <div key={team.id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 group transition-colors">
            <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: team.color }} />
            <span className="flex-1 text-sm font-medium dark:text-gray-200">{team.name}</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">{team.members?.length || 0}</span>
            <button onClick={() => startEdit(team)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
              <Pencil size={13} className="text-gray-400 dark:text-gray-500 hover:text-blue-500" />
            </button>
            <button onClick={() => handleDelete(team.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
              <Trash2 size={13} className="text-gray-400 dark:text-gray-500 hover:text-red-500" />
            </button>
          </div>
        ))}
        {teams.length === 0 && <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">{t('backoffice.noTeams')}</p>}
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
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
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
            onClick={handleSubmit}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-xl transition-all
              bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-sm hover:shadow"
          >
            <Plus size={16} />
            {editing ? t('backoffice.updateTeam') : t('backoffice.addTeam')}
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

function MembersSection({ members, teams, onUpdate }: { members: TeamMember[]; teams: Team[]; onUpdate: () => void }) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [teamId, setTeamId] = useState(teams[0]?.id || 0);

  const reset = () => { setEditing(null); setName(''); setRole(''); };

  const handleSubmit = async () => {
    if (!name.trim() || !teamId) return;
    if (editing) {
      await api.members.update(editing.id, { name: name.trim(), role: role.trim() || null, teamId });
    } else {
      await api.members.create({ name: name.trim(), role: role.trim() || null, teamId });
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
    <div className="bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
      <h3 className="text-sm font-bold mb-4 flex items-center gap-2 dark:text-gray-100">
        <span className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
        {t('backoffice.navMembers')}
      </h3>

      <div className="space-y-1.5 mb-4 max-h-64 overflow-y-auto">
        {members.map(m => {
          const team = teams.find(t => t.id === m.teamId);
          return (
            <div key={m.id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 group transition-colors">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br from-emerald-400 to-teal-500 flex-shrink-0">
                {m.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate dark:text-gray-200">{m.name}</div>
                <div className="text-xs text-gray-400 dark:text-gray-500 truncate">
                  {team?.name}{m.role ? ` · ${m.role}` : ''}
                </div>
              </div>
              <button onClick={() => startEdit(m)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                <Pencil size={13} className="text-gray-400 dark:text-gray-500 hover:text-emerald-500" />
              </button>
              <button onClick={() => handleDelete(m.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                <Trash2 size={13} className="text-gray-400 dark:text-gray-500 hover:text-red-500" />
              </button>
            </div>
          );
        })}
        {members.length === 0 && <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">{t('backoffice.noMembers')}</p>}
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
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
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
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-xl transition-all
              bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-sm hover:shadow"
          >
            <Plus size={16} />
            {editing ? t('backoffice.updateMember') : t('backoffice.addMember')}
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

function SeatsSection({ seats, functionId, onUpdate }: { seats: Seat[]; functionId: number; onUpdate: () => void }) {
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
    <div className="bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
      <h3 className="text-sm font-bold mb-4 flex items-center gap-2 dark:text-gray-100">
        <span className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
        {t('backoffice.navSeats')}
      </h3>

      <div className="space-y-1.5 mb-4 max-h-64 overflow-y-auto">
        {seats.map(seat => (
          <div key={seat.id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 group transition-colors">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-100 to-orange-200 dark:from-amber-900/40 dark:to-orange-900/40 flex items-center justify-center text-xs font-bold text-amber-700 dark:text-amber-300 flex-shrink-0">
              {seat.name}
            </div>
            <span className="flex-1 text-sm font-medium dark:text-gray-200">{seat.name}</span>
            <button onClick={() => { setEditing(seat); setName(seat.name); }} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
              <Pencil size={13} className="text-gray-400 dark:text-gray-500 hover:text-amber-500" />
            </button>
            <button onClick={() => handleDelete(seat.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
              <Trash2 size={13} className="text-gray-400 dark:text-gray-500 hover:text-red-500" />
            </button>
          </div>
        ))}
        {seats.length === 0 && <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">{t('backoffice.noSeats')}</p>}
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
              bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-sm hover:shadow"
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

function HolidaysSection({ holidays, onUpdate }: { holidays: Holiday[]; onUpdate: () => void }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [month, setMonth] = useState('1');
  const [day, setDay] = useState('1');

  const handleAdd = async () => {
    if (!name.trim()) return;
    await api.holidays.create({ name: name.trim(), month: Number(month), day: Number(day) });
    setName('');
    onUpdate();
  };

  return (
    <div className="bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
      <h3 className="text-sm font-bold mb-4 flex items-center gap-2 dark:text-gray-100">
        <span className="w-2 h-2 rounded-full bg-gradient-to-r from-red-500 to-rose-500" />
        {t('backoffice.holidays')}
      </h3>

      <div className="space-y-1.5 mb-4 max-h-96 overflow-y-auto">
        {holidays.sort((a, b) => a.month - b.month || a.day - b.day).map(h => (
          <div key={h.id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 group transition-colors">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate dark:text-gray-200">{h.name}</div>
              <div className="text-xs text-gray-400 dark:text-gray-500">{h.day} {PERSIAN_MONTHS[h.month - 1]}</div>
            </div>
            <button
              onClick={async () => { await api.holidays.delete(h.id); onUpdate(); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <Trash2 size={13} className="text-gray-400 dark:text-gray-500 hover:text-red-500" />
            </button>
          </div>
        ))}
        {holidays.length === 0 && <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">{t('backoffice.noHolidays')}</p>}
      </div>

      <div className="border-t dark:border-gray-700 pt-4">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">{t('backoffice.newHoliday')}</p>
        <div className="flex flex-wrap gap-2">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={t('backoffice.holidayName')}
            className="flex-1 min-w-[160px] px-3 py-2.5 text-sm border dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 dark:bg-gray-700 dark:text-white"
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <select
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="px-3 py-2.5 text-sm border dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white"
          >
            {PERSIAN_MONTHS.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <input
            value={day}
            onChange={e => setDay(e.target.value)}
            placeholder={t('backoffice.day')}
            type="number"
            min={1}
            max={31}
            className="w-18 px-3 py-2.5 text-sm border dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 dark:bg-gray-700 dark:text-white"
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <button
            onClick={handleAdd}
            className="flex items-center justify-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white rounded-xl transition-all
              bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-sm hover:shadow"
          >
            <Plus size={16} /> {t('backoffice.add')}
          </button>
        </div>
      </div>
    </div>
  );
}

function UsersSection({ users, allMembers, onUpdate }: { users: UserInfo[]; allMembers: TeamMember[]; onUpdate: () => void }) {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleCreate = async () => {
    if (!username.trim() || !password.trim()) return;
    await api.auth.register({
      username: username.trim(),
      password: password.trim(),
      displayName: displayName.trim() || username.trim(),
    });
    setUsername('');
    setPassword('');
    setDisplayName('');
    onUpdate();
  };

  return (
    <div className="bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
      <h3 className="text-sm font-bold mb-4 flex items-center gap-2 dark:text-gray-100">
        <span className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-pink-500" />
        {t('backoffice.users')}
      </h3>

      <div className="space-y-1.5 mb-4 max-h-96 overflow-y-auto">
        {users.map(u => (
          <UserRow key={u.id} user={u} allMembers={allMembers} onUpdate={onUpdate} />
        ))}
        {users.length === 0 && <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">{t('backoffice.noUsers')}</p>}
      </div>

      <div className="border-t dark:border-gray-700 pt-4">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">{t('backoffice.newUser')}</p>
        <div className="flex flex-wrap gap-2">
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder={t('backoffice.username')}
            className="flex-1 min-w-[130px] px-3 py-2.5 text-sm border dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 dark:bg-gray-700 dark:text-white"
          />
          <input
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder={t('backoffice.displayName')}
            className="flex-1 min-w-[130px] px-3 py-2.5 text-sm border dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 dark:bg-gray-700 dark:text-white"
          />
          <input
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={t('backoffice.password')}
            type="password"
            className="flex-1 min-w-[110px] px-3 py-2.5 text-sm border dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 dark:bg-gray-700 dark:text-white"
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
          />
          <button
            onClick={handleCreate}
            className="flex items-center justify-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white rounded-xl transition-all
              bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 shadow-sm hover:shadow"
          >
            <Plus size={16} /> {t('backoffice.add')}
          </button>
        </div>
      </div>
    </div>
  );
}

function UserRow({ user, allMembers, onUpdate }: { user: UserInfo; allMembers: TeamMember[]; onUpdate: () => void }) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');

  const handleSetPassword = async () => {
    if (!password.trim()) return;
    await api.auth.setPassword(user.id, password.trim());
    setPassword('');
    setShowPassword(false);
  };

  const handleLinkMember = async (teamMemberId: string) => {
    await api.auth.setTeamMember(user.id, teamMemberId ? Number(teamMemberId) : null);
    onUpdate();
  };

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 group transition-colors">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
        {user.displayName.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate dark:text-gray-200">{user.displayName}</div>
        <div className="text-xs text-gray-400 dark:text-gray-500">@{user.username} · {user.role}</div>
      </div>
      <div className="flex items-center gap-1">
        <select
          value={user.teamMemberId ?? ''}
          onChange={e => handleLinkMember(e.target.value)}
          className="text-xs border dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30"
        >
          <option value="">{t('backoffice.noMember')}</option>
          {allMembers.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        {showPassword ? (
          <div className="flex gap-1">
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={t('changePassword.newPassword')}
              type="password"
              className="w-28 px-2 py-1.5 text-xs border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 dark:bg-gray-700 dark:text-white"
              onKeyDown={e => { if (e.key === 'Enter') handleSetPassword(); }}
              autoFocus
            />
            <button onClick={handleSetPassword} className="px-2.5 py-1.5 text-xs font-medium text-white rounded-lg bg-violet-600 hover:bg-violet-700 transition-colors">
              {t('backoffice.set')}
            </button>
            <button onClick={() => { setShowPassword(false); setPassword(''); }} className="px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              {t('backoffice.cancel')}
            </button>
          </div>
        ) : (
          <button onClick={() => setShowPassword(true)} className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            <Key size={13} className="text-gray-400 dark:text-gray-500" />
          </button>
        )}
      </div>
    </div>
  );
}

function AddFunctionForm({ onUpdate }: { onUpdate: () => void }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) return;
    await api.functions.create({ name: name.trim(), description: desc.trim() || undefined });
    setName('');
    setDesc('');
    onUpdate();
  };

  return (
    <div className="border-t dark:border-gray-700 pt-3 space-y-2">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('backoffice.newFunction')}</p>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder={t('backoffice.functionName')}
        className="w-full px-3 py-2 text-sm border dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:bg-gray-700 dark:text-white"
        onKeyDown={e => e.key === 'Enter' && !desc && handleCreate()}
      />
      <input
        value={desc}
        onChange={e => setDesc(e.target.value)}
        placeholder={t('backoffice.description')}
        className="w-full px-3 py-2 text-sm border dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:bg-gray-700 dark:text-white"
        onKeyDown={e => e.key === 'Enter' && handleCreate()}
      />
      <button
        onClick={handleCreate}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-xl
          bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-sm hover:shadow transition-all"
      >
        <Plus size={16} /> {t('backoffice.addFunction')}
      </button>
    </div>
  );
}
