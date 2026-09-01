// Powered by OnSpace.AI
import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { Badge } from '@/components/ui/Badge';
import { Artwork } from '@/contexts/AppContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  visible: boolean;
  artwork: Artwork | null;
  onClose: () => void;
  onEdit: () => void;
}

const { width: SCREEN_W } = Dimensions.get('window');
const IMG_H = Math.round(Math.min(SCREEN_W * 0.85, 380));

function formatDimensions(dim: Artwork['dimensions']): string {
  const parts: { label: string; value: string }[] = [
    { label: 'الطول', value: dim.length },
    { label: 'العرض', value: dim.width },
    { label: 'الارتفاع', value: dim.height },
  ].filter(p => p.value && p.value !== '');
  return parts.map(p => `${p.label}: ${p.value} ${dim.unit}`).join('  |  ');
}

export function ArtworkDetailModal({ visible, artwork, onClose, onEdit }: Props) {
  const { currency } = useLanguage();
  const [imgIndex, setImgIndex] = useState(0);

  if (!artwork) return null;

  const allImages = artwork.images && artwork.images.length > 0
    ? artwork.images
    : artwork.image ? [artwork.image] : [];

  const dimText = formatDimensions(artwork.dimensions);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onEdit} style={styles.editBtn}>
            <MaterialIcons name="edit" size={18} color={Colors.primary} />
            <Text style={styles.editBtnText}>تعديل</Text>
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>{artwork.title}</Text>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
            <MaterialIcons name="close" size={22} color={Colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Image Gallery */}
          {allImages.length > 0 ? (
            <View style={styles.galleryWrap}>
              <View style={[styles.mainImageWrap, { height: IMG_H }]}>
                <Image
                  source={{ uri: allImages[imgIndex] }}
                  style={styles.mainImage}
                  contentFit="contain"
                  transition={200}
                />
                <View style={styles.imgOverlayBadge}>
                  <Badge label={artwork.available ? 'متاح للبيع' : 'مباع'} variant={artwork.available ? 'success' : 'error'} />
                </View>
                {allImages.length > 1 ? (
                  <View style={styles.imgCounter}>
                    <Text style={styles.imgCounterText}>{imgIndex + 1} / {allImages.length}</Text>
                  </View>
                ) : null}
              </View>
              {/* Thumbnails */}
              {allImages.length > 1 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbRow}>
                  {allImages.map((uri, i) => (
                    <Pressable key={i} onPress={() => setImgIndex(i)} style={[styles.thumb, imgIndex === i && styles.thumbActive]}>
                      <Image source={{ uri }} style={styles.thumbImg} contentFit="cover" transition={150} />
                    </Pressable>
                  ))}
                </ScrollView>
              ) : null}
            </View>
          ) : (
            <View style={[styles.noImageBox, { height: IMG_H / 1.5 }]}>
              <MaterialIcons name="view-in-ar" size={56} color={Colors.textMuted} />
              <Text style={styles.noImageText}>لا توجد صور لهذا العمل</Text>
            </View>
          )}

          {/* Title & Category */}
          <View style={styles.section}>
            <View style={styles.titleRow}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{artwork.category}</Text>
              </View>
              <Text style={styles.title}>{artwork.title}</Text>
            </View>
            <View style={styles.metaRow}>
              <View style={styles.metaChip}>
                <MaterialIcons name="calendar-today" size={13} color={Colors.textMuted} />
                <Text style={styles.metaText}>{artwork.year}</Text>
              </View>
              <Text style={styles.price}>{artwork.price.toLocaleString()} {currency}</Text>
            </View>
          </View>

          {/* Description */}
          {artwork.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>وصف العمل</Text>
              <Text style={styles.descriptionText}>{artwork.description}</Text>
            </View>
          ) : null}

          {/* Dimensions */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>الأبعاد والمقاسات</Text>
            {artwork.dimensions.length || artwork.dimensions.width || artwork.dimensions.height ? (
              <View style={styles.dimsGrid}>
                {artwork.dimensions.length ? (
                  <View style={styles.dimCard}>
                    <Text style={styles.dimValue}>{artwork.dimensions.length}</Text>
                    <Text style={styles.dimUnit}>{artwork.dimensions.unit}</Text>
                    <Text style={styles.dimLabel}>الطول</Text>
                  </View>
                ) : null}
                {artwork.dimensions.width ? (
                  <View style={styles.dimCard}>
                    <Text style={styles.dimValue}>{artwork.dimensions.width}</Text>
                    <Text style={styles.dimUnit}>{artwork.dimensions.unit}</Text>
                    <Text style={styles.dimLabel}>العرض</Text>
                  </View>
                ) : null}
                {artwork.dimensions.height ? (
                  <View style={styles.dimCard}>
                    <Text style={styles.dimValue}>{artwork.dimensions.height}</Text>
                    <Text style={styles.dimUnit}>{artwork.dimensions.unit}</Text>
                    <Text style={styles.dimLabel}>الارتفاع</Text>
                  </View>
                ) : null}
              </View>
            ) : (
              <Text style={styles.noDataText}>لم تُحدد الأبعاد</Text>
            )}
          </View>

          {/* Materials */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>الخامات المستخدمة</Text>
            {artwork.materials && artwork.materials.length > 0 ? (
              <View style={styles.materialsRow}>
                {artwork.materials.map((mat, i) => (
                  <View key={i} style={styles.materialChip}>
                    <MaterialIcons name="layers" size={13} color={Colors.primary} />
                    <Text style={styles.materialText}>{mat}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noDataText}>لم تُضف خامات لهذا العمل</Text>
            )}
          </View>

          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.sm,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primarySurface,
    paddingHorizontal: Spacing.md, paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.primary + '50',
  },
  editBtnText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },
  scroll: { paddingBottom: Spacing.xxl },
  galleryWrap: { marginBottom: Spacing.base },
  mainImageWrap: {
    width: '100%',
    backgroundColor: Colors.surfaceElevated,
    position: 'relative',
  },
  mainImage: { width: '100%', height: '100%' },
  imgOverlayBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.base,
  },
  imgCounter: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  imgCounterText: { fontSize: FontSize.xs, color: '#fff', fontWeight: FontWeight.bold },
  thumbRow: { paddingHorizontal: Spacing.base, paddingTop: Spacing.sm, gap: Spacing.sm },
  thumb: {
    width: 68, height: 68,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  thumbActive: { borderColor: Colors.primary },
  thumbImg: { width: '100%', height: '100%' },
  noImageBox: {
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.base,
  },
  noImageText: { fontSize: FontSize.sm, color: Colors.textMuted },
  section: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.base,
  },
  sectionLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    textAlign: 'right',
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  titleRow: { alignItems: 'flex-end', marginBottom: Spacing.sm },
  categoryBadge: {
    backgroundColor: Colors.primarySurface,
    paddingHorizontal: Spacing.md, paddingVertical: 4,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.primary + '40',
    marginBottom: Spacing.sm,
  },
  categoryText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },
  title: {
    fontSize: FontSize.xxl, fontWeight: FontWeight.bold,
    color: Colors.textPrimary, textAlign: 'right',
  },
  metaRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: Spacing.sm,
  },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
    borderRadius: Radius.full,
  },
  metaText: { fontSize: FontSize.sm, color: Colors.textMuted },
  price: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.primary },
  descriptionText: {
    fontSize: FontSize.base, color: Colors.textSecondary,
    textAlign: 'right', lineHeight: 24,
  },
  dimsGrid: { flexDirection: 'row', gap: Spacing.md, justifyContent: 'flex-end' },
  dimCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 80,
    ...Shadow.sm,
  },
  dimValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  dimUnit: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.semibold, marginBottom: 2 },
  dimLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  materialsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, justifyContent: 'flex-end' },
  materialChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.primarySurface,
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.primary + '40',
  },
  materialText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.medium },
  noDataText: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'right' },
});
