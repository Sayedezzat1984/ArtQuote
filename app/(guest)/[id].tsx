// Powered by OnSpace.AI — Guest Artwork Detail
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
import { useApp } from '@/hooks/useApp';
import { isTablet } from '@/constants/responsive';
import { useVisitor } from '@/contexts/VisitorContext';
import { useLanguage } from '@/contexts/LanguageContext';

const { width: SW, height: SH } = Dimensions.get('window');

export default function GuestArtworkDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { artworks, materials, appSettings } = useApp() as any;
  const { lang, toggleLang, t } = useLanguage();

  const artwork = artworks.find((a: any) => a.id === id);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { trackArtworkView } = useVisitor();

  // Track view when screen mounts
  useEffect(() => {
    if (artwork) {
      trackArtworkView(artwork.id, artwork.title).catch(() => {});
    }
  }, [artwork?.id]);

  const openWhatsApp = useCallback(() => {
    const number = appSettings?.whatsappNumber?.replace(/\D/g, '') || '';
    if (!number) {
      Alert.alert(
        lang === 'ar' ? 'تواصل' : 'Contact',
        lang === 'ar' ? 'رقم واتساب غير متوفر حالياً.' : 'WhatsApp number not available.'
      );
      return;
    }
    const message = encodeURIComponent(
      lang === 'ar'
        ? `مرحباً، أود الاستفسار عن العمل الفني: ${artwork?.title || ''}`
        : `Hello, I'd like to inquire about the artwork: ${artwork?.title || ''}`
    );
    Linking.openURL(`https://wa.me/${number}?text=${message}`).catch(() => {
      Linking.openURL(`https://wa.me/${number}`);
    });
  }, [appSettings, artwork, lang]);

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

  const allImages: string[] = [
    ...(artwork.image ? [artwork.image] : []),
    ...(artwork.images || []).filter((img: string) => img !== artwork.image),
  ].filter(Boolean);

  const artworkMaterials = (artwork.materialIds || [])
    .map((mid: string) => materials.find((m: any) => m.id === mid))
    .filter(Boolean);

  const dimensionParts: string[] = [];
  if (artwork.height) dimensionParts.push(`الارتفاع: ${artwork.height} ${artwork.dimensionUnit || 'cm'}`);
  if (artwork.width) dimensionParts.push(`العرض: ${artwork.width} ${artwork.dimensionUnit || 'cm'}`);
  if (artwork.depth) dimensionParts.push(`العمق: ${artwork.depth} ${artwork.dimensionUnit || 'cm'}`);
  if (artwork.length) dimensionParts.push(`الطول: ${artwork.length} ${artwork.dimensionUnit || 'cm'}`);
  if (artwork.diameter) dimensionParts.push(`القطر: ${artwork.diameter} ${artwork.dimensionUnit || 'cm'}`);
  if (artwork.thickness) dimensionParts.push(`السماكة: ${artwork.thickness} ${artwork.dimensionUnit || 'cm'}`);
  if (artwork.weight) dimensionParts.push(`الوزن: ${artwork.weight} ${artwork.weightUnit || 'kg'}`);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.topBar}>
        <View style={styles.topBarRight}>
          <Text style={styles.topBarTitle} numberOfLines={1}>{artwork.title}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable onPress={toggleLang} style={styles.langBtn}>
            <Text style={styles.langBtnText}>{lang === 'ar' ? 'EN' : 'عر'}</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} style={styles.topBackBtn}>
            <MaterialIcons name="arrow-back-ios" size={18} color={Colors.textPrimary} />
            <Text style={styles.topBackText}>{t('guestGallery')}</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Main Hero Image */}
        {artwork.image ? (
          <Pressable onPress={() => setLightboxIndex(0)} style={styles.heroContainer}>
            <Image
              source={{ uri: artwork.image }}
              style={styles.heroImage}
              contentFit="contain"
              transition={200}
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

        {/* Gallery thumbnails */}
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

        {/* Content block */}
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
              <Text style={styles.sectionLabel}>{t('guestDescription')}</Text>
              <Text style={styles.descriptionText}>{artwork.description}</Text>
            </View>
          ) : null}

          {/* Dimensions */}
          {dimensionParts.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('guestDimensions')}</Text>
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

          {/* Materials */}
          {artworkMaterials.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('guestMaterials')}</Text>
              <View style={styles.tagsRow}>
                {artworkMaterials.map((m: any) => (
                  <View key={m.id} style={styles.tag}>
                    {m.color ? <View style={[styles.tagDot, { backgroundColor: m.color }]} /> : null}
                    <Text style={styles.tagText}>{m.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Price */}
          {artwork.showPriceToCustomer !== false && artwork.price > 0 ? (
            <View style={styles.priceSection}>
              <Text style={styles.priceLabel}>{t('guestPrice')}</Text>
              <Text style={styles.priceValue}>{Number(artwork.price).toLocaleString()} {t('currency')}</Text>
            </View>
          ) : artwork.showPriceToCustomer === false ? (
            <View style={styles.priceHiddenRow}>
              <MaterialIcons name="chat" size={15} color={Colors.primary} />
              <Text style={styles.priceHiddenMsg}>{t('guestPriceHidden')}</Text>
            </View>
          ) : null}

          {/* Availability */}
          <View style={styles.availRow}>
            <View style={[styles.availBadge, { backgroundColor: artwork.available ? Colors.successSurface : Colors.errorSurface, borderColor: artwork.available ? Colors.success + '60' : Colors.error + '60' }]}>
              <MaterialIcons name={artwork.available ? 'check-circle' : 'cancel'} size={14} color={artwork.available ? Colors.success : Colors.error} />
              <Text style={[styles.availText, { color: artwork.available ? Colors.success : Colors.error }]}>
                {artwork.available ? t('guestAvailable') : t('guestUnavailable')}
              </Text>
            </View>
          </View>

          {/* Quantity if set */}
          {artwork.quantity ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>الكمية المتاحة</Text>
              <Text style={styles.simpleValue}>{artwork.quantity}</Text>
            </View>
          ) : null}

        </View>
      </ScrollView>

      {/* WhatsApp CTA — floating bottom bar */}
      <View style={[styles.waBar, { paddingBottom: insets.bottom + 8 }]}>
        <Pressable onPress={openWhatsApp} style={({ pressed }) => [styles.waBtn, pressed && { opacity: 0.85 }]}>
          <MaterialIcons name="chat" size={22} color="#fff" />
          <Text style={styles.waBtnText}>{t('guestContactBtn')}</Text>
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

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  langBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primarySurface,
    borderWidth: 1,
    borderColor: Colors.primary + '60',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.extrabold,
    color: Colors.primary,
  },
  topBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  topBackText: { fontSize: FontSize.xs, color: Colors.textPrimary, fontWeight: FontWeight.medium },
  topBarRight: { flex: 1, paddingRight: 12, alignItems: 'flex-end' },
  topBarTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'right' },

  scrollContent: { paddingBottom: 120 },

  // Hero
  heroContainer: {
    width: SW,
    height: isTablet ? SW * 0.55 : SW * 0.75,
    backgroundColor: Colors.surfaceElevated,
    position: 'relative',
  },
  heroPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primarySurface },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Thumbnails
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

  // Content
  contentBlock: { padding: 20 },
  titleSection: { alignItems: 'flex-end', marginBottom: 20 },
  categoryPill: {
    backgroundColor: Colors.primarySurface, borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: Colors.primary + '50',
    marginBottom: 10,
  },
  categoryPillText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.semibold },
  artworkTitle: { fontSize: isTablet ? FontSize.xxxl : FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, textAlign: 'right', lineHeight: 34 },
  artworkYear: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 4, textAlign: 'right' },

  // Section
  section: { marginBottom: 20 },
  sectionLabel: {
    fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary,
    textAlign: 'right', marginBottom: 10,
    borderRightWidth: 3, borderRightColor: Colors.primary, paddingRight: 10,
  },
  descriptionText: { fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'right', lineHeight: 26 },

  // Dimensions
  dimGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-end' },
  dimCard: {
    backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md,
    paddingVertical: 10, paddingHorizontal: 14,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
    minWidth: 90,
  },
  dimValue: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  dimLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },

  // Tags
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.surfaceElevated, borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.border,
  },
  tagDot: { width: 10, height: 10, borderRadius: 5 },
  tagText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },

  // Availability
  availRow: { alignItems: 'flex-end', marginBottom: 12 },
  availBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1,
  },
  availText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },

  simpleValue: { fontSize: FontSize.base, color: Colors.textPrimary, textAlign: 'right', fontWeight: FontWeight.semibold },

  // Price
  priceSection: {
    alignItems: 'flex-end', marginBottom: 16,
    backgroundColor: Colors.primarySurface,
    borderRadius: Radius.lg, padding: 16,
    borderWidth: 1, borderColor: Colors.primary + '40',
  },
  priceLabel: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.semibold, marginBottom: 4 },
  priceValue: { fontSize: isTablet ? 32 : 28, fontWeight: FontWeight.extrabold, color: Colors.primary },
  priceHiddenRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'flex-end',
    marginBottom: 16, backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg, padding: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  priceHiddenMsg: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.medium, textAlign: 'right' },

  // WhatsApp bar
  waBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadow.md,
  },
  waBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#25D366',
    borderRadius: Radius.lg,
    paddingVertical: 14,
  },
  waBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#fff' },

  // Lightbox
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

  // Not found
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  notFoundText: { fontSize: FontSize.xl, color: Colors.textMuted, marginTop: 16, textAlign: 'center' },
  backButton: {
    marginTop: 20, backgroundColor: Colors.primarySurface, borderRadius: Radius.md,
    paddingVertical: 12, paddingHorizontal: 28, borderWidth: 1, borderColor: Colors.primary,
  },
  backButtonText: { color: Colors.primary, fontWeight: FontWeight.bold, fontSize: FontSize.base },
});
