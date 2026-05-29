# Okane-app
Aplikasi sederhana untuk mencatat, mengetahui, dan rekap keuangan sehari-hari.

## Fitur
- Pencatatan Pemasukan & Pengeluaran
- Manajemen Kategori
- Laporan & Analitik (Harian, Mingguan, Bulanan, Tahunan)
- Target Tabungan (Savings Goals)
- Transaksi Rutin (Recurring Transactions)
- Ekspor ke Excel
- Mendukung Dark Mode & Multi-bahasa (ID/EN)

## Teknologi
- [Next.js](https://nextjs.org/) (App Router)
- [Supabase](https://supabase.com/) (Auth, Database, RLS)
- [Tailwind CSS](https://tailwindcss.com/)
- [Recharts](https://recharts.org/) (Visualisasi Data)

## Cara Menjalankan (Lokal)
1. *Clone repository* ini
2. Buat file `.env.local` dan masukkan kredensial Supabase (`NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
3. Jalankan `npm install`
4. Jalankan `npm run dev`
5. Buka [http://localhost:3000](http://localhost:3000)
