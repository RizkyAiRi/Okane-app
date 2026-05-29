'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/toast';
import Header from '@/components/layout/header';
import TransactionForm from '@/components/transactions/transaction-form';
import { getDashboardSummary, getChartData, getCategorySummary, getTransactions } from '@/lib/services/data-service';
import { formatRupiah, percentChange } from '@/lib/utils';
import type { Transaction, Category, CategorySummary, ChartDataPoint } from '@/lib/types';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import styles from './dashboard.module.css';

interface DashboardSummaryData {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  prevMonthIncome: number;
  prevMonthExpense: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { showToast } = useToast();

  const [summary, setSummary] = useState<DashboardSummaryData | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [categorySummary, setCategorySummary] = useState<CategorySummary[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<(Transaction & { category: Category })[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [summaryData, chart, categories, recent] = await Promise.all([
        getDashboardSummary(user.id),
        getChartData(user.id, 7),
        getCategorySummary(user.id, 'expense'),
        getTransactions({ userId: user.id, page: 1, pageSize: 5 }),
      ]);

      setSummary(summaryData);
      setChartData(chart);
      setCategorySummary(categories);
      setRecentTransactions(recent.data || []);
    } catch {
      showToast(t.errorGeneric, 'error');
    }
    setLoading(false);
  }, [user, t, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTransactionSaved = () => {
    setShowForm(false);
    showToast(t.transactionAdded);
    loadData();
  };

  const incomeChange = summary
    ? percentChange(summary.monthlyIncome, summary.prevMonthIncome)
    : 0;
  const expenseChange = summary
    ? percentChange(summary.monthlyExpense, summary.prevMonthExpense)
    : 0;

  if (loading || !summary) {
    return (
      <>
        <Header onAddTransaction={() => setShowForm(true)} />
        <div className={styles.container}>
          <div className="grid-summary">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="card">
                <div className="skeleton" style={{ width: 120, height: 14, marginBottom: 12 }} />
                <div className="skeleton" style={{ width: 180, height: 32 }} />
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header onAddTransaction={() => setShowForm(true)} />
      <div className={styles.container}>
        {/* Summary Cards */}
        <div className="grid-summary">
          <div className={`card ${styles.summaryCard} ${styles.balanceCard}`}>
            <div className={styles.cardIcon}>
              <Wallet size={22} />
            </div>
            <p className={styles.cardLabel}>{t.totalBalance}</p>
            <p className={`${styles.cardValue} text-balance`}>
              {formatRupiah(summary.totalBalance)}
            </p>
          </div>

          <div className={`card ${styles.summaryCard} ${styles.incomeCard}`}>
            <div className={styles.cardIcon} style={{ background: 'var(--color-income-bg)', color: 'var(--color-income)' }}>
              <TrendingUp size={22} />
            </div>
            <p className={styles.cardLabel}>{t.monthlyIncome}</p>
            <p className={`${styles.cardValue} text-income`}>
              {formatRupiah(summary.monthlyIncome)}
            </p>
            <div className={styles.cardChange}>
              {incomeChange >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              <span>{Math.abs(incomeChange).toFixed(1)}% {t.monthlyComparison}</span>
            </div>
          </div>

          <div className={`card ${styles.summaryCard} ${styles.expenseCard}`}>
            <div className={styles.cardIcon} style={{ background: 'var(--color-expense-bg)', color: 'var(--color-expense)' }}>
              <TrendingDown size={22} />
            </div>
            <p className={styles.cardLabel}>{t.monthlyExpense}</p>
            <p className={`${styles.cardValue} text-expense`}>
              {formatRupiah(summary.monthlyExpense)}
            </p>
            <div className={styles.cardChange}>
              {expenseChange <= 0 ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
              <span>{Math.abs(expenseChange).toFixed(1)}% {t.monthlyComparison}</span>
            </div>
          </div>

          <div className={`card ${styles.summaryCard}`}>
            <div className={styles.cardIcon} style={{ background: 'var(--color-primary-bg)', color: 'var(--color-primary)' }}>
              <Wallet size={22} />
            </div>
            <p className={styles.cardLabel}>{t.netBalance}</p>
            <p className={`${styles.cardValue} ${summary.monthlyIncome - summary.monthlyExpense >= 0 ? 'text-income' : 'text-expense'}`}>
              {formatRupiah(summary.monthlyIncome - summary.monthlyExpense)}
            </p>
            <p className={styles.cardSubtext}>{t.monthly}</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className={styles.chartsRow}>
          {/* Line Chart */}
          <div className={`card ${styles.chartCard}`}>
            <h3 className={styles.sectionTitle}>{t.incomeVsExpense}</h3>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                  <XAxis dataKey="label" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} />
                  <YAxis stroke="var(--text-tertiary)" fontSize={12} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                    }}
                    formatter={(value: number) => formatRupiah(value)}
                  />
                  <Line type="monotone" dataKey="income" stroke="var(--color-income)" strokeWidth={2.5} dot={{ r: 4, fill: 'var(--color-income)' }} name={t.income} />
                  <Line type="monotone" dataKey="expense" stroke="var(--color-expense)" strokeWidth={2.5} dot={{ r: 4, fill: 'var(--color-expense)' }} name={t.expense} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Donut Chart */}
          <div className={`card ${styles.chartCard}`}>
            <h3 className={styles.sectionTitle}>{t.expenseByCategory}</h3>
            <div className={styles.chartContainer}>
              {categorySummary.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={categorySummary}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="total"
                      nameKey="category_name"
                    >
                      {categorySummary.map((entry, index) => (
                        <Cell key={index} fill={entry.category_color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-primary)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-primary)',
                      }}
                      formatter={(value: number) => formatRupiah(value)}
                    />
                    <Legend
                      formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state">
                  <p className="empty-state-icon">📊</p>
                  <p className="empty-state-text">{t.noData}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className={`card ${styles.recentSection}`}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>{t.recentTransactions}</h3>
            <a href="/transactions" className={`btn btn-ghost btn-sm`}>{t.viewAll} →</a>
          </div>

          {recentTransactions.length > 0 ? (
            <div className={styles.transactionList}>
              {recentTransactions.map((tx) => (
                <div key={tx.id} className={styles.transactionItem}>
                  <div className={styles.txIcon}>
                    {tx.category?.icon || (tx.type === 'income' ? '📈' : '📉')}
                  </div>
                  <div className={styles.txInfo}>
                    <p className={styles.txDesc}>{tx.description || tx.category?.name || '-'}</p>
                    <p className={styles.txMeta}>
                      {tx.category?.name} • {new Date(tx.transaction_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <p className={`${styles.txAmount} ${tx.type === 'income' ? 'text-income' : 'text-expense'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p className="empty-state-icon">💰</p>
              <p className="empty-state-title">{t.noData}</p>
              <p className="empty-state-text">Mulai catat transaksi pertamamu!</p>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Form Modal */}
      {showForm && (
        <TransactionForm
          onClose={() => setShowForm(false)}
          onSaved={handleTransactionSaved}
        />
      )}
    </>
  );
}
