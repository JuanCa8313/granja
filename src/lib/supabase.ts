import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://kwvknzlhgwmvgdzqhoxn.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3dmtuemxoZ3dtdmdkenFob3huIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwODM3ODMsImV4cCI6MjEwNDY1OTc4M30.pKdbofKamM-TxKpTzM7XmaQwkKw-RMxafJn-7DdFQ10';

export function getSupabaseConfig(): { url: string; anonKey: string } {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (envUrl && envKey) {
    return { url: envUrl, anonKey: envKey };
  }

  if (typeof window !== 'undefined') {
    const localUrl = localStorage.getItem('granja_supabase_url') || localStorage.getItem('finca_supabase_url') || '';
    const localKey = localStorage.getItem('granja_supabase_anon_key') || localStorage.getItem('finca_supabase_anon_key') || '';
    if (localUrl && localKey) {
      return { url: localUrl, anonKey: localKey };
    }
  }

  return { url: DEFAULT_SUPABASE_URL, anonKey: DEFAULT_SUPABASE_ANON_KEY };
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return cachedClient;
}
