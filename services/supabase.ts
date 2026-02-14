import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const isNodeRuntime =
  typeof process !== 'undefined' &&
  !!process.versions?.node &&
  typeof window === 'undefined';

function isLikelyValidSupabasePublicKey(key: string | undefined): boolean {
  if (!key) return false;
  const value = key.trim();
  if (!value) return false;
  if (value.includes('your_') || value.includes('secrxet')) return false;
  return value.startsWith('eyJ') || value.startsWith('sb_publishable_');
}

export function isSupabaseConfigured(): boolean {
  return !!supabaseUrl && isLikelyValidSupabasePublicKey(supabaseAnonKey);
}

let cachedClient: SupabaseClient | null | undefined;
let loggedMissingOnce = false;

export function getSupabase(): SupabaseClient | null {
  if (cachedClient !== undefined) return cachedClient;

  if (!isSupabaseConfigured()) {
    if (!loggedMissingOnce) {
      loggedMissingOnce = true;
      console.error(
        'Supabase credentials missing/invalid. Using local mode.'
      );
    }
    cachedClient = null;
    return cachedClient;
  }

  cachedClient = createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      storage: isNodeRuntime ? undefined : AsyncStorage,
      autoRefreshToken: !isNodeRuntime,
      persistSession: !isNodeRuntime,
      detectSessionInUrl: false,
    },
  });

  return cachedClient;
}
