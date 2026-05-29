'use client';

import { useAuth } from '@/lib/auth-context';
import Sidebar from '@/components/layout/sidebar';
import styles from './dashboard-layout.module.css';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingLogo}>💴</div>
        <div className={styles.loadingText}>Okane</div>
        <div className={styles.loadingSpinner} />
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
