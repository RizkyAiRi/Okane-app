'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/toast';
import Header from '@/components/layout/header';
import { getSavingsGoals, createSavingsGoal, contributeToGoal, getGoalContributions } from '@/lib/services/data-service';
import { formatRupiah, formatInputRupiah, parseRupiah } from '@/lib/utils';
import type { SavingsGoal, GoalContribution } from '@/lib/types';
import { Plus, X, Trophy, Target } from 'lucide-react';
import styles from './goals.module.css';

export default function GoalsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { showToast } = useToast();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showContribute, setShowContribute] = useState<SavingsGoal | null>(null);
  const [form, setForm] = useState({ name: '', targetAmount: '', targetDate: '', icon: '🎯', color: '#f59e0b' });
  const [contribAmount, setContribAmount] = useState('');
  const [contribNote, setContribNote] = useState('');

  const loadGoals = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await getSavingsGoals(user.id);
    setGoals(data || []);
    setLoading(false);
  };

  useEffect(() => { loadGoals(); }, [user]);

  const handleAddGoal = async () => {
    if (!user || !form.name || !form.targetAmount) return;
    await createSavingsGoal({
      user_id: user.id,
      name: form.name,
      target_amount: parseRupiah(form.targetAmount),
      target_date: form.targetDate || undefined,
      icon: form.icon,
      color: form.color,
    });
    setShowAdd(false);
    setForm({ name: '', targetAmount: '', targetDate: '', icon: '🎯', color: '#f59e0b' });
    showToast('Target berhasil ditambahkan');
    loadGoals();
  };

  const handleContribute = async () => {
    if (!user || !showContribute || !contribAmount) return;
    await contributeToGoal(showContribute.id, user.id, parseRupiah(contribAmount), contribNote || undefined);
    setShowContribute(null);
    setContribAmount('');
    setContribNote('');
    showToast('Kontribusi berhasil ditambahkan');
    loadGoals();
  };

  const ICON_OPTIONS = ['🎯', '💻', '📱', '🏠', '🚗', '✈️', '🎓', '💍', '🎸', '📸', '⌚', '🎮', '🏋️', '📚', '🛋️'];

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className="page-header">
          <h1 className="page-title">{t.goals}</h1>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={18} /> {t.addGoal}
          </button>
        </div>

        <div className={styles.grid}>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card"><div className="skeleton" style={{ height: 180 }} /></div>
            ))
          ) : goals.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              <p className="empty-state-icon">🎯</p>
              <p className="empty-state-title">{t.noData}</p>
              <p className="empty-state-text">Buat target tabungan pertamamu!</p>
            </div>
          ) : (
            goals.map(goal => {
              const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
              const remaining = goal.target_amount - goal.current_amount;

              return (
                <div key={goal.id} className={`card ${styles.goalCard}`}>
                  {goal.is_completed && <div className={styles.completedBadge}><Trophy size={14} /> {t.completed}</div>}
                  <div className={styles.goalHeader}>
                    <div className={styles.goalIcon} style={{ background: goal.color + '20' }}>
                      <span>{goal.icon}</span>
                    </div>
                    <div>
                      <h3 className={styles.goalName}>{goal.name}</h3>
                      {goal.target_date && (
                        <p className={styles.goalDate}>
                          Target: {new Date(goal.target_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className={styles.goalProgress}>
                    <div className={styles.progressHeader}>
                      <span className="text-income">{formatRupiah(goal.current_amount)}</span>
                      <span className="text-muted">/ {formatRupiah(goal.target_amount)}</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%`, background: goal.color }} />
                    </div>
                    <div className={styles.progressFooter}>
                      <span>{progress.toFixed(1)}%</span>
                      {!goal.is_completed && <span>{t.remaining}: {formatRupiah(remaining)}</span>}
                    </div>
                  </div>

                  {!goal.is_completed && (
                    <button className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={() => setShowContribute(goal)}>
                      + {t.contribute}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Add Goal Modal */}
        {showAdd && (
          <div className="modal-overlay" onClick={() => setShowAdd(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="modal-title">{t.addGoal}</h2>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowAdd(false)}><X size={20} /></button>
              </div>
              <div className="form-group">
                <label className="label">{t.goalName}</label>
                <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Beli Laptop ASUS ROG..." autoFocus />
              </div>
              <div className="form-group">
                <label className="label">{t.targetAmount}</label>
                <input className="input" value={form.targetAmount} onChange={e => setForm(f => ({ ...f, targetAmount: formatInputRupiah(e.target.value) }))} placeholder="0" inputMode="numeric" />
              </div>
              <div className="form-group">
                <label className="label">{t.targetDate} ({t.contributionNote})</label>
                <input type="date" className="input" value={form.targetDate} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="label">{t.categoryIcon}</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {ICON_OPTIONS.map(icon => (
                    <button key={icon} type="button" onClick={() => setForm(f => ({ ...f, icon }))}
                      style={{ width: 40, height: 40, fontSize: 20, border: form.icon === icon ? '2px solid var(--color-primary)' : '2px solid transparent', borderRadius: 8, background: form.icon === icon ? 'var(--color-primary-bg)' : 'var(--bg-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-actions">
                <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>{t.cancel}</button>
                <button className="btn btn-primary" onClick={handleAddGoal}>{t.save}</button>
              </div>
            </div>
          </div>
        )}

        {/* Contribute Modal */}
        {showContribute && (
          <div className="modal-overlay" onClick={() => setShowContribute(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="modal-title">{t.contribute}: {showContribute.name}</h2>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowContribute(null)}><X size={20} /></button>
              </div>
              <div className="form-group">
                <label className="label">{t.contributionAmount}</label>
                <input className="input" value={contribAmount} onChange={e => setContribAmount(formatInputRupiah(e.target.value))} placeholder="0" inputMode="numeric" autoFocus />
              </div>
              <div className="form-group">
                <label className="label">{t.contributionNote}</label>
                <input className="input" value={contribNote} onChange={e => setContribNote(e.target.value)} placeholder="Catatan..." />
              </div>
              <div className="form-actions">
                <button className="btn btn-secondary" onClick={() => setShowContribute(null)}>{t.cancel}</button>
                <button className="btn btn-primary" onClick={handleContribute}>{t.save}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
