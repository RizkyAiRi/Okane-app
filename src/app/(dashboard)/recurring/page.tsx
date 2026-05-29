'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/toast';
import Header from '@/components/layout/header';
import { getRecurringTemplates, createRecurringTemplate, confirmRecurring, getCategories } from '@/lib/services/data-service';
import { formatRupiah, formatInputRupiah, parseRupiah } from '@/lib/utils';
import type { RecurringTemplate, Category, TransactionType, Frequency } from '@/lib/types';
import { Plus, X, Check, Pause, Play } from 'lucide-react';
import styles from './recurring.module.css';

export default function RecurringPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { showToast } = useToast();
  const [templates, setTemplates] = useState<(RecurringTemplate & { category: Category })[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showConfirm, setShowConfirm] = useState<(RecurringTemplate & { category: Category }) | null>(null);
  const [confirmAmount, setConfirmAmount] = useState('');

  const [form, setForm] = useState({
    type: 'expense' as TransactionType,
    categoryId: '',
    description: '',
    defaultAmount: '',
    frequency: 'monthly' as Frequency,
    nextDueDate: '',
  });

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: tmpl }, { data: cats }] = await Promise.all([
      getRecurringTemplates(user.id),
      getCategories(user.id),
    ]);
    setTemplates((tmpl as (RecurringTemplate & { category: Category })[]) || []);
    setCategories(cats || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [user]);

  const handleAdd = async () => {
    if (!user || !form.categoryId || !form.defaultAmount || !form.nextDueDate) return;
    await createRecurringTemplate({
      user_id: user.id,
      category_id: form.categoryId,
      type: form.type,
      default_amount: parseRupiah(form.defaultAmount),
      description: form.description || undefined,
      frequency: form.frequency,
      next_due_date: new Date(form.nextDueDate).toISOString(),
    });
    setShowAdd(false);
    showToast('Template berhasil ditambahkan');
    loadData();
  };

  const handleConfirm = async () => {
    if (!user || !showConfirm) return;
    const amount = parseRupiah(confirmAmount) || showConfirm.default_amount;
    await confirmRecurring(showConfirm.id, amount, user.id);
    setShowConfirm(null);
    showToast(t.transactionAdded);
    loadData();
  };

  const openConfirm = (tmpl: RecurringTemplate & { category: Category }) => {
    setShowConfirm(tmpl);
    setConfirmAmount(formatInputRupiah(tmpl.default_amount.toString()));
  };

  const isDue = (dateStr: string) => new Date(dateStr) <= new Date();

  const freqLabels: Record<Frequency, string> = {
    daily: t.frequencyDaily,
    weekly: t.frequencyWeekly,
    monthly: t.frequencyMonthly,
    yearly: t.frequencyYearly,
  };

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className="page-header">
          <h1 className="page-title">{t.recurring}</h1>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={18} /> {t.addRecurring}
          </button>
        </div>

        <div className={styles.list}>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card"><div className="skeleton" style={{ height: 80 }} /></div>
            ))
          ) : templates.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-icon">🔄</p>
              <p className="empty-state-title">{t.noData}</p>
              <p className="empty-state-text">Buat template untuk transaksi berulang</p>
            </div>
          ) : (
            templates.map(tmpl => (
              <div key={tmpl.id} className={`card ${styles.templateCard} ${isDue(tmpl.next_due_date) && tmpl.is_active ? styles.dueCard : ''}`}>
                <div className={styles.templateInfo}>
                  <div className={styles.templateIcon}>
                    {tmpl.category?.icon || '🔄'}
                  </div>
                  <div>
                    <p className={styles.templateDesc}>{tmpl.description || tmpl.category?.name}</p>
                    <p className={styles.templateMeta}>
                      <span className={`badge ${tmpl.type === 'income' ? 'badge-income' : 'badge-expense'}`}>
                        {tmpl.type === 'income' ? t.income : t.expense}
                      </span>
                      <span>{freqLabels[tmpl.frequency as Frequency]}</span>
                      <span>•</span>
                      <span>{t.defaultAmount}: {formatRupiah(tmpl.default_amount)}</span>
                    </p>
                    <p className={styles.templateDue}>
                      {t.nextDueDate}: {new Date(tmpl.next_due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {isDue(tmpl.next_due_date) && tmpl.is_active && <span className={styles.dueBadge}>Jatuh Tempo!</span>}
                    </p>
                  </div>
                </div>
                <div className={styles.templateActions}>
                  {isDue(tmpl.next_due_date) && tmpl.is_active && (
                    <button className="btn btn-primary btn-sm" onClick={() => openConfirm(tmpl)}>
                      <Check size={16} /> {t.confirm}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Template Modal */}
        {showAdd && (
          <div className="modal-overlay" onClick={() => setShowAdd(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="modal-title">{t.addRecurring}</h2>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowAdd(false)}><X size={20} /></button>
              </div>
              <div className="form-group">
                <label className="label">{t.type}</label>
                <div className="toggle-group">
                  <button type="button" className={`toggle-btn ${form.type === 'income' ? 'active-income' : ''}`} onClick={() => setForm(f => ({ ...f, type: 'income' }))}>📈 {t.income}</button>
                  <button type="button" className={`toggle-btn ${form.type === 'expense' ? 'active-expense' : ''}`} onClick={() => setForm(f => ({ ...f, type: 'expense' }))}>📉 {t.expense}</button>
                </div>
              </div>
              <div className="form-group">
                <label className="label">{t.category}</label>
                <select className="input select" value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                  <option value="">{t.selectCategory}</option>
                  {categories.filter(c => c.type === form.type).map(cat => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">{t.description}</label>
                <input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Bayar Listrik..." />
              </div>
              <div className="form-group">
                <label className="label">{t.defaultAmount}</label>
                <input className="input" value={form.defaultAmount} onChange={e => setForm(f => ({ ...f, defaultAmount: formatInputRupiah(e.target.value) }))} placeholder="0" inputMode="numeric" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="label">{t.frequency}</label>
                  <select className="input select" value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value as Frequency }))}>
                    <option value="daily">{t.frequencyDaily}</option>
                    <option value="weekly">{t.frequencyWeekly}</option>
                    <option value="monthly">{t.frequencyMonthly}</option>
                    <option value="yearly">{t.frequencyYearly}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">{t.nextDueDate}</label>
                  <input type="date" className="input" value={form.nextDueDate} onChange={e => setForm(f => ({ ...f, nextDueDate: e.target.value }))} />
                </div>
              </div>
              <div className="form-actions">
                <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>{t.cancel}</button>
                <button className="btn btn-primary" onClick={handleAdd}>{t.save}</button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Recurring Modal */}
        {showConfirm && (
          <div className="modal-overlay" onClick={() => setShowConfirm(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="modal-title">{t.confirmRecurring}</h2>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowConfirm(null)}><X size={20} /></button>
              </div>
              <p className="text-secondary-text" style={{ marginBottom: 16 }}>
                {showConfirm.description || showConfirm.category?.name} — {t.adjustAmount}
              </p>
              <div className="form-group">
                <label className="label">{t.amount}</label>
                <input className="input" value={confirmAmount} onChange={e => setConfirmAmount(formatInputRupiah(e.target.value))} inputMode="numeric" autoFocus style={{ fontSize: 20, fontWeight: 800 }} />
              </div>
              <div className="form-actions">
                <button className="btn btn-secondary" onClick={() => setShowConfirm(null)}>{t.cancel}</button>
                <button className="btn btn-primary" onClick={handleConfirm}><Check size={16} /> {t.confirm}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
