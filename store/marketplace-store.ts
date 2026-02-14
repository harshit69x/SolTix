import {
  cancelListing as cancelListingAPI,
  createListing as createListingAPI,
  fetchActiveListings,
  updateListingStatus as updateListingStatusAPI,
} from '@/services/marketplace-service';
import { MOCK_LISTINGS } from '@/data/mock-data';
import { ListingStatus, MarketplaceListing, Ticket } from '@/types';
import { create } from 'zustand';

interface MarketplaceStore {
  listings: MarketplaceListing[];
  loading: boolean;
  error: string | null;

  fetchListings: () => Promise<void>;
  getListingById: (id: string) => MarketplaceListing | undefined;
  addListing: (params: {
    ticketId: string;
    sellerWallet: string;
    listPrice: number;
    maxAllowedPrice: number;
    royaltyPercentage: number;
    ticket?: Ticket;
  }) => Promise<MarketplaceListing>;
  updateListingStatus: (
    listingId: string,
    status: ListingStatus,
    buyerWallet?: string,
    txSignature?: string
  ) => Promise<void>;
  removeListing: (listingId: string) => Promise<void>;
}

export const useMarketplaceStore = create<MarketplaceStore>((set, get) => ({
  listings: [],
  loading: false,
  error: null,

  fetchListings: async () => {
    set({ loading: true, error: null });
    try {
      let listings = await fetchActiveListings();
      if (listings.length === 0) {
        console.log('No listings in database — using mock listings for testing');
        listings = MOCK_LISTINGS;
      }
      set({ listings, loading: false });
    } catch (error: any) {
      console.error('Error fetching listings:', error);
      console.log('Supabase unavailable — using mock listings for testing');
      set({ listings: MOCK_LISTINGS, loading: false, error: null });
    }
  },

  getListingById: (id: string) => {
    return get().listings.find((l) => l.id === id);
  },

  addListing: async (params) => {
    try {
      const listing = await createListingAPI(params);
      set((state) => ({
        listings: [listing, ...state.listings],
      }));
      return listing;
    } catch (error: any) {
      console.error('Error adding listing:', error);
      throw error;
    }
  },

  updateListingStatus: async (
    listingId: string,
    status: ListingStatus,
    buyerWallet?: string,
    txSignature?: string
  ) => {
    try {
      await updateListingStatusAPI(listingId, status, buyerWallet, txSignature);
      set((state) => ({
        listings: state.listings.map((l) =>
          l.id === listingId ? { ...l, status, buyerWallet, txSignature } : l
        ),
      }));
    } catch (error: any) {
      console.error('Error updating listing status:', error);
      throw error;
    }
  },

  removeListing: async (listingId: string) => {
    try {
      await cancelListingAPI(listingId);
      set((state) => ({
        listings: state.listings.filter((l) => l.id !== listingId),
      }));
    } catch (error: any) {
      console.error('Error cancelling listing:', error);
      throw error;
    }
  },
}));
