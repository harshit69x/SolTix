import 'react-native-get-random-values';
import { PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import nacl from 'tweetnacl';
import { Platform } from 'react-native';

import {
  buildTransferTransaction,
  connection,
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
const WALLET_SESSION_KEY = 'soltix_wallet_session';
const PHANTOM_ENCRYPTION_KEY = 'soltix_phantom_encryption_public_key';
const DAPP_SECRET_KEY = 'soltix_dapp_secret_key';
const DAPP_PUBLIC_KEY = 'soltix_dapp_public_key';
const LAST_TX_SIGNATURE_KEY = 'soltix_last_tx_signature';

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

// ─── Session Encryption Keypair (for Phantom deep link flow) ───
let sessionKeypair: nacl.BoxKeyPair | null = null;
let walletSession: string | null = null;
let phantomEncryptionPublicKey: Uint8Array | null = null;
let sessionArtifactsLoaded = false;
let pendingPayment:
  | {
    resolve: (value: { signature: string; success: boolean }) => void;
    reject: (reason?: unknown) => void;
    timeoutId: ReturnType<typeof setTimeout>;
  }
  | null = null;
let pendingConnect:
  | {
    resolve: () => void;
    reject: (reason?: unknown) => void;
    timeoutId: ReturnType<typeof setTimeout>;
  }
  | null = null;
let naclPrngConfigured = false;

function ensureNaclPrng(): void {
  if (naclPrngConfigured) return;
  nacl.setPRNG((x: Uint8Array, n: number) => {
    x.set(Crypto.getRandomBytes(n));
  });
  naclPrngConfigured = true;
}

function clearSessionKeypair(): void {
  sessionKeypair = null;
}

function clearWalletSession(): void {
  walletSession = null;
  phantomEncryptionPublicKey = null;
}

function toBase58(bytes: Uint8Array): string {
  return bs58.encode(bytes);
}

function fromBase58(value: string): Uint8Array {
  return bs58.decode(value);
}

function clearPendingPayment(): void {
  if (!pendingPayment) return;
  clearTimeout(pendingPayment.timeoutId);
  pendingPayment = null;
}

function rejectPendingPayment(message: string): void {
  if (!pendingPayment) return;
  pendingPayment.reject(new Error(message));
  clearPendingPayment();
}

function clearPendingConnect(): void {
  if (!pendingConnect) return;
  clearTimeout(pendingConnect.timeoutId);
  pendingConnect = null;
}

function resolvePendingConnect(): void {
  if (!pendingConnect) return;
  pendingConnect.resolve();
  clearPendingConnect();
}

function rejectPendingConnect(message: string): void {
  if (!pendingConnect) return;
  pendingConnect.reject(new Error(message));
  clearPendingConnect();
}

function waitForConnectCallback(): Promise<void> {
  if (pendingConnect) {
    rejectPendingConnect('A new wallet connection request has started');
  }

  return new Promise<void>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      rejectPendingConnect('Wallet connection timed out. Please try again.');
    }, 120000);
    pendingConnect = { resolve, reject, timeoutId };
  });
}

function getWalletCallbackUrl(): string {
  // Use explicit app scheme for mobile wallet deep links.
  return Linking.createURL('wallet-callback', { scheme: 'soltix' });
}

async function openWalletDeepLinkWithFallback(
  schemeUrl: string,
  universalUrl: string,
  walletName: string
): Promise<void> {
  if (isWeb()) {
    await Linking.openURL(universalUrl);
    return;
  }

  try {
    await Linking.openURL(schemeUrl);
  } catch (schemeError) {
    throw new Error(`${walletName} app is not installed or cannot be opened on this device.`);
  }
}

async function getStoredValue(key: string): Promise<string | null> {
  if (isWeb()) {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    return window.localStorage.getItem(key);
  }

  return SecureStore.getItemAsync(key);
}

async function setStoredValue(key: string, value: string): Promise<void> {
  if (isWeb()) {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    window.localStorage.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function deleteStoredValue(key: string): Promise<void> {
  if (isWeb()) {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    window.localStorage.removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

async function persistSessionKeypair(keypair: nacl.BoxKeyPair): Promise<void> {
  await Promise.all([
    setStoredValue(DAPP_PUBLIC_KEY, toBase58(keypair.publicKey)),
    setStoredValue(DAPP_SECRET_KEY, toBase58(keypair.secretKey)),
  ]);
}

async function persistWalletSessionArtifacts(): Promise<void> {
  if (!walletSession || !phantomEncryptionPublicKey) return;

  await Promise.all([
    setStoredValue(WALLET_SESSION_KEY, walletSession),
    setStoredValue(PHANTOM_ENCRYPTION_KEY, toBase58(phantomEncryptionPublicKey)),
  ]);
}

async function clearPersistedSessionArtifacts(): Promise<void> {
  await Promise.all([
    deleteStoredValue(WALLET_SESSION_KEY),
    deleteStoredValue(PHANTOM_ENCRYPTION_KEY),
    deleteStoredValue(DAPP_SECRET_KEY),
    deleteStoredValue(DAPP_PUBLIC_KEY),
  ]);
  sessionArtifactsLoaded = false;
}

async function loadPersistedSessionArtifacts(): Promise<void> {
  if (sessionArtifactsLoaded) return;
  sessionArtifactsLoaded = true;

  try {
    const [session, phantomKeyB58, dappPublicB58, dappSecretB58] = await Promise.all([
      getStoredValue(WALLET_SESSION_KEY),
      getStoredValue(PHANTOM_ENCRYPTION_KEY),
      getStoredValue(DAPP_PUBLIC_KEY),
      getStoredValue(DAPP_SECRET_KEY),
    ]);

    if (session && phantomKeyB58) {
      walletSession = session;
      phantomEncryptionPublicKey = fromBase58(phantomKeyB58);
    }

    if (dappPublicB58 && dappSecretB58) {
      sessionKeypair = {
        publicKey: fromBase58(dappPublicB58),
        secretKey: fromBase58(dappSecretB58),
      };
    }
  } catch (error) {
    console.error('Failed to restore wallet session artifacts:', error);
    clearSessionKeypair();
    clearWalletSession();
    await clearPersistedSessionArtifacts();
  }
}

async function getOrCreateSessionKeypair(): Promise<nacl.BoxKeyPair> {
  ensureNaclPrng();
  await loadPersistedSessionArtifacts();
  if (!sessionKeypair) {
    sessionKeypair = nacl.box.keyPair();
    await persistSessionKeypair(sessionKeypair);
  }
  return sessionKeypair;
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
    const keypair = await getOrCreateSessionKeypair();
    const dappPubKeyBase58 = toBase58(keypair.publicKey);
    const redirectUrl = getWalletCallbackUrl();

    const params = new URLSearchParams({
      app_url: 'https://soltix.app',
      dapp_encryption_public_key: dappPubKeyBase58,
      redirect_link: redirectUrl,
      cluster: process.env.EXPO_PUBLIC_NETWORK || 'devnet',
    });

    const schemeConnectUrl = `phantom://ul/v1/connect?${params.toString()}`;
    const universalConnectUrl = `https://phantom.app/ul/v1/connect?${params.toString()}`;

    await openWalletDeepLinkWithFallback(schemeConnectUrl, universalConnectUrl, 'Phantom');
    return null; // Will be resolved via deep link callback
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
    const keypair = await getOrCreateSessionKeypair();
    const dappPubKeyBase58 = toBase58(keypair.publicKey);
    const redirectUrl = getWalletCallbackUrl();

    const params = new URLSearchParams({
      app_url: 'https://soltix.app',
      dapp_encryption_public_key: dappPubKeyBase58,
      redirect_link: redirectUrl,
      cluster: process.env.EXPO_PUBLIC_NETWORK || 'devnet',
    });

    const schemeConnectUrl = `solflare://ul/v1/connect?${params.toString()}`;
    const universalConnectUrl = `https://solflare.com/ul/v1/connect?${params.toString()}`;

    await openWalletDeepLinkWithFallback(schemeConnectUrl, universalConnectUrl, 'Solflare');
    return null;
  } catch (error) {
    console.error('Error connecting Solflare:', error);
    throw new Error('Failed to connect to Solflare wallet');
  }
}

// ─── Connect via Backpack (deep link redirect) ───
export async function connectBackpackWallet(): Promise<{
  publicKey: string;
  balance: number;
} | null> {
  try {
    const redirectUrl = getWalletCallbackUrl();
    const params = new URLSearchParams({
      redirect_link: redirectUrl,
      cluster: process.env.EXPO_PUBLIC_NETWORK || 'devnet',
      app_url: 'https://soltix.app',
    });

    const schemeConnectUrl = `backpack://ul/v1/connect?${params.toString()}`;
    const universalConnectUrl = `https://backpack.app/ul/v1/connect?${params.toString()}`;
    await openWalletDeepLinkWithFallback(schemeConnectUrl, universalConnectUrl, 'Backpack');
    return null;
  } catch (error) {
    console.error('Error connecting Backpack:', error);
    throw new Error('Failed to connect to Backpack wallet');
  }
}

// ─── Connect via Glow (deep link redirect) ───
export async function connectGlowWallet(): Promise<{
  publicKey: string;
  balance: number;
} | null> {
  try {
    const redirectUrl = getWalletCallbackUrl();
    const params = new URLSearchParams({
      redirect_link: redirectUrl,
      cluster: process.env.EXPO_PUBLIC_NETWORK || 'devnet',
      app_url: 'https://soltix.app',
    });

    const schemeConnectUrl = `glow://connect?${params.toString()}`;
    const universalConnectUrl = `https://glow.app`;
    await openWalletDeepLinkWithFallback(schemeConnectUrl, universalConnectUrl, 'Glow');
    return null;
  } catch (error) {
    console.error('Error connecting Glow:', error);
    throw new Error('Failed to connect to Glow wallet');
  }
}

// ─── Handle Deep Link Callback ───
export async function handleWalletCallback(
  url: string
): Promise<{ publicKey: string; balance: number } | null> {
  try {
    await loadPersistedSessionArtifacts();
    const parsed = Linking.parse(url);

    // Check for error in the wallet response
    if (parsed.queryParams?.errorCode) {
      rejectPendingConnect(
        `Wallet error: ${String(parsed.queryParams.errorCode)}${parsed.queryParams.errorMessage ? ` - ${String(parsed.queryParams.errorMessage)}` : ''}`
      );
      rejectPendingPayment(
        `Wallet error: ${String(parsed.queryParams.errorCode)}${parsed.queryParams.errorMessage ? ` - ${String(parsed.queryParams.errorMessage)}` : ''}`
      );
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
        const phantomPubKeyBytes = fromBase58(phantomPubKeyParam);
        const nonceBytes = fromBase58(nonceParam);
        const dataBytes = fromBase58(dataParam);

        // Decrypt the response using nacl box
        const decrypted = nacl.box.open(
          dataBytes,
          nonceBytes,
          phantomPubKeyBytes,
          sessionKeypair.secretKey
        );

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
        const sessionToken = decoded.session;
        const signedTransaction = decoded.transaction;
        const signature = decoded.signature;

        // ── Signed transaction returned from signTransaction ──
        if (typeof signedTransaction === 'string') {
          try {
            const signedTxBytes = fromBase58(signedTransaction);
            const submittedSignature = await connection.sendRawTransaction(signedTxBytes, {
              skipPreflight: false,
              preflightCommitment: 'confirmed',
            });
            await connection.confirmTransaction(submittedSignature, 'confirmed');

            // Store the successful signature so the UI can pick it up
            await setStoredValue(LAST_TX_SIGNATURE_KEY, submittedSignature);

            if (pendingPayment) {
              pendingPayment.resolve({ signature: submittedSignature, success: true });
              clearPendingPayment();
            }

            // Return a special marker so the deep link handler in _layout knows
            // this was a successful payment (not a wallet connect)
            return { publicKey: `tx:${submittedSignature}`, balance: 0 };
          } catch (submitError) {
            console.error('Failed to submit signed transaction:', submitError);
            if (pendingPayment) {
              rejectPendingPayment('Failed to submit signed transaction');
            }
            return { publicKey: 'tx:failed', balance: 0 };
          }
        }

        // ── Direct signature returned from signAndSendTransaction ──
        if (typeof signature === 'string') {
          await setStoredValue(LAST_TX_SIGNATURE_KEY, signature);

          if (pendingPayment) {
            pendingPayment.resolve({ signature, success: true });
            clearPendingPayment();
          }

          return { publicKey: `tx:${signature}`, balance: 0 };
        }

        if (!walletPubKey || typeof walletPubKey !== 'string') {
          console.error('No public_key in decrypted wallet response');
          return null;
        }

        if (typeof sessionToken === 'string' && sessionToken.length > 0) {
          walletSession = sessionToken;
          phantomEncryptionPublicKey = phantomPubKeyBytes;
          await persistWalletSessionArtifacts();
          resolvePendingConnect();
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
        clearWalletSession();
        await clearPersistedSessionArtifacts();
        rejectPendingConnect('Wallet callback decryption failed');
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
    rejectPendingConnect('Wallet callback failed');
    rejectPendingPayment('Wallet callback failed');
    return null;
  }
}

// ─── Restore Saved Session ───
export async function restoreSavedWallet(): Promise<{
  publicKey: string;
  balance: number;
} | null> {
  try {
    await loadPersistedSessionArtifacts();
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
    if (isWeb()) {
      const providers = [getPhantomProvider(), getSolflareProvider()].filter(Boolean) as SolanaProvider[];
      await Promise.allSettled(
        providers.map(async (provider) => {
          try {
            await provider.disconnect();
          } catch {
            // Ignore provider disconnect errors; local session cleanup still proceeds.
          }
        })
      );
    }

    await deleteStoredWalletAddress(WALLET_KEY);
    clearSessionKeypair();
    clearWalletSession();
    await clearPersistedSessionArtifacts();
    rejectPendingConnect('Wallet disconnected');
    rejectPendingPayment('Wallet disconnected');
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
    await loadPersistedSessionArtifacts();

    let fromPubkey: PublicKey;
    let toPubkey: PublicKey;

    try {
      fromPubkey = new PublicKey(fromWallet.trim());
    } catch {
      throw new Error(`Invalid sender address: "${fromWallet}"`);
    }

    try {
      toPubkey = new PublicKey(toWallet.trim());
    } catch {
      throw new Error(`Invalid recipient address: "${toWallet}"`);
    }

    if (fromPubkey.equals(toPubkey)) {
      throw new Error('Sender and recipient wallets cannot be the same.');
    }

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

    // Mobile: use encrypted Phantom deep link signTransaction flow.
    if (!sessionKeypair || !walletSession || !phantomEncryptionPublicKey) {
      await connectPhantomWallet();
      await waitForConnectCallback();
      await loadPersistedSessionArtifacts();

      if (!sessionKeypair || !walletSession || !phantomEncryptionPublicKey) {
        throw new Error('Wallet session expired. Please reconnect Phantom and try again.');
      }
    }

    const serializedTx = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });

    const sharedSecret = nacl.box.before(
      phantomEncryptionPublicKey,
      sessionKeypair.secretKey
    );

    const payload = {
      transaction: toBase58(serializedTx),
      session: walletSession,
    };

    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const encodedPayload = new TextEncoder().encode(JSON.stringify(payload));
    const encryptedPayload = nacl.box.after(encodedPayload, nonce, sharedSecret);
    const redirectUrl = getWalletCallbackUrl();

    const params = new URLSearchParams({
      dapp_encryption_public_key: toBase58(sessionKeypair.publicKey),
      nonce: toBase58(nonce),
      redirect_link: redirectUrl,
      payload: toBase58(encryptedPayload),
    });

    // Use signTransaction — Phantom returns the signed tx, we submit it in the callback
    const signSchemeUrl = `phantom://ul/v1/signTransaction?${params.toString()}`;
    const signUniversalUrl = `https://phantom.app/ul/v1/signTransaction?${params.toString()}`;

    if (pendingPayment) {
      rejectPendingPayment('Another payment request is already pending');
    }

    await deleteStoredValue(LAST_TX_SIGNATURE_KEY);

    const paymentPromise = new Promise<{ signature: string; success: boolean }>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        rejectPendingPayment('Payment confirmation timed out. Please try again.');
      }, 180000);

      pendingPayment = { resolve, reject, timeoutId };
    });

    await openWalletDeepLinkWithFallback(signSchemeUrl, signUniversalUrl, 'Phantom');

    return await paymentPromise;
  } catch (error) {
    console.error('Error sending payment:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to send transaction');
  }
}
