import { EventCard } from '@/components/event-card';
import { useEventStore } from '@/store/event-store';
import { useTicketStore } from '@/store/ticket-store';
import { useWalletStore } from '@/store/wallet-store';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const { publicKey, balance, connected, refreshBalance } = useWalletStore();
  const { events, fetchEvents } = useEventStore();
  const { tickets, fetchTickets } = useTicketStore();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    fetchEvents();
    if (connected && publicKey) {
      fetchTickets(publicKey);
      refreshBalance();
    }
  }, [connected, publicKey]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchEvents(),
        ...(connected && publicKey ? [fetchTickets(publicKey), refreshBalance()] : []),
      ]);
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const validTickets = tickets.filter((t) => t.status === 'valid');
  const listedTickets = tickets.filter((t) => t.status === 'listed');
  const upcomingEvents = events.filter((e) => e.status === 'upcoming').slice(0, 3);

  const shortAddress = publicKey
    ? `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`
    : 'Not connected';

  return (
    <SafeAreaView className="flex-1 bg-surface-dark">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#9945FF" />
        }
      >
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-gray-400 text-sm">Welcome back 👋</Text>
              <Text className="text-white font-bold text-2xl mt-1">Dashboard</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/settings')}
              className="w-10 h-10 bg-surface-card rounded-full items-center justify-center"
            >
              <Ionicons name="person" size={18} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Wallet Card */}
        <View className="mx-6 bg-surface-card rounded-2xl p-5 mb-6 border border-gray-700/30">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-solana-purple/20 rounded-full items-center justify-center">
                <Ionicons name="wallet" size={20} color="#9945FF" />
              </View>
              <View className="ml-3">
                <Text className="text-gray-400 text-xs">Wallet</Text>
                <Text className="text-white font-medium text-sm">{shortAddress}</Text>
              </View>
            </View>
            <View className={`px-2.5 py-1 rounded-full ${connected ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              <Text className={`text-xs font-semibold ${connected ? 'text-green-400' : 'text-red-400'}`}>
                {connected ? 'Connected' : 'Disconnected'}
              </Text>
            </View>
          </View>
          <View className="bg-surface-dark rounded-xl p-4">
            <Text className="text-gray-500 text-xs">Balance</Text>
            <View className="flex-row items-baseline mt-1">
              <Text className="text-white font-bold text-3xl">{Number.isFinite(balance) ? balance.toFixed(2) : '--'}</Text>
              <Text className="text-solana-green font-semibold text-base ml-1.5">SOL</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View className="flex-row px-6 gap-3 mb-6">
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/tickets')}
            className="flex-1 bg-surface-card rounded-2xl p-4"
            activeOpacity={0.8}
          >
            <View className="w-10 h-10 bg-solana-green/20 rounded-xl items-center justify-center mb-3">
              <Ionicons name="ticket" size={20} color="#14F195" />
            </View>
            <Text className="text-white font-bold text-2xl">{validTickets.length}</Text>
            <Text className="text-gray-400 text-xs mt-0.5">Active Tickets</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/marketplace')}
            className="flex-1 bg-surface-card rounded-2xl p-4"
            activeOpacity={0.8}
          >
            <View className="w-10 h-10 bg-amber-500/20 rounded-xl items-center justify-center mb-3">
              <Ionicons name="pricetag" size={20} color="#f59e0b" />
            </View>
            <Text className="text-white font-bold text-2xl">{listedTickets.length}</Text>
            <Text className="text-gray-400 text-xs mt-0.5">Listed for Sale</Text>
          </TouchableOpacity>

          <View className="flex-1 bg-surface-card rounded-2xl p-4">
            <View className="w-10 h-10 bg-blue-500/20 rounded-xl items-center justify-center mb-3">
              <Ionicons name="calendar" size={20} color="#3b82f6" />
            </View>
            <Text className="text-white font-bold text-2xl">{upcomingEvents.length}</Text>
            <Text className="text-gray-400 text-xs mt-0.5">Upcoming</Text>
          </View>
        </View>

        {/* Upcoming Events */}
        <View className="px-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white font-bold text-lg">Trending Events</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
              <Text className="text-solana-purple font-semibold text-sm">See All</Text>
            </TouchableOpacity>
          </View>

          {upcomingEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
              compact
            />
          ))}
        </View>

        {/* Recent Activity */}
        <View className="px-6 mt-6">
          <Text className="text-white font-bold text-lg mb-4">Recent Activity</Text>
          {tickets.slice(0, 3).map((ticket) => (
            <View
              key={ticket.id}
              className="flex-row items-center bg-surface-card rounded-xl p-3.5 mb-2"
            >
              <View className="w-8 h-8 bg-solana-purple/20 rounded-full items-center justify-center">
                <Ionicons
                  name={ticket.status === 'listed' ? 'pricetag' : 'ticket'}
                  size={14}
                  color="#9945FF"
                />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-white text-sm font-medium" numberOfLines={1}>
                  {ticket.event?.title ?? 'Untitled Event'}
                </Text>
                <Text className="text-gray-500 text-xs mt-0.5">
                  {ticket.status === 'listed' ? 'Listed for resale' : 'Purchased'}
                </Text>
              </View>
              <Text className="text-solana-green font-semibold text-sm">
                {ticket.purchasePrice} SOL
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
