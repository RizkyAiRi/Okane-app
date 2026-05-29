'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth-context';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tags,
  BarChart3,
  Repeat,
  Target,
  FileDown,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import styles from './sidebar.module.css';

const navItems = [
  { key: 'dashboard', href: '/', icon: LayoutDashboard },
  { key: 'transactions', href: '/transactions', icon: ArrowLeftRight },
  { key: 'categories', href: '/categories', icon: Tags },
  { key: 'reports', href: '/reports', icon: BarChart3 },
  { key: 'recurring', href: '/recurring', icon: Repeat },
  { key: 'goals', href: '/goals', icon: Target },
  { key: 'export', href: '/export', icon: FileDown },
  { key: 'settings', href: '/settings', icon: Settings },
] as const;

export default function Sidebar() {
  const { t } = useI18n();
  const { signOut } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const getLabel = (key: string) => {
    return t[key as keyof typeof t] || key;
  };

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className={styles.mobileToggle}
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className={styles.overlay} onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''} ${mobileOpen ? styles.mobileOpen : ''}`}>
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>💴</div>
          {!collapsed && <span className={styles.logoText}>Okane</span>}
        </div>

        {/* Nav */}
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`${styles.navItem} ${active ? styles.active : ''}`}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? getLabel(item.key) : undefined}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                {!collapsed && <span>{getLabel(item.key)}</span>}
                {active && <div className={styles.activeIndicator} />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className={styles.bottom}>
          <button
            className={styles.navItem}
            onClick={() => signOut()}
          >
            <LogOut size={20} />
            {!collapsed && <span>{t.logout}</span>}
          </button>

          {/* Collapse toggle (desktop only) */}
          <button
            className={styles.collapseBtn}
            onClick={() => setCollapsed(!collapsed)}
            aria-label="Toggle sidebar"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </aside>
    </>
  );
}
