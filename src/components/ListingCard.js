import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import VerifiedBadge from './VerifiedBadge';

const PROPERTY_TYPE_COLORS = {
  Apartment:  { bg: '#DBEAFE', text: '#1D4ED8' },
  Villa:      { bg: '#FEF3C7', text: '#92400E' },
  Plot:       { bg: '#D1FAE5', text: '#065F46' },
  Commercial: { bg: '#EDE9FE', text: '#5B21B6' },
  Penthouse:  { bg: '#FCE7F3', text: '#9D174D' },
  Studio:     { bg: '#FEE2E2', text: '#991B1B' },
};

const STATUS_STYLES = {
  pending:  { bg: '#FEF3C7', text: '#92400E' },
  approved: { bg: '#D1FAE5', text: '#065F46' },
  rejected: { bg: '#FEE2E2', text: '#991B1B' },
};

function formatPrice(price) {
  if (!price && price !== 0) return 'Price on request';
  if (price >= 10_000_000) return `₹${(price / 10_000_000).toFixed(2)} Cr`;
  if (price >= 100_000)    return `₹${(price / 100_000).toFixed(2)} L`;
  return `₹${Number(price).toLocaleString('en-IN')}`;
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

export default function ListingCard({
  listing,
  showStatus = false,
  onApprove,
  onReject,
}) {
  const [expanded, setExpanded] = useState(false);

  const typeColor =
    PROPERTY_TYPE_COLORS[listing.property_type] || { bg: '#F1F5F9', text: '#475569' };
  const statusStyle = STATUS_STYLES[listing.status] || STATUS_STYLES.pending;
  const isVerified = listing.source_name === 'Akshay Joe';

  // similar_properties may arrive as a JSON string from Supabase
  let similarProps = listing.similar_properties || [];
  if (typeof similarProps === 'string') {
    try { similarProps = JSON.parse(similarProps); } catch { similarProps = []; }
  }

  return (
    <View style={styles.card}>
      {/* ── Top row: type badge + status + price ── */}
      <View style={styles.topRow}>
        <View style={styles.topLeft}>
          <View style={[styles.typeBadge, { backgroundColor: typeColor.bg }]}>
            <Text style={[styles.typeBadgeText, { color: typeColor.text }]}>
              {listing.property_type}
            </Text>
          </View>
          {showStatus && (
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.statusText, { color: statusStyle.text }]}>
                {listing.status?.toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.price}>{formatPrice(listing.current_price)}</Text>
      </View>

      {/* ── Project & developer ── */}
      <Text style={styles.projectName}>{listing.project_name}</Text>
      <Text style={styles.developer}>{listing.developer}</Text>

      {/* ── Location ── */}
      <View style={styles.locationRow}>
        <Ionicons name="location-outline" size={13} color="#64748B" />
        <Text style={styles.locationText}>{listing.location}, Bangalore</Text>
      </View>

      {/* ── Stats chips ── */}
      <View style={styles.statsRow}>
        {!!listing.area && (
          <View style={styles.chip}>
            <Ionicons name="resize-outline" size={12} color="#2563EB" />
            <Text style={styles.chipText}>{listing.area} sqft</Text>
          </View>
        )}
        {!!listing.bedrooms && (
          <View style={styles.chip}>
            <Ionicons name="bed-outline" size={12} color="#2563EB" />
            <Text style={styles.chipText}>{listing.bedrooms} BHK</Text>
          </View>
        )}
        {!!listing.price_per_sqft && (
          <View style={styles.chip}>
            <Ionicons name="cash-outline" size={12} color="#2563EB" />
            <Text style={styles.chipText}>₹{listing.price_per_sqft}/sqft</Text>
          </View>
        )}
      </View>

      {/* ── Dates ── */}
      {(listing.launch_date || listing.possession_date) && (
        <View style={styles.datesRow}>
          {!!listing.launch_date && (
            <Text style={styles.dateText}>
              <Text style={styles.dateLabelText}>Launch: </Text>
              {formatDate(listing.launch_date)}
            </Text>
          )}
          {!!listing.possession_date && (
            <Text style={styles.dateText}>
              <Text style={styles.dateLabelText}>Possession: </Text>
              {formatDate(listing.possession_date)}
            </Text>
          )}
        </View>
      )}

      {/* ── Description ── */}
      {!!listing.description && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setExpanded(!expanded)}
        >
          <Text
            style={styles.description}
            numberOfLines={expanded ? undefined : 2}
          >
            {listing.description}
          </Text>
          <Text style={styles.readMoreText}>
            {expanded ? '▲ Read less' : '▼ Read more'}
          </Text>
        </TouchableOpacity>
      )}

      {/* ── Similar properties (visible when expanded) ── */}
      {expanded && similarProps.length > 0 && (
        <View style={styles.similarSection}>
          <Text style={styles.similarHeading}>Similar Properties</Text>
          {similarProps.map((sp, idx) => (
            <View key={idx} style={styles.similarItem}>
              <View style={styles.similarBullet} />
              <View style={{ flex: 1 }}>
                <Text style={styles.similarName}>{sp.projectName}</Text>
                <Text style={styles.similarMeta}>
                  {[sp.developer, sp.location, sp.price]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ── Divider ── */}
      <View style={styles.divider} />

      {/* ── Source row ── */}
      <View style={styles.sourceRow}>
        <Ionicons name="person-circle-outline" size={15} color="#94A3B8" />
        <Text style={styles.sourceText}>{listing.source_name || 'Unknown'}</Text>
        {isVerified && <VerifiedBadge />}
        {!!listing.source_contact && (
          <Text style={styles.sourceContact}>· {listing.source_contact}</Text>
        )}
        <Text style={styles.postedDate}>
          {listing.posted_date
            ? new Date(listing.posted_date).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : ''}
        </Text>
      </View>

      {/* ── Admin action buttons ── */}
      {(onApprove || onReject) && (
        <View style={styles.adminRow}>
          {onApprove && (
            <TouchableOpacity
              style={styles.approveBtn}
              onPress={() => onApprove(listing.id)}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle" size={15} color="#fff" />
              <Text style={styles.adminBtnText}>Approve</Text>
            </TouchableOpacity>
          )}
          {onReject && (
            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={() => onReject(listing.id)}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle" size={15} color="#fff" />
              <Text style={styles.adminBtnText}>Reject</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 7,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#EFF6FF',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeBadge: {
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  typeBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },
  price: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  projectName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  developer: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 10,
  },
  locationText: { fontSize: 13, color: '#475569', flex: 1 },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  chipText: { fontSize: 12, color: '#1D4ED8', fontWeight: '600' },
  datesRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 8,
  },
  dateText: { fontSize: 12, color: '#64748B' },
  dateLabelText: { color: '#94A3B8' },
  description: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
    marginBottom: 3,
  },
  readMoreText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
    marginBottom: 8,
  },
  similarSection: {
    backgroundColor: '#F8FAFF',
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  similarHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  similarItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  similarBullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#2563EB',
    marginTop: 5,
  },
  similarName: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
  similarMeta: { fontSize: 11, color: '#64748B', marginTop: 1 },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  sourceText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  sourceContact: { fontSize: 12, color: '#94A3B8' },
  postedDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginLeft: 'auto',
  },
  adminRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 10,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingVertical: 10,
  },
  adminBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
