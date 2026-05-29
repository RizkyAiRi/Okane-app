'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/toast';
import Header from '@/components/layout/header';
import { getTransactions } from '@/lib/services/data-service';
import { formatRupiah } from '@/lib/utils';
import type { Transaction, Category, TransactionType } from '@/lib/types';
import { FileDown, Download, Eye } from 'lucide-react';
import * as XLSX from 'xlsx';
import styles from './export.module.css';

export default function ExportPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { showToast } = useToast();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | ''>('');
  const [preview, setPreview] = useState<(Transaction & { category: Category })[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewed, setPreviewed] = useState(false);

  const handlePreview = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await getTransactions({
      userId: user.id,
      type: filterType || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate + 'T23:59:59') : undefined,
      pageSize: 10000,
    });
    setPreview(data || []);
    setPreviewed(true);
    setLoading(false);
  };

  const handleExport = () => {
    if (preview.length === 0) {
      showToast('Tidak ada data untuk diexport', 'error');
      return;
    }

    // Transaction sheet
    const txRows = preview.map(tx => ({
      'Tanggal': new Date(tx.transaction_date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      'Waktu': new Date(tx.transaction_date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      'Tipe': tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      'Kategori': tx.category?.name || '-',
      'Deskripsi': tx.description || '-',
      'Jumlah (Rp)': tx.amount,
    }));

    // Summary sheet
    const totalIncome = preview.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
    const totalExpense = preview.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);

    const summaryRows = [
      { 'Keterangan': 'Total Pemasukan', 'Jumlah (Rp)': totalIncome },
      { 'Keterangan': 'Total Pengeluaran', 'Jumlah (Rp)': totalExpense },
      { 'Keterangan': 'Saldo Bersih', 'Jumlah (Rp)': totalIncome - totalExpense },
      { 'Keterangan': '', 'Jumlah (Rp)': '' },
      { 'Keterangan': 'Jumlah Transaksi', 'Jumlah (Rp)': preview.length },
      { 'Keterangan': 'Periode', 'Jumlah (Rp)': `${startDate || 'Awal'} s/d ${endDate || 'Sekarang'}` },
    ];

    const wb = XLSX.utils.book_new();
    const wsTx = XLSX.utils.json_to_sheet(txRows);
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);

    // Auto-width columns
    const txCols = Object.keys(txRows[0] || {}).map(key => ({
      wch: Math.max(key.length, ...txRows.map(r => String((r as Record<string, unknown>)[key] || '').length)) + 2,
    }));
    wsTx['!cols'] = txCols;

    XLSX.utils.book_append_sheet(wb, wsTx, 'Transaksi');
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

    const fileName = `Okane_${startDate || 'all'}_${endDate || 'now'}.xlsx`;
    XLSX.writeFile(wb, fileName);
    showToast(`${fileName} berhasil diunduh!`);
  };

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className="page-header">
          <div>
            <h1 className="page-title">{t.exportToExcel}</h1>
            <p className="page-subtitle">Export transaksi ke file Excel (.xlsx)</p>
          </div>
          <FileDown size={32} className="text-primary-color" />
        </div>

        {/* Filters */}
        <div className={`card ${styles.filterCard}`}>
          <h3 className={styles.sectionTitle}>Filter Data</h3>
          <div className={styles.filterGrid}>
            <div className="form-group">
              <label className="label">Tanggal Mulai</label>
              <input type="date" className="input" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">Tanggal Akhir</label>
              <input type="date" className="input" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">{t.type}</label>
              <select className="input select" value={filterType} onChange={e => setFilterType(e.target.value as TransactionType | '')}>
                <option value="">{t.exportAll}</option>
                <option value="income">{t.income}</option>
                <option value="expense">{t.expense}</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button className="btn btn-secondary" onClick={handlePreview} disabled={loading}>
              <Eye size={16} /> {loading ? t.loading : t.exportPreview}
            </button>
            <button className="btn btn-primary" onClick={handleExport} disabled={preview.length === 0}>
              <Download size={16} /> {t.exportDownload}
            </button>
          </div>
        </div>

        {/* Preview */}
        {previewed && (
          <div className={`card ${styles.previewCard}`}>
            <h3 className={styles.sectionTitle}>{t.exportPreview} ({preview.length} transaksi)</h3>
            {preview.length > 0 ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>{t.dateTime}</th>
                      <th>{t.type}</th>
                      <th>{t.category}</th>
                      <th>{t.description}</th>
                      <th style={{ textAlign: 'right' }}>{t.amount}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 50).map(tx => (
                      <tr key={tx.id}>
                        <td>{new Date(tx.transaction_date).toLocaleDateString('id-ID')} {new Date(tx.transaction_date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
                        <td><span className={`badge ${tx.type === 'income' ? 'badge-income' : 'badge-expense'}`}>{tx.type === 'income' ? t.income : t.expense}</span></td>
                        <td>{tx.category?.icon} {tx.category?.name || '-'}</td>
                        <td>{tx.description || '-'}</td>
                        <td style={{ textAlign: 'right' }} className={tx.type === 'income' ? 'text-income' : 'text-expense'}>
                          {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 50 && <p className={styles.moreText}>...dan {preview.length - 50} transaksi lainnya</p>}
              </div>
            ) : (
              <div className="empty-state">
                <p className="empty-state-icon">📋</p>
                <p className="empty-state-text">{t.noData}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
