import { supabase } from '@/services/supabase';
import type { ProfileRow } from '@/types/database';

// ─── Upsert Profile (create or update) ───
// Called on every wallet connection to ensure the wallet is saved in Supabase.
export async function upsertProfile(walletAddress: string): Promise<ProfileRow> {
  // First try to find existing profile
  const { data: existing, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('wallet_address', walletAddress)
    .maybeSingle();

  if (fetchError) {
    console.error('Error checking profile:', fetchError.message);
    // Don't throw — profile creation is non-critical and shouldn't block wallet connection
  }

  if (existing) {
    return existing as ProfileRow;
  }

  // Create new profile
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      wallet_address: walletAddress,
      display_name: null,
      avatar_url: null,
    })
    .select()
    .single();

  if (error) {
    // If it's a uniqueness conflict (race condition), fetch the existing one
    if (error.code === '23505') {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      if (existingProfile) {
        return existingProfile as ProfileRow;
      }
    }

    console.error('Error creating profile:', error.message);
    throw new Error(`Failed to create profile: ${error.message}`);
  }

  return data as ProfileRow;
}

// ─── Fetch Profile by Wallet ───
export async function fetchProfileByWallet(walletAddress: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('wallet_address', walletAddress)
    .maybeSingle();

  if (error) {
    console.error('Error fetching profile:', error.message);
    return null;
  }

  return data as ProfileRow | null;
}

// ─── Update Profile Display Name ───
export async function updateProfileDisplayName(
  walletAddress: string,
  displayName: string
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName })
    .eq('wallet_address', walletAddress);

  if (error) {
    console.error('Error updating profile display name:', error.message);
    throw new Error(error.message);
  }
}
