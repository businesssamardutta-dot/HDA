import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default Supabase project credentials (provided by user)
const DEFAULT_SUPABASE_URL = 'https://zakajrrmzzybyptypjdt.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpha2FqcnJtenp5YnlwdHlwamR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyODk4NzMsImV4cCI6MjA5NTg2NTg3M30.IrWQsa1s6kzgNzhoa-NXOtz9OUeKZcY2MF6e8Zp4LXU';

// Read env variables safely and normalize URL (strip REST endpoint path if present)
const metaEnv = (import.meta as any).env || {};
let rawUrl = (metaEnv.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL || '').trim();
// Clean any trailing /rest/v1 or /rest/v1/ or slashes
rawUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

const supabaseUrl = rawUrl;
const supabaseAnonKey = (metaEnv.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.trim() !== '' && 
  supabaseAnonKey.trim() !== '' &&
  !supabaseUrl.includes('YOUR_SUPABASE')
);

let supabaseInstance: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    console.log('✅ Supabase Client initialized with target URL:', supabaseUrl);
  } catch (err) {
    console.warn('⚠️ Supabase initialization failed, running in resilient fallback mode:', err);
  }
} else {
  console.info('ℹ️ Supabase environment variables not set. Haribansho Delivery App is running in zero-latency resilient local store mode.');
}

export const supabase = supabaseInstance;

export const checkSupabaseConnection = async (): Promise<{ ok: boolean; message: string }> => {
  if (!isSupabaseConfigured || !supabase) {
    return { 
      ok: false, 
      message: 'Supabase credentials not configured in .env (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).' 
    };
  }

  try {
    const { error } = await supabase.from('01_orders').select('id').limit(1);
    if (error) {
      if (error.code === '42P01') {
        return {
          ok: false,
          message: 'Connected to Supabase, but "01_*" tables are not created yet. Please execute the SQL Migration in your Supabase SQL Editor.'
        };
      }
      return { ok: false, message: error.message };
    }
    return { ok: true, message: 'Successfully connected to Supabase and verified "01_*" tables!' };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Failed to connect to Supabase.' };
  }
};

