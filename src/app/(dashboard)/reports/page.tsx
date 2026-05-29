'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import Header from '@/components/layout/header';
import { getTransactions, getCategorySummary } from '@/lib/services/data-service';
import { formatRupiah } from '@/lib/utils';
import type { CategorySummary, ChartDataPoint, TransactionType } from '@/lib/types';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subWeeks, subMonths, format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  AreaChart, Area, PieChart, Pie, Cell,
} from 'recharts';
import styles from './reports.module.css';

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

export default function ReportsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [period, setPeriod] = useState<Period>('monthly');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [categorySummary, setCategorySummary] = useState<CategorySummary[]>([]);
  const [totals, setTotals] = useState({ income: 0, expense: 0 });
  const [loading, setLoading] = useState(true);

  const getDateRange = useCallback(() => {
    const now = new Date();
    switch (period) {
      case 'daily': return { start: subDays(now, 6), end: now };
      case 'weekly': return { start: subWeeks(now, 7), end: now };
      case 'monthly': return { start: subMonths(now, 11), end: now };
      case 'yearly': return { start: new Date(now.getFullYear() - 4, 0, 1), end: now };
    }
  }, [period]);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { start, end } = getDateRange();

    const { data: txData } = await getTransactions({
      userId: user.id,
      startDate: startOfDay(start),
      endDate: endOfDay(end),
      pageSize: 10000,
    });

    const transactions = txData || [];
    let income = 0, expense = 0;
    transactions.forEach(tx => {
      if (tx.type === 'income') income += tx.amount;
      else expense += tx.amount;
    });
    setTotals({ income, expense });

    // Build chart data based on period
    let dataPoints: ChartDataPoint[] = [];

    if (period === 'daily') {
      const days = eachDayOfInterval({ start, end });
      dataPoints = days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayTx = transactions.filter(tx => format(new Date(tx.transaction_date), 'yyyy-MM-dd') === dayStr);
        return {
          label: format(day, 'dd MMM', { locale: idLocale }),
          date: dayStr,
          income: dayTx.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0),
          expense: dayTx.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0),
        };
      });
    } else if (period === 'weekly') {
      const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
      dataPoints = weeks.map((weekStart, i) => {
        const weekEnd = i < weeks.length - 1 ? subDays(weeks[i + 1], 1) : end;
        const weekTx = transactions.filter(tx => {
          const d = new Date(tx.transaction_date);
          return d >= weekStart && d <= endOfDay(weekEnd);
        });
        return {
          label: `${format(weekStart, 'dd MMM', { locale: idLocale })}`,
          date: format(weekStart, 'yyyy-MM-dd'),
          income: weekTx.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0),
          expense: weekTx.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0),
        };
      });
    } else if (period === 'monthly') {
      const months = eachMonthOfInterval({ start, end });
      dataPoints = months.map(month => {
        const monthStr = format(month, 'yyyy-MM');
        const monthTx = transactions.filter(tx => format(new Date(tx.transaction_date), 'yyyy-MM') === monthStr);
        return {
          label: format(month, 'MMM yy', { locale: idLocale }),
          date: monthStr,
          income: monthTx.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0),
          expense: monthTx.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0),
        };
      });
    } else {
      for (let y = start.getFullYear(); y <= end.getFullYear(); y++) {
        const yearTx = transactions.filter(tx => new Date(tx.transaction_date).getFullYear() === y);
        dataPoints.push({
          label: y.toString(),
          date: y.toString(),
          income: yearTx.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0),
          expense: yearTx.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0),
        });
      }
    }

    setChartData(dataPoints);

    // Category summary
    const catSummary = await getCategorySummary(user.id, 'expense', startOfDay(start), endOfDay(end));
    setCategorySummary(catSummary);

    setLoading(false);
  }, [user, period, getDateRange]);

  useEffect(() => { loadData(); }, [loadData]);

  const periodLabels: Record<Period, string> = {
    daily: t.daily,
    weekly: t.weekly,
    monthly: t.monthly,
    yearly: t.yearly,
  };

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className="page-header">
          <h1 className="page-title">{t.reports}</h1>
          <div className="tabs" style={{ maxWidth: 400 }}>
            {(['daily', 'weekly', 'monthly', 'yearly'] as Period[]).map(p => (
              <button key={p} className={`tab ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>
                {periodLabels[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid-summary" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="card">
            <div className={styles.summaryIcon} style={{ background: 'var(--color-income-bg)', color: 'var(--color-income)' }}><TrendingUp size={20} /></div>
            <p className={styles.summaryLabel}>{t.totalIncome}</p>
            <p className={`${styles.summaryValue} text-income`}>{formatRupiah(totals.income)}</p>
          </div>
          <div className="card">
            <div className={styles.summaryIcon} style={{ background: 'var(--color-expense-bg)', color: 'var(--color-expense)' }}><TrendingDown size={20} /></div>
            <p className={styles.summaryLabel}>{t.totalExpense}</p>
            <p className={`${styles.summaryValue} text-expense`}>{formatRupiah(totals.expense)}</p>
          </div>
          <div className="card">
            <div className={styles.summaryIcon} style={{ background: 'var(--color-primary-bg)', color: 'var(--color-primary)' }}><Wallet size={20} /></div>
            <p className={styles.summaryLabel}>{t.netBalance}</p>
            <p className={`${styles.summaryValue} ${totals.income - totals.expense >= 0 ? 'text-income' : 'text-expense'}`}>
              {formatRupiah(totals.income - totals.expense)}
            </p>
          </div>
        </div>

        {/* Bar Chart */}
        <div className={`card ${styles.chartSection}`}>
          <h3 className={styles.sectionTitle}>{t.incomeVsExpense}</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
              <XAxis dataKey="label" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} />
              <YAxis stroke="var(--text-tertiary)" fontSize={12} tickLine={false} tickFormatter={v => `${(v / 1000000).toFixed(1)}jt`} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 12, color: 'var(--text-primary)' }}
                formatter={(value: number) => formatRupiah(value)}
              />
              <Legend formatter={v => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{v}</span>} />
              <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} name={t.income} />
              <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} name={t.expense} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Area + Donut row */}
        <div className={styles.chartsRow}>
          <div className={`card ${styles.chartSection}`}>
            <h3 className={styles.sectionTitle}>{t.trend}</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-income)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--color-income)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-expense)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--color-expense)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                <XAxis dataKey="label" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--text-tertiary)" fontSize={12} tickLine={false} tickFormatter={v => `${(v / 1000000).toFixed(1)}jt`} />
                <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 12, color: 'var(--text-primary)' }} formatter={(v: number) => formatRupiah(v)} />
                <Area type="monotone" dataKey="income" stroke="var(--color-income)" fill="url(#gradIncome)" strokeWidth={2} name={t.income} />
                <Area type="monotone" dataKey="expense" stroke="var(--color-expense)" fill="url(#gradExpense)" strokeWidth={2} name={t.expense} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className={`card ${styles.chartSection}`}>
            <h3 className={styles.sectionTitle}>{t.distribution}</h3>
            {categorySummary.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={categorySummary} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="total" nameKey="category_name">
                      {categorySummary.map((entry, i) => <Cell key={i} fill={entry.category_color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 12, color: 'var(--text-primary)' }} formatter={(v: number) => formatRupiah(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className={styles.catList}>
                  {categorySummary.slice(0, 6).map(cat => (
                    <div key={cat.category_id} className={styles.catItem}>
                      <span className={styles.catDot} style={{ background: cat.category_color }} />
                      <span className={styles.catLabel}>{cat.category_icon} {cat.category_name}</span>
                      <span className={styles.catPct}>{cat.percentage.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-state"><p className="empty-state-icon">📊</p><p className="empty-state-text">{t.noData}</p></div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
