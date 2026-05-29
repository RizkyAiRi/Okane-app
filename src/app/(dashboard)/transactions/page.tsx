'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/toast';
import Header from '@/components/layout/header';
import TransactionForm from '@/components/transactions/transaction-form';
import { getTransactions, deleteTransaction, getCategories } from '@/lib/services/data-service';
import { formatRupiah } from '@/lib/utils';
import type { Transaction, Category, TransactionType } from '@/lib/types';
import { Search, Trash2, Edit3, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './transactions.module.css';

export default function TransactionsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { showToast } = useToast();

  const [transactions, setTransactions] = useState<(Transaction & { category: Category })[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTx, setEditTx] = useState<(Transaction & { category: Category }) | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Filters
  const [filterType, setFilterType] = useState<TransactionType | ''>('');
  const [filterCategory, setFilterCategory] = useState('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadTransactions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, count } = await getTransactions({
      userId: user.id,
      type: filterType || undefined,
      categoryId: filterCategory || undefined,
      search: search || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate + 'T23:59:59') : undefined,
      page,
      pageSize,
    });
    setTransactions(data || []);
    setTotal(count || 0);
    setLoading(false);
  }, [user, filterType, filterCategory, search, startDate, endDate, page]);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  useEffect(() => {
    if (!user) return;
    getCategories(user.id).then(({ data }) => setCategories(data || []));
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm(t.deleteTransactionConfirm)) return;
    await deleteTransaction(id);
    showToast(t.transactionDeleted);
    loadTransactions();
  };

  const handleEdit = (tx: Transaction & { category: Category }) => {
    setEditTx(tx);
    setShowForm(true);
  };

  const handleSaved = () => {
    setShowForm(false);
    setEditTx(null);
    showToast(editTx ? t.transactionUpdated : t.transactionAdded);
    loadTransactions();
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      <Header onAddTransaction={() => { setEditTx(null); setShowForm(true); }} />
      <div className={styles.container}>
        <div className="page-header">
          <div>
            <h1 className="page-title">{t.transactions}</h1>
            <p className="page-subtitle">{total} transaksi</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setEditTx(null); setShowForm(true); }}>
            + {t.addTransaction}
          </button>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              className={`input ${styles.searchInput}`}
              placeholder={`${t.search}...`}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <select
            className="input select"
            value={filterType}
            onChange={e => { setFilterType(e.target.value as TransactionType | ''); setPage(1); }}
            style={{ maxWidth: 160 }}
          >
            <option value="">{t.all} {t.type}</option>
            <option value="income">{t.income}</option>
            <option value="expense">{t.expense}</option>
          </select>

          <select
            className="input select"
            value={filterCategory}
            onChange={e => { setFilterCategory(e.target.value); setPage(1); }}
            style={{ maxWidth: 200 }}
          >
            <option value="">{t.all} {t.category}</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
            ))}
          </select>

          <input type="date" className="input" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }} style={{ maxWidth: 160 }} />
          <input type="date" className="input" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }} style={{ maxWidth: 160 }} />
        </div>

        {/* Table */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>{t.dateTime}</th>
                <th>{t.type}</th>
                <th>{t.category}</th>
                <th>{t.description}</th>
                <th style={{ textAlign: 'right' }}>{t.amount}</th>
                <th style={{ textAlign: 'center', width: 100 }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j}><div className="skeleton" style={{ height: 16, width: '80%' }} /></td>
                    ))}
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <p className="empty-state-icon">📋</p>
                      <p className="empty-state-title">{t.noData}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map(tx => (
                  <tr key={tx.id}>
                    <td data-label={t.dateTime}>
                      <span className={styles.dateText}>
                        {new Date(tx.transaction_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      <span className={styles.timeText}>
                        {new Date(tx.transaction_date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td data-label={t.type}>
                      <span className={`badge ${tx.type === 'income' ? 'badge-income' : 'badge-expense'}`}>
                        {tx.type === 'income' ? t.income : t.expense}
                      </span>
                    </td>
                    <td data-label={t.category}>
                      <span className={styles.categoryCell}>
                        <span>{tx.category?.icon}</span>
                        <span>{tx.category?.name || '-'}</span>
                      </span>
                    </td>
                    <td data-label={t.description} className={styles.descCell}>{tx.description || '-'}</td>
                    <td data-label={t.amount} style={{ textAlign: 'right' }}>
                      <span className={`${styles.amountText} ${tx.type === 'income' ? 'text-income' : 'text-expense'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                      </span>
                    </td>
                    <td data-label="Aksi">
                      <div className={styles.actions}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleEdit(tx)} title={t.edit}>
                          <Edit3 size={15} />
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(tx.id)} title={t.delete} style={{ color: 'var(--color-expense)' }}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft size={16} /> Prev
            </button>
            <span className={styles.pageInfo}>{page} / {totalPages}</span>
            <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <TransactionForm
          onClose={() => { setShowForm(false); setEditTx(null); }}
          onSaved={handleSaved}
          editTransaction={editTx || undefined}
        />
      )}
    </>
  );
}
