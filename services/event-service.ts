import { PublicKey } from '@solana/web3.js';
import { getSupabase } from '@/services/supabase';
import { EventCategory, EventData } from '@/types';
import type { EventRow } from '@/types/database';
import { MOCK_EVENTS } from '@/data/mock-data';

const DEV_FALLBACK_ORGANIZER_WALLET = process.env.EXPO_PUBLIC_DEV_FALLBACK_ORGANIZER_WALLET?.trim() || '';

function isValidWalletAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

function getNormalizedOrganizerWallet(row: EventRow): string | null {
  if (isValidWalletAddress(row.organizer_wallet)) {
    return row.organizer_wallet;
  }

  if (DEV_FALLBACK_ORGANIZER_WALLET && isValidWalletAddress(DEV_FALLBACK_ORGANIZER_WALLET)) {
    console.warn(
      `Event ${row.id} has invalid organizer wallet "${row.organizer_wallet}". Using EXPO_PUBLIC_DEV_FALLBACK_ORGANIZER_WALLET for dev mode.`
    );
    return DEV_FALLBACK_ORGANIZER_WALLET;
  }

  console.warn(`Skipping event with invalid organizer wallet and no valid fallback configured: ${row.id}`);
  return null;
}

// ─── Row → App Model Mapper ───
function mapEventRow(row: EventRow, organizerWallet: string): EventData {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    date: row.date,
    time: row.time,
    venue: row.venue,
    location: row.location,
    imageUrl: row.image_url,
    organizerWallet,
    organizerName: row.organizer_name,
    ticketPrice: Number(row.ticket_price),
    totalTickets: row.total_tickets,
    ticketsSold: row.tickets_sold,
    maxResalePrice: Number(row.max_resale_price),
    royaltyPercentage: Number(row.royalty_percentage),
    category: row.category as EventCategory,
    status: row.status as EventData['status'],
    metadataUri: row.metadata_uri,
    createdAt: row.created_at,
  };
}

function mapAndFilterValidEvents(rows: EventRow[]): EventData[] {
  return rows.flatMap((row) => {
    const organizerWallet = getNormalizedOrganizerWallet(row);
    if (!organizerWallet) return [];
    return [mapEventRow(row, organizerWallet)];
  });
}

// ─── Fetch All Events ───
export async function fetchAllEvents(): Promise<EventData[]> {
  const supabase = getSupabase();
  if (!supabase) return MOCK_EVENTS;

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching events:', error.message);
    throw new Error(error.message);
  }

  return mapAndFilterValidEvents(data || []);
}

// ─── Fetch Events by Category ───
export async function fetchEventsByCategory(category: EventCategory): Promise<EventData[]> {
  const supabase = getSupabase();
  if (!supabase) return MOCK_EVENTS.filter((e) => e.category === category);

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('category', category)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching events by category:', error.message);
    throw new Error(error.message);
  }

  return mapAndFilterValidEvents(data || []);
}

// ─── Fetch Single Event ───
export async function fetchEventById(id: string): Promise<EventData | null> {
  const supabase = getSupabase();
  if (!supabase) return MOCK_EVENTS.find((e) => e.id === id) ?? null;

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    console.error('Error fetching event:', error.message);
    throw new Error(error.message);
  }

  if (!data) return null;
  const organizerWallet = getNormalizedOrganizerWallet(data);
  if (!organizerWallet) {
    return null;
  }
  return mapEventRow(data, organizerWallet);
}

// ─── Search Events ───
export async function searchEvents(query: string, category?: EventCategory): Promise<EventData[]> {
  const supabase = getSupabase();
  if (!supabase) {
    const q = query.trim().toLowerCase();
    return MOCK_EVENTS.filter((e) => {
      if (category && e.category !== category) return false;
      return (
        e.title.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
      );
    });
  }

  // Sanitize input for ilike pattern — escape SQL wildcards and special characters
  const sanitized = query
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .replace(/,/g, '\\,')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

  let q = supabase
    .from('events')
    .select('*')
    .or(`title.ilike.%${sanitized}%,location.ilike.%${sanitized}%,venue.ilike.%${sanitized}%,description.ilike.%${sanitized}%`)
    .order('date', { ascending: true });

  if (category) {
    q = q.eq('category', category);
  }

  const { data, error } = await q;

  if (error) {
    console.error('Error searching events:', error.message);
    throw new Error(error.message);
  }

  return mapAndFilterValidEvents(data || []);
}

// ─── Fetch Upcoming Events ───
export async function fetchUpcomingEvents(limit = 10): Promise<EventData[]> {
  const supabase = getSupabase();
  if (!supabase) {
    const today = new Date().toISOString().split('T')[0];
    return MOCK_EVENTS.filter((e) => e.status === 'upcoming' && e.date >= today).slice(0, limit);
  }

  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .gte('date', today)
    .eq('status', 'upcoming')
    .order('date', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching upcoming events:', error.message);
    throw new Error(error.message);
  }

  return mapAndFilterValidEvents(data || []);
}

// ─── Increment Tickets Sold (after purchase) ───
// NOTE: The DB trigger `on_ticket_created` auto-increments tickets_sold on INSERT.
// This manual function is kept as an RPC fallback. Prefer relying on the trigger.
export async function incrementTicketsSold(eventId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) {
    console.warn('incrementTicketsSold skipped: Supabase not configured.', { eventId });
    return;
  }

  const { error } = await supabase.rpc('increment_tickets_sold_rpc', {
    p_event_id: eventId,
  });

  // Fallback to manual update if RPC doesn't exist
  if (error && error.message.includes('function')) {
    const event = await fetchEventById(eventId);
    if (!event) {
      throw new Error(`Event not found: ${eventId}`);
    }

    const { error: updateError } = await supabase
      .from('events')
      .update({ tickets_sold: event.ticketsSold + 1 })
      .eq('id', eventId);

    if (updateError) {
      throw new Error(`Failed to increment tickets sold: ${updateError.message}`);
    }
  } else if (error) {
    throw new Error(`Failed to increment tickets sold: ${error.message}`);
  }
}
