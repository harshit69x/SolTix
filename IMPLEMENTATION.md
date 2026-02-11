# 🎯 Implementation Roadmap: Connecting UI to Solana Program

## Current Status
✅ UI/Frontend: 80% Complete  
✅ Solana Program: 100% Complete  
⬜ Integration: 0% Complete  

This guide shows you exactly how to connect your existing UI to the Solana blockchain.

---

## Phase 1: Program Setup (30 minutes)

### ✅ Prerequisites Installed
Follow `QUICKSTART.md` to:
1. Install Rust, Solana CLI, Anchor
2. Create wallet and get devnet SOL
3. Build and deploy program

### ✅ Program Deployed
```bash
npm run anchor:build
npm run anchor:deploy
npm run program:copy-idl
```

---

## Phase 2: Update Frontend Services (1-2 hours)

### Step 1: Update Event Service

Current `services/event-service.ts` uses Supabase only.  
We need to add on-chain event creation.

**File: `services/event-service.ts`**

Add import:
```typescript
import { initializeProgram, createEvent as createEventOnChain, getEventPDA } from './program';
```

Create new function:
```typescript
export async function createEventWithNFT(
  wallet: any,
  params: {
    title: string;
    description: string;
    date: string;
    time: string;
    venue: string;
    location: string;
    imageUrl: string;
    ticketPrice: number;
    maxResalePrice: number;
    royaltyPercentage: number;
    totalTickets: number;
    category: EventCategory;
  }
): Promise<EventData> {
  // 1. Create event on Solana
  const { provider, program } = initializeProgram(wallet);
  
  const { signature, eventPDA } = await createEventOnChain(provider, program, {
    name: params.title,
    originalPrice: params.ticketPrice,
    maxResalePrice: params.maxResalePrice,
    royaltyPercentage: params.royaltyPercentage,
    eventUri: params.imageUrl, // Or upload to Arweave first
  });

  // 2. Store in Supabase with eventPDA for querying
  const { data, error } = await supabase
    .from('events')
    .insert({
      title: params.title,
      description: params.description,
      date: params.date,
      time: params.time,
      venue: params.venue,
      location: params.location,
      image_url: params.imageUrl,
      organizer_wallet: wallet.publicKey.toString(),
      organizer_name: 'Organizer', // Get from profile
      ticket_price: params.ticketPrice,
      total_tickets: params.totalTickets,
      tickets_sold: 0,
      max_resale_price: params.maxResalePrice,
      royalty_percentage: params.royaltyPercentage,
      category: params.category,
      status: 'upcoming',
      metadata_uri: eventPDA.toString(), // Store PDA in metadata_uri
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return mapEventRow(data);
}
```

---

### Step 2: Update Ticket Service

**File: `services/ticket-service.ts`**

Add import:
```typescript
import { initializeProgram, mintTicket as mintTicketOnChain, getTicketPDA } from './program';
import { Keypair } from '@solana/web3.js';
```

Replace `createTicket` function:
```typescript
export async function purchaseTicket(
  wallet: any,
  eventId: string
): Promise<Ticket> {
  // 1. Get event from Supabase
  const event = await fetchEventById(eventId);
  if (!event) throw new Error('Event not found');

  // 2. Parse event PDA from metadata_uri
  const eventPDA = new PublicKey(event.metadataUri);

  // 3. Mint ticket on Solana
  const { provider, program } = initializeProgram(wallet);
  const mintKeypair = Keypair.generate();
  
  const { signature, ticketPDA, mint } = await mintTicketOnChain(
    provider,
    program,
    eventPDA,
    mintKeypair
  );

  // 4. Store in Supabase
  const { data, error } = await supabase
    .from('tickets')
    .insert({
      event_id: eventId,
      mint_address: mint.toString(),
      owner_wallet: wallet.publicKey.toString(),
      purchase_price: event.ticketPrice,
      token_account: ticketPDA.toString(),
      metadata_uri: event.imageUrl,
      tier: 'general',
      tx_signature: signature,
      status: 'valid',
      purchase_date: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return mapTicketRow(data);
}
```

---

### Step 3: Update Marketplace Service

**File: `services/marketplace-service.ts`**

Add functions:
```typescript
import { initializeProgram, listTicket as listTicketOnChain, buyTicket as buyTicketOnChain } from './program';
import { PublicKey } from '@solana/web3.js';

export async function listTicketForResale(
  wallet: any,
  ticketId: string,
  listPrice: number
): Promise<MarketplaceListing> {
  // 1. Get ticket from Supabase
  const ticket = await fetchTicketById(ticketId);
  if (!ticket) throw new Error('Ticket not found');

  // 2. Parse ticket PDA
  const ticketPDA = new PublicKey(ticket.tokenAccount);

  // 3. List on Solana
  const { provider, program } = initializeProgram(wallet);
  const signature = await listTicketOnChain(provider, program, ticketPDA, listPrice);

  // 4. Update ticket status in Supabase
  await updateTicketStatus(ticketId, 'listed');

  // 5. Create marketplace listing
  const { data, error } = await supabase
    .from('marketplace_listings')
    .insert({
      ticket_id: ticketId,
      seller_wallet: wallet.publicKey.toString(),
      list_price: listPrice,
      max_allowed_price: ticket.event.maxResalePrice,
      royalty_percentage: ticket.event.royaltyPercentage,
      status: 'active',
      listed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return mapListingRow(data);
}

export async function purchaseListedTicket(
  wallet: any,
  listingId: string
): Promise<void> {
  // 1. Get listing
  const listing = await fetchListingById(listingId);
  if (!listing) throw new Error('Listing not found');

  // 2. Parse ticket PDA
  const ticketPDA = new PublicKey(listing.ticket.tokenAccount);

  // 3. Buy on Solana (handles payment & transfer)
  const { provider, program } = initializeProgram(wallet);
  const signature = await buyTicketOnChain(provider, program, ticketPDA);

  // 4. Update database
  await supabase
    .from('marketplace_listings')
    .update({ status: 'sold' })
    .eq('id', listingId);

  await transferTicket(listing.ticket.id, wallet.publicKey.toString());
}
```

---

## Phase 3: Update UI Components (2-3 hours)

### Step 1: Event Creation Form

**File: Update component that creates events (likely in `app/(tabs)/explore.tsx` or similar)**

```typescript
import { createEventWithNFT } from '@/services/event-service';
import { useWallet } from '@/hooks/useWallet'; // You'll need to create this

const handleCreateEvent = async (formData) => {
  try {
    setLoading(true);
    
    const event = await createEventWithNFT(wallet, {
      title: formData.title,
      description: formData.description,
      date: formData.date,
      time: formData.time,
      venue: formData.venue,
      location: formData.location,
      imageUrl: formData.imageUrl,
      ticketPrice: formData.ticketPrice,
      maxResalePrice: formData.maxResalePrice,
      royaltyPercentage: formData.royaltyPercentage,
      totalTickets: formData.totalTickets,
      category: formData.category,
    });

    Alert.alert('Success', 'Event created on blockchain!');
    navigation.navigate('EventDetails', { id: event.id });
  } catch (error) {
    Alert.alert('Error', error.message);
  } finally {
    setLoading(false);
  }
};
```

### Step 2: Ticket Purchase

**File: `app/event/[id].tsx`**

```typescript
import { purchaseTicket } from '@/services/ticket-service';

const handlePurchaseTicket = async () => {
  if (!wallet) {
    Alert.alert('Connect Wallet', 'Please connect your wallet first');
    return;
  }

  try {
    setLoading(true);
    
    const ticket = await purchaseTicket(wallet, eventId);
    
    Alert.alert(
      'Success!',
      `Ticket minted as NFT!\nMint: ${ticket.mintAddress}`,
      [
        { text: 'View Ticket', onPress: () => navigation.navigate('Tickets') },
        { text: 'OK' }
      ]
    );
  } catch (error) {
    Alert.alert('Error', error.message);
  } finally {
    setLoading(false);
  }
};
```

### Step 3: List Ticket for Resale

**File: `components/ticket-card.tsx` or ticket detail page**

```typescript
import { listTicketForResale } from '@/services/marketplace-service';

const handleListTicket = async (ticketId: string, price: number) => {
  try {
    setLoading(true);
    
    await listTicketForResale(wallet, ticketId, price);
    
    Alert.alert('Listed!', 'Your ticket is now on the marketplace');
  } catch (error) {
    Alert.alert('Error', error.message);
  } finally {
    setLoading(false);
  }
};
```

---

## Phase 4: Create Wallet Hook (1 hour)

**File: `hooks/use-wallet.ts`**

```typescript
import { useState, useEffect } from 'react';
import { connectWallet, disconnectWallet, getConnectedWallet } from '@/services/wallet-service';
import { useWalletStore } from '@/store/wallet-store';

export function useWallet() {
  const { address, setAddress, clearAddress } = useWalletStore();
  const [connecting, setConnecting] = useState(false);

  const connect = async (providerName: string) => {
    setConnecting(true);
    try {
      const wallet = await connectWallet(providerName);
      setAddress(wallet.publicKey.toString());
      return wallet;
    } catch (error) {
      throw error;
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    await disconnectWallet();
    clearAddress();
  };

  return {
    address,
    connected: !!address,
    connecting,
    connect,
    disconnect,
    publicKey: address ? new PublicKey(address) : null,
  };
}
```

---

## Phase 5: Environment Configuration

**File: `.env`**

Add:
```env
EXPO_PUBLIC_NETWORK=devnet
EXPO_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
EXPO_PUBLIC_PROGRAM_ID=YOUR_PROGRAM_ID_HERE
```

Update `services/program.ts`:
```typescript
export const PROGRAM_ID = new PublicKey(
  process.env.EXPO_PUBLIC_PROGRAM_ID || 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS'
);
```

---

## Phase 6: Testing Checklist

### Test Flow:
1. ✅ Connect wallet (Phantom/Solflare)
2. ✅ Create event → Verify on Solana Explorer
3. ✅ Purchase ticket → Check NFT in wallet
4. ✅ View owned tickets
5. ✅ List ticket for resale
6. ✅ Buy listed ticket (with different wallet)
7. ✅ Verify royalty payment to organizer

### Testing Commands:
```bash
# Watch program logs
solana logs YOUR_PROGRAM_ID --url devnet

# Check wallet balance
solana balance YOUR_WALLET --url devnet

# View transaction
https://explorer.solana.com/tx/YOUR_TX_SIGNATURE?cluster=devnet
```

---

## Common Integration Issues & Solutions

### Issue 1: "Wallet not connected"
**Solution**: Ensure wallet hook is properly initialized in component tree

### Issue 2: "Program account not found"
**Solution**: Verify program is deployed and PROGRAM_ID is correct

### Issue 3: "Insufficient funds"
**Solution**: Get more devnet SOL: `solana airdrop 2`

### Issue 4: "Transaction too large"
**Solution**: Break into multiple transactions or use lookup tables

### Issue 5: "Account already exists"
**Solution**: Use try-catch and handle idempotency

---

## Migration Strategy: Supabase → On-Chain

You have TWO options:

### Option A: Hybrid (Recommended for MVP)
- On-chain: Event creation, ticket minting, transfers, sales
- Supabase: Event discovery, search, user profiles, analytics
- Benefit: Fast queries, familiar patterns

### Option B: Fully On-Chain
- Everything on Solana using GPA (Get Program Accounts)
- No Supabase needed
- Benefit: True decentralization
- Tradeoff: Slower queries, more complex

For MVP, use **Option A (Hybrid)**. You already have Supabase set up and it works well for read-heavy operations like browsing events.

---

## Next Steps Priority Order

1. ✅ Deploy program to devnet
2. ⬜ Update `program.ts` with correct PROGRAM_ID
3. ⬜ Implement `useWallet` hook
4. ⬜ Update event creation to call blockchain
5. ⬜ Update ticket purchase to mint NFT
6. ⬜ Test full flow on devnet
7. ⬜ Add marketplace listing
8. ⬜ Add marketplace  purchase
9. ⬜ Add metadata upload to Arweave
10. ⬜ Production testing → Mainnet

---

## Estimated Timeline

- Phase 1 (Setup): 30 min
- Phase 2 (Services): 2 hours
- Phase 3 (UI Updates): 3 hours
- Phase 4 (Wallet Hook): 1 hour
- Phase 5 (Config): 15 min
- Phase 6 (Testing): 2 hours

**Total: ~8-10 hours of focused development**

---

## Need Help?

Check these files for reference:
- `services/program.ts` - All blockchain interaction functions
- `programs/soltix-program/src/lib.rs` - Program logic
- `tests/soltix-program.ts` - Working examples
- `SOLANA_SETUP.md` - Detailed deployment guide
