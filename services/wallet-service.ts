import { PublicKey } from '@solana/web3.js';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import nacl from 'tweetnacl';
import { Platform } from 'react-native';

import {
  buildTransferTransaction,
  confirmTransaction,
  getBalance
} from '@/services/solana';

// ─── Platform Detection ───
function isWeb(): boolean {
  return Platform.OS === 'web';
}

// ─── Browser Extension Types (injected by wallet extensions on desktop) ───
interface SolanaProvider {
  isPhantom?: boolean;
  isSolflare?: boolean;
  connect: () => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  signAndSendTransaction: (
    transaction: import('@solana/web3.js').Transaction
  ) => Promise<{ signature: string }>;
}

function getPhantomProvider(): SolanaProvider | null {
  if (!isWeb()) return null;
  const win = window as any;
  return win?.phantom?.solana?.isPhantom ? win.phantom.solana : win?.solana?.isPhantom ? win.solana : null;
}

function getSolflareProvider(): SolanaProvider | null {
  if (!isWeb()) return null;
  const win = window as any;
  return win?.solflare?.isSolflare ? win.solflare : null;
}

const WALLET_KEY = 'soltix_wallet_address';

async function getStoredWalletAddress(key: string): Promise<string | null> {
  if (isWeb()) {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    return window.localStorage.getItem(key);
  }

  return SecureStore.getItemAsync(key);
}

async function setStoredWalletAddress(key: string, value: string): Promise<void> {
  if (isWeb()) {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    window.localStorage.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function deleteStoredWalletAddress(key: string): Promise<void> {
  if (isWeb()) {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    window.localStorage.removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

// ─── Supported Wallets ───
export interface WalletProvider {
  name: string;
  icon: string;
  scheme: string; // deep link scheme
  connectUrl: string;
  popular: boolean;
}

export const WALLET_PROVIDERS: WalletProvider[] = [
  {
    name: 'Phantom',
    icon: '👻',
    scheme: 'phantom',
    connectUrl: 'https://phantom.app/ul/v1/connect',
    popular: true,
  },
  {
    name: 'Solflare',
    icon: '🔥',
    scheme: 'solflare',
    connectUrl: 'https://solflare.com/ul/v1/connect',
    popular: true,
  },
  {
    name: 'Backpack',
    icon: '🎒',
    scheme: 'backpack',
    connectUrl: 'https://backpack.app/ul/v1/connect',
    popular: false,
  },
  {
    name: 'Glow',
    icon: '✨',
    scheme: 'glow',
    connectUrl: 'glow://connect',
    popular: false,
  },
];

// ─── Base58 Encode / Decode ───
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function encodeBase58(bytes: Uint8Array): string {
  let result = '';
  let num = BigInt(0);
  for (const byte of bytes) {
    num = num * BigInt(256) + BigInt(byte);
  }
  while (num > 0) {
    result = BASE58_ALPHABET[Number(num % BigInt(58))] + result;
    num = num / BigInt(58);
  }
  for (const byte of bytes) {
    if (byte === 0) result = '1' + result;
    else break;
  }
  return result || '1';
}

function decodeBase58(str: string): Uint8Array {
  const ALPHABET_MAP = new Map<string, number>();
  for (let i = 0; i < BASE58_ALPHABET.length; i++) {
    ALPHABET_MAP.set(BASE58_ALPHABET[i], i);
  }

  let num = BigInt(0);
  for (const char of str) {
    const val = ALPHABET_MAP.get(char);
    if (val === undefined) throw new Error(`Invalid base58 character: ${char}`);
    num = num * BigInt(58) + BigInt(val);
  }

  const bytes: number[] = [];
  while (num > 0) {
    bytes.unshift(Number(num % BigInt(256)));
    num = num / BigInt(256);
  }

  // Count leading '1's → leading zero bytes
  for (const char of str) {
    if (char !== '1') break;
    bytes.unshift(0);
  }

  return new Uint8Array(bytes);
}

// ─── Session Encryption Keypair (for Phantom deep link flow) ───
let sessionKeypair: nacl.BoxKeyPair | null = null;

function getOrCreateSessionKeypair(): nacl.BoxKeyPair {
  if (!sessionKeypair) {
    sessionKeypair = nacl.box.keyPair();
  }
  return sessionKeypair;
}

function clearSessionKeypair(): void {
  sessionKeypair = null;
}

// ─── Connect via Phantom ───
export async function connectPhantomWallet(): Promise<{
  publicKey: string;
  balance: number;
} | null> {
  // Desktop/Web: use browser extension
  if (isWeb()) {
    const provider = getPhantomProvider();
    if (!provider) {
      window.open('https://phantom.app/download', '_blank');
      throw new Error('Phantom extension not installed. Please install it and refresh the page.');
    }
    try {
      const resp = await provider.connect();
      const address = resp.publicKey.toBase58();
      const balance = await getBalance(address);
      await setStoredWalletAddress(WALLET_KEY, address);
      return { publicKey: address, balance };
    } catch (error: any) {
      if (error?.code === 4001) {
        throw new Error('Connection rejected by user');
      }
      throw new Error('Failed to connect to Phantom extension');
    }
  }

  // Mobile: use deep link with proper encryption
  try {
    const keypair = getOrCreateSessionKeypair();
    const dappPubKeyBase58 = encodeBase58(keypair.publicKey);
    const redirectUrl = Linking.createURL('');

    const params = new URLSearchParams({
      app_url: 'https://soltix.app',
      dapp_encryption_public_key: dappPubKeyBase58,
      redirect_link: redirectUrl,
      cluster: process.env.EXPO_PUBLIC_NETWORK || 'devnet',
    });

    const connectUrl = `https://phantom.app/ul/v1/connect?${params.toString()}`;

    const supported = await Linking.canOpenURL('phantom://');

    if (supported) {
      await Linking.openURL(connectUrl);
      return null; // Will be resolved via deep link callback
    } else {
      await Linking.openURL('https://phantom.app/download');
      return null;
    }
  } catch (error) {
    console.error('Error connecting Phantom:', error);
    throw new Error('Failed to connect to Phantom wallet');
  }
}

// ─── Connect via Solflare ───
export async function connectSolflareWallet(): Promise<{
  publicKey: string;
  balance: number;
} | null> {
  // Desktop/Web: use browser extension
  if (isWeb()) {
    const provider = getSolflareProvider();
    if (!provider) {
      window.open('https://solflare.com/download', '_blank');
      throw new Error('Solflare extension not installed. Please install it and refresh the page.');
    }
    try {
      const resp = await provider.connect();
      const address = resp.publicKey.toBase58();
      const balance = await getBalance(address);
      await setStoredWalletAddress(WALLET_KEY, address);
      return { publicKey: address, balance };
    } catch (error: any) {
      if (error?.code === 4001) {
        throw new Error('Connection rejected by user');
      }
      throw new Error('Failed to connect to Solflare extension');
    }
  }

  // Mobile: use deep link with proper encryption
  try {
    const keypair = getOrCreateSessionKeypair();
    const dappPubKeyBase58 = encodeBase58(keypair.publicKey);
    const redirectUrl = Linking.createURL('');

    const params = new URLSearchParams({
      app_url: 'https://soltix.app',
      dapp_encryption_public_key: dappPubKeyBase58,
      redirect_link: redirectUrl,
      cluster: process.env.EXPO_PUBLIC_NETWORK || 'devnet',
    });

    const connectUrl = `https://solflare.com/ul/v1/connect?${params.toString()}`;

    const supported = await Linking.canOpenURL('solflare://');

    if (supported) {
      await Linking.openURL(connectUrl);
      return null;
    } else {
      await Linking.openURL('https://solflare.com/download');
      return null;
    }
  } catch (error) {
    console.error('Error connecting Solflare:', error);
    throw new Error('Failed to connect to Solflare wallet');
  }
}

// ─── Handle Deep Link Callback ───
export async function handleWalletCallback(
  url: string
): Promise<{ publicKey: string; balance: number } | null> {
  try {
    const parsed = Linking.parse(url);

    // Check for error in the wallet response
    if (parsed.queryParams?.errorCode) {
      console.error(
        'Wallet connection error:',
        parsed.queryParams.errorCode,
        parsed.queryParams.errorMessage
      );
      return null;
    }

    const phantomPubKeyParam = parsed.queryParams?.phantom_encryption_public_key;
    const nonceParam = parsed.queryParams?.nonce;
    const dataParam = parsed.queryParams?.data;

    // ── Encrypted response (Phantom / Solflare deep link) ──
    if (
      typeof phantomPubKeyParam === 'string' &&
      typeof nonceParam === 'string' &&
      typeof dataParam === 'string' &&
      sessionKeypair
    ) {
      try {
        const phantomPubKeyBytes = decodeBase58(phantomPubKeyParam);
        const nonceBytes = decodeBase58(nonceParam);
        const dataBytes = decodeBase58(dataParam);

        // Decrypt the response using nacl box
        const decrypted = nacl.box.open(
          dataBytes,
          nonceBytes,
          phantomPubKeyBytes,
          sessionKeypair.secretKey
        );

        // Clear the session keypair after use
        clearSessionKeypair();

        if (!decrypted) {
          console.error('Failed to decrypt wallet response');
          return null;
        }

        // Decode the decrypted JSON — use a safe UTF-8 decoder
        let jsonString: string;
        if (typeof TextDecoder !== 'undefined') {
          jsonString = new TextDecoder().decode(decrypted);
        } else {
          // Fallback for environments without TextDecoder
          jsonString = Array.from(decrypted)
            .map((b) => String.fromCharCode(b))
            .join('');
        }

        const decoded = JSON.parse(jsonString);
        const walletPubKey = decoded.public_key;

        if (!walletPubKey || typeof walletPubKey !== 'string') {
          console.error('No public_key in decrypted wallet response');
          return null;
        }

        // Validate it's a proper Solana address
        const pk = new PublicKey(walletPubKey);
        const validatedKey = pk.toBase58();
        const balance = await getBalance(validatedKey);
        await setStoredWalletAddress(WALLET_KEY, validatedKey);

        return { publicKey: validatedKey, balance };
      } catch (decryptError) {
        console.error('Error decrypting wallet callback:', decryptError);
        clearSessionKeypair();
        return null;
      }
    }

    // ── Fallback: direct public_key param (some wallets) ──
    const directPubKey = parsed.queryParams?.public_key;
    if (typeof directPubKey === 'string' && directPubKey.length > 0) {
      try {
        const pk = new PublicKey(directPubKey);
        const validatedKey = pk.toBase58();
        const balance = await getBalance(validatedKey);
        await setStoredWalletAddress(WALLET_KEY, validatedKey);
        return { publicKey: validatedKey, balance };
      } catch {
        console.error('Invalid direct public_key received:', directPubKey);
        return null;
      }
    }

    return null;
  } catch (error) {
    console.error('Error handling wallet callback:', error);
    clearSessionKeypair();
    return null;
  }
}

// ─── Restore Saved Session ───
export async function restoreSavedWallet(): Promise<{
  publicKey: string;
  balance: number;
} | null> {
  try {
    const savedAddress = await getStoredWalletAddress(WALLET_KEY);
    if (savedAddress) {
      const balance = await getBalance(savedAddress);
      return { publicKey: savedAddress, balance };
    }
    return null;
  } catch (error) {
    console.error('Error restoring wallet:', error);
    return null;
  }
}

// ─── Disconnect Wallet ───
export async function disconnectWallet(): Promise<void> {
  try {
    await deleteStoredWalletAddress(WALLET_KEY);
  } catch (error) {
    console.error('Error disconnecting wallet:', error);
  }
}

// ─── Save Wallet Address ───
export async function saveWalletAddress(address: string): Promise<void> {
  if (!address || typeof address !== 'string' || address.trim().length === 0) {
    throw new Error('Invalid wallet address: address cannot be empty');
  }

  // Validate it's a proper Solana public key
  let canonicalAddress: string;
  try {
    const pk = new PublicKey(address);
    canonicalAddress = pk.toBase58();
  } catch {
    throw new Error(`Invalid Solana public key: ${address}`);
  }

  await setStoredWalletAddress(WALLET_KEY, canonicalAddress);
}

// ─── Sign & Send Transfer ───
export async function sendPayment(
  fromWallet: string,
  toWallet: string,
  amountSol: number
): Promise<{ signature: string; success: boolean; pending?: boolean }> {
  // Validate inputs
  if (!fromWallet || typeof fromWallet !== 'string' || fromWallet.trim().length === 0) {
    throw new Error('Invalid sender wallet address');
  }
  if (!toWallet || typeof toWallet !== 'string' || toWallet.trim().length === 0) {
    throw new Error('Invalid recipient wallet address');
  }
  if (typeof amountSol !== 'number' || !Number.isFinite(amountSol) || amountSol <= 0) {
    throw new Error('Invalid payment amount: must be a positive number');
  }

  try {
    const fromPubkey = new PublicKey(fromWallet);
    const toPubkey = new PublicKey(toWallet);

    const { transaction, blockhash, lastValidBlockHeight } = await buildTransferTransaction(
      fromPubkey,
      toPubkey,
      amountSol
    );

    // Desktop/Web: sign & send via browser extension
    if (isWeb()) {
      const provider = getPhantomProvider() || getSolflareProvider();
      if (!provider) {
        throw new Error('No wallet extension found. Please install Phantom or Solflare.');
      }

      const { signature } = await provider.signAndSendTransaction(transaction);
      await confirmTransaction(signature, blockhash, lastValidBlockHeight);
      return { signature, success: true };
    }

    // Mobile: deep link to wallet app for signing
    const serializedTx = transaction
      .serialize({ requireAllSignatures: false })
      .toString('base64');

    const redirectUrl = Linking.createURL('');

    const params = new URLSearchParams({
      transaction: serializedTx,
      redirect_link: redirectUrl,
    });

    const signUrl = `https://phantom.app/ul/v1/signAndSendTransaction?${params.toString()}`;

    await Linking.openURL(signUrl);

    // The signature will come back via deep link callback
    // Return pending state — caller should listen for callback
    return { signature: '', success: false, pending: true };
  } catch (error) {
    console.error('Error sending payment:', error);
    throw new Error('Failed to send transaction');
  }
}
