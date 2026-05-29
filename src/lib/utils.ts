/**
 * Format number to Indonesian Rupiah currency string
 * @example formatRupiah(1500000) => "Rp 1.500.000"
 */
export function formatRupiah(amount: number): string {
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return formatted;
}

/**
 * Parse Rupiah string back to number
 * @example parseRupiah("Rp 1.500.000") => 1500000
 */
export function parseRupiah(value: string): number {
  const cleaned = value.replace(/[^\d-]/g, '');
  return parseInt(cleaned, 10) || 0;
}

/**
 * Format number with dots as thousand separator
 * @example formatNumber(1500000) => "1.500.000"
 */
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('id-ID').format(amount);
}

/**
 * Format a number input value as user types (for Rupiah input)
 * @example formatInputRupiah("1500000") => "1.500.000"
 */
export function formatInputRupiah(value: string): string {
  const num = value.replace(/[^\d]/g, '');
  if (!num) return '';
  return new Intl.NumberFormat('id-ID').format(parseInt(num, 10));
}

/**
 * Calculate percentage change between two values
 */
export function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Get a greeting based on current time
 */
export function getGreeting(lang: 'id' | 'en' = 'id'): string {
  const hour = new Date().getHours();
  if (lang === 'id') {
    if (hour < 11) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  } else {
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }
}

/**
 * Generate a color palette for charts
 */
export const CHART_COLORS = [
  '#6366f1', // indigo
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ec4899', // pink
  '#14b8a6', // teal
  '#84cc16', // lime
];

/**
 * Truncate text to a max length
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}
