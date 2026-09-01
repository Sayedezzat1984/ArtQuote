// Powered by OnSpace.AI
import React, { useState } from 'react';
import { View, Text, Modal, ScrollView, StyleSheet, Pressable, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { Badge } from '@/components/ui/Badge';
import { Artwork, Material } from '@/contexts/AppContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ImageViewerModal } from './ImageViewerModal';

const { width: SCREEN_W } = Dimensions.get('window');

interface ArtworkDetailModalProps {
  visible: boolean;
  artwork: Artwork | null;
  materials: Material[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ArtworkDetailModal({ visible, artwork, materials, onClose, onEdit, onDelete }: ArtworkDetailModalProps) {
  const { currency } = useLanguage();
  const [activeImg, setActiveImg] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);

  if (!artwork) return null;

  const allImages = artwork.images?.length ? artwork.images : (artwork.image ? [artwork.image] : []);
  const usedMaterials = materials.filter(m => artwork.materialIds?.includes(m.id));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerActions}>
              <Pressable onPress={onDelete} style={[styles.headerBtn, styles.deleteBtn]}>
                <MaterialIcons name="delete-outline" size={18} color={Colors.error} />
              </Pressable>
              <Pressable onPress={onEdit} style={[styles.headerBtn, styles.editBtn]}>
                <MaterialIcons name="edit" size={18} color={Colors.primary} />
                <Text style={styles.editBtnText}>تعديل</Text>
              </Pressable>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={22} color={Colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Gallery */}
            {allImages.length > 0 ? (
              <View style={styles.galleryContainer}>
                {/* Main image — tap to open full screen viewer */}
                <Pressable onPress={() => setViewerOpen(true)} activeOpacity={0.92}>
                  <Image
                    source={{ uri: allImages[activeImg] }}
                    style={styles.mainImage}
                    contentFit="cover"
                    transition={200}
                  />
                  {/* Full-screen hint */}
                  <View style={styles.fullscreenHint}>
                    <MaterialIcons name="fullscreen" size={14} color="#fff" />
                    <Text style={styles.fullscreenHintText}>الشاشة الكاملة</Text>
                  </View>
                </Pressable>

                <View style={styles.galleryOverlay}>
                  <Badge label={artwork.available ? 'متاح للبيع' : 'مباع'} variant={artwork.available ? 'success' : 'error'} />
                </View>

                {allImages.length > 1 ? (
                  <>
                    <View style={styles.imgCounter}>
                      <Text style={styles.imgCounterText}>{activeImg + 1}/{allImages.length}</Text>
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.thumbsScroll}
                      contentContainerStyle={styles.thumbsContent}
                    >
                      {allImages.map((uri, i) => (
                        <Pressable
                          key={i}
                          onPress={() => setActiveImg(i)}
                          style={[styles.thumbBtn, i === activeImg && styles.thumbBtnActive]}
                        >
                          <Image source={{ uri }} style={styles.thumb} contentFit="cover" />
                        </Pressable>
                      ))}
                    </ScrollView>
                  </>
                ) : null}
              </View>
            ) : (
              <View style={styles.noImagePlaceholder}>
                <MaterialIcons name="palette" size={48} color={Colors.textMuted} />
                <Text style={styles.noImageText}>لا توجد صور</Text>
              </View>
            )}

            <View style={styles.content}>
              {/* Title & Category */}
              <View style={styles.titleRow}>
                <Text style={styles.category}>{artwork.category}</Text>
                <Text style={styles.title}>{artwork.title}</Text>
              </View>
              <Text style={styles.year}>سنة الإنجاز: {artwork.year}</Text>

              {/* Price */}
              <View style={styles.priceCard}>
                <MaterialIcons name="sell" size={20} color={Colors.primary} />
                <Text style={styles.price}>{artwork.price.toLocaleString()} {currency}</Text>
                <Text style={styles.priceLabel}>السعر</Text>
              </View>

              {/* Dimensions */}
              {artwork.dimensions ? (
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <MaterialIcons name="straighten" size={16} color={Colors.textMuted} />
                    <Text style={styles.infoValue}>{artwork.dimensions}</Text>
                    <Text style={styles.infoLabel}>الأبعاد</Text>
                  </View>
                  {artwork.width ? (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoValue}>{artwork.width} {artwork.dimensionUnit}</Text>
                      <Text style={styles.infoLabel}>العرض</Text>
                    </View>
                  ) : null}
                  {artwork.height ? (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoValue}>{artwork.height} {artwork.dimensionUnit}</Text>
                      <Text style={styles.infoLabel}>الارتفاع</Text>
                    </View>
                  ) : null}
                  {artwork.depth ? (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoValue}>{artwork.depth} {artwork.dimensionUnit}</Text>
                      <Text style={styles.infoLabel}>العمق</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}

              {/* Description */}
              {artwork.description ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>الوصف</Text>
                  <Text style={styles.description}>{artwork.description}</Text>
                </View>
              ) : null}

              {/* Materials */}
              {usedMaterials.length > 0 ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>الخامات المستخدمة</Text>
                  <View style={styles.materialsWrap}>
                    {usedMaterials.map(m => (
                      <View key={m.id} style={styles.materialTag}>
                        <View style={[styles.materialDot, { backgroundColor: m.color || Colors.primary }]} />
                        <Text style={styles.materialTagText}>{m.name}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Full-screen viewer with zoom, crop, rotate */}
      <ImageViewerModal
        visible={viewerOpen}
        images={allImages}
        initialIndex={activeImg}
        onClose={() => setViewerOpen(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  container: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    maxHeight: '95%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerActions: { flexDirection: 'row', gap: Spacing.sm },
  headerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderRadius: Radius.full, borderWidth: 1,
  },
  editBtn: { backgroundColor: Colors.primarySurface, borderColor: Colors.primary },
  editBtnText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },
  deleteBtn: { backgroundColor: Colors.errorSurface, borderColor: Colors.error + '60' },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center',
  },
  galleryContainer: { position: 'relative' },
  mainImage: { width: '100%', height: 280 },
  fullscreenHint: {
    position: 'absolute', bottom: Spacing.sm, left: Spacing.sm,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
  },
  fullscreenHintText: { fontSize: FontSize.xs, color: '#fff', fontWeight: FontWeight.medium },
  galleryOverlay: { position: 'absolute', top: Spacing.md, right: Spacing.md },
  imgCounter: {
    position: 'absolute', top: Spacing.md, left: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
  },
  imgCounterText: { fontSize: FontSize.xs, color: '#fff', fontWeight: FontWeight.bold },
  thumbsScroll: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  thumbsContent: { flexDirection: 'row', padding: Spacing.sm, gap: Spacing.sm },
  thumbBtn: { width: 54, height: 54, borderRadius: Radius.sm, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  thumbBtnActive: { borderColor: Colors.primary },
  thumb: { width: '100%', height: '100%' },
  noImagePlaceholder: {
    height: 200, backgroundColor: Colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
  },
  noImageText: { fontSize: FontSize.sm, color: Colors.textMuted },
  content: { padding: Spacing.base },
  titleRow: { marginBottom: Spacing.sm },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'right' },
  category: {
    fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold,
    textAlign: 'right', marginBottom: 4,
  },
  year: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'right', marginBottom: Spacing.base },
  priceCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.primarySurface, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.base, justifyContent: 'flex-end',
    borderWidth: 1, borderColor: Colors.primary + '40',
  },
  price: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.primary },
  priceLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  infoRow: {
    flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.base,
    justifyContent: 'flex-end', flexWrap: 'wrap',
  },
  infoItem: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.surfaceElevated, borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  infoValue: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  infoLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  section: { marginBottom: Spacing.base },
  sectionTitle: {
    fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary,
    textAlign: 'right', marginBottom: Spacing.sm, borderRightWidth: 3,
    borderRightColor: Colors.primary, paddingRight: Spacing.sm,
  },
  description: {
    fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'right',
    lineHeight: 22,
  },
  materialsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  materialTag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.surfaceElevated, borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.border,
  },
  materialDot: { width: 8, height: 8, borderRadius: 4 },
  materialTagText: { fontSize: FontSize.sm, color: Colors.textSecondary },
});
