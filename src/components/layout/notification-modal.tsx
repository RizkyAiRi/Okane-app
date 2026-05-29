'use client';

import { X, Sparkles, Receipt, UserCircle, LayoutGrid } from 'lucide-react';
import styles from './notification-modal.module.css';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationModal({ isOpen, onClose }: NotificationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className={`modal ${styles.notificationModal}`} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <div className={styles.iconContainer}>
              <Sparkles size={20} className={styles.icon} />
            </div>
            <div>
              <h2 className={styles.title}>Okane Update</h2>
              <span className={styles.badge}>v1.1 Early Access</span>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          <p className={styles.greeting}>
            Halo! Ada beberapa fitur baru yang keren di pembaruan kali ini untuk mempermudah pencatatan keuanganmu.
          </p>

          <div className={styles.featureList}>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon} style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                <Receipt size={18} />
              </div>
              <div className={styles.featureText}>
                <h3>Scan Struk Otomatis (OCR AI)</h3>
                <p>Kini kamu bisa memfoto struk belanja dan AI akan otomatis mengenali harga dan nama barang untuk dimasukkan ke form transaksi. Coba saat tambah transaksi!</p>
              </div>
            </div>

            <div className={styles.featureItem}>
              <div className={styles.featureIcon} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                <UserCircle size={18} />
              </div>
              <div className={styles.featureText}>
                <h3>Akun Tamu (Guest)</h3>
                <p>Ingin merekomendasikan Okane ke teman tapi mereka belum mau daftar? Sekarang tersedia mode Guest untuk mencoba aplikasi secara instan.</p>
              </div>
            </div>

            <div className={styles.featureItem}>
              <div className={styles.featureIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                <LayoutGrid size={18} />
              </div>
              <div className={styles.featureText}>
                <h3>Optimasi UI Mobile & Edit Transaksi</h3>
                <p>Tampilan tabel di HP sekarang jauh lebih ringkas dan rapi (compact card view). Kami juga memastikan fitur edit transaksi berjalan lancar.</p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className="btn btn-primary" onClick={onClose} style={{ width: '100%', justifyContent: 'center' }}>
            Mengerti, Lanjutkan!
          </button>
        </div>
      </div>
    </div>
  );
}
