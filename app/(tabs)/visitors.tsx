// Powered by OnSpace.AI — Admin Visitors Screen
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, TextInput,
  Modal, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { useVisitor, Visitor, ArtworkViewRecord } from '@/contexts/VisitorContext';
import { isTablet, pagePadding } from '@/constants/responsive';

type FilterKey = 'all' | 'today' | 'week' | 'month';
type SortKey = 'recent' | 'active' | 'views';

function isSameDay(dateStr: string, ref: Date) {
  const d = new Date(dateStr);
  return d.getFullYear() === ref.getFullYear()
    && d.getMonth() === ref.getMonth()
    && d.getDate() === ref.getDate();
}
function isThisWeek(dateStr: string, now: Date) {
  const d = new Date(dateStr);
  const s = new Date(now); s.setDate(now.getDate() - now.getDay()); s.setHours(0, 0, 0, 0);
  return d >= s;
}
function isThisMonth(dateStr: string, now: Date) {
  const d = new Date(dateStr);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Visitor Detail Modal ─────────────────────────────────────────────────────
function VisitorDetailModal({ visitor, visible, onClose }: {
  visitor: Visitor | null; visible: boolean; onClose: () => void;
}) {
  if (!visitor) return null;
  const sortedViews = [...(visitor.artworkViews || [])].sort((a, b) => b.viewCount - a.viewCount);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={dm.overlay}>
        <View style={dm.container}>
          <View style={dm.header}>
            <Pressable onPress={onClose} style={dm.closeBtn}>
              <MaterialIcons name="close" size={20} color={Colors.textSecondary} />
            </Pressable>
            <Text style={dm.headerTitle}>سجل الزائر</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={dm.content}>
            {/* Avatar */}
            <View style={dm.avatarSection}>
              <View style={dm.avatar}>
                <Text style={dm.avatarText}>{visitor.name?.[0] || 'ز'}</Text>
              </View>
              <Text style={dm.visitorName}>{visitor.name}</Text>
              <View style={dm.phoneRow}>
                <MaterialIcons name="phone" size={14} color={Colors.textMuted} />
                <Text style={dm.phoneText}>{visitor.phone}</Text>
              </View>
            </View>

            {/* Stats Grid */}
            <View style={dm.statsGrid}>
              <View style={dm.statBox}>
                <Text style={dm.statVal}>{visitor.totalVisits}</Text>
                <Text style={dm.statLbl}>عدد الزيارات</Text>
              </View>
              <View style={dm.statBox}>
                <Text style={dm.statVal}>{visitor.totalArtworkViews || 0}</Text>
                <Text style={dm.statLbl}>إجمالي المشاهدات</Text>
              </View>
              <View style={dm.statBox}>
                <Text style={dm.statVal}>{(visitor.artworkViews || []).length}</Text>
                <Text style={dm.statLbl}>أعمال مختلفة</Text>
              </View>
            </View>

            {/* Dates */}
            <View style={dm.section}>
              <Text style={dm.sectionTitle}>تواريخ الزيارة</Text>
              <View style={dm.infoRow}>
                <Text style={dm.infoVal}>{formatDate(visitor.firstVisitDate)}</Text>
                <Text style={dm.infoLbl}>أول زيارة</Text>
              </View>
              <View style={dm.infoRow}>
                <Text style={dm.infoVal}>{formatDate(visitor.lastVisitDate)}</Text>
                <Text style={dm.infoLbl}>آخر زيارة</Text>
              </View>
              {visitor.lastArtworkViewed ? (
                <View style={dm.infoRow}>
                  <Text style={[dm.infoVal, { color: Colors.primary }]}>{visitor.lastArtworkViewed}</Text>
                  <Text style={dm.infoLbl}>آخر عمل مشاهَد</Text>
                </View>
              ) : null}
            </View>

            {/* Artwork Views */}
            {sortedViews.length > 0 ? (
              <View style={dm.section}>
                <Text style={dm.sectionTitle}>الأعمال المشاهَدة ({sortedViews.length})</Text>
                {sortedViews.map((av: ArtworkViewRecord, i) => (
                  <View key={av.artworkId + i} style={dm.artworkRow}>
                    <View style={dm.artworkBadge}>
                      <Text style={dm.artworkBadgeText}>{av.viewCount}x</Text>
                    </View>
                    <View style={dm.artworkInfo}>
                      <Text style={dm.artworkName}>{av.artworkTitle}</Text>
                      <Text style={dm.artworkDate}>{formatDate(av.lastViewedAt)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={dm.emptyViews}>
                <MaterialIcons name="visibility-off" size={32} color={Colors.textMuted} />
                <Text style={dm.emptyViewsText}>لم يشاهد أعمالاً بعد</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const dm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  container: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, maxHeight: '92%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.base, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginBottom: Spacing.xl },
  avatar: { width: 68, height: 68, borderRadius: 34, backgroundColor: Colors.primarySurface, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.primary + '50', marginBottom: Spacing.md },
  avatarText: { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold, color: Colors.primary },
  visitorName: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: 4 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  phoneText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  statsGrid: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  statBox: { flex: 1, backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  statVal: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.primary },
  statLbl: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },
  section: { marginBottom: Spacing.xl },
  sectionTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'right', marginBottom: Spacing.md, borderRightWidth: 3, borderRightColor: Colors.primary, paddingRight: Spacing.sm },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoLbl: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  infoVal: { fontSize: FontSize.sm, color: Colors.textPrimary },
  artworkRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  artworkBadge: { backgroundColor: Colors.primarySurface, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: Colors.primary + '50' },
  artworkBadgeText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.bold },
  artworkInfo: { flex: 1, alignItems: 'flex-end' },
  artworkName: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.semibold },
  artworkDate: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  emptyViews: { alignItems: 'center', padding: Spacing.xl },
  emptyViewsText: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: Spacing.sm },
});

// ─── Visitor Card ─────────────────────────────────────────────────────────────
function VisitorCard({ visitor, onPress }: { visitor: Visitor; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [vc.card, pressed && { opacity: 0.88 }]}>
      <View style={vc.top}>
        <View style={vc.avatar}>
          <Text style={vc.avatarText}>{visitor.name?.[0] || 'ز'}</Text>
        </View>
        <View style={vc.info}>
          <Text style={vc.name} numberOfLines={1}>{visitor.name}</Text>
          <Text style={vc.phone}>{visitor.phone}</Text>
          <Text style={vc.date}>{formatDate(visitor.lastVisitDate)}</Text>
        </View>
        <View style={vc.badges}>
          <View style={vc.badge}>
            <Text style={vc.badgeVal}>{visitor.totalVisits}</Text>
            <Text style={vc.badgeLbl}>زيارة</Text>
          </View>
          <View style={[vc.badge, { backgroundColor: Colors.primarySurface, borderColor: Colors.primary + '40' }]}>
            <Text style={[vc.badgeVal, { color: Colors.primary }]}>{visitor.totalArtworkViews || 0}</Text>
            <Text style={vc.badgeLbl}>مشاهدة</Text>
          </View>
        </View>
      </View>
      {visitor.lastArtworkViewed ? (
        <View style={vc.lastArtwork}>
          <MaterialIcons name="visibility" size={12} color={Colors.textMuted} />
          <Text style={vc.lastArtworkText} numberOfLines={1}>{visitor.lastArtworkViewed}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const vc = StyleSheet.create({
  card: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.base, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  top: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.primarySurface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.primary + '50' },
  avatarText: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.primary },
  info: { flex: 1, alignItems: 'flex-end' },
  name: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  phone: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  date: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  badges: { flexDirection: 'row', gap: Spacing.xs },
  badge: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, paddingHorizontal: 10, paddingVertical: 4, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  badgeVal: { fontSize: FontSize.base, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  badgeLbl: { fontSize: 9, color: Colors.textMuted },
  lastArtwork: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  lastArtworkText: { fontSize: FontSize.xs, color: Colors.textMuted, flex: 1, textAlign: 'right' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function VisitorsScreen() {
  const { visitors, analytics, refreshVisitors } = useVisitor();
  const [search, setSearch] = useState('');
  const [filterKey, setFilterKey] = useState<FilterKey>('all');
  const [sortKey, setSortKey] = useState<SortKey>('recent');
  const [detailVisitor, setDetailVisitor] = useState<Visitor | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const now = new Date();

  const filtered = useMemo(() => {
    let result = visitors.filter(v => {
      const matchSearch = !search
        || v.name.includes(search)
        || v.phone.includes(search);
      const matchFilter =
        filterKey === 'all' ? true
        : filterKey === 'today' ? isSameDay(v.lastVisitDate, now)
        : filterKey === 'week' ? isThisWeek(v.lastVisitDate, now)
        : isThisMonth(v.lastVisitDate, now);
      return matchSearch && matchFilter;
    });

    switch (sortKey) {
      case 'recent': result = [...result].sort((a, b) => b.lastVisitDate.localeCompare(a.lastVisitDate)); break;
      case 'active': result = [...result].sort((a, b) => b.totalVisits - a.totalVisits); break;
      case 'views': result = [...result].sort((a, b) => (b.totalArtworkViews || 0) - (a.totalArtworkViews || 0)); break;
    }
    return result;
  }, [visitors, search, filterKey, sortKey]);

  async function handleRefresh() {
    setRefreshing(true);
    await refreshVisitors();
    setRefreshing(false);
  }

  const FILTERS: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'الكل' },
    { key: 'today', label: 'اليوم' },
    { key: 'week', label: 'هذا الأسبوع' },
    { key: 'month', label: 'هذا الشهر' },
  ];

  const SORTS: { key: SortKey; label: string }[] = [
    { key: 'recent', label: 'الأحدث' },
    { key: 'active', label: 'الأكثر نشاطاً' },
    { key: 'views', label: 'أعلى مشاهدات' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleRefresh} style={styles.refreshBtn} disabled={refreshing}>
          {refreshing
            ? <ActivityIndicator size="small" color={Colors.primary} />
            : <MaterialIcons name="refresh" size={20} color={Colors.textSecondary} />}
        </Pressable>
        <Text style={styles.title}>الزوار</Text>
      </View>

      {/* Analytics Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.analyticsRow}
      >
        <View style={[styles.anaCard, { borderColor: Colors.primary + '40' }]}>
          <Text style={[styles.anaVal, { color: Colors.primary }]}>{analytics.totalVisitors}</Text>
          <Text style={styles.anaLbl}>إجمالي الزوار</Text>
        </View>
        <View style={styles.anaCard}>
          <Text style={styles.anaVal}>{analytics.visitorsToday}</Text>
          <Text style={styles.anaLbl}>اليوم</Text>
        </View>
        <View style={styles.anaCard}>
          <Text style={styles.anaVal}>{analytics.visitorsThisWeek}</Text>
          <Text style={styles.anaLbl}>هذا الأسبوع</Text>
        </View>
        <View style={styles.anaCard}>
          <Text style={styles.anaVal}>{analytics.visitorsThisMonth}</Text>
          <Text style={styles.anaLbl}>هذا الشهر</Text>
        </View>
        <View style={[styles.anaCard, { borderColor: Colors.success + '40' }]}>
          <Text style={[styles.anaVal, { color: Colors.success }]}>{analytics.returningVisitors}</Text>
          <Text style={styles.anaLbl}>زوار عائدون</Text>
        </View>
        <View style={[styles.anaCard, { borderColor: Colors.info + '40' }]}>
          <Text style={[styles.anaVal, { color: Colors.info }]}>{analytics.totalArtworkViews}</Text>
          <Text style={styles.anaLbl}>إجمالي المشاهدات</Text>
        </View>
        <View style={styles.anaCard}>
          <Text style={styles.anaVal}>{analytics.avgArtworksPerVisitor}</Text>
          <Text style={styles.anaLbl}>متوسط/زائر</Text>
        </View>
      </ScrollView>

      {/* Most / Least Viewed */}
      {(analytics.mostViewedArtwork || analytics.leastViewedArtwork) ? (
        <View style={styles.topArtworksRow}>
          {analytics.mostViewedArtwork ? (
            <View style={[styles.topArtworkCard, { borderColor: Colors.primary + '40' }]}>
              <View style={styles.topArtworkIcon}><MaterialIcons name="trending-up" size={14} color={Colors.primary} /></View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={styles.topArtworkTitle} numberOfLines={1}>{analytics.mostViewedArtwork.artworkTitle}</Text>
                <Text style={styles.topArtworkSub}>{analytics.mostViewedArtwork.totalViews} مشاهدة · الأكثر مشاهدةً</Text>
              </View>
            </View>
          ) : null}
          {analytics.leastViewedArtwork && analytics.leastViewedArtwork.artworkId !== analytics.mostViewedArtwork?.artworkId ? (
            <View style={[styles.topArtworkCard, { borderColor: Colors.textMuted + '40' }]}>
              <View style={[styles.topArtworkIcon, { backgroundColor: Colors.surfaceElevated }]}><MaterialIcons name="trending-down" size={14} color={Colors.textMuted} /></View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={styles.topArtworkTitle} numberOfLines={1}>{analytics.leastViewedArtwork.artworkTitle}</Text>
                <Text style={styles.topArtworkSub}>{analytics.leastViewedArtwork.totalViews} مشاهدة · الأقل مشاهدةً</Text>
              </View>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <TextInput
            value={search} onChangeText={setSearch}
            placeholder="ابحث باسم الزائر أو رقم الهاتف..."
            placeholderTextColor={Colors.textMuted}
            style={styles.searchInput} textAlign="right"
          />
          {search
            ? <Pressable onPress={() => setSearch('')} hitSlop={8}><MaterialIcons name="close" size={16} color={Colors.textMuted} /></Pressable>
            : <MaterialIcons name="search" size={18} color={Colors.textMuted} />}
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterOuter}>
        <FlatList
          data={FILTERS} horizontal keyExtractor={f => f.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setFilterKey(item.key)}
              style={[styles.chip, filterKey === item.key && styles.chipActive]}
            >
              <Text style={[styles.chipText, filterKey === item.key && styles.chipTextActive]}>{item.label}</Text>
            </Pressable>
          )}
        />
      </View>

      {/* Sort Row */}
      <View style={styles.sortOuter}>
        <FlatList
          data={SORTS} horizontal keyExtractor={s => s.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setSortKey(item.key)}
              style={[styles.sortChip, sortKey === item.key && styles.sortChipActive]}
            >
              {sortKey === item.key ? <MaterialIcons name="check" size={11} color={Colors.primary} /> : null}
              <Text style={[styles.sortChipText, sortKey === item.key && styles.sortChipTextActive]}>{item.label}</Text>
            </Pressable>
          )}
        />
      </View>

      {/* Count */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>{filtered.length} زائر</Text>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={v => v.id}
        numColumns={isTablet ? 2 : 1}
        key={isTablet ? 'tablet' : 'phone'}
        columnWrapperStyle={isTablet ? { gap: Spacing.md } : undefined}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="person-off" size={56} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>لا يوجد زوار</Text>
            <Text style={styles.emptySub}>
              {search ? 'لا توجد نتائج تطابق البحث' : 'سيظهر الزوار هنا بعد التسجيل'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={isTablet ? { flex: 1 } : undefined}>
            <VisitorCard visitor={item} onPress={() => setDetailVisitor(item)} />
          </View>
        )}
      />

      <VisitorDetailModal
        visitor={detailVisitor}
        visible={detailVisitor !== null}
        onClose={() => setDetailVisitor(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: pagePadding, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { fontSize: isTablet ? FontSize.xxl : FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  refreshBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },

  analyticsRow: { paddingHorizontal: pagePadding, paddingVertical: Spacing.md, gap: Spacing.sm },
  anaCard: { backgroundColor: Colors.card, borderRadius: Radius.md, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, minWidth: 70 },
  anaVal: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  anaLbl: { fontSize: 10, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },

  topArtworksRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: pagePadding, marginBottom: Spacing.sm },
  topArtworkCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.sm, borderWidth: 1 },
  topArtworkIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.primarySurface, alignItems: 'center', justifyContent: 'center' },
  topArtworkTitle: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  topArtworkSub: { fontSize: 10, color: Colors.textMuted, marginTop: 1 },

  searchWrap: { paddingHorizontal: pagePadding, paddingBottom: Spacing.xs },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: FontSize.base, color: Colors.textPrimary, marginLeft: Spacing.sm },

  filterOuter: { height: 42 },
  filterContent: { paddingHorizontal: pagePadding, gap: Spacing.sm, alignItems: 'center' },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primarySurface, borderColor: Colors.primary },
  chipText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  chipTextActive: { color: Colors.primary, fontWeight: FontWeight.bold },

  sortOuter: { height: 38 },
  sortChip: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.full, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border },
  sortChipActive: { borderColor: Colors.primary },
  sortChipText: { fontSize: FontSize.xs, color: Colors.textMuted },
  sortChipTextActive: { color: Colors.primary, fontWeight: FontWeight.semibold },

  countRow: { paddingHorizontal: pagePadding, paddingBottom: 4, paddingTop: 2 },
  countText: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right' },

  list: { padding: pagePadding, paddingTop: Spacing.sm },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: Spacing.base },
  emptySub: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 6, textAlign: 'center', paddingHorizontal: 20 },
});
