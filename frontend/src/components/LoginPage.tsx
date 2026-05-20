import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LogIn, LayoutGrid } from 'lucide-react';

interface Props {
  onLogin: (username: string, password: string) => Promise<void>;
}

export function LoginPage({ onLogin }: Props) {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setBusy(true);
    setError('');
    try {
      await onLogin(username, password);
    } catch {
      setError(t('login.invalidCredentials'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg mx-auto mb-4">
            <LayoutGrid size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {t('app.title')}
          </h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t('login.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4">
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-2">{error}</div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('login.username')}</label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:bg-gray-700 dark:text-white"
              placeholder={t('login.usernamePlaceholder')}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('login.password')}</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:bg-gray-700 dark:text-white"
              placeholder={t('login.passwordPlaceholder')}
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-xl transition-all
              bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md hover:shadow-lg disabled:opacity-50"
          >
            <LogIn size={16} />
            {busy ? t('login.signingIn') : t('login.signIn')}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
          {t('login.hint')}
        </p>
      </div>
    </div>
  );
}
