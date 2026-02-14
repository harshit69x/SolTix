import { ListingCard } from '@/components/listing-card';
import { TransactionModal } from '@/components/transaction-modal';
import { EmptyState, LoadingScreen } from '@/components/ui/loading';
import { SearchBar } from '@/components/ui/search-bar';
import { transferTicket } from '@/services/ticket-service';
import { sendPayment } from '@/services/wallet-service';
import { useMarketplaceStore } from '@/store/marketplace-store';
import { useTicketStore } from '@/store/ticket-store';
import { useWalletStore } from '@/store/wallet-store';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MarketplaceScreen() {
  const { listings, loading, fetchListings } = useMarketplaceStore();
  const { publicKey, connected, refreshBalance } = useWalletStore();
  const { fetchTickets } = useTicketStore();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [txModalVisible, setTxModalVisible] = useState(false);
  const [txState, setTxState] = useState<'confirming' | 'processing' | 'success' | 'error'>('confirming');
  const [txTitle, setTxTitle] = useState('');
  const [purchaseListingId, setPurchaseListingId] = useState<string | null>(null);

  useEffect(() => {
    fetchListings();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchListings();
    } catch (error) {
      console.error('Error refreshing listings:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleBuy = async (listingId: string) => {
    if (!connected) {
      router.push('/landing');
      return;
    }

    const listing = listings.find((l) => l.id === listingId);
    if (!listing) return;
    if (!publicKey) return;
    if (listing.sellerWallet === publicKey) {
      setTxTitle('Cannot Buy Your Own Listing');
      setTxState('error');
      setTxModalVisible(true);
      return;
    }

    setPurchaseListingId(listingId);
    setTxTitle('Purchasing Ticket');
    setTxModalVisible(true);
    setTxState('confirming');

    // Wait briefly so the user sees the confirming state
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      setTxState('processing');

      const payment = await sendPayment(publicKey, listing.sellerWallet, listing.listPrice);

      // Update listing status in database
      await useMarketplaceStore.getState().updateListingStatus(
        listingId,
        'sold',
        publicKey,
        payment.signature
      );

      await transferTicket(listing.ticket.id, publicKey);

      // Keep local ticket list usable even in fallback/local mode.
      useTicketStore.setState((state) => ({
        tickets: [
          {
            ...listing.ticket,
            ownerWallet: publicKey,
            purchasePrice: listing.listPrice,
            purchaseDate: new Date().toISOString(),
            status: 'valid',
          },
          ...state.tickets.filter((t) => t.id !== listing.ticket.id),
        ],
      }));

      await fetchListings();
      await fetchTickets(publicKey);
      await refreshBalance();

      setTxState('success');
    } catch (error: any) {
      console.error('Purchase error:', error);
      setTxState('error');
    }
  };

  const activeListings = listings.filter((l) => l.status === 'active');

  const filteredListings = searchQuery
    ? activeListings.filter(
      (l) =>
        l.ticket.event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.ticket.event.location.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : activeListings;

  if (loading && listings.length === 0) {
    return <LoadingScreen message="Loading marketplace..." />;
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-dark">
      <View className="px-6 pt-4 pb-2">
        <Text className="text-white font-bold text-2xl">Marketplace</Text>
        <Text className="text-gray-400 text-sm mt-1">
          Browse verified resale tickets
        </Text>
      </View>

      <View className="px-6 mt-4">
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search listings..."
        />
      </View>

      {/* Info Banner */}
      <View className="mx-6 bg-solana-green/10 border border-solana-green/20 rounded-xl p-3 mb-4 flex-row items-center">
        <Text className="text-solana-green text-xs flex-1">
          🛡 All resale tickets are verified NFTs with enforced price caps and automatic royalty distribution.
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#9945FF" />
        }
      >
        {filteredListings.length === 0 ? (
          <EmptyState
            title="No Listings"
            message="There are no active listings at the moment"
          />
        ) : (
          <>
            <Text className="text-gray-400 text-sm mb-3">
              {filteredListings.length} active listing{filteredListings.length !== 1 ? 's' : ''}
            </Text>
            {filteredListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onPress={() => router.push(`/event/${listing.ticket.eventId}` as any)}
                onBuy={() => handleBuy(listing.id)}
                isOwner={listing.sellerWallet === publicKey}
              />
            ))}
          </>
        )}
      </ScrollView>

      <TransactionModal
        visible={txModalVisible}
        state={txState}
        title={txTitle}
        onClose={() => setTxModalVisible(false)}
        onRetry={() => {
          if (purchaseListingId) {
            handleBuy(purchaseListingId);
          }
        }}
      />
    </SafeAreaView>
  );
}
