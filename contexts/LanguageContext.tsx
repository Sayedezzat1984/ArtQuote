// Powered by OnSpace.AI
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { translations, Lang, TranslationKey } from '@/constants/i18n';

interface LanguageContextType {
  lang: Lang;
  toggleLang: () => void;
  t: (key: TranslationKey) => string;
  currency: string;
  dir: 'rtl' | 'ltr';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('ar');

  const toggleLang = () => setLang(prev => (prev === 'ar' ? 'en' : 'ar'));

  const t = (key: TranslationKey): string =>
    (translations[lang][key] as string) || key;

  return (
    <LanguageContext.Provider
      value={{
        lang,
        toggleLang,
        t,
        currency: translations[lang].currency,
        dir: lang === 'ar' ? 'rtl' : 'ltr',
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
