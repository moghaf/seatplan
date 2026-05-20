import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutGrid, LogOut, Shield, ChevronDown, ChevronRight, Key, Moon, Sun } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import { useData } from './hooks/useData';
import { TeamPanel } from './components/TeamPanel';
import { MemberPanel } from './components/MemberPanel';
import { SeatPanel } from './components/SeatPanel';
import { SeatMapEditor } from './components/SeatMapEditor';
import { AssignGrid } from './components/AssignGrid';
import { Backoffice } from './components/Backoffice';
import { LoginPage } from './components/LoginPage';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { api } from './api';
import type { WorkFunction } from './types';

export default function App() {
  const { t } = useTranslation();
  const { user, isSuperAdmin, isFunctionAdmin, isAdmin, isAuthenticated, login, logout } = useAuth();
  const { dark, toggle: toggleTheme } = useTheme();
  const [fnList, setFnList] = useState<WorkFunction[]>([]);
  const [selectedFnId, setSelectedFnId] = useState<number | undefined>();
  const [fnsLoaded, setFnsLoaded] = useState(false);
  const [showBackoffice, setShowBackoffice] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showSeatMap, setShowSeatMap] = useState(false);

  const visibleFnList = isSuperAdmin
    ? fnList
    : fnList.filter(fn => isFunctionAdmin && user?.functionId === fn.id);

  const { seats, teams, members, weeks, loading, refresh } = useData(selectedFnId);

  const loadFunctions = useCallback(async () => {
    try {
      const fns = await api.functions.list();
      setFnList(fns);
      const visible = isSuperAdmin ? fns : fns.filter(f => isFunctionAdmin && user?.functionId === f.id);
      if (visible.length > 0 && (selectedFnId === undefined || !visible.some(v => v.id === selectedFnId))) {
        setSelectedFnId(visible[0].id);
      }
    } catch (e) {
      console.error("Failed to load functions", e);
    } finally {
      setFnsLoaded(true);
    }
  }, [selectedFnId, isSuperAdmin, isFunctionAdmin, user?.functionId]);

  useEffect(() => { loadFunctions(); }, [loadFunctions]);

  if (!isAuthenticated) return <LoginPage onLogin={login} />;

  const selectedFn = visibleFnList.find(f => f.id === selectedFnId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-gray-900/80 border-b border-white/20 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
            <LayoutGrid size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t('app.title')}
            </h1>
          </div>

          <div className="relative">
            <select
              value={selectedFnId ?? ''}
              onChange={e => setSelectedFnId(e.target.value ? Number(e.target.value) : undefined)}
              className="appearance-none ps-3 pe-8 py-1.5 text-sm border rounded-xl bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
            >
              {visibleFnList.map(fn => (
                <option key={fn.id} value={fn.id}>{fn.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute end-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <div className="ms-auto flex items-center gap-3">
            {isAdmin && !showBackoffice && (
              <button
                onClick={() => setShowBackoffice(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-sm"
              >
                <Shield size={13} /> {t('app.backoffice')}
              </button>
            )}
            {showBackoffice && (
              <button
                onClick={() => { setShowBackoffice(false); refresh(); }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
              >
                {t('app.mainView')}
              </button>
            )}
            <LanguageSwitcher />
            <button onClick={toggleTheme} className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              {dark ? <Sun size={15} className="text-gray-400" /> : <Moon size={15} className="text-gray-400" />}
            </button>
            <span className="text-xs text-gray-400 dark:text-gray-500">{user?.displayName}</span>
            <button onClick={() => setShowChangePassword(true)} className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Key size={15} className="text-gray-400 dark:text-gray-500" />
            </button>
            <button onClick={logout} className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <LogOut size={15} className="text-gray-400 dark:text-gray-500" />
            </button>
          </div>
        </div>
      </header>

      {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}

      <main className="max-w-7xl mx-auto px-6 py-8">
        {(loading || !fnsLoaded) ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-blue-200 dark:border-gray-700 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : showBackoffice && isAdmin ? (
          <Backoffice functions={fnList} onBack={() => { setShowBackoffice(false); refresh(); }} onUpdate={loadFunctions} />
        ) : (
          <div>
            {!selectedFn ? (
              <div className="text-center py-24">
                <p className="text-gray-400 dark:text-gray-500 text-sm">{t('app.noFunctionSelected')}</p>
                {isAdmin && (
                  <button
                    onClick={() => setShowBackoffice(true)}
                    className="mt-4 px-4 py-2 text-sm font-medium text-white rounded-xl bg-gradient-to-r from-blue-600 to-purple-600"
                  >
                    {t('app.goToBackoffice')}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <AssignGrid
                  seats={seats}
                  members={members}
                  teams={teams}
                  weeks={weeks}
                  readOnly={!isAdmin}
                  myMemberId={user?.teamMemberId}
                  selectedWeek={selectedWeek}
                  onWeekChange={setSelectedWeek}
                  onUpdate={refresh}
                />
                {isAdmin && (
                  <>
                    <button
                      onClick={() => setShowSeatMap(v => !v)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all
                        bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700
                        hover:bg-gray-50 dark:hover:bg-gray-700/80 shadow-sm"
                    >
                      {showSeatMap ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      <LayoutGrid size={16} className="text-cyan-500" />
                      {t('backoffice.navSeatMap')}
                    </button>
                    {showSeatMap && <SeatMapEditor seats={seats} functionId={selectedFnId!} onUpdate={refresh} />}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <TeamPanel teams={teams} functionId={selectedFnId!} onUpdate={refresh} />
                      <MemberPanel teams={teams} members={members} onUpdate={refresh} />
                      <SeatPanel seats={seats} functionId={selectedFnId!} onUpdate={refresh} />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
