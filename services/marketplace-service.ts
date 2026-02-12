import { getSupabase } from '@/services/supabase';
import { fetchTicketById } from '@/services/ticket-service';
import { ListingStatus, MarketplaceListing } from '@/types';
import type { MarketplaceListingRow } from '@/types/database';
import { MOCK_LISTINGS } from '@/data/mock-data';

let localListings: MarketplaceListing[] = [...MOCK_LISTINGS];

function isSupabaseAuthLikeError(code: string | undefined, message: string): boolean {
  return (
    code === '401' ||
    code === '403' ||
    /invalid api key|jwt|unauthorized|permission/i.test(message)
  );
}

// ─── Row → App Model Mapper ───
async function mapListingRow(row: MarketplaceListingRow): Promise<MarketplaceListing> {
  const ticket = await fetchTicketById(row.ticket_id);

  if (!ticket) {
    throw new Error(`Ticket not found for listing ${row.id} (ticket_id: ${row.ticket_id})`);
  }

  return {
    id: row.id,
    ticket,
    sellerWallet: row.seller_wallet,
    listPrice: Number(row.list_price),
    maxAllowedPrice: Number(row.max_allowed_price),
    royaltyPercentage: Number(row.royalty_percentage),
    listedAt: row.listed_at,
    status: row.status as ListingStatus,
  };
}

// Batch mapper
async function mapListingRows(rows: MarketplaceListingRow[]): Promise<MarketplaceListing[]> {
  const ticketIds = [...new Set(rows.map((r) => r.ticket_id))];
  const tickets = await Promise.all(ticketIds.map(fetchTicketById));
  const ticketMap = new Map(ticketIds.map((id, i) => [id, tickets[i]]));

  const results: MarketplaceListing[] = [];
  for (const row of rows) {
    const ticket = ticketMap.get(row.ticket_id);
    if (!ticket) {
      console.error(`Skipping listing ${row.id}: ticket ${row.ticket_id} not found`);
      continue;
    }
    results.push({
      id: row.id,
      ticket,
      sellerWallet: row.seller_wallet,
      listPrice: Number(row.list_price),
      maxAllowedPrice: Number(row.max_allowed_price),
      royaltyPercentage: Number(row.royalty_percentage),
      listedAt: row.listed_at,
      status: row.status as ListingStatus,
    });
  }
  return results;
}

// ─── Fetch Active Listings ───
export async function fetchActiveListings(): Promise<MarketplaceListing[]> {
  const supabase = getSupabase();
  if (!supabase) return localListings.filter((l) => l.status === 'active');

  const { data, error } = await supabase
    .from('marketplace_listings')
    .select('*')
    .eq('status', 'active')
    .order('listed_at', { ascending: false });

  if (error) {
    console.error('Error fetching listings:', error.message);
    if (isSupabaseAuthLikeError(error.code, error.message)) {
      console.warn('Falling back to local listings due to Supabase auth/config error.');
      return localListings.filter((l) => l.status === 'active');
    }
    throw new Error(error.message);
  }

  return data && data.length > 0 ? mapListingRows(data) : [];
}

// ─── Fetch All Listings ───
export async function fetchAllListings(): Promise<MarketplaceListing[]> {
  const supabase = getSupabase();
  if (!supabase) return localListings;

  const { data, error } = await supabase
    .from('marketplace_listings')
    .select('*')
    .order('listed_at', { ascending: false });

  if (error) {
    console.error('Error fetching all listings:', error.message);
    if (isSupabaseAuthLikeError(error.code, error.message)) {
      console.warn('Falling back to local listings due to Supabase auth/config error.');
      return localListings;
    }
    throw new Error(error.message);
  }

  return data && data.length > 0 ? mapListingRows(data) : [];
}

// ─── Fetch Listing by ID ───
export async function fetchListingById(id: string): Promise<MarketplaceListing | null> {
  const supabase = getSupabase();
  if (!supabase) return localListings.find((l) => l.id === id) ?? null;

  const { data, error } = await supabase
    .from('marketplace_listings')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching listing:', error.message);
    if (isSupabaseAuthLikeError(error.code, error.message)) {
      return localListings.find((l) => l.id === id) ?? null;
    }
    throw new Error(error.message);
  }

  return data ? mapListingRow(data) : null;
}

// ─── Fetch Listings by Seller ───
export async function fetchListingsBySeller(walletAddress: string): Promise<MarketplaceListing[]> {
  const supabase = getSupabase();
  if (!supabase) return localListings.filter((l) => l.sellerWallet === walletAddress);

  const { data, error } = await supabase
    .from('marketplace_listings')
    .select('*')
    .eq('seller_wallet', walletAddress)
    .order('listed_at', { ascending: false });

  if (error) {
    console.error('Error fetching seller listings:', error.message);
    if (isSupabaseAuthLikeError(error.code, error.message)) {
      console.warn('Falling back to local listings due to Supabase auth/config error.');
      return localListings.filter((l) => l.sellerWallet === walletAddress);
    }
    throw new Error(error.message);
  }

  return data && data.length > 0 ? mapListingRows(data) : [];
}

// ─── Create Listing ───
export async function createListing(params: {
  ticketId: string;
  sellerWallet: string;
  listPrice: number;
  maxAllowedPrice: number;
  royaltyPercentage: number;
}): Promise<MarketplaceListing> {
  const supabase = getSupabase();
  if (!supabase) {
    const ticket = await fetchTicketById(params.ticketId);
    if (!ticket) {
      throw new Error(`Ticket not found for listing creation: ${params.ticketId}`);
    }

    const listing: MarketplaceListing = {
      id: `local-listing-${Date.now()}`,
      ticket,
      sellerWallet: params.sellerWallet,
      listPrice: params.listPrice,
      maxAllowedPrice: params.maxAllowedPrice,
      royaltyPercentage: params.royaltyPercentage,
      listedAt: new Date().toISOString(),
      status: 'active',
    };

    localListings = [listing, ...localListings];
    return listing;
  }

  const { data, error } = await supabase
    .from('marketplace_listings')
    .insert({
      ticket_id: params.ticketId,
      seller_wallet: params.sellerWallet,
      list_price: params.listPrice,
      max_allowed_price: params.maxAllowedPrice,
      royalty_percentage: params.royaltyPercentage,
      status: 'active',
      listed_at: new Date().toISOString(),
      buyer_wallet: null,
      sold_at: null,
      tx_signature: null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating listing:', error.message);
    if (isSupabaseAuthLikeError(error.code, error.message)) {
      console.warn('Falling back to local listing creation due to Supabase auth/config error.');
      const ticket = await fetchTicketById(params.ticketId);
      if (!ticket) {
        throw new Error(`Ticket not found for listing creation: ${params.ticketId}`);
      }
      const listing: MarketplaceListing = {
        id: `local-listing-${Date.now()}`,
        ticket,
        sellerWallet: params.sellerWallet,
        listPrice: params.listPrice,
        maxAllowedPrice: params.maxAllowedPrice,
        royaltyPercentage: params.royaltyPercentage,
        listedAt: new Date().toISOString(),
        status: 'active',
      };
      localListings = [listing, ...localListings];
      return listing;
    }
    throw new Error(error.message);
  }

  return mapListingRow(data);
}

// ─── Update Listing Status ───
export async function updateListingStatus(
  listingId: string,
  status: ListingStatus,
  buyerWallet?: string,
  txSignature?: string
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) {
    localListings = localListings.map((listing) =>
      listing.id === listingId ? { ...listing, status } : listing
    );
    return;
  }

  const updateData: Record<string, any> = { status };

  if (status === 'sold') {
    updateData.buyer_wallet = buyerWallet || null;
    updateData.sold_at = new Date().toISOString();
    updateData.tx_signature = txSignature || null;
  }

  const { data, error } = await supabase
    .from('marketplace_listings')
    .update(updateData)
    .eq('id', listingId)
    .select('id');

  if (error) {
    console.error('Error updating listing:', error.message);
    if (isSupabaseAuthLikeError(error.code, error.message)) {
      console.warn('Falling back to local listing update due to Supabase auth/config error.');
      localListings = localListings.map((listing) =>
        listing.id === listingId ? { ...listing, status } : listing
      );
      return;
    }
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error(`Listing not found or not modified: ${listingId}`);
  }
}

// ─── Cancel Listing ───
export async function cancelListing(listingId: string): Promise<void> {
  await updateListingStatus(listingId, 'cancelled');
}
