import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../supabase';
import ListingCard from '../components/ListingCard';

const PROPERTY_TYPES = ['All', 'Apartment', 'Villa', 'Plot', 'Commercial', 'Penthouse', 'Studio'];

export default function BrowseScreen() {
  const insets = useSafeAreaInsets();
  const [listings, setListings] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState('All');
  const [error, setError] = useState(null);

  const fetchListings = useCallback(async () => {
    try {
      setError(null);
      const { data, error: err } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'approved')
        .order('posted_date', { ascending: false });

      if (err) throw err;
      setListings(data || []);
    } catch (e) {
      setError(e.message || 'Failed to load listings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Filter by search text and property type
  useEffect(() => {
    let result = listings;
    if (activeType !== 'All') {
      result = result.filter((l) => l.property_type === activeType);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.project_name?.toLowerCase().includes(q) ||
          l.developer?.toLowerCase().includes(q) ||
          l.location?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [listings, search, activeType]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchListings();
  };

  const renderHeader = () => (
    <>
      {/* Hero banner */}
      <View style={styles.heroBanner}>
        <Text style={styles.heroTitle}>Find Your Dream</Text>
        <Text style={styles.heroTitle}>Home in Bangalore</Text>
        <Text style={styles.heroSub}>
          {listings.length} verified propert{listings.length !== 1 ? 'ies' : 'y'} listed
        </Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search-outline" size={18} color="#94A3B8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by project, developer, location..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Type filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {PROPERTY_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.filterChip, activeType === type && styles.filterChipActive]}
            onPress={() => setActiveType(type)}
            activeOpacity={0.8}
          >
            <Text
              style={[styles.filterChipText, activeType === type && styles.filterChipTextActive]}
            >
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results count */}
      <Text style={styles.resultsCount}>
        {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        {activeType !== 'All' ? ` · ${activeType}` : ''}
        {search ? ` · "${search}"` : ''}
      </Text>
    </>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading listings…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={16} color="#991B1B" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchListings}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ListingCard listing={item} />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="home-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No listings found</Text>
            <Text style={styles.emptySubtitle}>
              {search || activeType !== 'All'
                ? 'Try adjusting your search or filters'
                : 'No approved listings yet. Check back soon!'}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2563EB"
            colors={['#2563EB']}
          />
        }
        contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4FF',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F4FF',
    gap: 12,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 14,
  },
  heroBanner: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 32,
  },
  heroSub: {
    fontSize: 14,
    color: '#93C5FD',
    marginTop: 6,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: -16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    padding: 0,
  },
  clearBtn: { padding: 2 },
  filterRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextActive: { color: '#FFFFFF' },
  resultsCount: {
    fontSize: 12,
    color: '#94A3B8',
    marginHorizontal: 20,
    marginBottom: 4,
    fontWeight: '500',
  },
  listContent: { paddingBottom: 20 },
  emptyContainer: { flexGrow: 1 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#94A3B8',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  errorText: { flex: 1, fontSize: 13, color: '#991B1B' },
  retryText: { fontSize: 13, color: '#2563EB', fontWeight: '700' },
});
