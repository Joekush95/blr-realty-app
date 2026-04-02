import React, { useState, useCallback } from 'react';
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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../supabase';
import ListingCard from '../components/ListingCard';

const ADMIN_PASSWORD = 'akshay123';

const STATUS_FILTERS = ['Pending', 'Approved', 'Rejected', 'All'];

export default function AdminScreen() {
  const insets = useSafeAreaInsets();

  // ── Auth ──
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [authError, setAuthError] = useState('');

  // ── Data ──
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Pending');
  const [actionLoading, setActionLoading] = useState(null); // id of listing being updated

  const tryLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setLoggedIn(true);
      setAuthError('');
    } else {
      setAuthError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  const fetchListings = useCallback(async () => {
    if (!loggedIn) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('posted_date', { ascending: false });

      if (error) throw error;
      setListings(data || []);
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to fetch listings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loggedIn]);

  // Refresh when screen gets focus and user is logged in
  useFocusEffect(
    useCallback(() => {
      if (loggedIn) fetchListings();
    }, [loggedIn, fetchListings])
  );

  const updateStatus = async (id, newStatus) => {
    setActionLoading(id);
    try {
      const { error } = await supabase
        .from('properties')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      // Optimistically update local state
      setListings((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
      );
    } catch (e) {
      Alert.alert('Error', e.message || `Failed to ${newStatus} listing`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = (id) => {
    Alert.alert('Approve Listing', 'This listing will go live immediately.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Approve', onPress: () => updateStatus(id, 'approved') },
    ]);
  };

  const handleReject = (id) => {
    Alert.alert('Reject Listing', 'This listing will be marked as rejected.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: () => updateStatus(id, 'rejected') },
    ]);
  };

  const filteredListings = listings.filter((l) => {
    if (activeFilter === 'All') return true;
    return l.status === activeFilter.toLowerCase();
  });

  const counts = {
    Pending:  listings.filter((l) => l.status === 'pending').length,
    Approved: listings.filter((l) => l.status === 'approved').length,
    Rejected: listings.filter((l) => l.status === 'rejected').length,
    All:      listings.length,
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Password gate
  // ─────────────────────────────────────────────────────────────────────────
  if (!loggedIn) {
    return (
      <View style={[styles.gateContainer, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.gateCard}>
          <View style={styles.gateLockIcon}>
            <Ionicons name="shield-checkmark" size={44} color="#2563EB" />
          </View>
          <Text style={styles.gateTitle}>Admin Panel</Text>
          <Text style={styles.gateSub}>
            Enter the admin password to manage property listings
          </Text>

          <View style={styles.passwordWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" />
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter admin password"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                if (authError) setAuthError('');
              }}
              onSubmitEditing={tryLogin}
              returnKeyType="done"
              autoCapitalize="none"
            />
          </View>

          {!!authError && (
            <View style={styles.authErrorRow}>
              <Ionicons name="alert-circle-outline" size={14} color="#EF4444" />
              <Text style={styles.authErrorText}>{authError}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.loginBtn} onPress={tryLogin} activeOpacity={0.85}>
            <Ionicons name="enter-outline" size={18} color="#fff" />
            <Text style={styles.loginBtnText}>Login to Admin</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Admin panel
  // ─────────────────────────────────────────────────────────────────────────
  const renderHeader = () => (
    <>
      {/* Top bar */}
      <View style={styles.adminTopBar}>
        <View>
          <Text style={styles.adminTitle}>Admin Panel</Text>
          <Text style={styles.adminSub}>BLRRealty · Bangalore</Text>
        </View>
        <TouchableOpacity onPress={() => setLoggedIn(false)} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={16} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Stats row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statsRow}
      >
        <StatCard label="Total" count={counts.All} color="#2563EB" icon="layers" />
        <StatCard label="Pending" count={counts.Pending} color="#D97706" icon="time" />
        <StatCard label="Approved" count={counts.Approved} color="#059669" icon="checkmark-circle" />
        <StatCard label="Rejected" count={counts.Rejected} color="#DC2626" icon="close-circle" />
      </ScrollView>

      {/* Status filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterTabRow}
      >
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, activeFilter === f && styles.filterTabActive]}
            onPress={() => setActiveFilter(f)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterTabText, activeFilter === f && styles.filterTabTextActive]}>
              {f}
            </Text>
            <View
              style={[
                styles.filterTabBadge,
                activeFilter === f && styles.filterTabBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.filterTabBadgeText,
                  activeFilter === f && styles.filterTabBadgeTextActive,
                ]}
              >
                {counts[f]}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.listingCountLabel}>
        {filteredListings.length} listing{filteredListings.length !== 1 ? 's' : ''}
      </Text>
    </>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading all listings…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <FlatList
        data={filteredListings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={actionLoading === item.id ? styles.updatingOverlay : null}>
            {actionLoading === item.id && (
              <View style={styles.updatingBadge}>
                <ActivityIndicator size="small" color="#2563EB" />
                <Text style={styles.updatingText}>Updating…</Text>
              </View>
            )}
            <ListingCard
              listing={item}
              showStatus
              onApprove={item.status === 'pending' ? handleApprove : undefined}
              onReject={item.status === 'pending' ? handleReject : undefined}
            />
          </View>
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="clipboard-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>
              No {activeFilter === 'All' ? '' : activeFilter.toLowerCase()} listings
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeFilter === 'Pending'
                ? 'All caught up! No listings awaiting review.'
                : 'Nothing here yet.'}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchListings(); }}
            tintColor="#2563EB"
            colors={['#2563EB']}
          />
        }
        contentContainerStyle={
          filteredListings.length === 0 ? styles.emptyContainer : styles.listContent
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function StatCard({ label, count, color, icon }) {
  return (
    <View style={[statStyles.card, { borderLeftColor: color }]}>
      <Ionicons name={`${icon}-outline`} size={20} color={color} />
      <Text style={[statStyles.count, { color }]}>{count}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    minWidth: 80,
    borderLeftWidth: 4,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  count: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
  },
  label: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});

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
  loadingText: { color: '#64748B', fontSize: 14 },

  // ── Gate ──
  gateContainer: {
    flex: 1,
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  gateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  gateLockIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  gateTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 6,
  },
  gateSub: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#F8FAFF',
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 6,
  },
  passwordInput: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
    padding: 0,
  },
  authErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 14,
    alignSelf: 'flex-start',
  },
  authErrorText: { fontSize: 13, color: '#EF4444' },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
    marginTop: 8,
  },
  loginBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  // ── Admin panel ──
  adminTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  adminTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  adminSub: { fontSize: 12, color: '#93C5FD', marginTop: 2 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  logoutText: { fontSize: 13, fontWeight: '600', color: '#EF4444' },
  statsRow: {
    padding: 14,
    gap: 10,
  },
  filterTabRow: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
  },
  filterTabActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterTabText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  filterTabTextActive: { color: '#FFFFFF' },
  filterTabBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  filterTabBadgeActive: { backgroundColor: '#1D4ED8' },
  filterTabBadgeText: { fontSize: 11, fontWeight: '700', color: '#2563EB' },
  filterTabBadgeTextActive: { color: '#FFFFFF' },
  listingCountLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginHorizontal: 18,
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
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#94A3B8' },
  emptySubtitle: {
    fontSize: 14,
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 20,
  },
  updatingOverlay: { opacity: 0.6 },
  updatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    position: 'absolute',
    top: 14,
    right: 26,
    zIndex: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  updatingText: { fontSize: 11, color: '#2563EB', fontWeight: '600' },
});
