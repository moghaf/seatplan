import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Key, X } from 'lucide-react';
import { api } from '../api';

interface Props {
  onClose: () => void;
}

export function ChangePasswordModal({ onClose }: Props) {
  const { t } = useTranslation();
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!current || !newPass) { setError(t('changePassword.errors.allFieldsRequired')); return; }
    if (newPass.length < 4) { setError(t('changePassword.errors.minLength')); return; }
    if (newPass !== confirm) { setError(t('changePassword.errors.notMatch')); return; }
    try {
      await api.auth.changePassword(current, newPass);
      setDone(true);
    } catch (e: any) {
      setError(e.message || t('changePassword.errors.failed'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Key size={16} className="text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold dark:text-gray-100">{t('changePassword.title')}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <X size={16} className="text-gray-400 dark:text-gray-500" />
          </button>
        </div>

        {done ? (
          <div>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mb-4">{t('changePassword.success')}</p>
            <button onClick={onClose} className="w-full px-4 py-2 text-sm font-medium text-white rounded-xl bg-gradient-to-r from-blue-600 to-purple-600">
              {t('changePassword.done')}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              value={current}
              onChange={e => setCurrent(e.target.value)}
              placeholder={t('changePassword.currentPassword')}
              type="password"
              className="w-full px-3 py-2 text-sm border dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:bg-gray-700 dark:text-white"
            />
            <input
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
              placeholder={t('changePassword.newPassword')}
              type="password"
              className="w-full px-3 py-2 text-sm border dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:bg-gray-700 dark:text-white"
            />
            <input
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder={t('changePassword.confirmNewPassword')}
              type="password"
              className="w-full px-3 py-2 text-sm border dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:bg-gray-700 dark:text-white"
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
            />
            {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
            <button
              onClick={handleSubmit}
              className="w-full px-4 py-2 text-sm font-medium text-white rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {t('changePassword.changePassword')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
