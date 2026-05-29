'use client';

import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/lib/auth-context';
import { I18nProvider } from '@/lib/i18n';
import { ToastProvider } from '@/components/ui/toast';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
    >
      <I18nProvider>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
