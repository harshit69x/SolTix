import { TransactionModal } from '@/components/transaction-modal';
import { Button } from '@/components/ui/button';
import { LoadingScreen } from '@/components/ui/loading';
import { WalletModal } from '@/components/wallet-modal';
import { PublicKey } from '@solana/web3.js';
import { sendPayment } from '@/services/wallet-service';
import { useEventStore } from '@/store/event-store';
import { useTicketStore } from '@/store/ticket-store';
import { useWalletStore } from '@/store/wallet-store';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getEventById, fetchEvents, events, loading } = useEventStore();
  const { connected, publicKey, balance, refreshBalance } = useWalletStore();
  const { addTicket } = useTicketStore();

  const [txModalVisible, setTxModalVisible] = useState(false);
  const [txState, setTxState] = useState<'confirming' | 'processing' | 'success' | 'error'>('confirming');
  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const [txSignature, setTxSignature] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (events.length === 0 && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      fetchEvents();
    }
  }, [events.length, fetchEvents]);

  const event = getEventById(id || '');

  if (loading && !event) {
    return <LoadingScreen message="Loading event..." />;
  }

  if (!event) {
    return (
      <SafeAreaView className="flex-1 bg-surface-dark items-center justify-center px-8">
        <Text className="text-4xl mb-4">🔍</Text>
        <Text className="text-white font-bold text-lg text-center">Event not found</Text>
        <Text className="text-gray-400 text-sm text-center mt-2">
          This event may have been removed or the link is invalid.
        </Text>
        <View className="mt-6">
          <Button title="Go Back" onPress={() => router.back()} variant="primary" />
        </View>
      </SafeAreaView>
    );
  }

  const ticketsRemaining = Math.max(0, event.totalTickets - event.ticketsSold);
  const soldPercentage = event.totalTickets > 0
    ? Math.min(100, Math.max(0, (event.ticketsSold / event.totalTickets) * 100))
    : 0;
  const isSoldOut = ticketsRemaining === 0;
  const canAfford = Number.isFinite(balance) && balance >= event.ticketPrice;
  const hasValidOrganizerWallet = (() => {
    try {
      new PublicKey(event.organizerWallet);
      return true;
    } catch {
      return false;
    }
  })();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handlePurchase = async () => {
    if (isProcessing) return;

    if (!connected) {
      setWalletModalVisible(true);
      return;
    }

    const wallet = publicKey;
    if (!wallet) {
      setTxState('error');
      setTxModalVisible(true);
      return;
    }

    if (!canAfford) {
      setTxState('error');
      setTxModalVisible(true);
      return;
    }

    if (!hasValidOrganizerWallet) {
      setTxState('error');
      setTxModalVisible(true);
      return;
    }

    setIsProcessing(true);
    setTxState('confirming');
    setTxModalVisible(true);

    try {
      setTxState('processing');

      if (event.ticketPrice <= 0) {
        await addTicket({
          eventId: event.id,
          ownerWallet: wallet,
          purchasePrice: 0,
          mintAddress: `SolTixNFT_${Date.now()}`,
          tokenAccount: '',
          metadataUri: event.metadataUri,
          tier: 'general',
          txSignature: `free_${Date.now()}`,
        });

        setTxSignature('FREE_TICKET');
        setTxState('success');
        return;
      }

      // Send real SOL payment to the event organizer
      const result = await sendPayment(
        wallet,
        event.organizerWallet,
        event.ticketPrice
      );

      if (!result.signature) {
        throw new Error('Transaction signature not received.');
      }

      setTxSignature(result.signature);

      // Record the ticket in the database
      try {
        await addTicket({
          eventId: event.id,
          ownerWallet: wallet,
          purchasePrice: event.ticketPrice,
          mintAddress: `SolTixNFT_${Date.now()}`, // Will be replaced by actual NFT mint
          tokenAccount: '',
          metadataUri: event.metadataUri,
          tier: 'general',
          txSignature: result.signature,
        });
      } catch (ticketError) {
        console.error('Ticket recording failed after successful payment. Tx:', result.signature, ticketError);
        throw new Error('Payment succeeded but ticket creation failed. Please retry to sync your ticket.');
      }

      setTxState('success');
      // Refresh wallet balance after successful purchase
      refreshBalance();
    } catch (error: any) {
      console.error('Purchase error:', error);
      setTxState('error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-dark">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View className="relative">
          <Image
            source={{ uri: event.imageUrl }}
            style={{ width, height: 280 }}
            contentFit="cover"
          />
          <View className="absolute inset-0 bg-black/30" />

          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute top-4 left-4 w-10 h-10 bg-black/50 rounded-full items-center justify-center"
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>

          {/* Category Badge */}
          <View className="absolute bottom-4 left-4">
            <View className="bg-solana-purple px-4 py-1.5 rounded-full">
              <Text className="text-white text-xs font-bold capitalize">
                {event.category}
              </Text>
            </View>
          </View>
        </View>

        <View className="px-6 pt-6 pb-8">
          {/* Title & Organizer */}
          <Text className="text-white font-bold text-2xl">{event.title}</Text>
          <View className="flex-row items-center mt-2">
            <View className="w-6 h-6 bg-solana-purple/20 rounded-full items-center justify-center">
              <Ionicons name="person" size={12} color="#9945FF" />
            </View>
            <Text className="text-gray-400 text-sm ml-2">
              by {event.organizerName}
            </Text>
          </View>

          {/* Event Details */}
          <View className="mt-6 bg-surface-card rounded-2xl p-4">
            <View className="flex-row items-center mb-3">
              <View className="w-10 h-10 bg-solana-purple/10 rounded-xl items-center justify-center">
                <Ionicons name="calendar" size={20} color="#9945FF" />
              </View>
              <View className="ml-3">
                <Text className="text-gray-400 text-xs">Date & Time</Text>
                <Text className="text-white font-medium text-sm">
                  {formatDate(event.date)} • {event.time}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center mb-3">
              <View className="w-10 h-10 bg-solana-green/10 rounded-xl items-center justify-center">
                <Ionicons name="location" size={20} color="#14F195" />
              </View>
              <View className="ml-3">
                <Text className="text-gray-400 text-xs">Venue</Text>
                <Text className="text-white font-medium text-sm">
                  {event.venue}
                </Text>
                <Text className="text-gray-400 text-xs mt-0.5">
                  {event.location}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-amber-500/10 rounded-xl items-center justify-center">
                <Ionicons name="people" size={20} color="#f59e0b" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-gray-400 text-xs">Availability</Text>
                <Text className="text-white font-medium text-sm">
                  {ticketsRemaining} of {event.totalTickets} remaining
                </Text>
                <View className="w-full h-1.5 bg-gray-700 rounded-full mt-1.5 overflow-hidden">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${soldPercentage}%`,
                      backgroundColor:
                        soldPercentage > 90
                          ? '#ef4444'
                          : soldPercentage > 70
                            ? '#f59e0b'
                            : '#14F195',
                    }}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Description */}
          <View className="mt-6">
            <Text className="text-white font-bold text-lg mb-2">About</Text>
            <Text className="text-gray-400 text-sm leading-relaxed">
              {event.description}
            </Text>
          </View>

          {/* Ticket Info */}
          <View className="mt-6 bg-surface-card rounded-2xl p-4">
            <Text className="text-white font-bold text-base mb-3">Ticket Info</Text>

            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-400 text-sm">Price</Text>
              <Text className="text-solana-green font-bold text-base">
                {event.ticketPrice > 0 ? `${event.ticketPrice} SOL` : 'Free'}
              </Text>
            </View>

            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-400 text-sm">Max Resale Price</Text>
              <Text className="text-white font-medium text-sm">
                {event.maxResalePrice > 0 ? `${event.maxResalePrice} SOL` : 'N/A'}
              </Text>
            </View>

            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-400 text-sm">Resale Royalty</Text>
              <Text className="text-white font-medium text-sm">
                {event.royaltyPercentage}%
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-gray-400 text-sm">Blockchain</Text>
              <View className="flex-row items-center">
                <Text className="text-white font-medium text-sm">Solana</Text>
              </View>
            </View>
          </View>

          {/* Organizer Info */}
          <View className="mt-6 bg-surface-card rounded-2xl p-4">
            <Text className="text-white font-bold text-base mb-3">Organizer</Text>
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-solana-purple/20 rounded-full items-center justify-center">
                <Text className="text-lg">🎪</Text>
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-white font-medium text-sm">{event.organizerName}</Text>
                <Text className="text-gray-400 text-xs font-mono mt-0.5">
                  {event.organizerWallet.slice(0, 8)}...{event.organizerWallet.slice(-6)}
                </Text>
              </View>
              <View className="bg-blue-500/20 px-2.5 py-1 rounded-full">
                <Text className="text-blue-400 text-xs font-semibold">Verified</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Purchase Bar */}
      <View className="px-6 py-4 bg-surface-card border-t border-gray-700/30">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-gray-400 text-xs">Total Price</Text>
            <Text className="text-solana-green font-bold text-2xl">
              {event.ticketPrice > 0 ? `${event.ticketPrice} SOL` : 'Free'}
            </Text>
          </View>
          {connected && (
            <View className="items-end">
              <Text className="text-gray-500 text-xs">Your balance</Text>
              <Text className={`font-medium text-sm ${canAfford ? 'text-white' : 'text-red-400'}`}>
                {Number.isFinite(balance) ? balance.toFixed(2) : '--'} SOL
              </Text>
            </View>
          )}
        </View>

        <Button
          title={
            isSoldOut
              ? 'Sold Out'
              : !connected
                ? 'Connect Wallet to Buy'
                : !canAfford
                  ? 'Insufficient Balance'
                  : !hasValidOrganizerWallet
                    ? 'Invalid Organizer Wallet'
                    : 'Buy Ticket'
          }
          onPress={handlePurchase}
          variant="primary"
          size="lg"
          fullWidth
          disabled={isSoldOut || isProcessing || !hasValidOrganizerWallet}
          loading={isProcessing}
          icon={
            !isSoldOut ? (
              <Ionicons name={connected ? 'ticket' : 'wallet'} size={20} color="#fff" />
            ) : undefined
          }
        />
      </View>

      <TransactionModal
        visible={txModalVisible}
        state={txState}
        title={txState === 'error' && !canAfford ? 'Insufficient Balance' : 'Purchasing Ticket'}
        message={
          txState === 'error' && !canAfford
            ? `You need ${event.ticketPrice} SOL but only have ${Number.isFinite(balance) ? balance.toFixed(2) : '0'} SOL`
            : txState === 'error' && !hasValidOrganizerWallet
              ? 'This event has an invalid organizer wallet address and cannot be purchased.'
              : undefined
        }
        signature={txSignature || undefined}
        onClose={() => {
          setTxModalVisible(false);
          if (txState === 'success') {
            router.push('/(tabs)/tickets');
          }
        }}
        onRetry={handlePurchase}
      />

      <WalletModal
        visible={walletModalVisible}
        onClose={() => setWalletModalVisible(false)}
      />
    </SafeAreaView>
  );
}
