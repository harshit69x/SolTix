import { HapticTab } from '@/components/haptic-tab';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

export default function TabLayout() {
  const isWeb = Platform.OS === 'web';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#9945FF',
        tabBarInactiveTintColor: '#9ca3af',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: '#1a1a2e',
          borderTopColor: '#2d2d44',
          borderTopWidth: 1,
          height: isWeb ? 76 : 85,
          paddingBottom: isWeb ? 10 : 28,
          paddingTop: 8,
        },
        tabBarItemStyle: {
          paddingVertical: isWeb ? 2 : 0,
        },
        tabBarLabelStyle: {
          fontSize: isWeb ? 11 : 12,
          lineHeight: isWeb ? 13 : 14,
          fontWeight: '600',
          marginTop: isWeb ? 2 : 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Events',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tickets"
        options={{
          title: 'My Tickets',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ticket" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: 'Market',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="storefront" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
