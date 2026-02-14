import { Button } from '@/components/ui/button';
import { WalletModal } from '@/components/wallet-modal';
import { useWalletStore } from '@/store/wallet-store';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, SlideInLeft, SlideInRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

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
        decelerationRate="fast"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <View className="flex-row items-center">
            <Text className="text-2xl">🎫</Text>
            <Text className="text-white font-bold text-xl ml-2">SolTix</Text>
          </View>
        </View>

        {/* Hero Section */}
<<<<<<< HEAD
        <Animated.View entering={FadeInDown.delay(300).duration(800)} className="px-6 pt-8 pb-10">
          <LinearGradient
            colors={['#1a1a2e', '#16213e', '#0f0f23']}
            className="rounded-3xl p-6"
=======
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
>>>>>>> fff3fdb02f3bfbb07583fb184bdba0c3d658cc4c
          >
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
              onPress={() => router.push('/(tabs)/explore')}
              className="flex-row items-center justify-center mt-4 py-3"
              activeOpacity={0.7}
            >
              <Text className="text-gray-400 text-base mr-1">Explore Events</Text>
              <Ionicons name="arrow-forward" size={18} color="#9ca3af" />
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInUp.delay(500).duration(800)} className="flex-row justify-between px-6 py-6 mx-6 bg-surface-card rounded-2xl mb-10 shadow-lg">
          {STATS.map((stat) => (
            <View key={stat.label} className="items-center">
              <Text className="text-white font-bold text-lg">{stat.value}</Text>
              <Text className="text-gray-500 text-xs mt-0.5">{stat.label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Features */}
        <View className="px-6 mb-10">
          <Animated.Text entering={SlideInLeft.delay(700).duration(600)} className="text-white font-bold text-2xl mb-6">
            Why SolTix?
          </Animated.Text>
          {FEATURES.map((feature, index) => (
            <Animated.View
              key={feature.title}
              entering={SlideInRight.delay(800 + index * 200).duration(600)}
              className="flex-row bg-surface-card rounded-2xl p-4 mb-3 shadow-lg"
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
            </Animated.View>
          ))}
        </View>

        {/* How It Works */}
        <View className="px-6 mb-10">
          <Animated.Text entering={SlideInLeft.delay(1200).duration(600)} className="text-white font-bold text-2xl mb-6">How It Works</Animated.Text>
          {[
            { step: '01', title: 'Connect Your Wallet', desc: 'Link your Phantom, Solflare, or MetaMask wallet' },
            { step: '02', title: 'Browse Events', desc: 'Discover events and pick your tickets' },
            { step: '03', title: 'Purchase NFT Ticket', desc: 'Buy with SOL or ETH — ownership is instant' },
            { step: '04', title: 'Attend or Resell', desc: 'Use your ticket or list it on the marketplace' },
          ].map((item, index) => (
            <Animated.View key={item.step} entering={SlideInRight.delay(1300 + index * 200).duration(600)} className="flex-row items-center mb-4">
              <View className="w-10 h-10 rounded-full bg-solana-green/20 items-center justify-center mr-4">
                <Text className="text-solana-green font-bold text-sm">{item.step}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold text-sm">{item.title}</Text>
                <Text className="text-gray-400 text-xs mt-0.5">{item.desc}</Text>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* CTA */}
        <Animated.View entering={FadeInUp.delay(1800).duration(800)} className="px-6 py-8 mx-6 rounded-2xl items-center border border-solana-purple/20 overflow-hidden">
          <LinearGradient
            colors={['#9945FF20', '#14F19520', '#9945FF10']}
            className="absolute inset-0"
          />
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
        </Animated.View>

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
