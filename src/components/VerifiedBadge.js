import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Displayed next to listings where source_name === 'Akshay Joe'.
 */
export default function VerifiedBadge() {
  return (
    <View style={styles.badge}>
      <Ionicons name="shield-checkmark" size={11} color="#059669" />
      <Text style={styles.label}>Verified Expert</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#6EE7B7',
    gap: 3,
    marginLeft: 6,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
    letterSpacing: 0.2,
  },
});
