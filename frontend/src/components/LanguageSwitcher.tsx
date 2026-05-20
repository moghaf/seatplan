import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const isFa = i18n.language === 'fa';

  return (
    <button
      onClick={() => i18n.changeLanguage(isFa ? 'en' : 'fa')}
      className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
    >
      <Languages size={14} />
      {isFa ? 'EN' : 'FA'}
    </button>
  );
}
