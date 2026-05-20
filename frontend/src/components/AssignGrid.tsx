import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Ban, ChevronDown, ChevronRight } from 'lucide-react';
import type { TeamMember, WeekInfo, SeatWithAssignments, Team } from '../types';
import { api } from '../api';

interface Props {
  seats: SeatWithAssignments[];
  members: TeamMember[];
  teams: Team[];
  weeks: WeekInfo[];
  readOnly?: boolean;
  myMemberId?: number | null;
  selectedWeek: number;
  onWeekChange: (week: number) => void;
  onUpdate: () => void;
}

function hexToRgba(hex: string, alpha: number) {
  const v = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(v >> 16) & 255}, ${(v >> 8) & 255}, ${v & 255}, ${alpha})`;
}

export function AssignGrid({ seats, members, teams, weeks, readOnly, myMemberId, selectedWeek, onWeekChange, onUpdate }: Props) {
  const { t } = useTranslation();
  const [picking, setPicking] = useState<{ seatId: number; date: string } | null>(null);
  const [showUnassigned, setShowUnassigned] = useState(false);

  const days = weeks[selectedWeek]?.days ?? [];

  const getAssignment = (seatId: number, date: string) => {
    const seat = seats.find(s => s.id === seatId);
    if (!seat) return null;
    return seat.assignments.find(a => a.date === date) ?? null;
  };

  const isDisabled = (seatId: number, date: string) => {
    const seat = seats.find(s => s.id === seatId);
    return seat?.disabledDates.includes(date) ?? false;
  };

  const getTeamColor = (memberId: number): string => {
    const m = members.find(x => x.id === memberId);
    if (!m) return '#6B7280';
    const team = teams.find(t => t.id === m.teamId);
    return team?.color ?? '#6B7280';
  };

  const handleCellClick = (seatId: number, date: string, isHoliday: boolean) => {
    if (isHoliday) return;
    const existing = getAssignment(seatId, date);
    if (existing) {
      if (readOnly && existing.teamMemberId !== myMemberId) return;
      api.assignments.delete(existing.id).then(onUpdate);
    } else if (!isDisabled(seatId, date)) {
      if (readOnly && myMemberId) {
        api.assignments.create({ seatId, date, teamMemberId: myMemberId }).then(onUpdate);
      } else if (!readOnly) {
        setPicking(prev =>
          prev?.seatId === seatId && prev?.date === date ? null : { seatId, date }
        );
      }
    }
  };

  const handleAssign = async (memberId: number) => {
    if (!picking) return;
    await api.assignments.create({
      seatId: picking.seatId,
      date: picking.date,
      teamMemberId: memberId,
    });
    setPicking(null);
    onUpdate();
  };

  const handleToggleDisabled = async (seatId: number, date: string) => {
    if (readOnly) return;
    const day = days.find(d => d.date === date);
    if (day?.holiday) return;
    await api.seats.toggleUnavailable(seatId, date);
    setPicking(null);
    onUpdate();
  };

  const unassignedByDay = days.map(day => {
      const assignedIds = new Set(
        seats.flatMap(s =>
          s.assignments.filter(a => a.date === day.date).map(a => a.teamMemberId)
        )
      );
      const unassigned = members.filter(m => !assignedIds.has(m.id));
      return { day, unassigned };
    });

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800/80 rounded-2xl shadow-lg p-6 overflow-x-auto">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-500" />
            <h2 className="text-lg font-bold dark:text-gray-100">{t('assignGrid.title')}</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
              {weeks.map((w, i) => (
                <button
                  key={w.weekNumber}
                  onClick={() => { onWeekChange(i); setPicking(null); }}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                    i === selectedWeek
                      ? 'bg-white dark:bg-gray-800 text-violet-700 dark:text-violet-400 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {picking && (
          <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/30 dark:to-purple-900/30 border border-violet-200 dark:border-violet-800">
            <p className="text-sm text-violet-700 dark:text-violet-300 font-medium mb-2">
              {t('assignGrid.assignToSeat')}
            </p>
            <div className="flex flex-wrap gap-2">
              {members.map(m => {
                const team = teams.find(t => t.id === m.teamId);
                const c = team?.color ?? '#6B7280';
                return (
                  <button
                    key={m.id}
                    onClick={() => handleAssign(m.id)}
                    className="px-3 py-1.5 text-sm font-medium text-white rounded-lg shadow-sm hover:shadow-md transition-all"
                    style={{ background: `linear-gradient(135deg, ${c}, ${hexToRgba(c, 0.7)})` }}
                  >
                    {m.name}
                  </button>
                );
              })}
              <button
                onClick={() => setPicking(null)}
                className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
              >
                <X size={14} className="inline" /> {t('backoffice.cancel')}
              </button>
            </div>
          </div>
        )}

        <table className="w-full min-w-[550px]">
          <thead>
            <tr>
              <th className="text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 pe-4 w-16">{t('assignGrid.seat')}</th>
              {days.map(day => (
                <th key={day.date} className={`text-center pb-3 px-1 ${day.holiday ? '' : ''}`}>
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{day.shortLabel}</div>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{day.persianDate}</div>
                  {day.holiday && (
                    <div className="text-[9px] text-red-500 dark:text-red-400 font-medium mt-1 leading-tight">{day.holiday}</div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {seats.map(seat => (
              <tr key={seat.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="py-1.5 pe-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-100 to-orange-200 dark:from-amber-900/40 dark:to-orange-900/40 flex items-center justify-center text-[10px] font-bold text-amber-700 dark:text-amber-300 flex-shrink-0">
                      {seat.name}
                    </div>
                  </div>
                </td>
                {days.map(day => {
                  const a = getAssignment(seat.id, day.date);
                  const disabled = isDisabled(seat.id, day.date);
                  const pickingThis = picking?.seatId === seat.id && picking?.date === day.date;
                  const color = a ? getTeamColor(a.teamMemberId) : '#6B7280';

                  const isHoliday = !!day.holiday;
                  return (
                    <td key={day.date} className={`text-center px-1 py-1 ${isHoliday ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                      {disabled ? (
                        <div
                          className="w-full min-w-[85px] px-2 py-1.5 rounded-xl text-xs bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed flex items-center justify-center gap-1 border border-dashed border-gray-200 dark:border-gray-600"
                          onContextMenu={readOnly ? undefined : e => { e.preventDefault(); handleToggleDisabled(seat.id, day.date); }}
                        >
                          <Ban size={12} />
                          {t('assignGrid.off')}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleCellClick(seat.id, day.date, isHoliday)}
                          onContextMenu={e => { e.preventDefault(); handleToggleDisabled(seat.id, day.date); }}
                          style={a ? { background: `linear-gradient(135deg, ${color}, ${hexToRgba(color, 0.7)})` } : {}}
                          className={`w-full min-w-[85px] px-2 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 relative ${
                            pickingThis
                              ? 'ring-2 ring-violet-500 ring-offset-2 dark:ring-offset-gray-800 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                              : a
                                ? 'text-white shadow-sm hover:shadow-md'
                                : isHoliday
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-400 dark:text-red-400 cursor-default'
                                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 dark:text-gray-500 border border-dashed border-gray-200 dark:border-gray-600'
                          }`}
                        >
                          {a ? (
                            <span className="flex flex-col items-center leading-tight">
                              <span>{a.memberName}</span>
                              <span className="text-[9px] opacity-80">{a.teamName}</span>
                            </span>
                          ) : pickingThis ? (
                            t('assignGrid.pick')
                          ) : isHoliday ? (
                            <span className="text-[9px] text-red-400">-</span>
                          ) : (
                            '+'
                          )}
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {seats.length === 0 && (
              <tr>
                <td colSpan={days.length + 1} className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">
                  {t('assignGrid.noSeats')}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <p className="mt-3 text-[10px] text-gray-400 dark:text-gray-500 text-center">
          {readOnly && myMemberId
            ? t('assignGrid.clickToSit')
            : readOnly
              ? t('assignGrid.viewOnly')
              : t('assignGrid.adminHint')}
        </p>
      </div>

      {members.length > 0 && (
        <div>
          <button
            onClick={() => setShowUnassigned(v => !v)}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all
              bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700
              hover:bg-gray-50 dark:hover:bg-gray-700/80 shadow-sm"
          >
            {showUnassigned ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500" />
            {t('assignGrid.unassignedMembers')}
          </button>
          {showUnassigned && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {unassignedByDay.map(({ day, unassigned }) => (
                <div key={day.date} className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-xl p-3 border border-rose-100 dark:border-rose-800">
                  <div className="text-xs font-bold text-rose-600 dark:text-rose-400 mb-2">{day.persianDate}</div>
                  {unassigned.length === 0 ? (
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">{t('assignGrid.allSeated')}</div>
                  ) : (
                    <div className="space-y-1">
                      {unassigned.map(m => {
                        const team = teams.find(t => t.id === m.teamId);
                        return (
                          <div key={m.id} className="flex items-center gap-1.5 text-[11px]">
                            <div
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: team?.color ?? '#6B7280' }}
                            />
                            <span className="text-gray-700 dark:text-gray-300 truncate">{m.name}</span>
                            <span className="text-gray-400 dark:text-gray-500 ms-auto flex-shrink-0">{team?.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
