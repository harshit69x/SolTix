import { getBalance } from '@/services/solana';
import { upsertProfile } from '@/services/profile-service';
import {
  connectPhantomWallet,
  connectSolflareWallet,
  disconnectWallet as disconnectWalletService,
  restoreSavedWallet,
  saveWalletAddress,
} from '@/services/wallet-service';
import { create } from 'zustand';

interface WalletStore {
  connected: boolean;
  publicKey: string | null;
  balance: number;
  connecting: boolean;
  error: string | null;
  walletProvider: string | null;

  connect: (provider?: string) => Promise<void>;
  connectWithAddress: (address: string) => Promise<void>;
  disconnect: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  setBalance: (balance: number) => void;
  restoreSession: () => Promise<void>;
  clearError: () => void;
}

export const useWalletStore = create<WalletStore>((set, get) => ({
  connected: false,
  publicKey: null,
  balance: 0,
  connecting: false,
  error: null,
  walletProvider: null,

  connect: async (provider = 'phantom') => {
    set({ connecting: true, error: null, walletProvider: provider });
    try {
      let result: { publicKey: string; balance: number } | null = null;

      if (provider === 'phantom') {
        result = await connectPhantomWallet();
      } else if (provider === 'solflare') {
        result = await connectSolflareWallet();
      } else {
        result = await connectPhantomWallet();
      }

      // On web, the extension returns the result directly.
      // On mobile, result is null — connection completes via deep link callback.
      if (result) {
        await saveWalletAddress(result.publicKey);

        // Save wallet to Supabase profiles table
        upsertProfile(result.publicKey).catch((err) =>
          console.error('Failed to save profile to Supabase:', err)
        );

        set({
          connected: true,
          publicKey: result.publicKey,
          balance: result.balance,
          connecting: false,
        });
      } else {
        set({ connecting: false });
      }
    } catch (error: any) {
      set({
        connecting: false,
        walletProvider: null,
        error: error.message || 'Failed to connect wallet. Please try again.',
      });
    }
  },

  connectWithAddress: async (address: string) => {
    set({ connecting: true, error: null });
    try {
      const balance = await getBalance(address);
      await saveWalletAddress(address);

      // Save wallet to Supabase profiles table
      upsertProfile(address).catch((err) =>
        console.error('Failed to save profile to Supabase:', err)
      );

      set({
        connected: true,
        publicKey: address,
        balance,
        connecting: false,
      });
    } catch (error: any) {
      set({
        connecting: false,
        error: error.message || 'Failed to connect wallet.',
      });
    }
  },

  disconnect: async () => {
    try {
      await disconnectWalletService();
    } catch { }
    set({
      connected: false,
      publicKey: null,
      balance: 0,
      connecting: false,
      error: null,
      walletProvider: null,
    });
  },

  refreshBalance: async () => {
    const { publicKey } = get();
    if (!publicKey) return;

    try {
      const balance = await getBalance(publicKey);
      set({ balance });
    } catch (error) {
      console.error('Error refreshing balance:', error);
    }
  },

  setBalance: (balance: number) => {
    set({ balance });
  },

  restoreSession: async () => {
    try {
      const saved = await restoreSavedWallet();
      if (saved) {
        // Ensure profile exists in Supabase on session restore too
        upsertProfile(saved.publicKey).catch((err) =>
          console.error('Failed to save profile to Supabase on restore:', err)
        );

        set({
          connected: true,
          publicKey: saved.publicKey,
          balance: saved.balance,
        });
      }
    } catch (error) {
      console.error('Error restoring wallet session:', error);
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
