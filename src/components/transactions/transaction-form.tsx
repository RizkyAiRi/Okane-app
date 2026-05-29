'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { getCategories, createTransaction, updateTransaction } from '@/lib/services/data-service';
import { formatInputRupiah, parseRupiah } from '@/lib/utils';
import type { Category, Transaction, TransactionType } from '@/lib/types';
import { X, Camera, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import styles from './transaction-form.module.css';

interface TransactionFormProps {
  onClose: () => void;
  onSaved: () => void;
  editTransaction?: Transaction & { category?: Category };
}

export default function TransactionForm({ onClose, onSaved, editTransaction }: TransactionFormProps) {
  const { user } = useAuth();
  const { t } = useI18n();
  const { showToast } = useToast();

  const [type, setType] = useState<TransactionType>(editTransaction?.type || 'expense');
  const [amountDisplay, setAmountDisplay] = useState(editTransaction ? formatInputRupiah(editTransaction.amount.toString()) : '');
  const [categoryId, setCategoryId] = useState(editTransaction?.category_id || '');
  const [description, setDescription] = useState(editTransaction?.description || '');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Set default date/time
    if (editTransaction) {
      const d = new Date(editTransaction.transaction_date);
      setDate(d.toISOString().split('T')[0]);
      setTime(d.toTimeString().slice(0, 5));
    } else {
      const now = new Date();
      setDate(now.toISOString().split('T')[0]);
      setTime(now.toTimeString().slice(0, 5));
    }
  }, [editTransaction]);

  useEffect(() => {
    if (!user) return;
    getCategories(user.id, type).then(({ data }) => {
      setCategories(data || []);
      // Reset category when type changes (unless editing)
      if (!editTransaction) {
        setCategoryId('');
      }
    });
  }, [user, type, editTransaction]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const amount = parseRupiah(amountDisplay);
    if (!amount || amount < 1) newErrors.amount = t.errorMinAmount;
    if (!categoryId) newErrors.category = t.errorRequired;
    if (!date) newErrors.date = t.errorRequired;
    if (!time) newErrors.time = t.errorRequired;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !validate()) return;

    setSaving(true);
    const amount = parseRupiah(amountDisplay);
    const transactionDate = new Date(`${date}T${time}`).toISOString();

    if (editTransaction) {
      await updateTransaction(editTransaction.id, {
        type,
        amount,
        category_id: categoryId,
        description: description || undefined,
        transaction_date: transactionDate,
      });
    } else {
      await createTransaction({
        user_id: user.id,
        type,
        amount,
        category_id: categoryId,
        description: description || undefined,
        transaction_date: transactionDate,
      });
    }

    setSaving(false);
    onSaved();
  };

  const handleScanReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const res = await fetch('/api/scan-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64data }),
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Gagal memindai struk');
        }

        if (data.amount && data.amount > 0) {
          setAmountDisplay(formatInputRupiah(data.amount.toString()));
          if (data.description) {
            setDescription(data.description);
          }
          setType('expense');
          showToast('Data struk berhasil diekstrak!');
        } else {
          showToast('Tidak dapat menemukan nominal di struk', 'error');
        }
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error(error);
      showToast(error.message || 'Terjadi kesalahan OCR', 'error');
    } finally {
      setScanning(false);
      e.target.value = ''; // reset input
    }
  };

  const handleAmountChange = (value: string) => {
    const formatted = formatInputRupiah(value);
    setAmountDisplay(formatted);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {editTransaction ? t.editTransaction : t.addTransaction}
            {!editTransaction && (
              <label className={`btn btn-sm ${styles.scanBtn}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', background: 'rgba(99,102,241,0.1)', color: 'var(--color-primary)', border: 'none', padding: '6px 12px', borderRadius: '16px', fontSize: '0.85rem' }}>
                {scanning ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                {scanning ? 'Memindai...' : 'Scan Struk'}
                <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleScanReceipt} disabled={scanning} />
              </label>
            )}
          </h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Type toggle */}
          <div className="form-group">
            <label className="label">{t.type}</label>
            <div className="toggle-group">
              <button
                type="button"
                className={`toggle-btn ${type === 'income' ? 'active-income' : ''}`}
                onClick={() => setType('income')}
              >
                📈 {t.income}
              </button>
              <button
                type="button"
                className={`toggle-btn ${type === 'expense' ? 'active-expense' : ''}`}
                onClick={() => setType('expense')}
              >
                📉 {t.expense}
              </button>
            </div>
          </div>

          {/* Amount */}
          <div className="form-group">
            <label className="label">{t.amount}</label>
            <div className={styles.amountInput}>
              <span className={styles.currency}>Rp</span>
              <input
                type="text"
                className={`input ${styles.amountField}`}
                placeholder="0"
                value={amountDisplay}
                onChange={e => handleAmountChange(e.target.value)}
                inputMode="numeric"
                autoFocus
              />
            </div>
            {errors.amount && <p className={styles.errorText}>{errors.amount}</p>}
          </div>

          {/* Category */}
          <div className="form-group">
            <label className="label">{t.category}</label>
            <select
              className="input select"
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
            >
              <option value="">{t.selectCategory}</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
            {errors.category && <p className={styles.errorText}>{errors.category}</p>}
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="label">{t.description}</label>
            <input
              type="text"
              className="input"
              placeholder={t.enterDescription}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          {/* Date & Time */}
          <div className="form-row">
            <div className="form-group">
              <label className="label">{t.date}</label>
              <input
                type="date"
                className="input"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
              {errors.date && <p className={styles.errorText}>{errors.date}</p>}
            </div>
            <div className="form-group">
              <label className="label">{t.time}</label>
              <input
                type="time"
                className="input"
                value={time}
                onChange={e => setTime(e.target.value)}
              />
              {errors.time && <p className={styles.errorText}>{errors.time}</p>}
            </div>
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {t.cancel}
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? t.loading : t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
