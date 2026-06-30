import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const languages = [
  { code: 'fr', label: 'FR', name: 'Français' },
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'ar', label: 'ع', name: 'العربية' },
];

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const current = i18n.language;

  // Apply RTL / lang attribute whenever language changes
  useEffect(() => {
    document.documentElement.dir = current === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = current;
  }, [current]);

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('lang', lang);
  };

  return (
    <div className="flex items-center gap-1 bg-brand-card border border-brand-border rounded-full px-2 py-1">
      <Globe size={14} className="text-brand-muted mr-1" />
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => changeLanguage(lang.code)}
          title={lang.name}
          className={`text-xs font-bold px-2 py-1 rounded-full transition-all ${
            current === lang.code
              ? 'bg-brand-green text-white shadow-sm'
              : 'text-brand-muted hover:text-white'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
