import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function getSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL || '';
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  
  return { url, key };
}

export function getSupabase(): SupabaseClient | null {
  const { url, key } = getSupabaseConfig();
  
  if (!url || !key) {
    console.error('Supabase configuration missing. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
    return null;
  }
  
  return createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storageKey: 'bolt.supabase.auth',
    },
  });
}

export const supabase = getSupabase();
export const supabaseEnabled = !!supabase;