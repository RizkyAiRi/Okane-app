'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import styles from '../login/login.module.css';

export default function RegisterPage() {
  const { t } = useI18n();
  const { signUpWithEmail } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPwd) {
      setError('Password tidak cocok');
      return;
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }
    setLoading(true);
    setError('');
    const { error } = await signUpWithEmail(email, password, fullName);
    if (error) {
      setError(error);
      setLoading(false);
    } else {
      router.push('/');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.bgOrb1} />
      <div className={styles.bgOrb2} />
      <div className={styles.bgOrb3} />

      <div className={styles.card}>
        <div className={styles.logoSection}>
          <div className={styles.logoIcon}>💴</div>
          <h1 className={styles.logoText}>Okane</h1>
          <p className={styles.subtitle}>{t.registerSubtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.inputGroup}>
            <User size={18} className={styles.inputIcon} />
            <input
              type="text"
              className={`input ${styles.inputField}`}
              placeholder={t.fullName}
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <Mail size={18} className={styles.inputIcon} />
            <input
              type="email"
              className={`input ${styles.inputField}`}
              placeholder={t.email}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <Lock size={18} className={styles.inputIcon} />
            <input
              type={showPassword ? 'text' : 'password'}
              className={`input ${styles.inputField}`}
              placeholder={t.password}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className={styles.inputGroup}>
            <Lock size={18} className={styles.inputIcon} />
            <input
              type={showPassword ? 'text' : 'password'}
              className={`input ${styles.inputField}`}
              placeholder={t.confirmPassword}
              value={confirmPwd}
              onChange={e => setConfirmPwd(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? t.loading : t.register}
          </button>
        </form>

        <p className={styles.switchText}>
          {t.alreadyHaveAccount}{' '}
          <Link href="/login" className={styles.link}>{t.login}</Link>
        </p>
      </div>
    </div>
  );
}
