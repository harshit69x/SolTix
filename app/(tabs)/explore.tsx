import { EventCard } from '@/components/event-card';
import { Button } from '@/components/ui/button';
import { EmptyState, LoadingScreen } from '@/components/ui/loading';
import { CategoryFilter, SearchBar } from '@/components/ui/search-bar';
import { useEventStore } from '@/store/event-store';
import { EventCategory } from '@/types';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { FlatList, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CATEGORIES: { key: EventCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'concert', label: '🎵 Concerts' },
  { key: 'conference', label: '🎤 Conferences' },
  { key: 'workshop', label: '🛠 Workshops' },
  { key: 'festival', label: '🎪 Festivals' },
  { key: 'meetup', label: '🤝 Meetups' },
  { key: 'sports', label: '⚽ Sports' },
];

export default function EventsExplorerScreen() {
  const {
    filteredEvents,
    loading,
    searchQuery,
    selectedCategory,
    fetchEvents,
    setSearchQuery,
    setCategory,
  } = useEventStore();

  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchEvents();
    } catch (error) {
      console.error('Error refreshing events:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading && filteredEvents.length === 0) {
    return <LoadingScreen message="Loading events..." />;
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-dark">
      <View className="px-6 pt-4 pb-2">
        <Text className="text-white font-bold text-2xl">Discover Events</Text>
        <Text className="text-gray-400 text-sm mt-1">
          Find your next experience
        </Text>
      </View>

      <View className="px-6 mt-4">
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search events, venues, locations..."
        />
      </View>

      <View className="px-6">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 24 }}
        >
          <CategoryFilter
            categories={CATEGORIES}
            selected={selectedCategory}
            onSelect={(key) => setCategory(key as EventCategory | 'all')}
          />
        </ScrollView>
      </View>

      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 20, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#9945FF" />
        }
        renderItem={({ item }) => (
          <EventCard
            event={item}
            onPress={() => router.push({ pathname: '/event/[id]', params: { id: item.id } })}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title="No events found"
            message="Try adjusting your search or filters"
            action={
              <Button
                title="Clear Filters"
                onPress={() => {
                  setSearchQuery('');
                  setCategory('all');
                }}
                variant="outline"
                size="sm"
              />
            }
          />
        }
        ListHeaderComponent={
          filteredEvents.length > 0 ? (
            <View className="mb-2">
              <Text className="text-gray-400 text-sm">
                {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
              </Text>
            </View>
          ) : undefined
        }
      />
    </SafeAreaView>
  );
}
