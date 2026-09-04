// Powered by OnSpace.AI
// Comprehensive Backup & Restore modal for SayedEzzat
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Modal, StyleSheet, Pressable, ScrollView,
  ActivityIndicator, TextInput, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { globalStyles } from '@/constants/styles';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/hooks/useApp';
import { useAlert } from '@/template';
import { useAuth } from '@/contexts/AuthContext';
import {
  exportBackupToFile, importBackupFromFile, restoreFromBackup,
  loadBackupHistory, BackupHistoryEntry, BackupFile, getBackupPreview, formatFileSize,
} from '@/services/backupService';
import { COLLECTIONS } from '@/services/firebase';

interface BackupModalProps {
  visible: boolean;
  onClose: () => void;
}

type Tab = 'backup' | 'history';

export function BackupModal({ visible, onClose }: BackupModalProps) {
  const {
    artworks, customers, quotes, fullMaterials, suppliers, workers,
    productionOrders, artworkCosts, syncStatus, pendingOpsCount,
    isOnline, forceSyncNow,
  } = useApp() as any;
  const { isAdmin } = useAuth();
  const { showAlert } = useAlert();

  const [activeTab, setActiveTab] = useState<Tab>('backup');
  const [backupLoading, setBackupLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [history, setHistory] = useState<BackupHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [importedBackup, setImportedBackup] = useState<BackupFile | null>(null);
  const [backupDescription, setBackupDescription] = useState('');
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(null);

  const totalRecords = artworks.length + customers.length + quotes.length +
    fullMaterials.length + suppliers.length + workers.length +
    productionOrders.length + artworkCosts.length;

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    const h = await loadBackupHistory();
    setHistory(h.reverse()); // newest first
    setHistoryLoading(false);
  }, []);

  useEffect(() => {
    if (visible) {
      loadHistory();
      setLastResult(null);
      setImportedBackup(null);
    }
  }, [visible, loadHistory]);

  // ─── Create & export backup ────────────────────────────────────────────────
  async function handleExportBackup() {
    if (!isAdmin) { showAlert('وصول مرفوض', 'هذه الميزة للمشرف فقط'); return; }
    setBackupLoading(true);
    setLastResult(null);
    try {
      const result = await exportBackupToFile(backupDescription || undefined);
      setLastResult({ success: result.success, message: result.message });
      if (result.success) {
        setBackupDescription('');
        await loadHistory();
      }
    } finally {
      setBackupLoading(false);
    }
  }

  // ─── Import backup file ────────────────────────────────────────────────────
  async function handleImportFile() {
    if (!isAdmin) { showAlert('وصول مرفوض', 'هذه الميزة للمشرف فقط'); return; }
    setImportLoading(true);
    setLastResult(null);
    try {
      const result = await importBackupFromFile();
      if (result.success && result.backup) {
        setImportedBackup(result.backup);
        setLastResult({ success: true, message: 'تم استيراد الملف — راجع التفاصيل أدناه ثم أكد الاستعادة' });
      } else {
        setLastResult({ success: false, message: result.error || 'فشل الاستيراد' });
      }
    } finally {
      setImportLoading(false);
    }
  }

  // ─── Restore from imported backup ─────────────────────────────────────────
  function handleRestoreConfirm() {
    if (!importedBackup) return;
    const preview = getBackupPreview(importedBackup);
    showAlert(
      'تأكيد الاستعادة',
      `سيتم استعادة:\n${preview.join('\n')}\n\nهل تريد المتابعة؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'استعادة البيانات',
          style: 'destructive',
          onPress: async () => {
            setRestoreLoading(true);
            setLastResult(null);
            try {
              const result = await restoreFromBackup(importedBackup);
              setLastResult({ success: result.success, message: result.message });
              if (result.success) {
                setImportedBackup(null);
                await loadHistory();
              }
            } finally {
              setRestoreLoading(false);
            }
          },
        },
      ]
    );
  }

  // ─── Force sync ────────────────────────────────────────────────────────────
  async function handleForceSync() {
    if (!forceSyncNow) return;
    setSyncLoading(true);
    try {
      await forceSyncNow();
      setLastResult({ success: true, message: 'تمت المزامنة بنجاح' });
    } catch {
      setLastResult({ success: false, message: 'فشلت المزامنة' });
    } finally {
      setSyncLoading(false);
    }
  }

  // ─── Sync status badge ─────────────────────────────────────────────────────
  function SyncBadge() {
    const configs: Record<string, { color: string; bg: string; icon: any; label: string }> = {
      synced: { color: Colors.success, bg: Colors.successSurface, icon: 'cloud-done', label: 'متزامن' },
      syncing: { color: Colors.primary, bg: Colors.primarySurface, icon: 'sync', label: 'جارٍ المزامنة...' },
      offline: { color: Colors.warning, bg: Colors.warningSurface, icon: 'cloud-off', label: 'بدون اتصال' },
      error: { color: Colors.error, bg: Colors.errorSurface, icon: 'error-outline', label: 'خطأ في المزامنة' },
      idle: { color: Colors.textMuted, bg: Colors.surfaceElevated, icon: 'cloud-queue', label: 'في انتظار المزامنة' },
    };
    const cfg = configs[syncStatus] || configs.idle;
    return (
      <View style={[s.syncBadge, { backgroundColor: cfg.bg }]}>
        <MaterialIcons name={cfg.icon} size={14} color={cfg.color} />
        <Text style={[s.syncBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
        {pendingOpsCount > 0 ? (
          <View style={[s.pendingBadge, { backgroundColor: cfg.color }]}>
            <Text style={s.pendingBadgeText}>{pendingOpsCount}</Text>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={globalStyles.overlay}>
        <View style={[globalStyles.modalSheet, { maxHeight: '90%' }]}>
          <View style={globalStyles.modalHandle} />

          {/* Header */}
          <View style={s.headerRow}>
            <Pressable onPress={onClose} style={s.closeBtn}>
              <MaterialIcons name="close" size={20} color={Colors.textSecondary} />
            </Pressable>
            <Text style={globalStyles.modalTitle}>النسخ الاحتياطي والمزامنة</Text>
          </View>

          {/* Tabs */}
          <View style={s.tabRow}>
            {(['backup', 'history'] as Tab[]).map(tab => (
              <Pressable key={tab} onPress={() => setActiveTab(tab)} style={[s.tab, activeTab === tab && s.tabActive]}>
                <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
                  {tab === 'backup' ? 'النسخ والاستعادة' : `السجل (${history.length})`}
                </Text>
              </Pressable>
            ))}
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {activeTab === 'backup' ? (
              <View style={s.section}>
                {/* Sync Status Row */}
                <View style={s.syncRow}>
                  <Pressable onPress={handleForceSync} disabled={syncLoading || !isOnline} style={[s.syncBtn, (!isOnline) && s.syncBtnDisabled]}>
                    {syncLoading ? (
                      <ActivityIndicator size={14} color={Colors.primary} />
                    ) : (
                      <MaterialIcons name="sync" size={16} color={isOnline ? Colors.primary : Colors.textMuted} />
                    )}
                    <Text style={[s.syncBtnText, !isOnline && { color: Colors.textMuted }]}>مزامنة الآن</Text>
                  </Pressable>
                  <SyncBadge />
                </View>

                {/* Database stats */}
                <View style={s.statsGrid}>
                  {[
                    { label: 'أعمال فنية', value: artworks.length, icon: 'palette' as const },
                    { label: 'عملاء', value: customers.length, icon: 'people' as const },
                    { label: 'عروض أسعار', value: quotes.length, icon: 'description' as const },
                    { label: 'خامات', value: fullMaterials.length, icon: 'inventory-2' as const },
                    { label: 'موردين', value: suppliers.length, icon: 'people-outline' as const },
                    { label: 'عمال', value: workers.length, icon: 'engineering' as const },
                    { label: 'أوامر تصنيع', value: productionOrders.length, icon: 'precision-manufacturing' as const },
                    { label: 'تكاليف', value: artworkCosts.length, icon: 'calculate' as const },
                  ].map(item => (
                    <View key={item.label} style={s.statCard}>
                      <MaterialIcons name={item.icon} size={18} color={Colors.primary} />
                      <Text style={s.statValue}>{item.value}</Text>
                      <Text style={s.statLabel}>{item.label}</Text>
                    </View>
                  ))}
                </View>

                {!isAdmin ? (
                  <View style={s.adminOnly}>
                    <MaterialIcons name="lock" size={20} color={Colors.warning} />
                    <Text style={s.adminOnlyText}>النسخ الاحتياطي والاستعادة متاحان للمشرف فقط</Text>
                  </View>
                ) : (
                  <>
                    {/* Export section */}
                    <View style={s.card}>
                      <View style={s.cardHeader}>
                        <MaterialIcons name="cloud-upload" size={22} color={Colors.success} />
                        <Text style={s.cardTitle}>إنشاء نسخة احتياطية</Text>
                      </View>
                      <Text style={s.cardSub}>يصدّر كل البيانات (الأعمال الفنية، العملاء، الخامات، التصنيع...) مع روابط صور Cloudinary إلى ملف JSON آمن.</Text>
                      <TextInput
                        value={backupDescription}
                        onChangeText={setBackupDescription}
                        placeholder="وصف اختياري للنسخة..."
                        placeholderTextColor={Colors.textMuted}
                        style={s.descInput}
                        textAlign="right"
                      />
                      <View style={s.statsRow}>
                        <Text style={s.statsTotal}>{totalRecords} سجل إجمالي</Text>
                      </View>
                      <Pressable onPress={handleExportBackup} disabled={backupLoading} style={[s.actionBtn, s.exportBtn]}>
                        {backupLoading ? <ActivityIndicator size={16} color="#fff" /> : <MaterialIcons name="download" size={18} color="#fff" />}
                        <Text style={s.actionBtnText}>تصدير وحفظ النسخة الاحتياطية</Text>
                      </Pressable>
                    </View>

                    {/* Import / Restore section */}
                    <View style={[s.card, { marginTop: Spacing.md }]}>
                      <View style={s.cardHeader}>
                        <MaterialIcons name="cloud-download" size={22} color={Colors.warning} />
                        <Text style={s.cardTitle}>استيراد واستعادة</Text>
                      </View>
                      <Text style={s.cardSub}>اختر ملف نسخة احتياطية (.json) لاستعادة البيانات. يتم التحقق من صحة الملف قبل أي تغيير.</Text>

                      <Pressable onPress={handleImportFile} disabled={importLoading} style={[s.actionBtn, s.importBtn]}>
                        {importLoading ? <ActivityIndicator size={16} color="#fff" /> : <MaterialIcons name="folder-open" size={18} color="#fff" />}
                        <Text style={s.actionBtnText}>اختيار ملف النسخة الاحتياطية</Text>
                      </Pressable>

                      {/* Preview imported backup */}
                      {importedBackup ? (
                        <View style={s.previewBox}>
                          <View style={s.previewHeader}>
                            <MaterialIcons name="check-circle" size={18} color={Colors.success} />
                            <Text style={s.previewTitle}>ملف صالح — نسخة من {importedBackup.meta.createdAt?.slice(0, 10)}</Text>
                          </View>
                          {getBackupPreview(importedBackup).map((line, i) => (
                            <Text key={i} style={s.previewLine}>• {line}</Text>
                          ))}
                          <Text style={s.previewTotal}>{importedBackup.meta.totalRecords} سجل إجمالي</Text>
                          <Pressable onPress={handleRestoreConfirm} disabled={restoreLoading} style={[s.actionBtn, s.restoreBtn, { marginTop: Spacing.md }]}>
                            {restoreLoading ? <ActivityIndicator size={16} color="#fff" /> : <MaterialIcons name="restore" size={18} color="#fff" />}
                            <Text style={s.actionBtnText}>استعادة البيانات من هذه النسخة</Text>
                          </Pressable>
                          <Pressable onPress={() => setImportedBackup(null)} style={s.cancelPreview}>
                            <Text style={s.cancelPreviewText}>إلغاء</Text>
                          </Pressable>
                        </View>
                      ) : null}
                    </View>

                    {/* Result message */}
                    {lastResult ? (
                      <View style={[s.resultBox, lastResult.success ? s.resultSuccess : s.resultError]}>
                        <MaterialIcons
                          name={lastResult.success ? 'check-circle' : 'error-outline'}
                          size={18}
                          color={lastResult.success ? Colors.success : Colors.error}
                        />
                        <Text style={[s.resultText, { color: lastResult.success ? Colors.success : Colors.error }]}>
                          {lastResult.message}
                        </Text>
                      </View>
                    ) : null}
                  </>
                )}
              </View>
            ) : (
              // History Tab
              <View style={s.section}>
                <View style={s.historyHeader}>
                  <Pressable onPress={loadHistory} style={s.refreshBtn}>
                    <MaterialIcons name="refresh" size={16} color={Colors.primary} />
                    <Text style={s.refreshBtnText}>تحديث</Text>
                  </Pressable>
                  <Text style={s.historyTitle}>سجل النسخ الاحتياطية</Text>
                </View>
                {historyLoading ? (
                  <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 40 }} />
                ) : history.length === 0 ? (
                  <View style={s.emptyHistory}>
                    <MaterialIcons name="history" size={48} color={Colors.textMuted} />
                    <Text style={s.emptyHistoryText}>لا يوجد سجل نسخ احتياطية بعد</Text>
                    <Text style={s.emptyHistorySub}>أنشئ أول نسخة احتياطية من تبويب «النسخ والاستعادة»</Text>
                  </View>
                ) : (
                  history.map(entry => (
                    <View key={entry.id} style={s.historyCard}>
                      <View style={s.historyTop}>
                        <View style={[s.sourceBadge, { backgroundColor: entry.source === 'auto' ? Colors.infoSurface : Colors.primarySurface }]}>
                          <Text style={[s.sourceBadgeText, { color: entry.source === 'auto' ? Colors.info : Colors.primary }]}>
                            {entry.source === 'auto' ? 'تلقائية' : 'يدوية'}
                          </Text>
                        </View>
                        <Text style={s.historyDate}>
                          {new Date(entry.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                      {entry.description ? (
                        <Text style={s.historyDesc}>{entry.description}</Text>
                      ) : null}
                      <View style={s.historyCounts}>
                        {Object.entries(entry.recordCounts || {}).filter(([, v]) => v > 0).slice(0, 5).map(([col, count]) => {
                          const labelMap: Record<string, string> = {
                            artworks: 'أعمال', customers: 'عملاء', quotes: 'عروض',
                            fullMaterials: 'خامات', suppliers: 'موردين',
                          };
                          return (
                            <View key={col} style={s.countChip}>
                              <Text style={s.countChipText}>{labelMap[col] || col}: {count as number}</Text>
                            </View>
                          );
                        })}
                      </View>
                      <Text style={s.historyTotal}>الإجمالي: {entry.totalRecords} سجل {entry.fileSize ? `· ${formatFileSize(entry.fileSize)}` : ''}</Text>
                    </View>
                  ))
                )}
              </View>
            )}

            <View style={{ height: Spacing.xl }} />
            <View style={s.closeRow}>
              <Button title="إغلاق" onPress={onClose} variant="ghost" />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  tabRow: { flexDirection: 'row', backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, padding: 4, marginBottom: Spacing.base },
  tab: { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.sm, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.surface, ...Shadow.sm },
  tabText: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: FontWeight.medium },
  tabTextActive: { color: Colors.textPrimary, fontWeight: FontWeight.bold },
  section: { paddingBottom: Spacing.md },
  // Sync
  syncRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.base, backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  syncBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full },
  syncBadgeText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  pendingBadge: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  pendingBadgeText: { fontSize: 10, color: '#fff', fontWeight: FontWeight.bold },
  syncBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primarySurface, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.primary + '50' },
  syncBtnDisabled: { opacity: 0.5 },
  syncBtnText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },
  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.base },
  statCard: { backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center', gap: 3, borderWidth: 1, borderColor: Colors.border, minWidth: '22%', flex: 1 },
  statValue: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  statLabel: { fontSize: 10, color: Colors.textMuted, textAlign: 'center' },
  // Admin only
  adminOnly: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.warningSurface, borderRadius: Radius.md, padding: Spacing.base, borderWidth: 1, borderColor: Colors.warning + '50', justifyContent: 'center' },
  adminOnlyText: { fontSize: FontSize.sm, color: Colors.warning, fontWeight: FontWeight.medium, textAlign: 'center' },
  // Cards
  card: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.base, borderWidth: 1, borderColor: Colors.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm, justifyContent: 'flex-end' },
  cardTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  cardSub: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'right', lineHeight: 22, marginBottom: Spacing.md },
  descInput: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, fontSize: FontSize.sm, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md },
  statsRow: { marginBottom: Spacing.md },
  statsTotal: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'right', fontWeight: FontWeight.medium },
  // Action buttons
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.md, borderRadius: Radius.md },
  exportBtn: { backgroundColor: Colors.success },
  importBtn: { backgroundColor: Colors.warning },
  restoreBtn: { backgroundColor: Colors.error },
  actionBtnText: { fontSize: FontSize.base, color: '#fff', fontWeight: FontWeight.bold },
  // Preview box
  previewBox: { backgroundColor: Colors.successSurface, borderRadius: Radius.md, padding: Spacing.md, marginTop: Spacing.base, borderWidth: 1, borderColor: Colors.success + '50' },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm, justifyContent: 'flex-end' },
  previewTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.success, textAlign: 'right' },
  previewLine: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'right', marginBottom: 2 },
  previewTotal: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'right', marginTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm },
  cancelPreview: { alignItems: 'center', paddingTop: Spacing.sm },
  cancelPreviewText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  // Result
  resultBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.md, marginTop: Spacing.md, borderWidth: 1, justifyContent: 'flex-end' },
  resultSuccess: { backgroundColor: Colors.successSurface, borderColor: Colors.success + '40' },
  resultError: { backgroundColor: Colors.errorSurface, borderColor: Colors.error + '40' },
  resultText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, flex: 1, textAlign: 'right' },
  // History
  historyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  historyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primarySurface, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.primary + '50' },
  refreshBtnText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.semibold },
  emptyHistory: { alignItems: 'center', paddingVertical: Spacing.xxxl, gap: Spacing.md },
  emptyHistoryText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textSecondary },
  emptyHistorySub: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  historyCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.base, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  historyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  historyDate: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  historyDesc: { fontSize: FontSize.sm, color: Colors.textPrimary, textAlign: 'right', marginBottom: Spacing.sm, fontStyle: 'italic' },
  historyCounts: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.sm, justifyContent: 'flex-end' },
  countChip: { backgroundColor: Colors.primarySurface, paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full },
  countChipText: { fontSize: 11, color: Colors.primary, fontWeight: FontWeight.medium },
  historyTotal: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right' },
  sourceBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full },
  sourceBadgeText: { fontSize: 11, fontWeight: FontWeight.bold },
  closeRow: { paddingHorizontal: Spacing.sm },
});
