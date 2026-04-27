import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_URL = "https://wwzimaikmghcdkcsmbmh.supabase.co";
const DEFAULT_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3emltYWlrbWdoY2RrY3NtYm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NzAyOTUsImV4cCI6MjA5MjQ0NjI5NX0.wjK-qbvfsJY-Mb3drmIhYiSuj3ONlDYojbZrvq2ACY8";

let client: SupabaseClient | null = null;

export function getSupabaseConfig() {
  if (typeof window === 'undefined') return { url: DEFAULT_URL, key: DEFAULT_KEY };
  
  const url = localStorage.getItem('bolt.supabase.url') || DEFAULT_URL;
  const key = localStorage.getItem('bolt.supabase.key') || DEFAULT_KEY;
  
  return { url, key };
}

export function getSupabase(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;
  
  const { url, key } = getSupabaseConfig();
  
  if (!client || client.supabaseUrl !== url) {
    client = createClient(url, key, {
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

export const supabase = getSupabase();
export const supabaseEnabled = true;