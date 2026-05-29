'use client';

import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth-context';
import { getGreeting } from '@/lib/utils';
import { Plus, Bell } from 'lucide-react';
import { useState } from 'react';
import NotificationModal from './notification-modal';
import styles from './header.module.css';

interface HeaderProps {
  onAddTransaction?: () => void;
}

export default function Header({ onAddTransaction }: HeaderProps) {
  const { t, lang } = useI18n();
  const { profile } = useAuth();
  const [showNotif, setShowNotif] = useState(false);

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
        <button 
          className={`btn btn-ghost btn-icon ${styles.notifBtn}`} 
          title="Notifications"
          onClick={() => setShowNotif(true)}
        >
          <Bell size={20} />
          <span className={styles.badgeIndicator} style={{
            position: 'absolute', top: 4, right: 4, width: 8, height: 8, 
            backgroundColor: 'var(--color-expense)', borderRadius: '50%',
            border: '2px solid var(--color-bg)'
          }} />
        </button>
        <button className="btn btn-primary" onClick={onAddTransaction}>
          <Plus size={18} />
          <span className={styles.addText}>{t.addTransaction}</span>
        </button>
      </div>

      <NotificationModal isOpen={showNotif} onClose={() => setShowNotif(false)} />
    </header>
  );
}
