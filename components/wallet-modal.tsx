import { WALLET_PROVIDERS } from '@/services/wallet-service';
import { useWalletStore } from '@/store/wallet-store';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Linking, Modal, Platform, Text, TouchableOpacity, View } from 'react-native';

interface WalletModalProps {
  visible: boolean;
  onClose: () => void;
}

export function WalletModal({ visible, onClose }: WalletModalProps) {
  const LEGAL_URL = 'https://aman124598.github.io/SolTix/';
  const { connect, connecting, error, clearError } = useWalletStore();
  const isWeb = Platform.OS === 'web';
  const supportedWallets = WALLET_PROVIDERS.filter(
    (wallet) => isWeb || wallet.name === 'Phantom' || wallet.name === 'Solflare'
  );

  const handleConnect = async (providerName: string) => {
    await connect(providerName.toLowerCase());
    // Connection completes via deep link callback — don't close yet
    // The root layout's deep link handler will call connectWithAddress
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/60">
        <View className="bg-surface-dark rounded-t-3xl px-6 pt-6 pb-10">
          {/* Handle */}
          <View className="w-10 h-1 bg-gray-600 rounded-full self-center mb-6" />

          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-white font-bold text-xl">Connect Wallet</Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <Ionicons name="close" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <Text className="text-gray-400 text-sm mb-6">
            Choose your preferred Solana wallet to connect and start using SolTix.
          </Text>

          {error && (
            <View className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 mb-4 flex-row items-center">
              <Ionicons name="warning" size={18} color="#ef4444" />
              <Text className="text-red-400 text-sm ml-2 flex-1">{error}</Text>
              <TouchableOpacity onPress={clearError}>
                <Ionicons name="close-circle" size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}

          {connecting ? (
            <View className="items-center py-10">
              <ActivityIndicator size="large" color="#9945FF" />
              <Text className="text-white font-medium text-base mt-4">
                Connecting wallet...
              </Text>
              <Text className="text-gray-400 text-sm mt-1">
                Approve the connection in your wallet app
              </Text>
            </View>
          ) : (
            <View>
              {supportedWallets.map((wallet) => (
                <TouchableOpacity
                  key={wallet.name}
                  onPress={() => handleConnect(wallet.name)}
                  className="flex-row items-center bg-surface-card rounded-xl p-4 mb-3"
                  activeOpacity={0.7}
                >
                  <Text className="text-2xl mr-3">{wallet.icon}</Text>
                  <View className="flex-1">
                    <Text className="text-white font-semibold text-base">
                      {wallet.name}
                    </Text>
                  </View>
                  {wallet.popular && (
                    <View className="bg-solana-purple/20 px-2.5 py-1 rounded-full mr-2">
                      <Text className="text-solana-purple text-xs font-medium">
                        Popular
                      </Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={18} color="#6b7280" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View className="mt-4 items-center">
            <TouchableOpacity onPress={() => Linking.openURL(LEGAL_URL)}>
              <Text className="text-gray-500 text-xs text-center">
                By connecting, you agree to SolTix&apos;s Terms of Service
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
