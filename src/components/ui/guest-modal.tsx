'use client';

import { useRouter } from 'next/navigation';
import { LogIn, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface GuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export default function GuestModal({ isOpen, onClose, title = "Fitur Terkunci" }: GuestModalProps) {
  const router = useRouter();
  const { signOut } = useAuth();

  if (!isOpen) return null;

  const handleRegister = async () => {
    await signOut();
    router.push('/register');
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{
        backgroundColor: 'var(--color-bg-card)', padding: '24px', borderRadius: '16px',
        maxWidth: '400px', width: '90%', boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        position: 'relative', textAlign: 'center'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none',
          color: 'var(--color-text-muted)', cursor: 'pointer'
        }}>
          <X size={20} />
        </button>
        
        <div style={{
          width: '64px', height: '64px', borderRadius: '32px', backgroundColor: 'rgba(99, 102, 241, 0.1)',
          color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
        }}>
          <LogIn size={32} />
        </div>
        
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)' }}>
          {title}
        </h3>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px', fontSize: '0.95rem', lineHeight: 1.5 }}>
          Akun Tamu (Guest) memiliki akses terbatas. Buat akun pribadimu sekarang untuk menggunakan semua fitur Okane dan menyimpan data secara permanen!
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button className="btn btn-primary" onClick={handleRegister} style={{ width: '100%', justifyContent: 'center' }}>
            Daftar Sekarang
          </button>
          <button className="btn btn-ghost" onClick={onClose} style={{ width: '100%', justifyContent: 'center' }}>
            Nanti Saja
          </button>
        </div>
      </div>
    </div>
  );
}
