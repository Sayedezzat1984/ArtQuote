// Powered by OnSpace.AI — Guest Gallery (Real-Time)
import React, {
  useState, useMemo, useCallback, useRef, useEffect,
} from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, TextInput,
  Dimensions, ActivityIndicator, Animated, AppState, AppStateStatus,
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
import { notifyNewArtwork, areNotificationsEnabled } from '@/services/notificationService';

const SCREEN_W = Dimensions.get('window').width;
const CARD_GAP = 12;
const COLS = isTablet ? 3 : 2;
const CARD_W = (SCREEN_W - (COLS + 1) * CARD_GAP * (isTablet ? 1.5 : 1.2)) / COLS;

export default function GuestGalleryScreen() {
  const {
    artworks,
    artworkCategories,
    artworksReady,
    syncGuestGallery,
    isOnline,
  } = useApp() as any;

  const { signOut } = useAuth();
  const {
    isRegistered,
    isLoadingVisitor,
    notificationsEnabled,
    requestNotificationPermission,
  } = useVisitor();
  const router = useRouter();

  // ── Redirect if not registered ────────────────────────────────────────────
  useEffect(() => {
    if (!isLoadingVisitor && !isRegistered) {
      router.replace('/(guest)/register');
    }
  }, [isLoadingVisitor, isRegistered]);

  // ── Cold-start: one-shot fetch on first open ─────────────────────────────
  const coldStartDone = useRef(false);
  const [coldSyncing, setColdSyncing] = useState(false);

  useEffect(() => {
    if (!isRegistered || isLoadingVisitor) return;
    if (coldStartDone.current) return;
    coldStartDone.current = true;
    // AppContext already has a real-time listener; only do a fetchOnce if no
    // artworks have arrived yet (prevents empty gallery on first cold open).
    if (artworksReady && artworks.length > 0) return;
    setColdSyncing(true);
    syncGuestGallery().finally(() => setColdSyncing(false));
  }, [isRegistered, isLoadingVisitor, artworksReady, artworks.length, syncGuestGallery]);

  // ── Re-sync when coming back online ──────────────────────────────────────
  const wasOffline = useRef(false);
  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
    } else if (wasOffline.current) {
      wasOffline.current = false;
      // Connection restored — fetch latest to catch any missed changes
      syncGuestGallery().catch(() => {});
    }
  }, [isOnline, syncGuestGallery]);

  // ── Re-sync on app foreground ─────────────────────────────────────────────
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  useEffect(() => {
    if (!isRegistered) return;
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = next;
      if (prev.match(/inactive|background/) && next === 'active') {
        syncGuestGallery().catch(() => {});
      }
    });
    return () => sub.remove();
  }, [isRegistered, syncGuestGallery]);

  // ── Search / filter state ─────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('الكل');

  // ── Notification banner ───────────────────────────────────────────────────
  const [showNotifBanner, setShowNotifBanner] = useState(false);
  useEffect(() => {
    const t = setTimeout(async () => {
      const enabled = await areNotificationsEnabled();
      if (!enabled) setShowNotifBanner(true);
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  // ── Manual refresh state ──────────────────────────────────────────────────
  type RefreshStatus = 'idle' | 'refreshing' | 'done' | 'new';
  const [refreshStatus, setRefreshStatus] = useState<RefreshStatus>('idle');
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast() {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
    toastTimer.current = setTimeout(() => setRefreshStatus('idle'), 3000);
  }

  // ── Track "new" artworks for badge ────────────────────────────────────────
  const knownIdsRef = useRef<Set<string>>(new Set());
  const [newArtworkIds, setNewArtworkIds] = useState<Set<string>>(new Set());
  const initialised = useRef(false);

  // Only visible artworks (visibleToVisitors !== false)
  const visibleArtworks = useMemo(() => {
    return (artworks as Artwork[]).filter((a: Artwork) => (a as any).visibleToVisitors !== false);
  }, [artworks]);

  // Keep ref in sync for AppState callbacks
  const visibleArtworksRef = useRef<Artwork[]>(visibleArtworks);
  useEffect(() => { visibleArtworksRef.current = visibleArtworks; }, [visibleArtworks]);

  // On first load, seed known IDs (no "new" badge for existing artworks)
  useEffect(() => {
    if (!initialised.current && visibleArtworks.length > 0) {
      initialised.current = true;
      knownIdsRef.current = new Set(visibleArtworks.map((a: Artwork) => a.id));
    }
  }, [visibleArtworks]);

  // ── Real-time change detection (driven by AppContext listener) ─────────────
  // artworks state in AppContext updates automatically via Firestore onSnapshot.
  // We just watch for new IDs to display the "جديد" badge and local notification.
  const notifyLockRef = useRef(false);
  useEffect(() => {
    if (!initialised.current) return; // skip before first seed
    if (notifyLockRef.current) return;

    const prevIds = knownIdsRef.current;
    const addedIds = new Set<string>();
    visibleArtworks.forEach((a: Artwork) => {
      if (!prevIds.has(a.id)) addedIds.add(a.id);
    });

    if (addedIds.size > 0) {
      notifyLockRef.current = true;
      knownIdsRef.current = new Set(visibleArtworks.map((a: Artwork) => a.id));
      setNewArtworkIds(addedIds);
      setTimeout(() => {
        setNewArtworkIds(new Set());
        notifyLockRef.current = false;
      }, 10_000);
      const firstTitle = visibleArtworks.find((a: Artwork) => addedIds.has(a.id))?.title || 'عمل جديد';
      notifyNewArtwork(firstTitle, addedIds.size).catch(() => {});
    } else {
      // Update known IDs if artworks were deleted or hidden
      knownIdsRef.current = new Set(visibleArtworks.map((a: Artwork) => a.id));
    }
  }, [visibleArtworks]);

  // ── Manual refresh ────────────────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    if (refreshStatus === 'refreshing') return;
    setRefreshStatus('refreshing');
    try {
      const prevIds = new Set(knownIdsRef.current);
      await syncGuestGallery();
      // Let state settle
      await new Promise(res => setTimeout(res, 300));

      const current = visibleArtworksRef.current;
      const addedIds = new Set<string>();
      current.forEach((a: Artwork) => { if (!prevIds.has(a.id)) addedIds.add(a.id); });
      knownIdsRef.current = new Set(current.map((a: Artwork) => a.id));

      if (addedIds.size > 0) {
        setNewArtworkIds(addedIds);
        setTimeout(() => setNewArtworkIds(new Set()), 10_000);
        setRefreshStatus('new');
      } else {
        setRefreshStatus('done');
      }
      showToast();
    } catch {
      setRefreshStatus('idle');
    }
  }, [refreshStatus, syncGuestGallery]);

  const handleEnableNotifications = useCallback(async () => {
    const granted = await requestNotificationPermission();
    if (granted) setShowNotifBanner(false);
  }, [requestNotificationPermission]);

  // ── Category labels ───────────────────────────────────────────────────────
  const ALL_LABEL = 'الكل';
  const categoryLabels = [ALL_LABEL, ...artworkCategories.map((c: any) => c.name)];

  // ── Filtered artworks ─────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return visibleArtworks.filter((a: Artwork) => {
      const matchSearch = !search
        || a.title.includes(search)
        || a.description?.includes(search)
        || a.category?.includes(search);
      const matchCat = catFilter === ALL_LABEL || a.category === catFilter;
      return matchSearch && matchCat;
    });
  }, [visibleArtworks, search, catFilter]);

  // ── Loading states ────────────────────────────────────────────────────────
  if (isLoadingVisitor) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>جاري التحقق...</Text>
      </View>
    );
  }

  if (!isRegistered) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (coldSyncing && !artworksReady && visibleArtworks.length === 0) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>جاري تحميل المعرض...</Text>
        <Text style={styles.loadingSubText}>يتم جلب أحدث الأعمال الفنية</Text>
      </View>
    );
  }

  const toastMessage =
    refreshStatus === 'new' ? 'تم إضافة أعمال جديدة ✦' :
    refreshStatus === 'done' ? 'تم تحديث المعرض' : '';

  const isSyncing = coldSyncing || refreshStatus === 'refreshing';

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

      {/* ── Status bars ─────────────────────────────────────────────────── */}

      {/* Offline indicator */}
      {!isOnline ? (
        <View style={styles.offlineBar}>
          <MaterialIcons name="wifi-off" size={14} color="#fff" />
          <Text style={styles.offlineText}>لا يوجد اتصال — يتم عرض الأعمال المحفوظة</Text>
        </View>
      ) : null}

      {/* Sync in-progress */}
      {isSyncing && isOnline ? (
        <View style={styles.statusBar}>
          <ActivityIndicator size="small" color={Colors.primary} style={{ marginLeft: 6 }} />
          <Text style={styles.statusBarText}>جاري تحديث المعرض...</Text>
        </View>
      ) : null}

      {/* Real-time connected indicator (subtle) */}
      {isOnline && !isSyncing && artworksReady ? (
        <View style={styles.liveBar}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>مزامنة فورية نشطة</Text>
        </View>
      ) : null}

      {/* Notification permission banner */}
      {showNotifBanner && !notificationsEnabled ? (
        <View style={styles.notifBanner}>
          <View style={styles.notifBannerLeft}>
            <MaterialIcons name="notifications-none" size={20} color={Colors.primary} />
            <View>
              <Text style={styles.notifBannerTitle}>تفعيل الإشعارات</Text>
              <Text style={styles.notifBannerSub}>كن أول من يعلم بالأعمال الجديدة</Text>
            </View>
          </View>
          <View style={styles.notifBannerActions}>
            <Pressable onPress={handleEnableNotifications} style={styles.notifEnableBtn}>
              <Text style={styles.notifEnableBtnText}>تفعيل</Text>
            </Pressable>
            <Pressable onPress={() => setShowNotifBanner(false)} style={styles.notifDismissBtn} hitSlop={8}>
              <MaterialIcons name="close" size={16} color={Colors.textMuted} />
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* Notifications active */}
      {notificationsEnabled ? (
        <View style={styles.notifActiveBar}>
          <MaterialIcons name="notifications-active" size={13} color={Colors.success} />
          <Text style={styles.notifActiveText}>ستصلك إشعارات عند إضافة أعمال جديدة</Text>
        </View>
      ) : null}

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

      {/* Count row */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>{filtered.length} عمل فني</Text>
        {!isOnline ? (
          <View style={styles.offlineBadge}>
            <MaterialIcons name="cloud-off" size={11} color={Colors.textMuted} />
            <Text style={styles.offlineBadgeText}>غير متصل</Text>
          </View>
        ) : null}
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
            {coldSyncing ? (
              <>
                <ActivityIndicator size="large" color={Colors.primary} style={{ marginBottom: 16 }} />
                <Text style={styles.emptyTitle}>جاري تحميل الأعمال...</Text>
              </>
            ) : (
              <>
                <MaterialIcons name="palette" size={64} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>
                  {search || catFilter !== ALL_LABEL ? 'لا توجد نتائج' : 'لا توجد أعمال منشورة'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {search || catFilter !== ALL_LABEL
                    ? 'جرّب تعديل كلمة البحث أو الفئة'
                    : isOnline ? 'لم يتم نشر أي أعمال بعد' : 'تحقق من الاتصال بالإنترنت'}
                </Text>
                <Pressable onPress={handleRefresh} style={styles.retryBtn}>
                  <MaterialIcons name="refresh" size={16} color={Colors.primary} />
                  <Text style={styles.retryBtnText}>إعادة المحاولة</Text>
                </Pressable>
              </>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/(guest)/${item.id}`)}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <View style={styles.imgContainer}>
              {item.image ? (
                <Image
                  source={{ uri: item.image }}
                  style={styles.img}
                  contentFit="cover"
                  transition={200}
                  // Append updatedAt to bust image cache when admin changes the image
                  cachePolicy="memory-disk"
                />
              ) : (
                <View style={styles.imgPlaceholder}>
                  <MaterialIcons name="palette" size={32} color={Colors.primary + '60'} />
                </View>
              )}
              {item.category ? (
                <View style={styles.catBadge}>
                  <Text style={styles.catBadgeText} numberOfLines={1}>{item.category}</Text>
                </View>
              ) : null}
              {newArtworkIds.has(item.id) ? (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>جديد</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
              {item.year ? <Text style={styles.cardYear}>{item.year}</Text> : null}
            </View>
          </Pressable>
        )}
      />

      {/* Toast */}
      {toastMessage ? (
        <Animated.View
          style={[
            styles.toast,
            { opacity: toastOpacity },
            refreshStatus === 'new' && styles.toastNew,
          ]}
        >
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: FontSize.base,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
    textAlign: 'center',
  },
  loadingSubText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  safe: { flex: 1, backgroundColor: Colors.background },

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
  refreshBtnActive: { backgroundColor: Colors.surfaceElevated, borderColor: Colors.border },

  // Offline bar
  offlineBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#c0392b',
    paddingVertical: 8,
  },
  offlineText: { fontSize: FontSize.xs, color: '#fff', fontWeight: FontWeight.semibold },

  // Syncing status bar
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
  statusBarText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.semibold },

  // Live indicator
  liveBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
    backgroundColor: Colors.successSurface,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  liveText: { fontSize: 10, color: Colors.success, fontWeight: FontWeight.semibold },

  // Notification banner
  notifBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: Colors.primarySurface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  notifBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  notifBannerTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  notifBannerSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: 1,
  },
  notifBannerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  notifEnableBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  notifEnableBtnText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: '#0d0d0f' },
  notifDismissBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notifActiveBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 5,
    backgroundColor: Colors.successSurface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.success + '30',
  },
  notifActiveText: { fontSize: 11, color: Colors.success, fontWeight: FontWeight.medium },

  headerDivider: { height: 1, backgroundColor: Colors.border },

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

  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 4,
  },
  countText: { fontSize: FontSize.xs, color: Colors.textMuted },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  offlineBadgeText: { fontSize: 10, color: Colors.textMuted },

  grid: { paddingHorizontal: CARD_GAP, paddingBottom: 32 },
  columnWrapper: { gap: CARD_GAP, marginBottom: CARD_GAP },

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
  newBadgeText: { fontSize: 9, color: '#fff', fontWeight: FontWeight.extrabold, letterSpacing: 0.5 },
  cardBody: { padding: 10, paddingTop: 8 },
  cardTitle: {
    fontSize: isTablet ? FontSize.base : FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'right',
    lineHeight: 20,
  },
  cardYear: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right', marginTop: 2 },

  empty: { alignItems: 'center', paddingVertical: 80, gap: 8 },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginTop: 8,
    textAlign: 'center',
  },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    backgroundColor: Colors.primarySurface,
    borderRadius: Radius.full,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  retryBtnText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },

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
  toastNew: { borderColor: Colors.success + '70', backgroundColor: Colors.successSurface },
  toastText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.primary },
});
