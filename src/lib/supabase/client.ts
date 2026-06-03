import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    const errorMsg = 'Supabase environment variables are missing! Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env.local file, and then restart your development server (npm run dev).';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  return createBrowserClient(url, anonKey);
}
