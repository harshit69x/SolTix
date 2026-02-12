import { fetchEventById } from '@/services/event-service';
import { getSupabase } from '@/services/supabase';
import { Ticket, TicketStatus, TicketTier } from '@/types';
import type { TicketRow } from '@/types/database';
import { MOCK_TICKETS } from '@/data/mock-data';

// ─── Row → App Model Mapper ───
async function mapTicketRow(row: TicketRow): Promise<Ticket> {
  const event = await fetchEventById(row.event_id);

  if (!event) {
    throw new Error(`Event not found for ticket ${row.id} (event_id: ${row.event_id})`);
  }

  return {
    id: row.id,
    eventId: row.event_id,
    event,
    mintAddress: row.mint_address,
    ownerWallet: row.owner_wallet,
    purchasePrice: Number(row.purchase_price),
    purchaseDate: row.purchase_date,
    status: row.status as TicketStatus,
    tokenAccount: row.token_account,
    metadataUri: row.metadata_uri,
    seatInfo: row.seat_info || undefined,
    tier: row.tier as TicketTier,
  };
}

// Batch mapper — fetches all events at once for efficiency
async function mapTicketRows(rows: TicketRow[]): Promise<Ticket[]> {
  // Gather unique event IDs
  const eventIds = [...new Set(rows.map((r) => r.event_id))];

  // Fetch all events in parallel, handling individual failures
  const settledResults = await Promise.allSettled(eventIds.map((id) => fetchEventById(id)));
  const eventMap = new Map<string, any>();
  for (let i = 0; i < eventIds.length; i++) {
    const result = settledResults[i];
    if (result.status === 'fulfilled' && result.value) {
      eventMap.set(eventIds[i], result.value);
    } else {
      console.error(`Failed to fetch event ${eventIds[i]}:`, result.status === 'rejected' ? result.reason : 'null');
    }
  }

  const results: Ticket[] = [];
  for (const row of rows) {
    const event = eventMap.get(row.event_id);
    if (!event) {
      console.error(`Skipping ticket ${row.id}: event ${row.event_id} not found`);
      continue;
    }
    results.push({
      id: row.id,
      eventId: row.event_id,
      event,
      mintAddress: row.mint_address,
      ownerWallet: row.owner_wallet,
      purchasePrice: Number(row.purchase_price),
      purchaseDate: row.purchase_date,
      status: row.status as TicketStatus,
      tokenAccount: row.token_account,
      metadataUri: row.metadata_uri,
      seatInfo: row.seat_info || undefined,
      tier: row.tier as TicketTier,
    });
  }
  return results;
}

// ─── Fetch Tickets by Owner Wallet ───
export async function fetchTicketsByOwner(walletAddress: string): Promise<Ticket[]> {
  const supabase = getSupabase();
  if (!supabase) return MOCK_TICKETS.filter((t) => t.ownerWallet === walletAddress);

  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('owner_wallet', walletAddress)
    .order('purchase_date', { ascending: false });

  if (error) {
    console.error('Error fetching tickets:', error.message);
    throw new Error(error.message);
  }

  return data && data.length > 0 ? mapTicketRows(data) : [];
}

// ─── Fetch Single Ticket ───
export async function fetchTicketById(id: string): Promise<Ticket | null> {
  const supabase = getSupabase();
  if (!supabase) return MOCK_TICKETS.find((t) => t.id === id) ?? null;

  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching ticket:', error.message);
    throw new Error(error.message);
  }

  return data ? mapTicketRow(data) : null;
}

// ─── Fetch Tickets for an Event ───
export async function fetchTicketsByEvent(eventId: string): Promise<Ticket[]> {
  const supabase = getSupabase();
  if (!supabase) return MOCK_TICKETS.filter((t) => t.eventId === eventId);

  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('event_id', eventId)
    .order('purchase_date', { ascending: false });

  if (error) {
    console.error('Error fetching event tickets:', error.message);
    throw new Error(error.message);
  }

  return data && data.length > 0 ? mapTicketRows(data) : [];
}

// ─── Create Ticket (after on-chain purchase) ───
export async function createTicket(params: {
  eventId: string;
  ownerWallet: string;
  purchasePrice: number;
  mintAddress: string;
  tokenAccount: string;
  metadataUri: string;
  tier: TicketTier;
  seatInfo?: string;
  txSignature: string;
}): Promise<Ticket> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase not configured. Ticket creation is disabled in offline/mock mode.');
  }

  // Idempotency: check if a ticket with this txSignature already exists
  if (params.txSignature) {
    const { data: existing } = await supabase
      .from('tickets')
      .select('*')
      .eq('tx_signature', params.txSignature)
      .maybeSingle();

    if (existing) {
      return mapTicketRow(existing);
    }
  }

  const { data, error } = await supabase
    .from('tickets')
    .insert({
      event_id: params.eventId,
      owner_wallet: params.ownerWallet,
      purchase_price: params.purchasePrice,
      mint_address: params.mintAddress,
      token_account: params.tokenAccount,
      metadata_uri: params.metadataUri,
      tier: params.tier,
      seat_info: params.seatInfo || null,
      tx_signature: params.txSignature,
      status: 'valid' as TicketStatus,
      purchase_date: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating ticket:', error.message);
    throw new Error(error.message);
  }

  return mapTicketRow(data);
}

// ─── Update Ticket Status ───
export async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase not configured. Ticket updates are disabled in offline/mock mode.');
  }

  const { data, error } = await supabase
    .from('tickets')
    .update({ status })
    .eq('id', ticketId)
    .select('id');

  if (error) {
    console.error('Error updating ticket status:', error.message);
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error(`Ticket not found: ${ticketId}`);
  }
}

// ─── Transfer Ticket (change owner) ───
export async function transferTicket(
  ticketId: string,
  newOwnerWallet: string
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase not configured. Ticket transfers are disabled in offline/mock mode.');
  }

  // Get current ticket for audit logging
  const currentTicket = await fetchTicketById(ticketId);
  const previousOwner = currentTicket?.ownerWallet || 'unknown';

  const { data, error } = await supabase
    .from('tickets')
    .update({
      owner_wallet: newOwnerWallet,
      status: 'valid' as TicketStatus,
    })
    .eq('id', ticketId)
    .select('id');

  if (error) {
    console.error('Error transferring ticket:', error.message);
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error(`Ticket not found for transfer: ${ticketId}`);
  }

  // Audit log
  console.info('Ticket transferred:', {
    ticketId,
    previousOwner,
    newOwnerWallet,
    timestamp: new Date().toISOString(),
  });
}
