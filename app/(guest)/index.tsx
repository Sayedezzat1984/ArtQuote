// Powered by OnSpace.AI — Guest Gallery
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, TextInput, Dimensions,
  ActivityIndicator, Animated, AppState, AppStateStatus,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/contexts/AuthContext';
import { useVisitor } from '@/contexts/VisitorContext';
import { Artwork } from '@/contexts/AppContext';
import { isTablet } from '@/constants/responsive';

const SCREEN_W = Dimensions.get('window').width;
const CARD_GAP = 12;
const COLS = isTablet ? 3 : 2;
const CARD_W = (SCREEN_W - (COLS + 1) * CARD_GAP * (isTablet ? 1.5 : 1.2)) / COLS;

// Auto-sync interval in ms (every 60 seconds while gallery is open)
const AUTO_SYNC_INTERVAL = 60_000;

type RefreshStatus = 'idle' | 'refreshing' | 'done' | 'new';

export default function GuestGalleryScreen() {
  const { artworks, artworkCategories, forceSyncNow } = useApp() as any;
  const { signOut } = useAuth();
  const { currentVisitor, checkAccessEnabled, clearSession } = useVisitor();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('الكل');
  const [isBlocked, setIsBlocked] = useState(false);

  // Refresh state
  const [refreshStatus, setRefreshStatus] = useState<RefreshStatus>('idle');
  const [newArtworkIds, setNewArtworkIds] = useState<Set<string>>(new Set());
  const knownIdsRef = useRef<Set<string>>(new Set());
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSyncTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const isSyncing = useRef(false);

  // ── Access check on mount and on return from background ─────────────────────
  useEffect(() => {
    if (!currentVisitor) return;
    checkAccessEnabled(currentVisitor.id).then(allowed => {
      setIsBlocked(!allowed);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVisitor?.id]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', async (state: AppStateStatus) => {
      if (state === 'active' && currentVisitor) {
        const allowed = await checkAccessEnabled(currentVisitor.id);
        setIsBlocked(!allowed);
      }
    });
    return () => sub.remove();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVisitor?.id]);

  // ── Filter: only show artworks that are visible to visitors (default true for backward compat)
  const visibleArtworks = useMemo(() => {
    return artworks.filter((a: Artwork) => (a as any).visibleToVisitors !== false);
  }, [artworks]);

  // Initialise known IDs on first load (don't mark as new on mount)
  useEffect(() => {
    knownIdsRef.current = new Set(visibleArtworks.map((a: Artwork) => a.id));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  // ── Auto-sync: periodic while gallery is open ─────────────────────────────
  useEffect(() => {
    // Start interval
    autoSyncTimer.current = setInterval(() => {
      silentSync();
    }, AUTO_SYNC_INTERVAL);

    // Sync immediately when screen mounts
    silentSync();

    return () => {
      if (autoSyncTimer.current) clearInterval(autoSyncTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-sync: when app returns to foreground ─────────────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        silentSync();
      }
    });
    return () => sub.remove();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Silent sync: doesn't show loading but detects new artworks ────────────
  const silentSync = useCallback(async () => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    try {
      const prevIds = new Set(knownIdsRef.current);
      await forceSyncNow();
      // Brief wait for state to settle — artworks state updates via Firestore listener
      await new Promise(res => setTimeout(res, 600));
      // Read current artworks from ref to avoid stale closure
      const allArtworks: Artwork[] = (artworks as Artwork[]).filter(
        (a: Artwork) => (a as any).visibleToVisitors !== false
      );
      const currentIds = new Set<string>(allArtworks.map((a: Artwork) => a.id));
      const addedIds = new Set<string>();
      currentIds.forEach((id: string) => { if (!prevIds.has(id)) addedIds.add(id); });
      knownIdsRef.current = currentIds;
      if (addedIds.size > 0) {
        setNewArtworkIds(addedIds);
        // Auto-clear NEW badges after 10 seconds
        setTimeout(() => setNewArtworkIds(new Set()), 10_000);
      }
    } catch {
      // Silent — don't surface errors for background sync
    } finally {
      isSyncing.current = false;
    }
  }, [forceSyncNow, artworks]);

  function showToast(status: RefreshStatus) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
    toastTimer.current = setTimeout(() => setRefreshStatus('idle'), 3000);
  }

  // ── Manual refresh ────────────────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    if (refreshStatus === 'refreshing') return;
    setRefreshStatus('refreshing');
    try {
      const prevIds = new Set(knownIdsRef.current);
      await forceSyncNow();
      await new Promise(res => setTimeout(res, 600));
      const allArtworks: Artwork[] = (artworks as Artwork[]).filter(
        (a: Artwork) => (a as any).visibleToVisitors !== false
      );
      const currentIds = new Set<string>(allArtworks.map((a: Artwork) => a.id));
      const addedIds = new Set<string>();
      currentIds.forEach((id: string) => { if (!prevIds.has(id)) addedIds.add(id); });
      knownIdsRef.current = currentIds;

      if (addedIds.size > 0) {
        setNewArtworkIds(addedIds);
        setRefreshStatus('new');
        setTimeout(() => setNewArtworkIds(new Set()), 10_000);
      } else {
        setRefreshStatus('done');
      }
      showToast(refreshStatus === 'new' ? 'new' : 'done');
    } catch {
      setRefreshStatus('idle');
    }
  }, [refreshStatus, forceSyncNow, artworks]);

  const ALL_LABEL = 'الكل';
  const categoryLabels = [ALL_LABEL, ...artworkCategories.map((c: any) => c.name)];

  const filtered = useMemo(() => {
    return visibleArtworks.filter((a: Artwork) => {
      const matchSearch = !search || a.title.includes(search) || a.description?.includes(search) || a.category?.includes(search);
      const matchCat = catFilter === ALL_LABEL || a.category === catFilter;
      return matchSearch && matchCat;
    });
  }, [visibleArtworks, search, catFilter]);

  const toastMessage =
    refreshStatus === 'new' ? 'تم إضافة أعمال جديدة ✦' :
    refreshStatus === 'done' ? 'تم تحديث المعرض' : '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Blocked Visitor Screen */}
      {isBlocked ? (
        <View style={styles.blockedContainer}>
          <View style={styles.blockedIcon}>
            <MaterialIcons name="block" size={56} color={Colors.error} />
          </View>
          <Text style={styles.blockedTitle}>وصولك محدود</Text>
          <Text style={styles.blockedMsg}>
            {'وصولك للمعرض غير متاح حالياً.\nيرجى التواصل معنا للمزيد من المعلومات.'}
          </Text>
          <Pressable onPress={async () => { await clearSession(); signOut(); }} style={styles.blockedExitBtn}>
            <MaterialIcons name="exit-to-app" size={18} color={Colors.textSecondary} />
            <Text style={styles.blockedExitText}>خروج</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Main Gallery (shown when not blocked) */}
      {!isBlocked ? (
        <>
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
        {/* Refresh Button */}
        <Pressable
          onPress={handleRefresh}
          disabled={refreshStatus === 'refreshing'}
          style={({ pressed }) => [
            styles.refreshBtn,
            pressed && { opacity: 0.8 },
            refreshStatus === 'refreshing' && styles.refreshBtnActive,
          ]}
          accessibilityLabel="تحديث الأعمال"
        >
          {refreshStatus === 'refreshing' ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <MaterialIcons
              name="refresh"
              size={20}
              color={refreshStatus === 'new' ? Colors.success : Colors.primary}
            />
          )}
        </Pressable>
      </View>

      {/* Refreshing status bar */}
      {refreshStatus === 'refreshing' ? (
        <View style={styles.statusBar}>
          <ActivityIndicator size="small" color={Colors.primary} style={{ marginLeft: 6 }} />
          <Text style={styles.statusBarText}>جاري تحديث الأعمال...</Text>
        </View>
      ) : null}

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
              {/* NEW badge */}
              {newArtworkIds.has(item.id) ? (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>جديد</Text>
                </View>
              ) : null}
            </View>

            {/* Name */}
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
              {item.year ? <Text style={styles.cardYear}>{item.year}</Text> : null}
              {item.showPriceToCustomer !== false && item.price > 0 ? (
                <Text style={styles.cardPrice}>{Number(item.price).toLocaleString()} ج.م</Text>
              ) : item.showPriceToCustomer === false ? (
                <View style={styles.cardPriceHidden}>
                  <MaterialIcons name="chat" size={10} color={Colors.primary} />
                  <Text style={styles.cardPriceHiddenText}>تواصل للسعر</Text>
                </View>
              ) : null}
            </View>
          </Pressable>
        )}
      />

      {/* Toast notification */}
      {toastMessage ? (
        <Animated.View style={[styles.toast, { opacity: toastOpacity }, refreshStatus === 'new' && styles.toastNew]}>
          <MaterialIcons
            name={refreshStatus === 'new' ? 'fiber-new' : 'check-circle'}
            size={16}
            color={refreshStatus === 'new' ? Colors.success : Colors.primary}
          />
          <Text style={[styles.toastText, refreshStatus === 'new' && { color: Colors.success }]}>
            {toastMessage}
          </Text>
        </Animated.View>
      ) : null}
      </> ) : null}
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

  // Refresh button
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primarySurface,
    borderWidth: 1,
    borderColor: Colors.primary + '50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshBtnActive: {
    backgroundColor: Colors.surfaceElevated,
    borderColor: Colors.border,
  },

  // Status bar (while refreshing)
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primarySurface,
    paddingVertical: 7,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary + '30',
  },
  statusBarText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },

  headerDivider: { height: 1, backgroundColor: Colors.border },

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

  // NEW badge
  newBadge: {
    position: 'absolute',
    top: 7,
    left: 7,
    backgroundColor: Colors.success,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#fff',
  },
  newBadgeText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: FontWeight.extrabold,
    letterSpacing: 0.5,
  },

  cardBody: { padding: 10, paddingTop: 8 },
  cardTitle: {
    fontSize: isTablet ? FontSize.base : FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'right',
    lineHeight: 20,
  },
  cardYear: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right', marginTop: 2 },
  cardPrice: { fontSize: FontSize.sm, fontWeight: FontWeight.extrabold, color: Colors.primary, textAlign: 'right', marginTop: 4 },
  cardPriceHidden: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, justifyContent: 'flex-end' },
  cardPriceHiddenText: { fontSize: 9, color: Colors.primary, fontWeight: FontWeight.medium },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 80 },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: 16 },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 6, textAlign: 'center' },

  // Toast
  toast: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.card,
    borderRadius: Radius.full,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.primary + '50',
    ...Shadow.md,
  },
  toastNew: {
    borderColor: Colors.success + '70',
    backgroundColor: Colors.successSurface,
  },
  toastText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },

  // Blocked visitor
  blockedContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    zIndex: 100,
  },
  blockedIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.errorSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 2,
    borderColor: Colors.error + '40',
  },
  blockedTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  blockedMsg: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: Spacing.xxl,
  },
  blockedExitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.full,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  blockedExitText: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
  },
});
