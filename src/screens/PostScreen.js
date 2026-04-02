import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../supabase';

const PROPERTY_TYPES = ['Apartment', 'Villa', 'Plot', 'Commercial', 'Penthouse', 'Studio'];
const BEDROOM_OPTIONS = ['1', '2', '3', '4', '5', '6+'];

const EMPTY_FORM = {
  property_type: '',
  project_name: '',
  developer: '',
  location: '',
  launch_date: '',
  possession_date: '',
  current_price: '',
  price_per_sqft: '',
  area: '',
  bedrooms: '',
  description: '',
  source_name: '',
  source_contact: '',
};

const EMPTY_SIMILAR = { projectName: '', developer: '', price: '', location: '' };

export default function PostScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [similarProperties, setSimilarProperties] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: null }));
  };

  // ── Similar properties helpers ────────────────────────────────────────────
  const addSimilar = () => {
    if (similarProperties.length < 5) {
      setSimilarProperties((s) => [...s, { ...EMPTY_SIMILAR }]);
    }
  };

  const updateSimilar = (idx, key, val) => {
    setSimilarProperties((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [key]: val };
      return updated;
    });
  };

  const removeSimilar = (idx) => {
    setSimilarProperties((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.property_type) e.property_type = 'Select a property type';
    if (!form.project_name.trim()) e.project_name = 'Project name is required';
    if (!form.developer.trim()) e.developer = 'Developer name is required';
    if (!form.location.trim()) e.location = 'Location is required';
    if (!form.source_name.trim()) e.source_name = 'Your name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    setSubmitting(true);
    try {
      const cleanedSimilar = similarProperties
        .filter((sp) => sp.projectName.trim())
        .map((sp) => ({
          projectName: sp.projectName.trim(),
          developer: sp.developer.trim() || undefined,
          price: sp.price.trim() || undefined,
          location: sp.location.trim() || undefined,
        }));

      const payload = {
        property_type: form.property_type,
        project_name: form.project_name.trim(),
        developer: form.developer.trim(),
        location: form.location.trim(),
        launch_date: form.launch_date.trim() || null,
        possession_date: form.possession_date.trim() || null,
        current_price: form.current_price ? Number(form.current_price) : null,
        price_per_sqft: form.price_per_sqft ? Number(form.price_per_sqft) : null,
        area: form.area ? Number(form.area) : null,
        bedrooms: form.bedrooms ? (form.bedrooms === '6+' ? 6 : Number(form.bedrooms)) : null,
        description: form.description.trim() || null,
        source_name: form.source_name.trim(),
        source_contact: form.source_contact.trim() || null,
        similar_properties: cleanedSimilar,
        status: 'pending',
        posted_date: new Date().toISOString(),
      };

      const { error } = await supabase.from('properties').insert([payload]);
      if (error) throw error;

      setSubmitted(true);
      setForm(EMPTY_FORM);
      setSimilarProperties([]);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } catch (e) {
      Alert.alert('Submission Failed', e.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetSuccess = () => setSubmitted(false);

  // ── Success state ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successCard}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={56} color="#10B981" />
          </View>
          <Text style={styles.successTitle}>Listing Submitted!</Text>
          <Text style={styles.successBody}>
            Your property listing has been submitted for review. Our admin team will approve it
            shortly and it will appear in the Browse section.
          </Text>
          <TouchableOpacity style={styles.successBtn} onPress={resetSuccess}>
            <Text style={styles.successBtnText}>Submit Another Listing</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Page header */}
        <View style={styles.pageHeader}>
          <Ionicons name="add-circle" size={28} color="#2563EB" />
          <View>
            <Text style={styles.pageTitle}>Post a Property</Text>
            <Text style={styles.pageSubtitle}>
              Listings are reviewed before going live
            </Text>
          </View>
        </View>

        {/* ── SECTION: Property Details ── */}
        <SectionHeader title="Property Details" icon="home" />

        <Label text="Property Type *" error={errors.property_type} />
        <View style={styles.typeGrid}>
          {PROPERTY_TYPES.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.typeChip, form.property_type === t && styles.typeChipActive]}
              onPress={() => set('property_type', t)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.typeChipText,
                  form.property_type === t && styles.typeChipTextActive,
                ]}
              >
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.property_type && <ErrorText msg={errors.property_type} />}

        <Label text="Project Name *" error={errors.project_name} />
        <Input
          placeholder="e.g. Prestige Lakeside Habitat"
          value={form.project_name}
          onChangeText={(v) => set('project_name', v)}
          error={errors.project_name}
        />

        <Label text="Developer / Builder *" error={errors.developer} />
        <Input
          placeholder="e.g. Prestige Group"
          value={form.developer}
          onChangeText={(v) => set('developer', v)}
          error={errors.developer}
        />

        <Label text="Location / Micro-market *" error={errors.location} />
        <Input
          placeholder="e.g. Whitefield, Sarjapur Road"
          value={form.location}
          onChangeText={(v) => set('location', v)}
          error={errors.location}
        />

        {/* ── SECTION: Dates ── */}
        <SectionHeader title="Dates" icon="calendar" />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Label text="Launch Date" />
            <Input
              placeholder="YYYY-MM-DD"
              value={form.launch_date}
              onChangeText={(v) => set('launch_date', v)}
              keyboardType="numbers-and-punctuation"
            />
          </View>
          <View style={styles.rowGap} />
          <View style={{ flex: 1 }}>
            <Label text="Possession Date" />
            <Input
              placeholder="YYYY-MM-DD"
              value={form.possession_date}
              onChangeText={(v) => set('possession_date', v)}
              keyboardType="numbers-and-punctuation"
            />
          </View>
        </View>

        {/* ── SECTION: Pricing & Size ── */}
        <SectionHeader title="Pricing & Size" icon="cash" />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Label text="Current Price (₹)" />
            <Input
              placeholder="e.g. 8500000"
              value={form.current_price}
              onChangeText={(v) => set('current_price', v)}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.rowGap} />
          <View style={{ flex: 1 }}>
            <Label text="Price / sqft (₹)" />
            <Input
              placeholder="e.g. 7800"
              value={form.price_per_sqft}
              onChangeText={(v) => set('price_per_sqft', v)}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Label text="Area (sqft)" />
            <Input
              placeholder="e.g. 1250"
              value={form.area}
              onChangeText={(v) => set('area', v)}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.rowGap} />
          <View style={{ flex: 1 }}>
            <Label text="Bedrooms (BHK)" />
            <View style={styles.bedroomGrid}>
              {BEDROOM_OPTIONS.map((b) => (
                <TouchableOpacity
                  key={b}
                  style={[styles.bedroomChip, form.bedrooms === b && styles.bedroomChipActive]}
                  onPress={() => set('bedrooms', b)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.bedroomChipText,
                      form.bedrooms === b && styles.bedroomChipTextActive,
                    ]}
                  >
                    {b}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* ── SECTION: Description ── */}
        <SectionHeader title="Description" icon="document-text" />

        <TextInput
          style={styles.textArea}
          placeholder="Describe the property — amenities, USPs, connectivity, etc."
          placeholderTextColor="#94A3B8"
          value={form.description}
          onChangeText={(v) => set('description', v)}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />

        {/* ── SECTION: Similar Properties ── */}
        <SectionHeader title="Similar Properties" icon="copy" />
        <Text style={styles.sectionNote}>
          Add up to 5 comparable projects (optional — helps buyers)
        </Text>

        {similarProperties.map((sp, idx) => (
          <View key={idx} style={styles.similarCard}>
            <View style={styles.similarCardHeader}>
              <Text style={styles.similarCardTitle}>Property {idx + 1}</Text>
              <TouchableOpacity onPress={() => removeSimilar(idx)}>
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
            <Input
              placeholder="Project name *"
              value={sp.projectName}
              onChangeText={(v) => updateSimilar(idx, 'projectName', v)}
            />
            <Input
              placeholder="Developer"
              value={sp.developer}
              onChangeText={(v) => updateSimilar(idx, 'developer', v)}
            />
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Input
                  placeholder="Price (e.g. ₹85 L)"
                  value={sp.price}
                  onChangeText={(v) => updateSimilar(idx, 'price', v)}
                />
              </View>
              <View style={styles.rowGap} />
              <View style={{ flex: 1 }}>
                <Input
                  placeholder="Location"
                  value={sp.location}
                  onChangeText={(v) => updateSimilar(idx, 'location', v)}
                />
              </View>
            </View>
          </View>
        ))}

        {similarProperties.length < 5 && (
          <TouchableOpacity style={styles.addSimilarBtn} onPress={addSimilar} activeOpacity={0.8}>
            <Ionicons name="add-circle-outline" size={18} color="#2563EB" />
            <Text style={styles.addSimilarText}>
              Add Similar Property ({similarProperties.length}/5)
            </Text>
          </TouchableOpacity>
        )}

        {/* ── SECTION: Source Info ── */}
        <SectionHeader title="Source Information" icon="person" />

        <Label text="Your Name *" error={errors.source_name} />
        <Input
          placeholder="e.g. Akshay Joe"
          value={form.source_name}
          onChangeText={(v) => set('source_name', v)}
          error={errors.source_name}
        />

        <Label text="Contact (phone / email)" />
        <Input
          placeholder="e.g. +91 98765 43210"
          value={form.source_contact}
          onChangeText={(v) => set('source_contact', v)}
          keyboardType="email-address"
        />

        {/* ── Submit ── */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
              <Text style={styles.submitBtnText}>Submit for Review</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.submitNote}>
          Your listing will be visible after admin approval.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionHeader({ title, icon }) {
  return (
    <View style={sectionStyles.wrapper}>
      <Ionicons name={`${icon}-outline`} size={15} color="#2563EB" />
      <Text style={sectionStyles.title}>{title}</Text>
    </View>
  );
}

function Label({ text, error }) {
  return (
    <Text style={[labelStyles.text, error && { color: '#EF4444' }]}>{text}</Text>
  );
}

function ErrorText({ msg }) {
  return (
    <View style={errorStyles.row}>
      <Ionicons name="alert-circle-outline" size={13} color="#EF4444" />
      <Text style={errorStyles.text}>{msg}</Text>
    </View>
  );
}

function Input({ error, style, ...props }) {
  return (
    <TextInput
      style={[inputStyles.base, error && inputStyles.errorBorder, style]}
      placeholderTextColor="#94A3B8"
      {...props}
    />
  );
}

const sectionStyles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 22,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: '#DBEAFE',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E40AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

const labelStyles = StyleSheet.create({
  text: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 5,
    marginTop: 10,
  },
});

const errorStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  text: { fontSize: 12, color: '#EF4444' },
});

const inputStyles = StyleSheet.create({
  base: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 14,
    color: '#1E293B',
    marginBottom: 6,
  },
  errorBorder: { borderColor: '#FCA5A5' },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4FF',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  pageSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  row: { flexDirection: 'row' },
  rowGap: { width: 10 },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
  },
  typeChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  typeChipText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  typeChipTextActive: { color: '#FFFFFF' },
  bedroomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 10,
  },
  bedroomChip: {
    width: 38,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
  },
  bedroomChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  bedroomChipText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  bedroomChipTextActive: { color: '#FFFFFF' },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 14,
    color: '#1E293B',
    minHeight: 110,
    textAlignVertical: 'top',
  },
  sectionNote: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 8,
    marginTop: -8,
  },
  similarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
    borderStyle: 'dashed',
  },
  similarCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  similarCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E40AF',
  },
  addSimilarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 12,
    backgroundColor: '#EFF6FF',
    marginBottom: 6,
  },
  addSimilarText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 24,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  submitBtnDisabled: { backgroundColor: '#93C5FD' },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  submitNote: {
    textAlign: 'center',
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 10,
  },
  successContainer: {
    flex: 1,
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  successIcon: { marginBottom: 16 },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 10,
  },
  successBody: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  successBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    width: '100%',
    alignItems: 'center',
  },
  successBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
