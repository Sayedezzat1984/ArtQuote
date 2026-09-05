// Powered by OnSpace.AI — Guest Gallery
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, TextInput, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/contexts/AuthContext';
import { Artwork } from '@/contexts/AppContext';
import { isTablet } from '@/constants/responsive';

const SCREEN_W = Dimensions.get('window').width;
const CARD_GAP = 12;
const COLS = isTablet ? 3 : 2;
const CARD_W = (SCREEN_W - (COLS + 1) * CARD_GAP * (isTablet ? 1.5 : 1.2)) / COLS;

export default function GuestGalleryScreen() {
  const { artworks, artworkCategories } = useApp() as any;
  const { signOut } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('الكل');

  const ALL_LABEL = 'الكل';
  const categoryLabels = [ALL_LABEL, ...artworkCategories.map((c: any) => c.name)];

  const filtered = useMemo(() => {
    return artworks.filter((a: Artwork) => {
      const matchSearch = !search || a.title.includes(search) || a.description?.includes(search) || a.category?.includes(search);
      const matchCat = catFilter === ALL_LABEL || a.category === catFilter;
      return matchSearch && matchCat;
    });
  }, [artworks, search, catFilter]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={signOut} style={styles.backBtn}>
          <MaterialIcons name="exit-to-app" size={18} color={Colors.textSecondary} />
          <Text style={styles.backBtnText}>خروج</Text>
        </Pressable>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>سيد عزت</Text>
          <Text style={styles.subtitle}>معرض الأعمال الفنية</Text>
        </View>
        <View style={styles.headerBadge}>
          <MaterialIcons name="visibility" size={14} color={Colors.info} />
          <Text style={styles.headerBadgeText}>زائر</Text>
        </View>
      </View>

      {/* Divider line */}
      <View style={styles.headerDivider} />

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="ابحث في الأعمال..."
            placeholderTextColor={Colors.textMuted}
            style={styles.searchInput}
            textAlign="right"
          />
          {search ? (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <MaterialIcons name="close" size={16} color={Colors.textMuted} />
            </Pressable>
          ) : (
            <MaterialIcons name="search" size={18} color={Colors.textMuted} />
          )}
        </View>
      </View>

      {/* Category chips */}
      {categoryLabels.length > 1 ? (
        <View style={styles.catOuter}>
          <FlatList
            data={categoryLabels}
            horizontal
            keyExtractor={(_, i) => i.toString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catContent}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => setCatFilter(item)}
                style={[styles.catChip, catFilter === item && styles.catChipActive]}
              >
                <Text style={[styles.catChipText, catFilter === item && styles.catChipTextActive]}>
                  {item}
                </Text>
              </Pressable>
            )}
          />
        </View>
      ) : null}

      {/* Count */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>{filtered.length} عمل فني</Text>
      </View>

      {/* Gallery Grid */}
      <FlatList
        data={filtered}
        keyExtractor={a => a.id}
        numColumns={COLS}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="palette" size={64} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>لا توجد أعمال</Text>
            <Text style={styles.emptySubtitle}>جرّب تعديل كلمة البحث أو الفئة</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/(guest)/${item.id}`)}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            {/* Image */}
            <View style={styles.imgContainer}>
              {item.image ? (
                <Image
                  source={{ uri: item.image }}
                  style={styles.img}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View style={styles.imgPlaceholder}>
                  <MaterialIcons name="palette" size={32} color={Colors.primary + '60'} />
                </View>
              )}
              {/* Category badge */}
              {item.category ? (
                <View style={styles.catBadge}>
                  <Text style={styles.catBadgeText} numberOfLines={1}>{item.category}</Text>
                </View>
              ) : null}
            </View>

            {/* Name */}
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
              {item.year ? <Text style={styles.cardYear}>{item.year}</Text> : null}
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backBtnText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  titleBlock: { alignItems: 'center', flex: 1 },
  title: {
    fontSize: isTablet ? FontSize.xxl : FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  subtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 1 },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.infoSurface,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.info + '40',
  },
  headerBadgeText: { fontSize: FontSize.xs, color: Colors.info, fontWeight: FontWeight.semibold },
  headerDivider: { height: 1, backgroundColor: Colors.border, marginHorizontal: 0 },

  // Search
  searchRow: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    marginLeft: 8,
  },

  // Category filter
  catOuter: { height: 46 },
  catContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catChipActive: { backgroundColor: Colors.primarySurface, borderColor: Colors.primary },
  catChipText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  catChipTextActive: { color: Colors.primary, fontWeight: FontWeight.bold },

  // Count
  countRow: { paddingHorizontal: 16, paddingBottom: 8, paddingTop: 4 },
  countText: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right' },

  // Grid
  grid: { paddingHorizontal: CARD_GAP, paddingBottom: 32 },
  columnWrapper: { gap: CARD_GAP, marginBottom: CARD_GAP },

  // Card
  card: {
    width: CARD_W,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  cardPressed: { opacity: 0.88, transform: [{ scale: 0.97 }] },
  imgContainer: {
    width: '100%',
    height: CARD_W * 1.15,
    backgroundColor: Colors.surfaceElevated,
    position: 'relative',
  },
  img: { width: '100%', height: '100%' },
  imgPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primarySurface,
  },
  catBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: CARD_W - 16,
  },
  catBadgeText: { fontSize: 9, color: '#fff', fontWeight: FontWeight.semibold },
  cardBody: { padding: 10, paddingTop: 8 },
  cardTitle: {
    fontSize: isTablet ? FontSize.base : FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'right',
    lineHeight: 20,
  },
  cardYear: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right', marginTop: 2 },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 80 },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: 16 },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 6, textAlign: 'center' },
});
