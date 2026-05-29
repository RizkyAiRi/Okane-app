'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/toast';
import Header from '@/components/layout/header';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/lib/services/data-service';
import type { Category, TransactionType } from '@/lib/types';
import { Plus, Edit3, Trash2, X } from 'lucide-react';
import styles from './categories.module.css';

const EMOJI_OPTIONS = ['💰', '💼', '📈', '🎁', '💵', '🍔', '🚗', '🛒', '💡', '🎮', '🏥', '📚', '🏠', '✈️', '👗', '💄', '🐾', '🎵', '⚽', '💻', '📱', '🎬', '☕', '🍕', '🥗', '💊', '🚌', '⛽', '🔧', '📦'];
const COLOR_OPTIONS = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#84cc16', '#64748b', '#0ea5e9'];

export default function CategoriesPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { showToast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<TransactionType>('expense');
  const [showModal, setShowModal] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', icon: '💰', color: '#6366f1' });
  const [loading, setLoading] = useState(true);

  const loadCategories = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await getCategories(user.id);
    setCategories(data || []);
    setLoading(false);
  };

  useEffect(() => { loadCategories(); }, [user]);

  const filtered = categories.filter(c => c.type === activeTab);

  const openAdd = () => {
    setEditCat(null);
    setForm({ name: '', icon: '💰', color: '#6366f1' });
    setShowModal(true);
  };

  const openEdit = (cat: Category) => {
    setEditCat(cat);
    setForm({ name: cat.name, icon: cat.icon, color: cat.color });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!user || !form.name.trim()) return;

    if (editCat) {
      await updateCategory(editCat.id, { name: form.name, icon: form.icon, color: form.color });
    } else {
      await createCategory({
        user_id: user.id,
        name: form.name,
        type: activeTab,
        icon: form.icon,
        color: form.color,
      });
    }

    setShowModal(false);
    showToast(editCat ? 'Kategori diperbarui' : 'Kategori ditambahkan');
    loadCategories();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus kategori ini?')) return;
    await deleteCategory(id);
    showToast('Kategori dihapus');
    loadCategories();
  };

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className="page-header">
          <h1 className="page-title">{t.categories}</h1>
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={18} /> {t.addCategory}
          </button>
        </div>

        {/* Tabs */}
        <div className="tabs" style={{ maxWidth: 300, marginBottom: 24 }}>
          <button className={`tab ${activeTab === 'expense' ? 'active' : ''}`} onClick={() => setActiveTab('expense')}>
            {t.expenseCategories}
          </button>
          <button className={`tab ${activeTab === 'income' ? 'active' : ''}`} onClick={() => setActiveTab('income')}>
            {t.incomeCategories}
          </button>
        </div>

        {/* Grid */}
        <div className={styles.grid}>
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={`card ${styles.catCard}`}>
                <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 12 }} />
                <div className="skeleton" style={{ width: 100, height: 16, marginTop: 8 }} />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              <p className="empty-state-icon">📂</p>
              <p className="empty-state-title">{t.noData}</p>
            </div>
          ) : (
            filtered.map(cat => (
              <div key={cat.id} className={`card ${styles.catCard}`}>
                <div className={styles.catIcon} style={{ background: cat.color + '20', color: cat.color }}>
                  <span>{cat.icon}</span>
                </div>
                <p className={styles.catName}>{cat.name}</p>
                {!cat.is_default && (
                  <div className={styles.catActions}>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(cat)}>
                      <Edit3 size={14} />
                    </button>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(cat.id)} style={{ color: 'var(--color-expense)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
                {cat.is_default && <span className={styles.defaultBadge}>Default</span>}
              </div>
            ))
          )}
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="modal-title">{editCat ? t.editCategory : t.addCategory}</h2>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
              </div>

              <div className="form-group">
                <label className="label">{t.categoryName}</label>
                <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nama kategori..." autoFocus />
              </div>

              <div className="form-group">
                <label className="label">{t.categoryIcon}</label>
                <div className={styles.emojiGrid}>
                  {EMOJI_OPTIONS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      className={`${styles.emojiBtn} ${form.icon === emoji ? styles.emojiActive : ''}`}
                      onClick={() => setForm(f => ({ ...f, icon: emoji }))}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="label">{t.categoryColor}</label>
                <div className={styles.colorGrid}>
                  {COLOR_OPTIONS.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`${styles.colorBtn} ${form.color === color ? styles.colorActive : ''}`}
                      style={{ background: color }}
                      onClick={() => setForm(f => ({ ...f, color }))}
                    />
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>{t.cancel}</button>
                <button className="btn btn-primary" onClick={handleSave}>{t.save}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
