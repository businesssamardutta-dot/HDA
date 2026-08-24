import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Read env variables safely
const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || '';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || '';

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
  console.info('ℹ️ Supabase environment variables not set yet. Haribansho Delivery App is running in zero-latency resilient local store mode with full live CRUD & real-time simulation.');
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
