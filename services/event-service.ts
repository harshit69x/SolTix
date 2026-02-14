import { MOCK_EVENTS } from '@/data/mock-data';
import { EventCategory, EventData } from '@/types';

function cloneEvents(): EventData[] {
  return MOCK_EVENTS.map((event) => ({ ...event }));
}

export async function fetchAllEvents(): Promise<EventData[]> {
  return cloneEvents();
}

export async function fetchEventsByCategory(category: EventCategory): Promise<EventData[]> {
  return cloneEvents().filter((event) => event.category === category);
}

export async function fetchEventById(id: string): Promise<EventData | null> {
  return cloneEvents().find((event) => event.id === id) ?? null;
}

export async function searchEvents(query: string, category?: EventCategory): Promise<EventData[]> {
  const q = query.trim().toLowerCase();
  return cloneEvents().filter((event) => {
    if (category && event.category !== category) return false;
    return (
      event.title.toLowerCase().includes(q) ||
      event.location.toLowerCase().includes(q) ||
      event.venue.toLowerCase().includes(q) ||
      event.description.toLowerCase().includes(q)
    );
  });
}

export async function fetchUpcomingEvents(limit = 10): Promise<EventData[]> {
  const today = new Date().toISOString().split('T')[0];
  return cloneEvents()
    .filter((event) => event.status === 'upcoming' && event.date >= today)
    .slice(0, limit);
}

export async function incrementTicketsSold(eventId: string): Promise<void> {
  const event = MOCK_EVENTS.find((item) => item.id === eventId);
  if (!event) return;
  event.ticketsSold = Math.min(event.totalTickets, event.ticketsSold + 1);
}
