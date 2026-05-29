'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import id from './id';
import en from './en';
import type { Language } from '../types';

type Translations = typeof id;

const translations: Record<Language, Translations> = { id, en };

interface I18nContextType {
  t: Translations;
  lang: Language;
  setLang: (lang: Language) => void;
}

const I18nContext = createContext<I18nContextType>({
  t: id,
  lang: 'id',
  setLang: () => {},
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('id');

  useEffect(() => {
    const saved = localStorage.getItem('okane-lang') as Language;
    if (saved && translations[saved]) {
      setLang(saved);
    }
  }, []);

  const handleSetLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('okane-lang', newLang);
    document.documentElement.lang = newLang;
  };

  return (
    <I18nContext.Provider value={{ t: translations[lang], lang, setLang: handleSetLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
