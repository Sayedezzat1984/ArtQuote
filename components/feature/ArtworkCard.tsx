// Powered by OnSpace.AI
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
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

export function ArtworkCard({ artwork, onPress, onEdit, onDelete }: ArtworkCardProps) {
  const { currency, t } = useLanguage();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.imageWrap}>
        {artwork.image ? (
          <Image source={{ uri: artwork.image }} style={styles.image} contentFit="cover" transition={200} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <MaterialIcons name="palette" size={32} color={Colors.textMuted} />
          </View>
        )}
        <View style={styles.imageOverlay}>
          <Badge label={artwork.available ? 'متاح' : 'مباع'} variant={artwork.available ? 'success' : 'error'} />
        </View>
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{artwork.title}</Text>
        <Text style={styles.category}>{artwork.category} · {artwork.year}</Text>
        <Text style={styles.description} numberOfLines={2}>{artwork.description}</Text>
        <View style={styles.footer}>
          <Text style={styles.price}>{artwork.price.toLocaleString()} {currency}</Text>
          <Text style={styles.dimensions}>{artwork.dimensions}</Text>
        </View>
        <View style={styles.actions}>
          <Pressable onPress={onEdit} style={styles.actionBtn} hitSlop={8}>
            <MaterialIcons name="edit" size={18} color={Colors.primary} />
            <Text style={styles.actionText}>تعديل</Text>
          </Pressable>
          <Pressable onPress={onDelete} style={styles.actionBtn} hitSlop={8}>
            <MaterialIcons name="delete-outline" size={18} color={Colors.error} />
            <Text style={[styles.actionText, { color: Colors.error }]}>حذف</Text>
          </Pressable>
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
  imageWrap: {
    height: 180,
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
  },
  content: {
    padding: Spacing.base,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'right',
    marginBottom: 2,
  },
  category: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    textAlign: 'right',
    marginBottom: Spacing.sm,
    fontWeight: FontWeight.medium,
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'right',
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  price: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  dimensions: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.base,
    justifyContent: 'flex-end',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
  },
  actionText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.primary,
  },
});
