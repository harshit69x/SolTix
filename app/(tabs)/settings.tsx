import { Button } from '@/components/ui/button';
import { WalletModal } from '@/components/wallet-modal';
import { useWalletStore } from '@/store/wallet-store';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Linking, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const LEGAL_URL = 'https://aman124598.github.io/SolTix/';
  const { connected, publicKey, balance, disconnect } = useWalletStore();
  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [biometrics, setBiometrics] = useState(false);

  const handleToggleNotifications = (value: boolean) => {
    Alert.alert('Coming Soon', 'Push notifications will be available in a future update.');
  };

  const handleToggleBiometrics = (value: boolean) => {
    Alert.alert('Coming Soon', 'Biometric authentication will be available in a future update.');
  };

  const shortAddress = publicKey
    ? `${publicKey.slice(0, 6)}...${publicKey.slice(-6)}`
    : '';

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Wallet',
      'Are you sure you want to disconnect your wallet?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await disconnect();
            router.replace('/landing');
          },
        },
      ]
    );
  };

  const SettingRow = ({
    icon,
    title,
    subtitle,
    onPress,
    rightElement,
    danger = false,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    danger?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress && !rightElement}
      className="flex-row items-center bg-surface-card rounded-xl p-4 mb-2"
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View
        className={`w-9 h-9 rounded-lg items-center justify-center mr-3 ${danger ? 'bg-red-500/20' : 'bg-surface-elevated'
          }`}
      >
        <Ionicons
          name={icon as any}
          size={18}
          color={danger ? '#ef4444' : '#9ca3af'}
        />
      </View>
      <View className="flex-1">
        <Text
          className={`font-medium text-sm ${danger ? 'text-red-400' : 'text-white'}`}
        >
          {title}
        </Text>
        {subtitle && (
          <Text className="text-gray-500 text-xs mt-0.5">{subtitle}</Text>
        )}
      </View>
      {rightElement || (
        onPress && <Ionicons name="chevron-forward" size={16} color="#6b7280" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-surface-dark">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="px-6 pt-4 pb-6">
          <Text className="text-white font-bold text-2xl">Settings</Text>
        </View>

        {/* Wallet Section */}
        {connected ? (
          <View className="mx-6 bg-surface-card rounded-2xl p-5 mb-6 border border-gray-700/30">
            <View className="flex-row items-center mb-4">
              <View className="w-12 h-12 bg-solana-purple/20 rounded-full items-center justify-center">
                <Ionicons name="wallet" size={24} color="#9945FF" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-white font-semibold text-base">Wallet Connected</Text>
                <Text className="text-gray-400 text-sm font-mono mt-0.5">{shortAddress}</Text>
              </View>
              <View className="bg-green-500/20 px-2.5 py-1 rounded-full">
                <Text className="text-green-400 text-xs font-semibold">Active</Text>
              </View>
            </View>
            <View className="bg-surface-dark rounded-xl p-3 flex-row items-center justify-between">
              <Text className="text-gray-400 text-sm">Balance</Text>
              <Text className="text-white font-bold text-base">{Number.isFinite(balance) ? balance.toFixed(4) : '—'} SOL</Text>
            </View>
          </View>
        ) : (
          <View className="mx-6 mb-6">
            <Button
              title="Connect Wallet"
              onPress={() => setWalletModalVisible(true)}
              variant="primary"
              size="lg"
              fullWidth
              icon={<Ionicons name="wallet" size={20} color="#fff" />}
            />
          </View>
        )}

        {/* General Settings */}
        <View className="px-6 mb-6">
          <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
            General
          </Text>
          <SettingRow
            icon="notifications"
            title="Push Notifications"
            subtitle="Get alerts for events and transactions"
            rightElement={
              <Switch
                value={notifications}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: '#374151', true: '#9945FF' }}
                thumbColor="#fff"
              />
            }
          />
          <SettingRow
            icon="finger-print"
            title="Biometric Lock"
            subtitle="Require biometrics for transactions"
            rightElement={
              <Switch
                value={biometrics}
                onValueChange={handleToggleBiometrics}
                trackColor={{ false: '#374151', true: '#9945FF' }}
                thumbColor="#fff"
              />
            }
          />
        </View>

        {/* Network Settings */}
        <View className="px-6 mb-6">
          <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Network
          </Text>
          <SettingRow
            icon="globe"
            title="Network"
            subtitle={`Solana ${(process.env.EXPO_PUBLIC_NETWORK || 'devnet').charAt(0).toUpperCase() + (process.env.EXPO_PUBLIC_NETWORK || 'devnet').slice(1)}`}
          />
          <SettingRow
            icon="server"
            title="RPC Endpoint"
            subtitle={process.env.EXPO_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com'}
          />
        </View>

        {/* About */}
        <View className="px-6 mb-6">
          <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
            About
          </Text>
          <SettingRow
            icon="information-circle"
            title="Version"
            subtitle="1.0.0"
          />
          <SettingRow
            icon="document-text"
            title="Terms of Service"
            onPress={() => {
              Linking.openURL(LEGAL_URL).catch(() =>
                Alert.alert('Error', 'Could not open Terms of Service.')
              );
            }}
          />
          <SettingRow
            icon="shield"
            title="Privacy Policy"
            onPress={() => {
              Linking.openURL(LEGAL_URL).catch(() =>
                Alert.alert('Error', 'Could not open Privacy Policy.')
              );
            }}
          />
        </View>

        {/* Danger Zone */}
        {connected && (
          <View className="px-6">
            <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
              Account
            </Text>
            <SettingRow
              icon="log-out"
              title="Disconnect Wallet"
              subtitle="Remove wallet connection"
              onPress={handleDisconnect}
              danger
            />
          </View>
        )}
      </ScrollView>

      <WalletModal
        visible={walletModalVisible}
        onClose={() => setWalletModalVisible(false)}
      />
    </SafeAreaView>
  );
}
