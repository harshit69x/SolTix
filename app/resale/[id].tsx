import { TransactionModal } from '@/components/transaction-modal';
import { Button } from '@/components/ui/button';
import { LoadingScreen } from '@/components/ui/loading';
import { cancelListing } from '@/services/marketplace-service';
import { useMarketplaceStore } from '@/store/marketplace-store';
import { useTicketStore } from '@/store/ticket-store';
import { useWalletStore } from '@/store/wallet-store';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ResaleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getTicketById, updateTicketStatus, loading: ticketLoading } = useTicketStore();
  const { addListing } = useMarketplaceStore();
  const { publicKey } = useWalletStore();

  const [price, setPrice] = useState('');
  const [priceError, setPriceError] = useState('');
  const [txModalVisible, setTxModalVisible] = useState(false);
  const [txState, setTxState] = useState<'confirming' | 'processing' | 'success' | 'error'>('confirming');

  const ticket = getTicketById(id || '');

  if (ticketLoading && !ticket) {
    return <LoadingScreen message="Loading ticket..." />;
  }

  if (!ticket) {
    return (
      <SafeAreaView className="flex-1 bg-surface-dark items-center justify-center px-8">
        <Text className="text-4xl mb-4">🔍</Text>
        <Text className="text-white font-bold text-lg text-center">Ticket not found</Text>
        <Text className="text-gray-400 text-sm text-center mt-2">
          This ticket may no longer exist or the link is invalid.
        </Text>
        <View className="mt-6">
          <Button title="Go Back" onPress={() => router.back()} variant="primary" />
        </View>
      </SafeAreaView>
    );
  }

  const maxResalePrice = ticket.event.maxResalePrice;
  const royaltyPercentage = ticket.event.royaltyPercentage;

  const validatePrice = (value: string) => {
    setPrice(value);
    const numPrice = parseFloat(value);

    if (isNaN(numPrice) || numPrice <= 0) {
      setPriceError('Please enter a valid price');
      return false;
    }
    if (numPrice > maxResalePrice) {
      setPriceError(`Price cannot exceed ${maxResalePrice} SOL (max resale cap)`);
      return false;
    }
    setPriceError('');
    return true;
  };

  const calculateBreakdown = () => {
    const numPrice = parseFloat(price) || 0;
    const royalty = (numPrice * royaltyPercentage) / 100;
    const youReceive = numPrice - royalty;
    return { royalty, youReceive };
  };

  const { royalty, youReceive } = calculateBreakdown();

  const handleListForSale = async () => {
    if (!validatePrice(price)) return;

    if (!publicKey) {
      setPriceError('Wallet not connected. Please connect your wallet first.');
      return;
    }

    if (!ticket?.id) {
      setPriceError('Ticket data is unavailable. Please try again.');
      return;
    }

    setTxState('confirming');
    setTxModalVisible(true);

    try {
      setTxState('processing');

      // Create real listing in Supabase
      const listing = await addListing({
        ticketId: ticket.id,
        sellerWallet: publicKey,
        listPrice: parseFloat(price),
        maxAllowedPrice: maxResalePrice,
        royaltyPercentage: royaltyPercentage,
        ticket,
      });

      // Update ticket status — compensate on failure
      try {
        await updateTicketStatus(ticket.id, 'listed');
      } catch (statusError) {
        console.error('Failed to update ticket status, rolling back listing:', statusError);
        // Roll back the listing since we couldn't update ticket status
        try {
          await cancelListing(listing.id);
        } catch (rollbackError) {
          console.error('Failed to rollback listing:', rollbackError);
        }
        throw statusError;
      }

      setTxState('success');
    } catch (error: any) {
      console.error('Listing error:', error);
      setTxState('error');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-dark">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-4 pb-2 flex-row items-center">
          <Button
            title=""
            onPress={() => router.back()}
            variant="ghost"
            size="sm"
            icon={<Ionicons name="arrow-back" size={22} color="#fff" />}
          />
          <Text className="text-white font-bold text-xl ml-2">List for Resale</Text>
        </View>

        <View className="px-6 mt-4">
          {/* Ticket Summary */}
          <View className="bg-surface-card rounded-2xl p-4 mb-6">
            <Text className="text-white font-bold text-base">{ticket.event.title}</Text>
            <View className="flex-row items-center mt-2">
              <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
              <Text className="text-gray-400 text-sm ml-1.5">
                {new Date(ticket.event.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
            <View className="flex-row items-center mt-1">
              <Ionicons name="location-outline" size={14} color="#9ca3af" />
              <Text className="text-gray-400 text-sm ml-1.5">{ticket.event.venue}</Text>
            </View>
            <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-700/30">
              <View>
                <Text className="text-gray-500 text-xs">Original Price</Text>
                <Text className="text-white font-bold text-sm">
                  {ticket.purchasePrice} SOL
                </Text>
              </View>
              <View>
                <Text className="text-gray-500 text-xs">Tier</Text>
                <Text className="text-white font-medium text-sm uppercase">
                  {ticket.tier}
                </Text>
              </View>
              <View>
                <Text className="text-gray-500 text-xs">Mint</Text>
                <Text className="text-gray-400 text-xs font-mono">
                  {ticket.mintAddress.slice(0, 4)}...{ticket.mintAddress.slice(-4)}
                </Text>
              </View>
            </View>
          </View>

          {/* Resale Rules */}
          <View className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-6">
            <View className="flex-row items-center mb-2">
              <Ionicons name="shield-checkmark" size={18} color="#f59e0b" />
              <Text className="text-amber-400 font-bold text-sm ml-2">
                Resale Rules (Enforced On-Chain)
              </Text>
            </View>
            <Text className="text-gray-400 text-xs leading-relaxed">
              • Maximum resale price:{' '}
              <Text className="text-white font-semibold">{maxResalePrice} SOL</Text>
              {'\n'}• Organizer royalty:{' '}
              <Text className="text-white font-semibold">{royaltyPercentage}%</Text> of sale price
              {'\n'}• These rules are enforced at the smart contract level and cannot be bypassed
            </Text>
          </View>

          {/* Price Input */}
          <View className="mb-6">
            <Text className="text-white font-bold text-base mb-3">Set Your Price</Text>
            <View
              className={`flex-row items-center bg-surface-card rounded-xl px-4 py-3 border ${priceError ? 'border-red-500' : 'border-gray-700/30'
                }`}
            >
              <Text className="text-gray-400 text-lg mr-2">◎</Text>
              <TextInput
                value={price}
                onChangeText={validatePrice}
                placeholder="0.00"
                placeholderTextColor="#6b7280"
                keyboardType="decimal-pad"
                className="flex-1 text-white text-xl font-bold"
              />
              <Text className="text-gray-400 text-sm">SOL</Text>
            </View>
            {priceError ? (
              <Text className="text-red-400 text-xs mt-2">{priceError}</Text>
            ) : (
              <Text className="text-gray-500 text-xs mt-2">
                Max allowed: {maxResalePrice} SOL
              </Text>
            )}
          </View>

          {/* Price Breakdown */}
          {parseFloat(price) > 0 && !priceError && (
            <View className="bg-surface-card rounded-2xl p-4 mb-6">
              <Text className="text-white font-bold text-base mb-3">Price Breakdown</Text>

              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-400 text-sm">List Price</Text>
                <Text className="text-white font-medium text-sm">{parseFloat(price).toFixed(4)} SOL</Text>
              </View>

              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-400 text-sm">
                  Organizer Royalty ({royaltyPercentage}%)
                </Text>
                <Text className="text-amber-400 font-medium text-sm">
                  -{royalty.toFixed(4)} SOL
                </Text>
              </View>

              <View className="border-t border-gray-700/30 mt-2 pt-2">
                <View className="flex-row justify-between">
                  <Text className="text-white font-semibold text-sm">You Receive</Text>
                  <Text className="text-solana-green font-bold text-lg">
                    {youReceive.toFixed(4)} SOL
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View className="px-6 py-4 bg-surface-card border-t border-gray-700/30">
        <Button
          title="List for Resale"
          onPress={handleListForSale}
          variant="primary"
          size="lg"
          fullWidth
          disabled={!price || !!priceError || parseFloat(price) <= 0}
          icon={<Ionicons name="pricetag" size={20} color="#fff" />}
        />
      </View>

      <TransactionModal
        visible={txModalVisible}
        state={txState}
        title="Listing Ticket for Resale"
        message={txState === 'success' ? 'Your ticket has been listed on the marketplace!' : undefined}
        onClose={() => {
          setTxModalVisible(false);
          if (txState === 'success') {
            router.push('/(tabs)/marketplace');
          }
        }}
        onRetry={handleListForSale}
      />
    </SafeAreaView>
  );
}
