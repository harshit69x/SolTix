import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const isNodeRuntime =
  typeof process !== 'undefined' &&
  !!process.versions?.node &&
  typeof window === 'undefined';

export function isSupabaseConfigured(): boolean {
  return !!supabaseUrl && !!supabaseAnonKey;
}

let cachedClient: SupabaseClient | null | undefined;
let loggedMissingOnce = false;

export function getSupabase(): SupabaseClient | null {
  if (cachedClient !== undefined) return cachedClient;

  if (!isSupabaseConfigured()) {
    if (!loggedMissingOnce) {
      loggedMissingOnce = true;
      console.error(
        'Supabase credentials missing. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY (EAS env/secrets) to enable backend features.'
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
