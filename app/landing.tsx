import { Button } from '@/components/ui/button';
import { WalletModal } from '@/components/wallet-modal';
import { useWalletStore } from '@/store/wallet-store';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const FEATURES = [
  {
    icon: 'shield-checkmark',
    title: 'Fraud-Proof Tickets',
    description: 'Every ticket is a unique NFT verified on-chain. No counterfeits, ever.',
  },
  {
    icon: 'swap-horizontal',
    title: 'Controlled Resale',
    description: 'Resale price caps and rules enforced at the smart contract level.',
  },
  {
    icon: 'cash',
    title: 'Automatic Royalties',
    description: 'Organizers earn royalties on every secondary sale, automatically.',
  },
  {
    icon: 'flash',
    title: 'Instant & Cheap',
    description: 'Sub-second finality and near-zero fees on Solana blockchain.',
  },
];

const STATS = [
  { value: '10K+', label: 'Tickets Minted' },
  { value: '<2s', label: 'Confirmation' },
  { value: '$0.001', label: 'Avg. Fee' },
  { value: '99.9%', label: 'Uptime' },
];

export default function LandingScreen() {
  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const { connected } = useWalletStore();

  React.useEffect(() => {
    if (connected) {
      router.replace('/(tabs)');
    }
  }, [connected]);

  return (
    <SafeAreaView className="flex-1 bg-surface-dark">
      <StatusBar style="light" />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <View className="flex-row items-center">
            <Text className="text-2xl">🎫</Text>
            <Text className="text-white font-bold text-xl ml-2">SolTix</Text>
          </View>
        </View>

        {/* Hero Section */}
        <View className="px-6 pt-8 pb-10">
          <View className="bg-solana-purple/10 self-start px-4 py-1.5 rounded-full mb-4">
            <Text className="text-solana-purple text-xs font-semibold">
              ⚡ Built on Solana
            </Text>
          </View>

          <Text className="text-white font-bold text-4xl leading-tight">
            NFT Tickets.{'\n'}
            <Text className="text-solana-green">Trustless.</Text>
            {'\n'}Transparent.
          </Text>

          <Text className="text-gray-400 text-base mt-4 leading-relaxed">
            The decentralized ticketing protocol that eliminates fraud, enforces fair resale, and
            puts organizers in control.
          </Text>

          <View className="flex-row gap-3 mt-8">
            <View className="flex-1">
              <Button
                title="Connect Wallet"
                onPress={() => setWalletModalVisible(true)}
                variant="primary"
                size="lg"
                fullWidth
                icon={<Ionicons name="wallet" size={20} color="#fff" />}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={() => router.replace('/(tabs)/explore')}
            className="flex-row items-center justify-center mt-4 py-3"
            activeOpacity={0.7}
          >
            <Text className="text-gray-400 text-base mr-1">Explore Events</Text>
            <Ionicons name="arrow-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View className="flex-row justify-between px-6 py-6 mx-6 bg-surface-card rounded-2xl mb-10">
          {STATS.map((stat) => (
            <View key={stat.label} className="items-center">
              <Text className="text-white font-bold text-lg">{stat.value}</Text>
              <Text className="text-gray-500 text-xs mt-0.5">{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Features */}
        <View className="px-6 mb-10">
          <Text className="text-white font-bold text-2xl mb-6">
            Why SolTix?
          </Text>
          {FEATURES.map((feature, index) => (
            <View
              key={feature.title}
              className="flex-row bg-surface-card rounded-2xl p-4 mb-3"
            >
              <View className="w-12 h-12 rounded-xl bg-solana-purple/20 items-center justify-center mr-4">
                <Ionicons
                  name={feature.icon as any}
                  size={24}
                  color="#9945FF"
                />
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold text-base">
                  {feature.title}
                </Text>
                <Text className="text-gray-400 text-sm mt-1 leading-relaxed">
                  {feature.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* How It Works */}
        <View className="px-6 mb-10">
          <Text className="text-white font-bold text-2xl mb-6">How It Works</Text>
          {[
            { step: '01', title: 'Connect Your Wallet', desc: 'Link your Phantom or Solflare wallet' },
            { step: '02', title: 'Browse Events', desc: 'Discover events and pick your tickets' },
            { step: '03', title: 'Purchase NFT Ticket', desc: 'Buy with SOL — ownership is instant' },
            { step: '04', title: 'Attend or Resell', desc: 'Use your ticket or list it on the marketplace' },
          ].map((item) => (
            <View key={item.step} className="flex-row items-center mb-4">
              <View className="w-10 h-10 rounded-full bg-solana-green/20 items-center justify-center mr-4">
                <Text className="text-solana-green font-bold text-sm">{item.step}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold text-sm">{item.title}</Text>
                <Text className="text-gray-400 text-xs mt-0.5">{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* CTA */}
        <View className="px-6 py-8 mx-6 bg-solana-purple/10 rounded-2xl items-center border border-solana-purple/20">
          <Text className="text-white font-bold text-xl text-center">
            Ready to get started?
          </Text>
          <Text className="text-gray-400 text-sm text-center mt-2 mb-6">
            Connect your wallet and explore the future of ticketing.
          </Text>
          <Button
            title="Connect Wallet"
            onPress={() => setWalletModalVisible(true)}
            variant="primary"
            size="md"
            icon={<Ionicons name="wallet" size={18} color="#fff" />}
          />
        </View>

        {/* Footer */}
        <View className="items-center mt-10 px-6">
          <View className="flex-row items-center">
            <Text className="text-xl">🎫</Text>
            <Text className="text-gray-500 font-semibold text-sm ml-1.5">SolTix</Text>
          </View>
          <Text className="text-gray-600 text-xs mt-2">
            Decentralized Ticketing on Solana
          </Text>
          <Text className="text-gray-700 text-xs mt-1">© 2026 SolTix Protocol</Text>
        </View>
      </ScrollView>

      <WalletModal
        visible={walletModalVisible}
        onClose={() => setWalletModalVisible(false)}
      />
    </SafeAreaView>
  );
}
