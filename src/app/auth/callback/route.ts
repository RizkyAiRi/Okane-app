import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Ensure profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single();

      if (!existingProfile) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
          language: 'id',
          theme: 'system',
        });

        // Seed default categories for new user
        const defaultCategories = [
          { user_id: data.user.id, name: 'Gaji', type: 'income', icon: '💰', color: '#10b981', is_default: true },
          { user_id: data.user.id, name: 'Freelance', type: 'income', icon: '💼', color: '#6366f1', is_default: true },
          { user_id: data.user.id, name: 'Investasi', type: 'income', icon: '📈', color: '#f59e0b', is_default: true },
          { user_id: data.user.id, name: 'Hadiah', type: 'income', icon: '🎁', color: '#ec4899', is_default: true },
          { user_id: data.user.id, name: 'Lainnya', type: 'income', icon: '💵', color: '#8b5cf6', is_default: true },
          { user_id: data.user.id, name: 'Makanan & Minuman', type: 'expense', icon: '🍔', color: '#ef4444', is_default: true },
          { user_id: data.user.id, name: 'Transportasi', type: 'expense', icon: '🚗', color: '#f97316', is_default: true },
          { user_id: data.user.id, name: 'Belanja', type: 'expense', icon: '🛒', color: '#ec4899', is_default: true },
          { user_id: data.user.id, name: 'Tagihan & Utilitas', type: 'expense', icon: '💡', color: '#06b6d4', is_default: true },
          { user_id: data.user.id, name: 'Hiburan', type: 'expense', icon: '🎮', color: '#8b5cf6', is_default: true },
          { user_id: data.user.id, name: 'Kesehatan', type: 'expense', icon: '🏥', color: '#14b8a6', is_default: true },
          { user_id: data.user.id, name: 'Pendidikan', type: 'expense', icon: '📚', color: '#6366f1', is_default: true },
          { user_id: data.user.id, name: 'Lainnya', type: 'expense', icon: '💵', color: '#64748b', is_default: true },
        ];
        await supabase.from('categories').insert(defaultCategories);
      }

      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
