// Powered by OnSpace.AI — Public Artwork Detail (reads from published_artworks)
import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Dimensions, Modal, FlatList, Linking, Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { usePublicGallery } from '@/contexts/PublicGalleryContext';
import { isTablet } from '@/constants/responsive';
import { useVisitor } from '@/contexts/VisitorContext';
import { useApp } from '@/hooks/useApp';

const { width: SW, height: SH } = Dimensions.get('window');

export default function PublicArtworkDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { getPublicArtwork } = usePublicGallery();
  const { appSettings } = useApp() as any;
  const { trackArtworkView } = useVisitor();

  const artwork = getPublicArtwork(id);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Track view when screen mounts
  useEffect(() => {
    if (artwork) {
      trackArtworkView(artwork.id, artwork.title).catch(() => {});
    }
  }, [artwork?.id]);

  const openWhatsApp = useCallback(() => {
    const number = appSettings?.whatsappNumber?.replace(/\D/g, '') || '';
    if (!number) {
      Alert.alert('تواصل', 'رقم واتساب غير متوفر حالياً. يرجى التواصل مع الإدارة.');
      return;
    }
    const message = encodeURIComponent(`مرحباً، أود الاستفسار عن العمل الفني: ${artwork?.title || ''}`);
    Linking.openURL(`https://wa.me/${number}?text=${message}`).catch(() => {
      Linking.openURL(`https://wa.me/${number}`);
    });
  }, [appSettings, artwork]);

  if (!artwork) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.notFound}>
          <MaterialIcons name="image-not-supported" size={64} color={Colors.textMuted} />
          <Text style={styles.notFoundText}>العمل الفني غير موجود</Text>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>العودة للمعرض</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Build full image list (mainImage + additional images deduplicated)
  const allImages: string[] = [
    ...(artwork.mainImage ? [artwork.mainImage] : []),
    ...(artwork.images || []).filter(img => img !== artwork.mainImage),
  ].filter(Boolean);

  // Dimension display
  const dimensionParts: string[] = [];
  const unit = artwork.dimensionUnit || 'cm';
  if (artwork.height) dimensionParts.push(`الارتفاع: ${artwork.height} ${unit}`);
  if (artwork.width) dimensionParts.push(`العرض: ${artwork.width} ${unit}`);
  if (artwork.depth) dimensionParts.push(`العمق: ${artwork.depth} ${unit}`);
  if (artwork.length) dimensionParts.push(`الطول: ${artwork.length} ${unit}`);
  if (artwork.diameter) dimensionParts.push(`القطر: ${artwork.diameter} ${unit}`);
  if (artwork.thickness) dimensionParts.push(`السماكة: ${artwork.thickness} ${unit}`);
  if (artwork.weight) dimensionParts.push(`الوزن: ${artwork.weight} ${artwork.weightUnit || 'kg'}`);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.topBar}>
        <View style={styles.topBarRight}>
          <Text style={styles.topBarTitle} numberOfLines={1}>{artwork.title}</Text>
        </View>
        <Pressable onPress={() => router.back()} style={styles.topBackBtn}>
          <MaterialIcons name="arrow-back-ios" size={18} color={Colors.textPrimary} />
          <Text style={styles.topBackText}>المعرض</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Hero Image */}
        {artwork.mainImage ? (
          <Pressable onPress={() => setLightboxIndex(0)} style={styles.heroContainer}>
            <Image
              source={{ uri: artwork.mainImage }}
              style={styles.heroImage}
              contentFit="contain"
              transition={200}
              cachePolicy="memory-disk"
            />
            <View style={styles.heroOverlay}>
              <MaterialIcons name="zoom-in" size={22} color="#fff" />
            </View>
          </Pressable>
        ) : (
          <View style={[styles.heroContainer, styles.heroPlaceholder]}>
            <MaterialIcons name="palette" size={64} color={Colors.primary + '50'} />
          </View>
        )}

        {/* Thumbnails */}
        {allImages.length > 1 ? (
          <View style={styles.thumbsOuter}>
            <FlatList
              data={allImages}
              horizontal
              keyExtractor={(_, i) => i.toString()}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbsContent}
              renderItem={({ item, index }) => (
                <Pressable onPress={() => setLightboxIndex(index)} style={styles.thumb}>
                  <Image source={{ uri: item }} style={styles.thumbImg} contentFit="cover" transition={150} />
                  <View style={styles.thumbOverlay}>
                    <MaterialIcons name="zoom-in" size={14} color="#fff" />
                  </View>
                </Pressable>
              )}
            />
          </View>
        ) : null}

        {/* Content */}
        <View style={styles.contentBlock}>

          {/* Title & Category */}
          <View style={styles.titleSection}>
            {artwork.category ? (
              <View style={styles.categoryPill}>
                <Text style={styles.categoryPillText}>{artwork.category}</Text>
              </View>
            ) : null}
            <Text style={styles.artworkTitle}>{artwork.title}</Text>
            {artwork.year ? <Text style={styles.artworkYear}>{artwork.year}</Text> : null}
          </View>

          {/* Description */}
          {artwork.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>الوصف</Text>
              <Text style={styles.descriptionText}>{artwork.description}</Text>
            </View>
          ) : null}

          {/* Dimensions */}
          {dimensionParts.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>المقاسات</Text>
              <View style={styles.dimGrid}>
                {dimensionParts.map((d, i) => {
                  const [label, value] = d.split(': ');
                  return (
                    <View key={i} style={styles.dimCard}>
                      <Text style={styles.dimValue}>{value}</Text>
                      <Text style={styles.dimLabel}>{label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* Material names from public mirror */}
          {artwork.materialNames && artwork.materialNames.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>الخامات</Text>
              <View style={styles.tagsRow}>
                {artwork.materialNames.map((name, i) => (
                  <View key={i} style={styles.tag}>
                    <Text style={styles.tagText}>{name}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Availability */}
          <View style={styles.availRow}>
            <View style={[
              styles.availBadge,
              {
                backgroundColor: artwork.available ? Colors.successSurface : Colors.errorSurface,
                borderColor: artwork.available ? Colors.success + '60' : Colors.error + '60',
              },
            ]}>
              <MaterialIcons
                name={artwork.available ? 'check-circle' : 'cancel'}
                size={14}
                color={artwork.available ? Colors.success : Colors.error}
              />
              <Text style={[styles.availText, { color: artwork.available ? Colors.success : Colors.error }]}>
                {artwork.available ? 'متاح' : 'غير متاح حالياً'}
              </Text>
            </View>
          </View>

          {/* Quantity */}
          {artwork.quantity ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>الكمية المتاحة</Text>
              <Text style={styles.simpleValue}>{artwork.quantity}</Text>
            </View>
          ) : null}

        </View>
      </ScrollView>

      {/* WhatsApp CTA */}
      <View style={[styles.waBar, { paddingBottom: insets.bottom + 8 }]}>
        <Pressable
          onPress={openWhatsApp}
          style={({ pressed }) => [styles.waBtn, pressed && { opacity: 0.85 }]}
        >
          <MaterialIcons name="chat" size={22} color="#fff" />
          <Text style={styles.waBtnText}>تواصل عبر واتساب</Text>
        </Pressable>
      </View>

      {/* Fullscreen Lightbox */}
      {lightboxIndex !== null ? (
        <Modal visible transparent animationType="fade" onRequestClose={() => setLightboxIndex(null)}>
          <View style={styles.lightboxOverlay}>
            <Pressable style={styles.lightboxClose} onPress={() => setLightboxIndex(null)}>
              <MaterialIcons name="close" size={26} color="#fff" />
            </Pressable>
            <FlatList
              data={allImages}
              horizontal
              pagingEnabled
              initialScrollIndex={lightboxIndex}
              getItemLayout={(_, index) => ({ length: SW, offset: SW * index, index })}
              keyExtractor={(_, i) => i.toString()}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={{ width: SW, height: SH, justifyContent: 'center', alignItems: 'center' }}>
                  <Image
                    source={{ uri: item }}
                    style={{ width: SW, height: SH * 0.85 }}
                    contentFit="contain"
                    transition={150}
                  />
                </View>
              )}
            />
            {allImages.length > 1 ? (
              <Text style={styles.lightboxCount}>{allImages.length} صور — اسحب للتنقل</Text>
            ) : null}
          </View>
        </Modal>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface,
  },
  topBackBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: Colors.surfaceElevated, borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: Colors.border,
  },
  topBackText: { fontSize: FontSize.xs, color: Colors.textPrimary, fontWeight: FontWeight.medium },
  topBarRight: { flex: 1, paddingRight: 12, alignItems: 'flex-end' },
  topBarTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'right' },

  scrollContent: { paddingBottom: 120 },
  heroContainer: {
    width: SW, height: isTablet ? SW * 0.55 : SW * 0.75,
    backgroundColor: Colors.surfaceElevated, position: 'relative',
  },
  heroPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primarySurface },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: {
    position: 'absolute', bottom: 12, left: 12,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
  },

  thumbsOuter: { height: 80, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surfaceElevated },
  thumbsContent: { paddingHorizontal: 12, gap: 8, alignItems: 'center' },
  thumb: {
    width: 68, height: 68, borderRadius: Radius.md, overflow: 'hidden',
    borderWidth: 1.5, borderColor: Colors.border, position: 'relative',
  },
  thumbImg: { width: '100%', height: '100%' },
  thumbOverlay: {
    position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },

  contentBlock: { padding: 20 },
  titleSection: { alignItems: 'flex-end', marginBottom: 20 },
  categoryPill: {
    backgroundColor: Colors.primarySurface, borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.primary + '50', marginBottom: 10,
  },
  categoryPillText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.semibold },
  artworkTitle: {
    fontSize: isTablet ? FontSize.xxxl : FontSize.xxl,
    fontWeight: FontWeight.extrabold, color: Colors.textPrimary,
    textAlign: 'right', lineHeight: 34,
  },
  artworkYear: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 4, textAlign: 'right' },

  section: { marginBottom: 20 },
  sectionLabel: {
    fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary,
    textAlign: 'right', marginBottom: 10,
    borderRightWidth: 3, borderRightColor: Colors.primary, paddingRight: 10,
  },
  descriptionText: { fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'right', lineHeight: 26 },

  dimGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-end' },
  dimCard: {
    backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md,
    paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border, minWidth: 90,
  },
  dimValue: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  dimLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.surfaceElevated, borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.border,
  },
  tagText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },

  availRow: { alignItems: 'flex-end', marginBottom: 12 },
  availBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1,
  },
  availText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  simpleValue: { fontSize: FontSize.base, color: Colors.textPrimary, textAlign: 'right', fontWeight: FontWeight.semibold },

  waBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surface, paddingHorizontal: 20, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: Colors.border, ...Shadow.md,
  },
  waBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#25D366', borderRadius: Radius.lg, paddingVertical: 14,
  },
  waBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#fff' },

  lightboxOverlay: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  lightboxClose: {
    position: 'absolute', top: 48, right: 20, zIndex: 10,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  lightboxCount: {
    position: 'absolute', bottom: 30, alignSelf: 'center',
    color: 'rgba(255,255,255,0.7)', fontSize: FontSize.sm,
  },

  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  notFoundText: { fontSize: FontSize.xl, color: Colors.textMuted, marginTop: 16, textAlign: 'center' },
  backButton: {
    marginTop: 20, backgroundColor: Colors.primarySurface, borderRadius: Radius.md,
    paddingVertical: 12, paddingHorizontal: 28, borderWidth: 1, borderColor: Colors.primary,
  },
  backButtonText: { color: Colors.primary, fontWeight: FontWeight.bold, fontSize: FontSize.base },
});
