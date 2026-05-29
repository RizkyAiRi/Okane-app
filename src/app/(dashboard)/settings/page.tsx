'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/toast';
import Header from '@/components/layout/header';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from 'next-themes';
import { User, Globe, Palette, LogOut } from 'lucide-react';
import type { Language } from '@/lib/types';
import styles from './settings.module.css';

export default function SettingsPage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { t, lang, setLang } = useI18n();
  const { showToast } = useToast();
  const { theme, setTheme } = useTheme();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from('profiles').update({
      full_name: fullName,
      language: lang,
      theme: theme,
    }).eq('id', user.id);
    await refreshProfile();
    setSaving(false);
    showToast('Profil berhasil diperbarui');
  };

  return (
    <>
      <Header />
      <div className={styles.container}>
        <h1 className="page-title">{t.settings}</h1>

        {/* Profile Section */}
        <div className={`card ${styles.section}`}>
          <div className={styles.sectionHeader}>
            <User size={20} className="text-primary-color" />
            <h3 className={styles.sectionTitle}>{t.profile}</h3>
          </div>

          <div className="form-group">
            <label className="label">{t.fullName}</label>
            <input className="input" value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="label">{t.email}</label>
            <input className="input" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
          </div>

          <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saving}>
            {saving ? t.loading : t.save}
          </button>
        </div>

        {/* Language Section */}
        <div className={`card ${styles.section}`}>
          <div className={styles.sectionHeader}>
            <Globe size={20} className="text-primary-color" />
            <h3 className={styles.sectionTitle}>{t.language}</h3>
          </div>

          <div className={styles.optionGrid}>
            <button
              className={`${styles.optionCard} ${lang === 'id' ? styles.optionActive : ''}`}
              onClick={() => setLang('id')}
            >
              <span className={styles.optionEmoji}>🇮🇩</span>
              <span>{t.languageId}</span>
            </button>
            <button
              className={`${styles.optionCard} ${lang === 'en' ? styles.optionActive : ''}`}
              onClick={() => setLang('en')}
            >
              <span className={styles.optionEmoji}>🇬🇧</span>
              <span>{t.languageEn}</span>
            </button>
          </div>
        </div>

        {/* Theme Section */}
        <div className={`card ${styles.section}`}>
          <div className={styles.sectionHeader}>
            <Palette size={20} className="text-primary-color" />
            <h3 className={styles.sectionTitle}>{t.theme}</h3>
          </div>

          <div className={styles.optionGrid}>
            <button
              className={`${styles.optionCard} ${theme === 'system' ? styles.optionActive : ''}`}
              onClick={() => setTheme('system')}
            >
              <span className={styles.optionEmoji}>💻</span>
              <span>{t.themeSystem}</span>
            </button>
            <button
              className={`${styles.optionCard} ${theme === 'dark' ? styles.optionActive : ''}`}
              onClick={() => setTheme('dark')}
            >
              <span className={styles.optionEmoji}>🌙</span>
              <span>{t.themeDark}</span>
            </button>
            <button
              className={`${styles.optionCard} ${theme === 'light' ? styles.optionActive : ''}`}
              onClick={() => setTheme('light')}
            >
              <span className={styles.optionEmoji}>☀️</span>
              <span>{t.themeLight}</span>
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className={`card ${styles.section} ${styles.dangerSection}`}>
          <h3 className={styles.sectionTitle} style={{ color: 'var(--color-expense)' }}>Danger Zone</h3>
          <button className="btn btn-danger" onClick={() => signOut()}>
            <LogOut size={16} /> {t.logout}
          </button>
        </div>
      </div>
    </>
  );
}
