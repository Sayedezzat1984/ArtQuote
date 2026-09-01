// Powered by OnSpace.AI
import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { Badge } from '@/components/ui/Badge';
import { Artwork } from '@/contexts/AppContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface ArtworkCardProps {
  artwork: Artwork;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const IMAGE_HEIGHT = Math.round(Math.min(SCREEN_WIDTH * 0.55, 240));

function formatDimensions(dim: Artwork['dimensions']): string {
  const parts = [dim.length, dim.width, dim.height].filter(v => v && v !== '');
  if (parts.length === 0) return '';
  return parts.join(' × ') + ' ' + dim.unit;
}

export function ArtworkCard({ artwork, onPress, onEdit, onDelete }: ArtworkCardProps) {
  const { currency } = useLanguage();
  const mainImage = artwork.images && artwork.images.length > 0 ? artwork.images[0] : artwork.image;
  const extraImages = (artwork.images || []).length;
  const dimText = formatDimensions(artwork.dimensions);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      {/* Image */}
      <View style={[styles.imageWrap, { height: IMAGE_HEIGHT }]}>
        {mainImage ? (
          <Image
            source={{ uri: mainImage }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <MaterialIcons name="view-in-ar" size={36} color={Colors.textMuted} />
            <Text style={styles.noImageText}>لا توجد صورة</Text>
          </View>
        )}
        {/* Overlay badges */}
        <View style={styles.topOverlay}>
          <Badge label={artwork.available ? 'متاح' : 'مباع'} variant={artwork.available ? 'success' : 'error'} />
          {extraImages > 1 ? (
            <View style={styles.photoCount}>
              <MaterialIcons name="photo-library" size={12} color="#fff" />
              <Text style={styles.photoCountText}>{extraImages}</Text>
            </View>
          ) : null}
        </View>
        {/* Category chip bottom */}
        <View style={styles.bottomOverlay}>
          <View style={styles.categoryChip}>
            <Text style={styles.categoryChipText}>{artwork.category}</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.year}>{artwork.year}</Text>
          <Text style={styles.title} numberOfLines={1}>{artwork.title}</Text>
        </View>

        {artwork.description ? (
          <Text style={styles.description} numberOfLines={2}>{artwork.description}</Text>
        ) : null}

        {/* Dimensions + Materials row */}
        <View style={styles.specsRow}>
          {dimText ? (
            <View style={styles.specChip}>
              <MaterialIcons name="straighten" size={12} color={Colors.textMuted} />
              <Text style={styles.specText}>{dimText}</Text>
            </View>
          ) : null}
          {artwork.materials && artwork.materials.length > 0 ? (
            <View style={styles.specChip}>
              <MaterialIcons name="layers" size={12} color={Colors.textMuted} />
              <Text style={styles.specText} numberOfLines={1}>
                {artwork.materials.slice(0, 2).join(' · ')}{artwork.materials.length > 2 ? ' +' + (artwork.materials.length - 2) : ''}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.actions}>
            <Pressable onPress={onEdit} style={styles.actionBtn} hitSlop={8}>
              <MaterialIcons name="edit" size={16} color={Colors.primary} />
              <Text style={styles.actionText}>تعديل</Text>
            </Pressable>
            <Pressable onPress={onDelete} style={[styles.actionBtn, styles.deleteActionBtn]} hitSlop={8}>
              <MaterialIcons name="delete-outline" size={16} color={Colors.error} />
              <Text style={[styles.actionText, { color: Colors.error }]}>حذف</Text>
            </Pressable>
          </View>
          <Text style={styles.price}>{artwork.price.toLocaleString()} {currency}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  imageWrap: { position: 'relative', width: '100%' },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  noImageText: { fontSize: FontSize.xs, color: Colors.textMuted },
  topOverlay: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  photoCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  photoCountText: { fontSize: FontSize.xs, color: '#fff', fontWeight: FontWeight.bold },
  bottomOverlay: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
  },
  categoryChip: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.primary + '60',
  },
  categoryChipText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.semibold },
  content: { padding: Spacing.base },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: Spacing.xs },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, flex: 1, textAlign: 'right' },
  year: { fontSize: FontSize.xs, color: Colors.textMuted, marginLeft: Spacing.sm },
  description: {
    fontSize: FontSize.sm, color: Colors.textSecondary,
    textAlign: 'right', lineHeight: 20, marginBottom: Spacing.sm,
  },
  specsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.md, justifyContent: 'flex-end' },
  specChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
  },
  specText: { fontSize: FontSize.xs, color: Colors.textMuted },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 5, paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.primarySurface,
    borderRadius: Radius.full,
  },
  deleteActionBtn: { backgroundColor: Colors.errorSurface },
  actionText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium, color: Colors.primary },
  price: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.primary },
});
