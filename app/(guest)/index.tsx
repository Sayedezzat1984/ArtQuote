// Powered by OnSpace.AI — Public Gallery (Reads from published_artworks — No Admin Required)
import React, {
  useState, useMemo, useCallback, useRef, useEffect,
} from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, TextInput,
  Dimensions, ActivityIndicator, Animated, Modal,
  TextInput as RNTextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { usePublicGallery, PublicArtwork } from '@/contexts/PublicGalleryContext';
import { useAuth } from '@/contexts/AuthContext';
import { isTablet } from '@/constants/responsive';
import { ADMIN_EMAIL } from '@/services/firebase';

const SCREEN_W = Dimensions.get('window').width;
const CARD_GAP = 12;
const COLS = isTablet ? 3 : 2;
const CARD_W = (SCREEN_W - (COLS + 1) * CARD_GAP * (isTablet ? 1.5 : 1.2)) / COLS;

// ─── Inline Admin Login Modal ─────────────────────────────────────────────────
function AdminLoginModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { signIn, authError, authLoading, clearError, resetPassword } = useAuth();
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState(ADMIN_EMAIL);
  const [resetSent, setResetSent] = useState(false);

  function handleClose() {
    setPassword('');
    clearError();
    setShowReset(false);
    setResetSent(false);
    onClose();
  }

  async function handleLogin() {
    if (!password) return;
    await signIn(ADMIN_EMAIL, password);
  }

  async function handleReset() {
    if (!resetEmail.trim()) return;
    await resetPassword(resetEmail);
    setResetSent(true);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        <View style={styles.modalCard}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Pressable onPress={handleClose} style={styles.modalCloseBtn} hitSlop={8}>
              <MaterialIcons name="close" size={18} color={Colors.textSecondary} />
            </Pressable>
            <View style={styles.modalTitleRow}>
              <MaterialIcons name="admin-panel-settings" size={18} color={Colors.primary} />
              <Text style={styles.modalTitle}>دخول المشرف</Text>
            </View>
          </View>

          {!showReset ? (
            <View style={styles.modalBody}>
              {authError ? (
                <View style={styles.errorBox}>
                  <MaterialIcons name="error-outline" size={14} color={Colors.error} />
                  <Text style={styles.errorTxt}>{authError}</Text>
                  <Pressable onPress={clearError} hitSlop={8}>
                    <MaterialIcons name="close" size={12} color={Colors.error} />
                  </Pressable>
                </View>
              ) : null}
              <Text style={styles.emailHint}>{ADMIN_EMAIL}</Text>
              <View style={styles.inputRow}>
                <Pressable onPress={() => setShowPwd(!showPwd)} hitSlop={8} style={styles.inputIcon}>
                  <MaterialIcons name={showPwd ? 'visibility-off' : 'visibility'} size={18} color={Colors.textMuted} />
                </Pressable>
                <RNTextInput
                  value={password}
                  onChangeText={v => { setPassword(v); clearError(); }}
                  secureTextEntry={!showPwd}
                  style={styles.input}
                  textAlign="right"
                  placeholder="كلمة المرور"
                  placeholderTextColor={Colors.textMuted}
                  onSubmitEditing={handleLogin}
                  returnKeyType="go"
                  autoFocus
                />
              </View>
              <Pressable onPress={() => setShowReset(true)} style={styles.forgotRow}>
                <Text style={styles.forgotTxt}>نسيت كلمة المرور؟</Text>
              </Pressable>
              <Pressable
                onPress={handleLogin}
                disabled={authLoading || !password}
                style={[styles.loginBtn, (authLoading || !password) && styles.loginBtnDisabled]}
              >
                {authLoading ? (
                  <ActivityIndicator size="small" color={Colors.textOnPrimary} />
                ) : (
                  <>
                    <MaterialIcons name="login" size={18} color={Colors.textOnPrimary} />
                    <Text style={styles.loginBtnTxt}>دخول</Text>
                  </>
                )}
              </Pressable>
            </View>
          ) : (
            <View style={styles.modalBody}>
              {resetSent ? (
                <View style={styles.resetSentBox}>
                  <MaterialIcons name="check-circle" size={40} color={Colors.success} />
                  <Text style={styles.resetSentTxt}>تم إرسال رابط الاستعادة على بريدك الإلكتروني</Text>
                  <Pressable onPress={handleClose} style={styles.doneBtn}>
                    <Text style={styles.doneBtnTxt}>تم</Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  <Text style={styles.resetLabel}>أدخل بريدك الإلكتروني</Text>
                  <RNTextInput
                    value={resetEmail}
                    onChangeText={setResetEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.resetInput}
                    textAlign="right"
                    placeholder="your@email.com"
                    placeholderTextColor={Colors.textMuted}
                  />
                  <Pressable onPress={handleReset} disabled={authLoading} style={styles.loginBtn}>
                    {authLoading ? (
                      <ActivityIndicator size="small" color={Colors.textOnPrimary} />
                    ) : (
                      <Text style={styles.loginBtnTxt}>إرسال رابط الاستعادة</Text>
                    )}
                  </Pressable>
                  <Pressable onPress={() => setShowReset(false)} style={styles.backRow}>
                    <Text style={styles.forgotTxt}>رجوع</Text>
                  </Pressable>
                </>
              )}
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Public Gallery ──────────────────────────────────────────────────────
export default function PublicGalleryScreen() {
  const { publicArtworks, isReady, isOnline, isSyncing, syncPublicGallery } = usePublicGallery();
  const router = useRouter();

  // Admin modal
  const [showAdminModal, setShowAdminModal] = useState(false);

  // Cold-start sync — if no cache and not ready yet
  const coldStartDone = useRef(false);
  useEffect(() => {
    if (coldStartDone.current) return;
    coldStartDone.current = true;
    if (isReady && publicArtworks.length > 0) return;
    syncPublicGallery().catch(() => {});
  }, [isReady, publicArtworks.length, syncPublicGallery]);

  // Search / filter
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('الكل');

  // Manual refresh
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

  // Track "new" artwork IDs for badge
  const knownIdsRef = useRef<Set<string>>(new Set());
  const [newArtworkIds, setNewArtworkIds] = useState<Set<string>>(new Set());
  const initialisedRef = useRef(false);

  useEffect(() => {
    if (!initialisedRef.current && publicArtworks.length > 0) {
      initialisedRef.current = true;
      knownIdsRef.current = new Set(publicArtworks.map(a => a.id));
      return;
    }
    if (!initialisedRef.current) return;
    const addedIds = new Set<string>();
    publicArtworks.forEach(a => {
      if (!knownIdsRef.current.has(a.id)) addedIds.add(a.id);
    });
    knownIdsRef.current = new Set(publicArtworks.map(a => a.id));
    if (addedIds.size > 0) {
      setNewArtworkIds(addedIds);
      setTimeout(() => setNewArtworkIds(new Set()), 10_000);
    }
  }, [publicArtworks]);

  // Manual refresh handler
  const prevCountRef = useRef(publicArtworks.length);
  const handleRefresh = useCallback(async () => {
    if (refreshStatus === 'refreshing') return;
    setRefreshStatus('refreshing');
    prevCountRef.current = publicArtworks.length;
    try {
      await syncPublicGallery();
      await new Promise(res => setTimeout(res, 300));
      // Compare via knownIds already updated by the useEffect above
      setRefreshStatus('done');
      showToast();
    } catch {
      setRefreshStatus('idle');
    }
  }, [refreshStatus, syncPublicGallery, publicArtworks.length]);

  // Category labels derived from actual artworks
  const ALL_LABEL = 'الكل';
  const categoryLabels = useMemo(() => {
    const cats = new Set(publicArtworks.map(a => a.category).filter(Boolean));
    return [ALL_LABEL, ...Array.from(cats)];
  }, [publicArtworks]);

  // Filtered list
  const filtered = useMemo(() => {
    return publicArtworks.filter(a => {
      const matchSearch = !search
        || a.title.includes(search)
        || a.description?.includes(search)
        || a.category?.includes(search);
      const matchCat = catFilter === ALL_LABEL || a.category === catFilter;
      return matchSearch && matchCat;
    });
  }, [publicArtworks, search, catFilter]);

  const showingLoader = isSyncing && !isReady && publicArtworks.length === 0;

  if (showingLoader) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.loadingLogoCircle}>
          <MaterialIcons name="palette" size={40} color={Colors.primary} />
        </View>
        <Text style={styles.loadingBrand}>سيد عزت</Text>
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 24 }} />
        <Text style={styles.loadingText}>جاري تحميل المعرض...</Text>
      </View>
    );
  }

  const toastMessage =
    refreshStatus === 'new' ? 'تم إضافة أعمال جديدة ✦' :
    refreshStatus === 'done' ? 'تم تحديث المعرض' : '';

  const activeSyncing = isSyncing || refreshStatus === 'refreshing';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        {/* Small Admin Button — RTL: left side */}
        <Pressable
          onPress={() => setShowAdminModal(true)}
          style={({ pressed }) => [styles.adminBtn, pressed && { opacity: 0.7 }]}
          hitSlop={8}
          accessibilityLabel="دخول المشرف"
        >
          <MaterialIcons name="lock" size={15} color={Colors.textMuted} />
        </Pressable>

        <View style={styles.titleBlock}>
          <Text style={styles.title}>سيد عزت</Text>
          <Text style={styles.subtitle}>معرض الأعمال الفنية</Text>
        </View>

        <Pressable
          onPress={handleRefresh}
          disabled={activeSyncing}
          style={({ pressed }) => [
            styles.refreshBtn,
            pressed && { opacity: 0.8 },
            activeSyncing && styles.refreshBtnActive,
          ]}
          accessibilityLabel="تحديث الأعمال"
        >
          {activeSyncing ? (
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

      {/* Status bars */}
      {!isOnline ? (
        <View style={styles.offlineBar}>
          <MaterialIcons name="wifi-off" size={14} color="#fff" />
          <Text style={styles.offlineText}>لا يوجد اتصال — يتم عرض الأعمال المحفوظة</Text>
        </View>
      ) : activeSyncing ? (
        <View style={styles.statusBar}>
          <ActivityIndicator size="small" color={Colors.primary} style={{ marginLeft: 6 }} />
          <Text style={styles.statusBarText}>جاري تحديث المعرض...</Text>
        </View>
      ) : isReady ? (
        <View style={styles.liveBar}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>مزامنة فورية نشطة</Text>
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
            {activeSyncing ? (
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
              {item.mainImage ? (
                <Image
                  source={{ uri: item.mainImage }}
                  style={styles.img}
                  contentFit="cover"
                  transition={200}
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

      {/* Admin Login Modal */}
      <AdminLoginModal
        visible={showAdminModal}
        onClose={() => setShowAdminModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1, backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  loadingLogoCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.primary + '50',
    ...Shadow.gold,
  },
  loadingBrand: {
    fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold,
    color: Colors.primary, letterSpacing: 1, marginTop: 12,
  },
  loadingText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },

  safe: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  adminBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', opacity: 0.7,
  },
  titleBlock: { alignItems: 'center', flex: 1 },
  title: {
    fontSize: isTablet ? FontSize.xxl : FontSize.xl,
    fontWeight: FontWeight.extrabold, color: Colors.primary, letterSpacing: 0.5,
  },
  subtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 1 },
  refreshBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primarySurface,
    borderWidth: 1, borderColor: Colors.primary + '50',
    alignItems: 'center', justifyContent: 'center',
  },
  refreshBtnActive: { backgroundColor: Colors.surfaceElevated, borderColor: Colors.border },

  offlineBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, backgroundColor: '#c0392b', paddingVertical: 8,
  },
  offlineText: { fontSize: FontSize.xs, color: '#fff', fontWeight: FontWeight.semibold },
  statusBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primarySurface, paddingVertical: 7, gap: 8,
    borderBottomWidth: 1, borderBottomColor: Colors.primary + '30',
  },
  statusBarText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.semibold },
  liveBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 4, backgroundColor: Colors.successSurface,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.success },
  liveText: { fontSize: 10, color: Colors.success, fontWeight: FontWeight.semibold },
  headerDivider: { height: 1, backgroundColor: Colors.border },

  searchRow: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceElevated, borderRadius: Radius.lg,
    paddingHorizontal: 14, borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: {
    flex: 1, paddingVertical: 10, fontSize: FontSize.base,
    color: Colors.textPrimary, marginLeft: 8,
  },

  catOuter: { height: 46 },
  catContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full,
    backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border,
  },
  catChipActive: { backgroundColor: Colors.primarySurface, borderColor: Colors.primary },
  catChipText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  catChipTextActive: { color: Colors.primary, fontWeight: FontWeight.bold },

  countRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 8, paddingTop: 4,
  },
  countText: { fontSize: FontSize.xs, color: Colors.textMuted },
  offlineBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.surfaceElevated, borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: Colors.border,
  },
  offlineBadgeText: { fontSize: 10, color: Colors.textMuted },

  grid: { paddingHorizontal: CARD_GAP, paddingBottom: 32 },
  columnWrapper: { gap: CARD_GAP, marginBottom: CARD_GAP },
  card: {
    width: CARD_W, backgroundColor: Colors.card, borderRadius: Radius.lg,
    overflow: 'hidden', borderWidth: 1, borderColor: Colors.border, ...Shadow.sm,
  },
  cardPressed: { opacity: 0.88, transform: [{ scale: 0.97 }] },
  imgContainer: {
    width: '100%', height: CARD_W * 1.15,
    backgroundColor: Colors.surfaceElevated, position: 'relative',
  },
  img: { width: '100%', height: '100%' },
  imgPlaceholder: {
    flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primarySurface,
  },
  catBadge: {
    position: 'absolute', bottom: 6, right: 6,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 3, maxWidth: CARD_W - 16,
  },
  catBadgeText: { fontSize: 9, color: '#fff', fontWeight: FontWeight.semibold },
  newBadge: {
    position: 'absolute', top: 7, left: 7, backgroundColor: Colors.success,
    borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: '#fff',
  },
  newBadgeText: { fontSize: 9, color: '#fff', fontWeight: FontWeight.extrabold, letterSpacing: 0.5 },
  cardBody: { padding: 10, paddingTop: 8 },
  cardTitle: {
    fontSize: isTablet ? FontSize.base : FontSize.sm, fontWeight: FontWeight.bold,
    color: Colors.textPrimary, textAlign: 'right', lineHeight: 20,
  },
  cardYear: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right', marginTop: 2 },

  empty: { alignItems: 'center', paddingVertical: 80, gap: 8 },
  emptyTitle: {
    fontSize: FontSize.xl, fontWeight: FontWeight.bold,
    color: Colors.textPrimary, marginTop: 8, textAlign: 'center',
  },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16,
    backgroundColor: Colors.primarySurface, borderRadius: Radius.full,
    paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1, borderColor: Colors.primary,
  },
  retryBtnText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },

  toast: {
    position: 'absolute', bottom: 24, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.card, borderRadius: Radius.full,
    paddingHorizontal: 20, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.primary + '50', ...Shadow.md,
  },
  toastNew: { borderColor: Colors.success + '70', backgroundColor: Colors.successSurface },
  toastText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.primary },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl,
    paddingBottom: 40, borderWidth: 1, borderColor: Colors.border, borderBottomWidth: 0,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border, alignSelf: 'center', marginTop: 12, marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  modalCloseBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  modalBody: { padding: 20, gap: 12 },
  emailHint: {
    fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right',
    backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md,
    padding: 10, borderWidth: 1, borderColor: Colors.border,
  },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.errorSurface, borderRadius: Radius.md,
    padding: 10, borderWidth: 1, borderColor: Colors.error + '40',
  },
  errorTxt: { flex: 1, fontSize: FontSize.xs, color: Colors.error, textAlign: 'right' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  inputIcon: { paddingHorizontal: 12 },
  input: {
    flex: 1, paddingVertical: 14, paddingHorizontal: 8,
    fontSize: FontSize.base, color: Colors.textPrimary,
  },
  forgotRow: { alignItems: 'flex-end' },
  forgotTxt: { fontSize: FontSize.xs, color: Colors.primary },
  backRow: { alignItems: 'center', marginTop: 4 },
  loginBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 14,
    ...Shadow.gold,
  },
  loginBtnDisabled: { opacity: 0.5 },
  loginBtnTxt: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textOnPrimary },
  resetLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'right' },
  resetInput: {
    backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md,
    padding: 14, fontSize: FontSize.base, color: Colors.textPrimary,
    borderWidth: 1, borderColor: Colors.border,
  },
  resetSentBox: { alignItems: 'center', gap: 14, paddingVertical: 20 },
  resetSentTxt: { fontSize: FontSize.base, color: Colors.textPrimary, textAlign: 'center' },
  doneBtn: {
    backgroundColor: Colors.primarySurface, borderRadius: Radius.md,
    paddingVertical: 10, paddingHorizontal: 32,
    borderWidth: 1, borderColor: Colors.primary,
  },
  doneBtnTxt: { color: Colors.primary, fontWeight: FontWeight.bold },
});
