// Powered by OnSpace.AI — Admin Visitor Management
import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, TextInput,
  Modal, ScrollView, ActivityIndicator, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { useVisitor, Visitor, ArtworkViewRecord, HourlyDistribution } from '@/contexts/VisitorContext';
import { isTablet, pagePadding } from '@/constants/responsive';

type FilterKey = 'all' | 'today' | 'week' | 'month' | 'blocked';
type SortKey = 'recent' | 'active' | 'views' | 'blocked';

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
function shortDate(dateStr: string) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Visitor Detail Modal ─────────────────────────────────────────────────────
function VisitorDetailModal({
  visitor, visible, onClose, onToggleAccess, onDelete, onClearActivity,
}: {
  visitor: Visitor | null;
  visible: boolean;
  onClose: () => void;
  onToggleAccess: (enabled: boolean) => void;
  onDelete: () => void;
  onClearActivity: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  if (!visitor) return null;
  const sortedViews = [...(visitor.artworkViews || [])].sort((a, b) => b.viewCount - a.viewCount);
  const isBlocked = visitor.accessEnabled === false;

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
            {/* Avatar + Status */}
            <View style={dm.avatarSection}>
              <View style={[dm.avatar, isBlocked && dm.avatarBlocked]}>
                <Text style={dm.avatarText}>{visitor.name?.[0] || 'ز'}</Text>
              </View>
              <Text style={dm.visitorName}>{visitor.name}</Text>
              <View style={dm.phoneRow}>
                <MaterialIcons name="phone" size={14} color={Colors.textMuted} />
                <Text style={dm.phoneText}>{visitor.phone}</Text>
              </View>
              <View style={[dm.statusPill, isBlocked ? dm.statusBlocked : dm.statusActive]}>
                <MaterialIcons
                  name={isBlocked ? 'block' : 'check-circle'}
                  size={13}
                  color={isBlocked ? Colors.error : Colors.success}
                />
                <Text style={[dm.statusText, { color: isBlocked ? Colors.error : Colors.success }]}>
                  {isBlocked ? 'محظور' : 'نشط'}
                </Text>
              </View>
              <Text style={dm.visitorId}>ID: {visitor.id}</Text>
            </View>

            {/* Stats Grid */}
            <View style={dm.statsGrid}>
              <View style={dm.statBox}>
                <Text style={dm.statVal}>{visitor.totalVisits}</Text>
                <Text style={dm.statLbl}>الزيارات</Text>
              </View>
              <View style={dm.statBox}>
                <Text style={dm.statVal}>{visitor.totalArtworkViews || 0}</Text>
                <Text style={dm.statLbl}>المشاهدات</Text>
              </View>
              <View style={dm.statBox}>
                <Text style={dm.statVal}>{sortedViews.length}</Text>
                <Text style={dm.statLbl}>أعمال مختلفة</Text>
              </View>
            </View>

            {/* Access Control */}
            <View style={dm.section}>
              <Text style={dm.sectionTitle}>التحكم في الوصول</Text>
              <View style={[dm.accessRow, isBlocked ? dm.accessRowBlocked : dm.accessRowActive]}>
                <Switch
                  value={!isBlocked}
                  onValueChange={(val) => onToggleAccess(val)}
                  trackColor={{ false: Colors.error + '60', true: Colors.success + '60' }}
                  thumbColor={isBlocked ? Colors.error : Colors.success}
                />
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={[dm.accessLabel, { color: isBlocked ? Colors.error : Colors.success }]}>
                    {isBlocked ? 'الوصول محظور' : 'الوصول مسموح'}
                  </Text>
                  <Text style={dm.accessSub}>
                    {isBlocked
                      ? 'لن يتمكن هذا الزائر من دخول المعرض'
                      : 'يمكن لهذا الزائر دخول المعرض بحرية'}
                  </Text>
                </View>
                <MaterialIcons
                  name={isBlocked ? 'lock' : 'lock-open'}
                  size={22}
                  color={isBlocked ? Colors.error : Colors.success}
                />
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
              <View style={dm.infoRow}>
                <Text style={dm.infoVal}>{formatDate(visitor.createdAt)}</Text>
                <Text style={dm.infoLbl}>تاريخ التسجيل</Text>
              </View>
              {visitor.lastArtworkViewed ? (
                <View style={dm.infoRow}>
                  <Text style={[dm.infoVal, { color: Colors.primary }]} numberOfLines={1}>{visitor.lastArtworkViewed}</Text>
                  <Text style={dm.infoLbl}>آخر عمل مشاهَد</Text>
                </View>
              ) : null}
            </View>

            {/* Artwork Views */}
            {sortedViews.length > 0 ? (
              <View style={dm.section}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
                  <Pressable
                    onPress={() => setConfirmClear(true)}
                    style={dm.clearActivityBtn}
                  >
                    <MaterialIcons name="clear-all" size={14} color={Colors.warning} />
                    <Text style={dm.clearActivityText}>مسح النشاط</Text>
                  </Pressable>
                  <Text style={dm.sectionTitle}>الأعمال المشاهَدة ({sortedViews.length})</Text>
                </View>
                {sortedViews.map((av: ArtworkViewRecord, i) => (
                  <View key={av.artworkId + i} style={dm.artworkRow}>
                    <View style={dm.artworkBadge}>
                      <Text style={dm.artworkBadgeText}>{av.viewCount}×</Text>
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

            {/* Delete Section */}
            <View style={dm.dangerSection}>
              <Pressable
                onPress={() => setConfirmDelete(true)}
                style={dm.deleteBtn}
              >
                <MaterialIcons name="delete-forever" size={18} color={Colors.error} />
                <Text style={dm.deleteBtnText}>حذف سجل الزائر نهائياً</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Confirm Delete Dialog */}
      <Modal visible={confirmDelete} transparent animationType="fade" onRequestClose={() => setConfirmDelete(false)}>
        <View style={dm.confirmOverlay}>
          <View style={dm.confirmBox}>
            <MaterialIcons name="warning" size={36} color={Colors.error} />
            <Text style={dm.confirmTitle}>حذف سجل الزائر؟</Text>
            <Text style={dm.confirmMsg}>
              سيتم حذف جميع بيانات الزائر <Text style={{ fontWeight: '700', color: Colors.textPrimary }}>{visitor.name}</Text> نهائياً.
              {'\n'}لن تتأثر الأعمال الفنية أو بيانات التطبيق الأخرى.
            </Text>
            <View style={dm.confirmBtns}>
              <Pressable onPress={() => setConfirmDelete(false)} style={dm.confirmCancelBtn}>
                <Text style={dm.confirmCancelText}>إلغاء</Text>
              </Pressable>
              <Pressable onPress={() => { setConfirmDelete(false); onDelete(); }} style={dm.confirmDeleteBtn}>
                <Text style={dm.confirmDeleteText}>حذف نهائياً</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirm Clear Activity Dialog */}
      <Modal visible={confirmClear} transparent animationType="fade" onRequestClose={() => setConfirmClear(false)}>
        <View style={dm.confirmOverlay}>
          <View style={dm.confirmBox}>
            <MaterialIcons name="clear-all" size={36} color={Colors.warning} />
            <Text style={dm.confirmTitle}>مسح سجل النشاط؟</Text>
            <Text style={dm.confirmMsg}>
              سيتم مسح تاريخ مشاهدة الأعمال لـ <Text style={{ fontWeight: '700', color: Colors.textPrimary }}>{visitor.name}</Text>.
              {'\n'}سيبقى سجل الزائر وبياناته الأساسية.
            </Text>
            <View style={dm.confirmBtns}>
              <Pressable onPress={() => setConfirmClear(false)} style={dm.confirmCancelBtn}>
                <Text style={dm.confirmCancelText}>إلغاء</Text>
              </Pressable>
              <Pressable onPress={() => { setConfirmClear(false); onClearActivity(); }} style={[dm.confirmDeleteBtn, { backgroundColor: Colors.warningSurface, borderColor: Colors.warning + '50' }]}>
                <Text style={[dm.confirmDeleteText, { color: Colors.warning }]}>مسح النشاط</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const dm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  container: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, maxHeight: '94%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.base, paddingBottom: 50 },
  avatarSection: { alignItems: 'center', marginBottom: Spacing.xl },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primarySurface, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.primary + '50', marginBottom: Spacing.md },
  avatarBlocked: { backgroundColor: Colors.errorSurface, borderColor: Colors.error + '50' },
  avatarText: { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold, color: Colors.primary },
  visitorName: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: 4 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.sm },
  phoneText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 5, borderWidth: 1, marginBottom: Spacing.xs },
  statusActive: { backgroundColor: Colors.successSurface, borderColor: Colors.success + '50' },
  statusBlocked: { backgroundColor: Colors.errorSurface, borderColor: Colors.error + '50' },
  statusText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  visitorId: { fontSize: 10, color: Colors.textMuted, marginTop: 4 },
  statsGrid: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  statBox: { flex: 1, backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  statVal: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.primary },
  statLbl: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },
  section: { marginBottom: Spacing.xl },
  sectionTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'right', borderRightWidth: 3, borderRightColor: Colors.primary, paddingRight: Spacing.sm },
  accessRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderRadius: Radius.lg, padding: Spacing.base, borderWidth: 1, marginTop: Spacing.md },
  accessRowActive: { backgroundColor: Colors.successSurface, borderColor: Colors.success + '40' },
  accessRowBlocked: { backgroundColor: Colors.errorSurface, borderColor: Colors.error + '40' },
  accessLabel: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  accessSub: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2, textAlign: 'right' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoLbl: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  infoVal: { fontSize: FontSize.sm, color: Colors.textPrimary, flex: 1, textAlign: 'left', marginLeft: Spacing.sm },
  artworkRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  artworkBadge: { backgroundColor: Colors.primarySurface, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: Colors.primary + '50', minWidth: 44, alignItems: 'center' },
  artworkBadgeText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.bold },
  artworkInfo: { flex: 1, alignItems: 'flex-end' },
  artworkName: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.semibold, textAlign: 'right' },
  artworkDate: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  emptyViews: { alignItems: 'center', padding: Spacing.xl },
  emptyViewsText: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: Spacing.sm },
  clearActivityBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.warningSurface, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 6, borderWidth: 1, borderColor: Colors.warning + '50' },
  clearActivityText: { fontSize: FontSize.xs, color: Colors.warning, fontWeight: FontWeight.semibold },
  dangerSection: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.xl, marginTop: Spacing.sm },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.errorSurface, borderRadius: Radius.lg, padding: Spacing.base, borderWidth: 1, borderColor: Colors.error + '40' },
  deleteBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.error },
  confirmOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  confirmBox: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl, alignItems: 'center', width: '100%', maxWidth: 360, ...Shadow.md },
  confirmTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: Spacing.md, marginBottom: Spacing.sm },
  confirmMsg: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.xl },
  confirmBtns: { flexDirection: 'row', gap: Spacing.md, width: '100%' },
  confirmCancelBtn: { flex: 1, backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  confirmCancelText: { fontSize: FontSize.base, color: Colors.textSecondary, fontWeight: FontWeight.semibold },
  confirmDeleteBtn: { flex: 2, backgroundColor: Colors.errorSurface, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.error + '50' },
  confirmDeleteText: { fontSize: FontSize.base, color: Colors.error, fontWeight: FontWeight.bold },
});

// ─── Visitor Card ─────────────────────────────────────────────────────────────
function VisitorCard({
  visitor, onPress, onToggleAccess,
}: {
  visitor: Visitor;
  onPress: () => void;
  onToggleAccess: (enabled: boolean) => void;
}) {
  const isBlocked = visitor.accessEnabled === false;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [vc.card, isBlocked && vc.cardBlocked, pressed && { opacity: 0.88 }]}>
      <View style={vc.top}>
        <View style={[vc.avatar, isBlocked && vc.avatarBlocked]}>
          <Text style={vc.avatarText}>{visitor.name?.[0] || 'ز'}</Text>
        </View>
        <View style={vc.info}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
            <Text style={vc.name} numberOfLines={1}>{visitor.name}</Text>
            {isBlocked ? (
              <View style={vc.blockedPill}>
                <MaterialIcons name="block" size={10} color={Colors.error} />
                <Text style={vc.blockedText}>محظور</Text>
              </View>
            ) : null}
          </View>
          <Text style={vc.phone}>{visitor.phone}</Text>
          <Text style={vc.date}>{shortDate(visitor.lastVisitDate)}</Text>
        </View>
        <View style={vc.right}>
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
          <Pressable
            onPress={(e) => { e.stopPropagation?.(); onToggleAccess(!isBlocked); }}
            style={[vc.toggleBtn, isBlocked ? vc.toggleBtnBlocked : vc.toggleBtnActive]}
            hitSlop={8}
          >
            <MaterialIcons
              name={isBlocked ? 'lock' : 'lock-open'}
              size={13}
              color={isBlocked ? Colors.error : Colors.success}
            />
            <Text style={[vc.toggleText, { color: isBlocked ? Colors.error : Colors.success }]}>
              {isBlocked ? 'محظور' : 'نشط'}
            </Text>
          </Pressable>
        </View>
      </View>
      {visitor.lastArtworkViewed ? (
        <View style={vc.lastArtwork}>
          <MaterialIcons name="visibility" size={11} color={Colors.textMuted} />
          <Text style={vc.lastArtworkText} numberOfLines={1}>{visitor.lastArtworkViewed}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const vc = StyleSheet.create({
  card: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.base, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  cardBlocked: { borderColor: Colors.error + '40', backgroundColor: Colors.errorSurface + '30' },
  top: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.primarySurface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.primary + '50' },
  avatarBlocked: { backgroundColor: Colors.errorSurface, borderColor: Colors.error + '50' },
  avatarText: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.primary },
  info: { flex: 1, alignItems: 'flex-end' },
  name: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  phone: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  date: { fontSize: 10, color: Colors.textMuted, marginTop: 1 },
  blockedPill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.errorSurface, borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: Colors.error + '40' },
  blockedText: { fontSize: 9, color: Colors.error, fontWeight: FontWeight.bold },
  right: { alignItems: 'flex-end', gap: Spacing.xs },
  badges: { flexDirection: 'row', gap: Spacing.xs },
  badge: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 3, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  badgeVal: { fontSize: FontSize.sm, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  badgeLbl: { fontSize: 9, color: Colors.textMuted },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1 },
  toggleBtnActive: { backgroundColor: Colors.successSurface, borderColor: Colors.success + '50' },
  toggleBtnBlocked: { backgroundColor: Colors.errorSurface, borderColor: Colors.error + '50' },
  toggleText: { fontSize: 10, fontWeight: FontWeight.bold },
  lastArtwork: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  lastArtworkText: { fontSize: FontSize.xs, color: Colors.textMuted, flex: 1, textAlign: 'right' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function VisitorsScreen() {
  const { visitors, analytics, refreshVisitors, updateVisitorAccess, deleteVisitor, clearVisitorActivity } = useVisitor();
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
        : filterKey === 'blocked' ? v.accessEnabled === false
        : filterKey === 'today' ? isSameDay(v.lastVisitDate, now)
        : filterKey === 'week' ? isThisWeek(v.lastVisitDate, now)
        : isThisMonth(v.lastVisitDate, now);
      return matchSearch && matchFilter;
    });

    switch (sortKey) {
      case 'recent': result = [...result].sort((a, b) => b.lastVisitDate.localeCompare(a.lastVisitDate)); break;
      case 'active': result = [...result].sort((a, b) => b.totalVisits - a.totalVisits); break;
      case 'views': result = [...result].sort((a, b) => (b.totalArtworkViews || 0) - (a.totalArtworkViews || 0)); break;
      case 'blocked': result = [...result].sort((a, b) => (a.accessEnabled === false ? -1 : 1) - (b.accessEnabled === false ? -1 : 1)); break;
    }
    return result;
  }, [visitors, search, filterKey, sortKey]);

  async function handleRefresh() {
    setRefreshing(true);
    await refreshVisitors();
    setRefreshing(false);
  }

  const handleToggleAccess = useCallback((visitorId: string, enabled: boolean) => {
    updateVisitorAccess(visitorId, enabled);
    setDetailVisitor(prev => prev?.id === visitorId ? { ...prev, accessEnabled: enabled } : prev);
  }, [updateVisitorAccess]);

  const handleDelete = useCallback((visitor: Visitor) => {
    deleteVisitor(visitor.id);
    setDetailVisitor(null);
  }, [deleteVisitor]);

  const handleClearActivity = useCallback((visitor: Visitor) => {
    clearVisitorActivity(visitor.id);
    setDetailVisitor(prev => prev?.id === visitor.id
      ? { ...prev, artworkViews: [], totalArtworkViews: 0, lastArtworkViewed: '' }
      : prev);
  }, [clearVisitorActivity]);

  const FILTERS: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'الكل' },
    { key: 'today', label: 'اليوم' },
    { key: 'week', label: 'هذا الأسبوع' },
    { key: 'month', label: 'هذا الشهر' },
    { key: 'blocked', label: 'المحظورون' },
  ];

  const SORTS: { key: SortKey; label: string }[] = [
    { key: 'recent', label: 'الأحدث' },
    { key: 'active', label: 'الأكثر نشاطاً' },
    { key: 'views', label: 'أعلى مشاهدات' },
    { key: 'blocked', label: 'المحظورون أولاً' },
  ];

  // ── All static content as ListHeaderComponent so the entire page scrolls ──
  const listHeader = (
    <View>
      {/* Analytics Strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.analyticsRow}
      >
        <View style={[styles.anaCard, { borderColor: Colors.primary + '40' }]}>
          <Text style={[styles.anaVal, { color: Colors.primary }]}>{analytics.totalVisitors}</Text>
          <Text style={styles.anaLbl}>الكل</Text>
        </View>
        <View style={styles.anaCard}>
          <Text style={styles.anaVal}>{analytics.visitorsToday}</Text>
          <Text style={styles.anaLbl}>اليوم</Text>
        </View>
        <View style={styles.anaCard}>
          <Text style={styles.anaVal}>{analytics.visitorsThisWeek}</Text>
          <Text style={styles.anaLbl}>الأسبوع</Text>
        </View>
        <View style={styles.anaCard}>
          <Text style={styles.anaVal}>{analytics.visitorsThisMonth}</Text>
          <Text style={styles.anaLbl}>الشهر</Text>
        </View>
        <View style={[styles.anaCard, { borderColor: Colors.success + '40' }]}>
          <Text style={[styles.anaVal, { color: Colors.success }]}>{analytics.returningVisitors}</Text>
          <Text style={styles.anaLbl}>عائدون</Text>
        </View>
        <View style={[styles.anaCard, { borderColor: Colors.info + '40' }]}>
          <Text style={[styles.anaVal, { color: Colors.info }]}>{analytics.totalArtworkViews}</Text>
          <Text style={styles.anaLbl}>المشاهدات</Text>
        </View>
        {(analytics as any).blockedVisitors > 0 ? (
          <View style={[styles.anaCard, { borderColor: Colors.error + '40' }]}>
            <Text style={[styles.anaVal, { color: Colors.error }]}>{(analytics as any).blockedVisitors}</Text>
            <Text style={styles.anaLbl}>محظور</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Detailed Stats */}
      <View style={styles.detailStatsRow}>
        <View style={styles.detailCard}>
          <View style={styles.detailCardHeader}>
            <MaterialIcons name="loop" size={14} color={Colors.primary} />
            <Text style={styles.detailCardLabel}>معدل العودة</Text>
          </View>
          <Text style={styles.detailCardVal}>{analytics.returnRate}%</Text>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${analytics.returnRate}%` as any, backgroundColor: Colors.primary }]} />
          </View>
        </View>
        <View style={styles.detailCard}>
          <View style={styles.detailCardHeader}>
            <MaterialIcons name="repeat" size={14} color={Colors.info} />
            <Text style={styles.detailCardLabel}>متوسط الزيارات</Text>
          </View>
          <Text style={[styles.detailCardVal, { color: Colors.info }]}>{analytics.avgVisitsPerVisitor}</Text>
          <Text style={styles.detailCardSub}>لكل زائر</Text>
        </View>
        <View style={styles.detailCard}>
          <View style={styles.detailCardHeader}>
            <MaterialIcons name="palette" size={14} color={Colors.success} />
            <Text style={styles.detailCardLabel}>متوسط المشاهدات</Text>
          </View>
          <Text style={[styles.detailCardVal, { color: Colors.success }]}>{analytics.avgArtworksPerVisitor}</Text>
          <Text style={styles.detailCardSub}>عمل / زائر</Text>
        </View>
      </View>

      {/* Today's Breakdown */}
      {analytics.visitorsToday > 0 ? (
        <View style={styles.todayRow}>
          <View style={[styles.todayBadge, { borderColor: Colors.success + '50', backgroundColor: Colors.successSurface }]}>
            <MaterialIcons name="fiber-new" size={13} color={Colors.success} />
            <Text style={[styles.todayBadgeText, { color: Colors.success }]}>{analytics.newVisitorsToday} جديد اليوم</Text>
          </View>
          <View style={[styles.todayBadge, { borderColor: Colors.info + '50', backgroundColor: Colors.info + '15' }]}>
            <MaterialIcons name="loop" size={13} color={Colors.info} />
            <Text style={[styles.todayBadgeText, { color: Colors.info }]}>{analytics.returningVisitorsToday} عائد اليوم</Text>
          </View>
          <View style={[styles.todayBadge, { borderColor: Colors.primary + '40', backgroundColor: Colors.primarySurface }]}>
            <MaterialIcons name="schedule" size={13} color={Colors.primary} />
            <Text style={[styles.todayBadgeText, { color: Colors.primary }]}>ذروة: {analytics.peakHourLabel}</Text>
          </View>
        </View>
      ) : null}

      {/* Hourly Distribution */}
      {analytics.totalVisitors > 0 ? (
        <View style={styles.hourlySection}>
          <Text style={styles.hourlySectionTitle}>توزيع أوقات الزيارة</Text>
          <View style={styles.hourlyBars}>
            {([
              { key: 'morning', label: 'صباح', icon: 'wb-sunny', color: '#F59E0B' },
              { key: 'afternoon', label: 'ظهر', icon: 'wb-cloudy', color: '#3B82F6' },
              { key: 'evening', label: 'مساء', icon: 'nights-stay', color: '#8B5CF6' },
              { key: 'night', label: 'ليل', icon: 'bedtime', color: '#1E293B' },
            ] as { key: keyof HourlyDistribution; label: string; icon: any; color: string }[]).map(({ key, label, icon, color }) => {
              const val = analytics.hourlyDistribution[key];
              const maxVal = Math.max(
                analytics.hourlyDistribution.morning,
                analytics.hourlyDistribution.afternoon,
                analytics.hourlyDistribution.evening,
                analytics.hourlyDistribution.night,
                1
              );
              const pct = Math.round((val / maxVal) * 100);
              return (
                <View key={key} style={styles.hourlyBarCol}>
                  <Text style={styles.hourlyBarVal}>{val}</Text>
                  <View style={styles.hourlyBarBg}>
                    <View style={[styles.hourlyBarFill, { height: `${pct}%` as any, backgroundColor: color }]} />
                  </View>
                  <MaterialIcons name={icon} size={13} color={color} />
                  <Text style={styles.hourlyBarLabel}>{label}</Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* Top 5 Artworks */}
      {analytics.topArtworks.length > 0 ? (
        <View style={styles.topSection}>
          <Text style={styles.topSectionTitle}>أكثر الأعمال مشاهدةً</Text>
          {analytics.topArtworks.map((aw, idx) => {
            const maxViews = analytics.topArtworks[0]?.totalViews || 1;
            const pct = Math.round((aw.totalViews / maxViews) * 100);
            const visitorPct = analytics.totalVisitors > 0
              ? Math.round((aw.uniqueVisitors / analytics.totalVisitors) * 100)
              : 0;
            return (
              <View key={aw.artworkId} style={styles.topArtworkRow}>
                <View style={[styles.topArtworkRank, idx === 0 && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}>
                  <Text style={[styles.topArtworkRankText, idx === 0 && { color: '#fff' }]}>#{idx + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.topArtworkMeta}>
                    <Text style={styles.topArtworkSub}>{aw.uniqueVisitors} زائر ({visitorPct}%)</Text>
                    <Text style={styles.topArtworkName} numberOfLines={1}>{aw.artworkTitle}</Text>
                  </View>
                  <View style={styles.topArtworkBarBg}>
                    <View style={[styles.topArtworkBarFill, { width: `${pct}%` as any }]} />
                  </View>
                </View>
                <View style={styles.topArtworkViewsBadge}>
                  <Text style={styles.topArtworkViews}>{aw.totalViews}</Text>
                  <Text style={styles.topArtworkViewsLbl}>مشاهدة</Text>
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="ابحث بالاسم أو رقم الهاتف..."
            placeholderTextColor={Colors.textMuted}
            style={styles.searchInput}
            textAlign="right"
          />
          {search
            ? <Pressable onPress={() => setSearch('')} hitSlop={8}><MaterialIcons name="close" size={16} color={Colors.textMuted} /></Pressable>
            : <MaterialIcons name="search" size={18} color={Colors.textMuted} />}
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterOuter}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
          {FILTERS.map(item => (
            <Pressable
              key={item.key}
              onPress={() => setFilterKey(item.key)}
              style={[
                styles.chip,
                filterKey === item.key && styles.chipActive,
                item.key === 'blocked' && filterKey === 'blocked' && styles.chipBlocked,
              ]}
            >
              {item.key === 'blocked'
                ? <MaterialIcons name="block" size={11} color={filterKey === 'blocked' ? Colors.error : Colors.textMuted} />
                : null}
              <Text style={[
                styles.chipText,
                filterKey === item.key && styles.chipTextActive,
                item.key === 'blocked' && filterKey === 'blocked' && { color: Colors.error },
              ]}>{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Sort Row */}
      <View style={styles.sortOuter}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
          {SORTS.map(item => (
            <Pressable
              key={item.key}
              onPress={() => setSortKey(item.key)}
              style={[styles.sortChip, sortKey === item.key && styles.sortChipActive]}
            >
              {sortKey === item.key ? <MaterialIcons name="check" size={11} color={Colors.primary} /> : null}
              <Text style={[styles.sortChipText, sortKey === item.key && styles.sortChipTextActive]}>{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Count */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>{filtered.length} زائر</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <Pressable onPress={handleRefresh} style={styles.refreshBtn} disabled={refreshing}>
          {refreshing
            ? <ActivityIndicator size="small" color={Colors.primary} />
            : <MaterialIcons name="refresh" size={20} color={Colors.textSecondary} />}
        </Pressable>
        <Text style={styles.title}>إدارة الزوار</Text>
      </View>

      {/* Scrollable list with all stats as header */}
      <FlatList
        data={filtered}
        keyExtractor={v => v.id}
        numColumns={isTablet ? 2 : 1}
        key={isTablet ? 'tablet' : 'phone'}
        columnWrapperStyle={isTablet ? { gap: Spacing.md } : undefined}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={listHeader}
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
            <VisitorCard
              visitor={item}
              onPress={() => setDetailVisitor(item)}
              onToggleAccess={(enabled) => handleToggleAccess(item.id, enabled)}
            />
          </View>
        )}
      />

      <VisitorDetailModal
        visitor={detailVisitor}
        visible={detailVisitor !== null}
        onClose={() => setDetailVisitor(null)}
        onToggleAccess={(enabled) => detailVisitor && handleToggleAccess(detailVisitor.id, enabled)}
        onDelete={() => detailVisitor && handleDelete(detailVisitor)}
        onClearActivity={() => detailVisitor && handleClearActivity(detailVisitor)}
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
  anaCard: { backgroundColor: Colors.card, borderRadius: Radius.md, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, minWidth: 64 },
  anaVal: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  anaLbl: { fontSize: 10, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },
  detailStatsRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: pagePadding, marginBottom: Spacing.sm },
  detailCard: { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  detailCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginBottom: 4 },
  detailCardLabel: { fontSize: 9, color: Colors.textMuted, fontWeight: FontWeight.medium },
  detailCardVal: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.primary, textAlign: 'right' },
  detailCardSub: { fontSize: 9, color: Colors.textMuted, textAlign: 'right', marginTop: 2 },
  progressBg: { height: 4, backgroundColor: Colors.border, borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  todayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, paddingHorizontal: pagePadding, marginBottom: Spacing.sm },
  todayBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  todayBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  hourlySection: { marginHorizontal: pagePadding, backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm },
  hourlySectionTitle: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'right', marginBottom: Spacing.md, borderRightWidth: 2, borderRightColor: Colors.primary, paddingRight: 8 },
  hourlyBars: { flexDirection: 'row', justifyContent: 'space-around', height: 80, alignItems: 'flex-end', gap: Spacing.xs },
  hourlyBarCol: { flex: 1, alignItems: 'center', gap: 3 },
  hourlyBarVal: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  hourlyBarBg: { flex: 1, width: '100%', backgroundColor: Colors.surfaceElevated, borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end', minHeight: 8 },
  hourlyBarFill: { width: '100%', borderRadius: 4, minHeight: 4 },
  hourlyBarLabel: { fontSize: 9, color: Colors.textMuted },
  topSection: { marginHorizontal: pagePadding, backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm },
  topSectionTitle: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'right', marginBottom: Spacing.md, borderRightWidth: 2, borderRightColor: Colors.primary, paddingRight: 8 },
  topArtworkRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  topArtworkRank: { width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  topArtworkRankText: { fontSize: FontSize.xs, fontWeight: FontWeight.extrabold, color: Colors.textMuted },
  topArtworkMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  topArtworkName: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textPrimary, flex: 1, textAlign: 'right' },
  topArtworkSub: { fontSize: 9, color: Colors.textMuted, marginLeft: 4 },
  topArtworkBarBg: { height: 5, backgroundColor: Colors.surfaceElevated, borderRadius: 3, overflow: 'hidden' },
  topArtworkBarFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3, minWidth: 4 },
  topArtworkViewsBadge: { alignItems: 'center', minWidth: 44 },
  topArtworkViews: { fontSize: FontSize.base, fontWeight: FontWeight.extrabold, color: Colors.primary },
  topArtworkViewsLbl: { fontSize: 9, color: Colors.textMuted },
  searchWrap: { paddingHorizontal: pagePadding, paddingBottom: Spacing.xs, paddingTop: Spacing.xs },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: FontSize.base, color: Colors.textPrimary, marginLeft: Spacing.sm },
  filterOuter: { height: 42 },
  filterContent: { paddingHorizontal: pagePadding, gap: Spacing.sm, alignItems: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primarySurface, borderColor: Colors.primary },
  chipBlocked: { backgroundColor: Colors.errorSurface, borderColor: Colors.error + '50' },
  chipText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  chipTextActive: { color: Colors.primary, fontWeight: FontWeight.bold },
  sortOuter: { height: 38 },
  sortChip: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.full, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border },
  sortChipActive: { borderColor: Colors.primary },
  sortChipText: { fontSize: FontSize.xs, color: Colors.textMuted },
  sortChipTextActive: { color: Colors.primary, fontWeight: FontWeight.semibold },
  countRow: { paddingHorizontal: pagePadding, paddingBottom: 4, paddingTop: 2 },
  countText: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right' },
  list: { paddingHorizontal: pagePadding, paddingTop: Spacing.sm, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: Spacing.base },
  emptySub: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 6, textAlign: 'center', paddingHorizontal: 20 },
});
