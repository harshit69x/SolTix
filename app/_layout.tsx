import { handleWalletCallback } from '@/services/wallet-service';
import { useWalletStore } from '@/store/wallet-store';
import * as Linking from 'expo-linking';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Alert } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/global.css';

export default function RootLayout() {
  const { connectWithAddress, restoreSession, refreshBalance } = useWalletStore();

  // Restore saved wallet session on app launch
  useEffect(() => {
    restoreSession();
  }, []);

  // Handle deep link callbacks from wallet apps
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      try {
        const result = await handleWalletCallback(event.url);
        if (result) {
          // Check if this is a payment callback (publicKey starts with "tx:")
          if (result.publicKey.startsWith('tx:')) {
            const signature = result.publicKey.replace('tx:', '');
            // Refresh balance after payment
            refreshBalance();
            if (signature === 'failed') {
              Alert.alert('Transaction Failed', 'The transaction could not be submitted. Please try again.');
            } else {
              Alert.alert(
                'Payment Successful!',
                `Transaction confirmed on Solana.\n\nSignature: ${signature.slice(0, 20)}...`,
                [{ text: 'OK' }]
              );
            }
            return;
          }

          // Otherwise it's a wallet connect callback
          await connectWithAddress(result.publicKey);
        }
      } catch (error) {
        console.error('Error handling deep link:', error);
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check if app was opened via deep link
    Linking.getInitialURL()
      .then((url) => {
        if (url) handleDeepLink({ url });
      })
      .catch((error) => {
        console.error('Error getting initial URL:', error);
      });

    return () => subscription.remove();
  }, [connectWithAddress]);

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#1a1a2e' },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="landing" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ headerShown: false }} />
        <Stack.Screen
          name="event/[id]"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="resale/[id]"
          options={{
            headerShown: false,
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="modal"
          options={{
            presentation: 'modal',
            title: 'Modal',
          }}
        />
      </Stack>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
