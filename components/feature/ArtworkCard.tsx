// Powered by OnSpace.AI
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { Badge } from '@/components/ui/Badge';
import { Artwork, Material } from '@/contexts/AppContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface ArtworkCardProps {
  artwork: Artwork;
  materials: Material[];
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ArtworkCard({ artwork, materials, onPress, onEdit, onDelete }: ArtworkCardProps) {
  const { currency } = useLanguage();
  const coverImage = artwork.images?.[0] || artwork.image;
  const imageCount = artwork.images?.length || (artwork.image ? 1 : 0);
  const usedMaterials = materials.filter(m => artwork.materialIds?.includes(m.id));

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.imageWrap}>
        {coverImage ? (
          <Image source={{ uri: coverImage }} style={styles.image} contentFit="cover" transition={200} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <MaterialIcons name="palette" size={32} color={Colors.textMuted} />
          </View>
        )}
        <View style={styles.imageOverlay}>
          <Badge label={artwork.available ? 'متاح' : 'مباع'} variant={artwork.available ? 'success' : 'error'} />
        </View>
        {/* Visitor visibility badge — admin indicator */}
        {(artwork as any).visibleToVisitors === false ? (
          <View style={styles.hiddenBadge}>
            <MaterialIcons name="visibility-off" size={11} color="#fff" />
            <Text style={styles.hiddenBadgeText}>مخفي</Text>
          </View>
        ) : (
          <View style={styles.visibleBadge}>
            <MaterialIcons name="people" size={11} color={Colors.success} />
          </View>
        )}
        {imageCount > 1 && (
          <View style={styles.imgCountBadge}>
            <MaterialIcons name="photo-library" size={12} color="#fff" />
            <Text style={styles.imgCountText}>{imageCount}</Text>
          </View>
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{artwork.title}</Text>
        <Text style={styles.category}>{artwork.category} · {artwork.year}</Text>
        <Text style={styles.description} numberOfLines={2}>{artwork.description}</Text>

        {/* Dimensions */}
        {artwork.dimensions ? (
          <View style={styles.dimsRow}>
            <MaterialIcons name="straighten" size={13} color={Colors.textMuted} />
            <Text style={styles.dims}>{artwork.dimensions}</Text>
          </View>
        ) : null}

        {/* Materials chips */}
        {usedMaterials.length > 0 && (
          <View style={styles.materialsRow}>
            {usedMaterials.slice(0, 3).map(m => (
              <View key={m.id} style={styles.matChip}>
                <View style={[styles.matDot, { backgroundColor: m.color || Colors.primary }]} />
                <Text style={styles.matChipText} numberOfLines={1}>{m.name}</Text>
              </View>
            ))}
            {usedMaterials.length > 3 && (
              <Text style={styles.moreText}>+{usedMaterials.length - 3}</Text>
            )}
          </View>
        )}

        <View style={styles.footer}>
          <View style={styles.actions}>
            {onEdit ? (
              <Pressable onPress={onEdit} style={styles.actionBtn} hitSlop={8}>
                <MaterialIcons name="edit" size={18} color={Colors.primary} />
                <Text style={styles.actionText}>تعديل</Text>
              </Pressable>
            ) : null}
            {onDelete ? (
              <Pressable onPress={onDelete} style={styles.actionBtn} hitSlop={8}>
                <MaterialIcons name="delete-outline" size={18} color={Colors.error} />
                <Text style={[styles.actionText, { color: Colors.error }]}>حذف</Text>
              </Pressable>
            ) : null}
          </View>
          <Text style={styles.price}>{artwork.price.toLocaleString()} {currency}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card, borderRadius: Radius.lg, overflow: 'hidden',
    marginBottom: Spacing.base, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  imageWrap: { height: 200, position: 'relative' },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: {
    flex: 1, backgroundColor: Colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  imageOverlay: { position: 'absolute', top: Spacing.sm, right: Spacing.sm },
  hiddenBadge: {
    position: 'absolute', bottom: Spacing.sm, right: Spacing.sm,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: Radius.full,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  hiddenBadgeText: { fontSize: 9, color: '#fff', fontWeight: FontWeight.semibold },
  visibleBadge: {
    position: 'absolute', bottom: Spacing.sm, right: Spacing.sm,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  imgCountBadge: {
    position: 'absolute', bottom: Spacing.sm, left: Spacing.sm,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
  },
  imgCountText: { fontSize: FontSize.xs, color: '#fff', fontWeight: FontWeight.bold },
  content: { padding: Spacing.base },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'right', marginBottom: 2 },
  category: { fontSize: FontSize.sm, color: Colors.primary, textAlign: 'right', marginBottom: Spacing.sm, fontWeight: FontWeight.medium },
  description: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'right', lineHeight: 20, marginBottom: Spacing.sm },
  dimsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginBottom: Spacing.sm },
  dims: { fontSize: FontSize.xs, color: Colors.textMuted },
  materialsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end', marginBottom: Spacing.sm },
  matChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.surfaceElevated, borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 3,
    borderWidth: 1, borderColor: Colors.border,
  },
  matDot: { width: 6, height: 6, borderRadius: 3 },
  matChipText: { fontSize: 10, color: Colors.textMuted, maxWidth: 70 },
  moreText: { fontSize: FontSize.xs, color: Colors.textMuted, alignSelf: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  price: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.primary },
  actions: { flexDirection: 'row', gap: Spacing.base },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: Spacing.sm },
  actionText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.primary },
});
