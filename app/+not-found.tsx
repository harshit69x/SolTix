import { useWalletStore } from '@/store/wallet-store';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

export default function NotFoundScreen() {
  const { connected } = useWalletStore();

  useEffect(() => {
    // Redirect to appropriate screen after a brief delay.
    // This handles wallet callback deep links and any other unmatched routes.
    const timeout = setTimeout(() => {
      if (connected) {
        router.replace('/(tabs)');
      } else {
        router.replace('/landing');
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [connected]);

  return (
    <View style={{ flex: 1, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#9945FF" />
      <Text style={{ color: '#9ca3af', marginTop: 16, fontSize: 14 }}>Redirecting...</Text>
    </View>
  );
}
