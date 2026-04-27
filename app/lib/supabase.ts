import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function getSupabaseConfig() {
  const url = localStorage.getItem('bolt.supabase.url') || '';
  const key = localStorage.getItem('bolt.supabase.key') || '';
  return { url, key };
}

export function getSupabase(): SupabaseClient | null {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;
  
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