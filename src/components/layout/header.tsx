'use client';

import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth-context';
import { getGreeting } from '@/lib/utils';
import { Plus, Bell } from 'lucide-react';
import styles from './header.module.css';

interface HeaderProps {
  onAddTransaction?: () => void;
}

export default function Header({ onAddTransaction }: HeaderProps) {
  const { t, lang } = useI18n();
  const { profile } = useAuth();

  const greeting = getGreeting(lang);
  const name = profile?.full_name || 'User';

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <h2 className={styles.greeting}>
          {greeting}, <span className={styles.name}>{name}</span> 👋
        </h2>
      </div>
      <div className={styles.right}>
        <button className={`btn btn-ghost btn-icon ${styles.notifBtn}`} title="Notifications">
          <Bell size={20} />
        </button>
        <button className="btn btn-primary" onClick={onAddTransaction}>
          <Plus size={18} />
          <span className={styles.addText}>{t.addTransaction}</span>
        </button>
      </div>
    </header>
  );
}
