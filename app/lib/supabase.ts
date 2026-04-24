import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://wwzimaikmghcdkcsmbmh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3emltYWlrbWdoY2RrY3NtYm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NzAyOTUsImV4cCI6MjA5MjQ0NjI5NX0.wjK-qbvfsJY-Mb3drmIhYiSuj3ONlDYojbZrvq2ACY8";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;
  
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storageKey: 'bolt.supabase.auth',
      },
    });
  }
  return client;
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const supabaseEnabled = true;