import { EventData } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface EventCardProps {
  event: EventData;
  onPress: () => void;
  compact?: boolean;
}

export function EventCard({ event, onPress, compact = false }: EventCardProps) {
  const [imageError, setImageError] = useState(false);
  const ticketsRemaining = Math.max(0, event.totalTickets - event.ticketsSold);
  const soldPercentage = event.totalTickets > 0
    ? Math.min(100, Math.max(0, (event.ticketsSold / event.totalTickets) * 100))
    : 0;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      concert: '#f43f5e',
      conference: '#3b82f6',
      workshop: '#10b981',
      festival: '#f59e0b',
      meetup: '#8b5cf6',
      sports: '#ef4444',
      other: '#6b7280',
    };
    return colors[category] || colors.other;
  };

  if (compact) {
    return (
      <TouchableOpacity
        onPress={onPress}
        className="flex-row bg-surface-card rounded-2xl overflow-hidden mb-3"
        activeOpacity={0.8}
      >
        {!imageError && event.imageUrl ? (
          <Image
            source={{ uri: event.imageUrl }}
            className="w-24 h-24"
            contentFit="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <View className="w-24 h-24 bg-surface-elevated items-center justify-center">
            <Ionicons name="image-outline" size={24} color="#6b7280" />
          </View>
        )}
        <View className="flex-1 p-3 justify-between">
          <View>
            <Text className="text-white font-semibold text-sm" numberOfLines={1}>
              {event.title}
            </Text>
            <View className="flex-row items-center mt-1">
              <Ionicons name="calendar-outline" size={12} color="#9ca3af" />
              <Text className="text-gray-400 text-xs ml-1">{formatDate(event.date)}</Text>
            </View>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-solana-green font-bold text-sm">
              {event.ticketPrice > 0 ? `${event.ticketPrice} SOL` : 'Free'}
            </Text>
            <View
              className="px-2 py-0.5 rounded-full"
              style={{ backgroundColor: getCategoryColor(event.category) + '30' }}
            >
              <Text
                className="text-xs font-medium capitalize"
                style={{ color: getCategoryColor(event.category) }}
              >
                {event.category}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-surface-card rounded-2xl overflow-hidden mb-4"
      activeOpacity={0.8}
    >
      <View className="relative">
        {!imageError && event.imageUrl ? (
          <Image
            source={{ uri: event.imageUrl }}
            className="w-full h-48"
            contentFit="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <View className="w-full h-48 bg-surface-elevated items-center justify-center">
            <Ionicons name="image-outline" size={40} color="#6b7280" />
          </View>
        )}
      </View>

      <View className="p-4">
        <View className="flex-row items-center justify-between mb-2">
          <View
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: getCategoryColor(event.category) }}
          >
            <Text className="text-white text-xs font-bold capitalize">
              {event.category}
            </Text>
          </View>
          {ticketsRemaining <= 10 && ticketsRemaining > 0 && (
            <Text className="text-red-400 text-xs font-semibold">
              {ticketsRemaining} left!
            </Text>
          )}
        </View>

        <Text className="text-white font-bold text-lg" numberOfLines={2}>
          {event.title}
        </Text>

        <View className="flex-row items-center mt-2">
          <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
          <Text className="text-gray-400 text-sm ml-1.5">
            {formatDate(event.date)} • {event.time}
          </Text>
        </View>

        <View className="flex-row items-center mt-1.5">
          <Ionicons name="location-outline" size={14} color="#9ca3af" />
          <Text className="text-gray-400 text-sm ml-1.5" numberOfLines={1}>
            {event.venue}, {event.location}
          </Text>
        </View>

        <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-700/50">
          <View>
            <Text className="text-gray-500 text-xs">Price</Text>
            <Text className="text-solana-green font-bold text-lg">
              {event.ticketPrice > 0 ? `${event.ticketPrice} SOL` : 'Free'}
            </Text>
          </View>

          <View className="items-end">
            <Text className="text-gray-500 text-xs">
              {event.ticketsSold}/{event.totalTickets} sold
            </Text>
            <View className="w-20 h-1.5 bg-gray-700 rounded-full mt-1 overflow-hidden">
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
    </TouchableOpacity>
  );
}
