// Powered by OnSpace.AI
import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, Modal, StyleSheet, ScrollView, Pressable,
  TextInput, Switch, ActivityIndicator, Platform, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { useAlert } from '@/template';
import {
  generateBackupName, estimateSize, BACKUP_VERSION, APP_VERSION,
  AppSettings,
} from '@/services/storage';
import { RestoreOptions } from '@/contexts/AppContext';

interface BackupModalProps {
  visible: boolean;
  onClose: () => void;
}

type ModalView = 'main' | 'create' | 'restore' | 'history' | 'settings' | 'trash';

// ─── helpers ───────────────────────────────────────────────────────────────
function SectionTitle({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <Text style={[st.txt, color ? { color, borderRightColor: color } : {}]}>{children}</Text>
  );
}
const st = StyleSheet.create({
  txt: {
    fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary,
    textAlign: 'right', marginBottom: Spacing.md, marginTop: Spacing.base,
    borderRightWidth: 3, borderRightColor: Colors.primary, paddingRight: Spacing.sm,
  },
});

function StatBox({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <View style={sb.box}>
      <Text style={[sb.val, color ? { color } : {}]}>{typeof value === 'number' ? value.toLocaleString() : value}</Text>
      <Text style={sb.lbl}>{label}</Text>
    </View>
  );
}
const sb = StyleSheet.create({
  box: { flex: 1, alignItems: 'center', backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  val: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  lbl: { fontSize: 10, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },
});

function ToggleRow({ label, sub, value, onChange, color }: { label: string; sub?: string; value: boolean; onChange: (v: boolean) => void; color?: string }) {
  return (
    <View style={tr.row}>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: Colors.border, true: (color || Colors.primary) + '60' }} thumbColor={value ? (color || Colors.primary) : Colors.textMuted} />
      <View style={{ flex: 1, alignItems: 'flex-end' }}>
        <Text style={tr.label}>{label}</Text>
        {sub ? <Text style={tr.sub}>{sub}</Text> : null}
      </View>
    </View>
  );
}
const tr = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  label: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.medium },
  sub: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
});

// ─── Main Component ─────────────────────────────────────────────────────────
export function BackupModal({ visible, onClose }: BackupModalProps) {
  const {
    artworks, customers, quotes, materials, fullMaterials, suppliers,
    workers, productionOrders, externalManufacturing, artworkCosts,
    artworkCategories,
    trashArtworks, trashCustomers, trashQuotes, trashMaterials, trashSuppliers,
    backupHistory, appSettings,
    updateAppSettings, addBackupHistoryEntry, clearBackupHistory,
    restoreFullBackup,
    restoreArtwork, permanentDeleteArtwork,
    restoreCustomer, permanentDeleteCustomer,
    restoreQuote, permanentDeleteQuote,
    restoreFullMaterial, permanentDeleteFullMaterial,
    restoreSupplier, permanentDeleteSupplier,
  } = useApp();
  const { showAlert } = useAlert();

  const [view, setView] = useState<ModalView>('main');
  const [busy, setBusy] = useState(false);
  const [busyMsg, setBusyMsg] = useState('');

  // Create backup options
  const [backupName, setBackupName] = useState('');

  // Restore options
  const [restorePreview, setRestorePreview] = useState<any>(null);
  const [restoreOpts, setRestoreOpts] = useState<RestoreOptions>({
    artworks: true, customers: true, quotes: true, materials: true,
    suppliers: true, workers: true, productionOrders: true, artworkCosts: true,
    categories: true, settings: false, mergeMode: 'replace',
  });

  const totalTrash = trashArtworks.length + trashCustomers.length + trashQuotes.length + trashMaterials.length + trashSuppliers.length;

  function resetView() { setView('main'); setRestorePreview(null); setBusy(false); setBusyMsg(''); }

  // ─── Build full backup payload ───────────────────────────────────────────
  function buildBackupPayload(name: string) {
    const counts = {
      artworks: artworks.length, customers: customers.length, quotes: quotes.length,
      materials: materials.length, fullMaterials: fullMaterials.length,
      suppliers: suppliers.length, workers: workers.length,
      productionOrders: productionOrders.length, artworkCosts: artworkCosts.length,
      externalManufacturing: externalManufacturing.length, categories: artworkCategories.length,
    };
    return {
      meta: {
        backupVersion: BACKUP_VERSION,
        appVersion: APP_VERSION,
        createdAt: new Date().toISOString(),
        name,
        counts,
      },
      data: {
        artworks, customers, quotes, materials, fullMaterials,
        categories: artworkCategories, suppliers, artworkCosts,
        workers, productionOrders, internalManufacturing: [],
        externalManufacturing, settings: appSettings,
      },
    };
  }

  // ─── Create Backup ───────────────────────────────────────────────────────
  async function handleCreateBackup() {
    setBusy(true); setBusyMsg('جاري إنشاء النسخة الاحتياطية...');
    try {
      const dayBackups = backupHistory.filter(b => b.date.startsWith(new Date().toISOString().slice(0, 10)));
      const finalName = backupName.trim() || generateBackupName(dayBackups.length);
      const payload = buildBackupPayload(finalName);
      const json = JSON.stringify(payload, null, 2);
      const size = estimateSize(payload);

      const fileName = `${finalName}.json`;
      const filePath = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(filePath, json, { encoding: FileSystem.EncodingType.UTF8 });

      if (await Sharing.isAvailableAsync()) {
        setBusyMsg('جاري مشاركة الملف...');
        await Sharing.shareAsync(filePath, { mimeType: 'application/json', dialogTitle: finalName });
      }

      await addBackupHistoryEntry({
        name: finalName, date: new Date().toISOString(),
        artworksCount: artworks.length, customersCount: customers.length,
        quotesCount: quotes.length, materialsCount: fullMaterials.length,
        suppliersCount: suppliers.length, workersCount: workers.length,
        ordersCount: productionOrders.length, type: 'manual', size,
      });

      setBackupName('');
      showAlert('تم الحفظ', `النسخة الاحتياطية "${finalName}" (${size}) جاهزة وتم مشاركتها.`);
      setView('main');
    } catch (err: any) {
      showAlert('خطأ', `فشل إنشاء النسخة: ${err?.message || err}`);
    } finally {
      setBusy(false); setBusyMsg('');
    }
  }

  // ─── Load Restore File ───────────────────────────────────────────────────
  async function handlePickRestoreFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.[0]) return;
      setBusy(true); setBusyMsg('جاري تحليل الملف...');
      const content = await FileSystem.readAsStringAsync(result.assets[0].uri, { encoding: FileSystem.EncodingType.UTF8 });
      const parsed = JSON.parse(content);
      // Validate
      if (!parsed.meta && !parsed.artworks) {
        showAlert('ملف غير صالح', 'لم يتم التعرف على تنسيق النسخة الاحتياطية.');
        setBusy(false); return;
      }
      setRestorePreview(parsed);
      setView('restore');
    } catch (err: any) {
      showAlert('خطأ في القراءة', `لا يمكن قراءة الملف: ${err?.message || err}`);
    } finally {
      setBusy(false); setBusyMsg('');
    }
  }

  // ─── Execute Restore ─────────────────────────────────────────────────────
  async function handleRestore() {
    if (!restorePreview) return;
    showAlert(
      'تأكيد الاستعادة',
      restoreOpts.mergeMode === 'replace'
        ? 'سيتم استبدال البيانات الحالية. هل أنت متأكد؟'
        : 'سيتم دمج البيانات مع الحالية (لن تُحذف السجلات الموجودة). هل أنت متأكد؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'استعادة', style: 'destructive', onPress: async () => {
            setBusy(true); setBusyMsg('جاري استعادة البيانات...');
            try {
              await restoreFullBackup(restorePreview, restoreOpts);
              setRestorePreview(null);
              setView('main');
              showAlert('تمت الاستعادة', 'تم استعادة البيانات بنجاح.');
            } catch (err: any) {
              showAlert('خطأ', `فشلت الاستعادة: ${err?.message || err}`);
            } finally {
              setBusy(false); setBusyMsg('');
            }
          },
        },
      ]
    );
  }

  // ─── Data stats ──────────────────────────────────────────────────────────
  const dbStats = useMemo(() => {
    const allData = { artworks, customers, quotes, fullMaterials, suppliers, workers, productionOrders, artworkCosts, externalManufacturing };
    return {
      artworks: artworks.length,
      customers: customers.length,
      quotes: quotes.length,
      materials: fullMaterials.length,
      suppliers: suppliers.length,
      workers: workers.length,
      orders: productionOrders.length,
      costs: artworkCosts.length,
      externalMfg: externalManufacturing.length,
      totalImages: artworks.reduce((s, a) => s + (a.images?.length || 0), 0),
      estimatedSize: estimateSize(allData),
    };
  }, [artworks, customers, quotes, fullMaterials, suppliers, workers, productionOrders, artworkCosts, externalManufacturing]);

  // ─── Restore preview meta ─────────────────────────────────────────────────
  const previewMeta = restorePreview?.meta;
  const previewCounts = previewMeta?.counts || {};
  const previewData = restorePreview?.data || restorePreview || {};

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => { resetView(); onClose(); }}>
      <View style={ms.overlay}>
        <View style={ms.sheet}>
          <View style={ms.handle} />

          {/* Header */}
          <View style={ms.header}>
            {view !== 'main' ? (
              <Pressable onPress={() => setView('main')} style={ms.backBtn}>
                <MaterialIcons name="arrow-back" size={20} color={Colors.textSecondary} />
              </Pressable>
            ) : (
              <Pressable onPress={() => { resetView(); onClose(); }} style={ms.backBtn}>
                <MaterialIcons name="close" size={20} color={Colors.textSecondary} />
              </Pressable>
            )}
            <Text style={ms.headerTitle}>
              {view === 'main' ? 'إدارة البيانات والنسخ الاحتياطي' :
               view === 'create' ? 'إنشاء نسخة احتياطية' :
               view === 'restore' ? 'استعادة بيانات' :
               view === 'history' ? 'سجل النسخ الاحتياطية' :
               view === 'settings' ? 'إعدادات النسخ الاحتياطي' :
               'سلة المحذوفات'}
            </Text>
          </View>

          {/* Busy overlay */}
          {busy ? (
            <View style={ms.busyOverlay}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={ms.busyTxt}>{busyMsg}</Text>
            </View>
          ) : null}

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={ms.content}>

            {/* ── MAIN VIEW ── */}
            {view === 'main' ? (
              <>
                <View style={ms.adminBanner}>
                  <MaterialIcons name="lock" size={14} color={Colors.warning} />
                  <Text style={ms.adminBannerTxt}>للمشرف فقط — SayedEzzat Data Management</Text>
                </View>

                {/* Database stats */}
                <SectionTitle>إحصائيات قاعدة البيانات</SectionTitle>
                <View style={ms.statsGrid}>
                  <StatBox label="أعمال فنية" value={dbStats.artworks} color={Colors.primary} />
                  <StatBox label="عملاء" value={dbStats.customers} color={Colors.info} />
                  <StatBox label="عروض أسعار" value={dbStats.quotes} color={Colors.success} />
                  <StatBox label="خامات" value={dbStats.materials} color="#9C6FFF" />
                  <StatBox label="موردين" value={dbStats.suppliers} color={Colors.warning} />
                  <StatBox label="عمال" value={dbStats.workers} color={Colors.textSecondary} />
                  <StatBox label="أوامر إنتاج" value={dbStats.orders} color={Colors.error} />
                  <StatBox label="حسابات تكلفة" value={dbStats.costs} color={Colors.primary} />
                  <StatBox label="صور" value={dbStats.totalImages} color={Colors.info} />
                  <StatBox label="حجم البيانات" value={dbStats.estimatedSize} />
                </View>

                {/* Actions */}
                <SectionTitle>العمليات</SectionTitle>
                <View style={ms.actionsList}>
                  {[
                    { icon: 'cloud-upload', label: 'إنشاء نسخة احتياطية كاملة', sub: 'حفظ كل البيانات ومشاركتها', color: Colors.success, action: () => setView('create') },
                    { icon: 'cloud-download', label: 'استعادة من ملف', sub: 'استيراد نسخة احتياطية', color: Colors.primary, action: handlePickRestoreFile },
                    { icon: 'history', label: `سجل النسخ (${backupHistory.length})`, sub: 'عرض النسخ الاحتياطية السابقة', color: Colors.info, action: () => setView('history') },
                    { icon: 'delete', label: `سلة المحذوفات (${totalTrash})`, sub: 'استعادة أو حذف نهائي', color: Colors.error, action: () => setView('trash') },
                    { icon: 'settings', label: 'إعدادات النسخ الاحتياطي', sub: 'نسخ تلقائي، عدد النسخ', color: Colors.textMuted, action: () => setView('settings') },
                  ].map(item => (
                    <Pressable key={item.label} onPress={item.action} style={({ pressed }) => [ms.actionRow, pressed && { opacity: 0.8 }]}>
                      <MaterialIcons name="chevron-left" size={20} color={Colors.textMuted} />
                      <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        <Text style={ms.actionLabel}>{item.label}</Text>
                        <Text style={ms.actionSub}>{item.sub}</Text>
                      </View>
                      <View style={[ms.actionIcon, { backgroundColor: item.color + '20' }]}>
                        <MaterialIcons name={item.icon as any} size={20} color={item.color} />
                      </View>
                    </Pressable>
                  ))}
                </View>

                {/* Last backup info */}
                {backupHistory.length > 0 ? (
                  <View style={ms.lastBackupBox}>
                    <MaterialIcons name="check-circle" size={16} color={Colors.success} />
                    <Text style={ms.lastBackupTxt}>
                      آخر نسخة: {backupHistory[0].name} — {new Date(backupHistory[0].date).toLocaleDateString('ar-EG')}
                    </Text>
                  </View>
                ) : (
                  <View style={ms.noBackupBox}>
                    <MaterialIcons name="warning" size={16} color={Colors.warning} />
                    <Text style={ms.noBackupTxt}>لم يتم إنشاء أي نسخة احتياطية بعد — يُنصح بإنشاء نسخة الآن</Text>
                  </View>
                )}
              </>
            ) : null}

            {/* ── CREATE BACKUP VIEW ── */}
            {view === 'create' ? (
              <>
                <SectionTitle>محتوى النسخة الاحتياطية</SectionTitle>
                <View style={ms.statsGrid}>
                  <StatBox label="أعمال فنية" value={artworks.length} color={Colors.primary} />
                  <StatBox label="عملاء" value={customers.length} color={Colors.info} />
                  <StatBox label="عروض" value={quotes.length} color={Colors.success} />
                  <StatBox label="خامات" value={fullMaterials.length} color="#9C6FFF" />
                  <StatBox label="موردين" value={suppliers.length} color={Colors.warning} />
                  <StatBox label="عمال" value={workers.length} color={Colors.textSecondary} />
                  <StatBox label="أوامر إنتاج" value={productionOrders.length} color={Colors.error} />
                  <StatBox label="حسابات تكلفة" value={artworkCosts.length} color={Colors.primary} />
                </View>

                <SectionTitle>اسم النسخة الاحتياطية</SectionTitle>
                <View style={ms.nameField}>
                  <TextInput
                    value={backupName}
                    onChangeText={setBackupName}
                    placeholder={generateBackupName(backupHistory.filter(b => b.date.startsWith(new Date().toISOString().slice(0, 10))).length)}
                    placeholderTextColor={Colors.textMuted}
                    style={ms.nameInput}
                    textAlign="right"
                  />
                  <Text style={ms.nameHint}>اتركه فارغاً للتسمية التلقائية: SayedEzzat_Backup_YYYY-MM-DD</Text>
                </View>

                <View style={ms.infoBox}>
                  <MaterialIcons name="info-outline" size={14} color={Colors.info} />
                  <Text style={ms.infoTxt}>
                    ستحتوي النسخة على جميع البيانات: أعمال فنية، عملاء، عروض أسعار، خامات، موردين، عمال، أوامر إنتاج، حسابات التكلفة، وإعدادات التطبيق. حجم البيانات المقدّر: {dbStats.estimatedSize}
                  </Text>
                </View>

                <Pressable onPress={handleCreateBackup} style={ms.createBtn} disabled={busy}>
                  <MaterialIcons name="cloud-upload" size={20} color="#fff" />
                  <Text style={ms.createBtnTxt}>إنشاء النسخة الاحتياطية ومشاركتها</Text>
                </Pressable>
              </>
            ) : null}

            {/* ── RESTORE VIEW ── */}
            {view === 'restore' && restorePreview ? (
              <>
                {/* Backup info */}
                <View style={ms.restoreInfoCard}>
                  <View style={ms.restoreInfoRow}>
                    <Text style={ms.restoreInfoVal}>{previewMeta?.name || 'غير محدد'}</Text>
                    <Text style={ms.restoreInfoLbl}>اسم النسخة</Text>
                  </View>
                  {previewMeta?.createdAt ? (
                    <View style={ms.restoreInfoRow}>
                      <Text style={ms.restoreInfoVal}>{new Date(previewMeta.createdAt).toLocaleDateString('ar-EG')}</Text>
                      <Text style={ms.restoreInfoLbl}>تاريخ الإنشاء</Text>
                    </View>
                  ) : null}
                  {previewMeta?.backupVersion ? (
                    <View style={ms.restoreInfoRow}>
                      <Text style={ms.restoreInfoVal}>v{previewMeta.backupVersion}</Text>
                      <Text style={ms.restoreInfoLbl}>إصدار النسخة</Text>
                    </View>
                  ) : null}
                </View>

                <SectionTitle>محتوى النسخة الاحتياطية</SectionTitle>
                <View style={ms.statsGrid}>
                  <StatBox label="أعمال فنية" value={previewCounts.artworks ?? previewData.artworks?.length ?? 0} color={Colors.primary} />
                  <StatBox label="عملاء" value={previewCounts.customers ?? previewData.customers?.length ?? 0} color={Colors.info} />
                  <StatBox label="عروض" value={previewCounts.quotes ?? previewData.quotes?.length ?? 0} color={Colors.success} />
                  <StatBox label="خامات" value={previewCounts.fullMaterials ?? previewData.fullMaterials?.length ?? 0} color="#9C6FFF" />
                  <StatBox label="موردين" value={previewCounts.suppliers ?? previewData.suppliers?.length ?? 0} color={Colors.warning} />
                  <StatBox label="عمال" value={previewCounts.workers ?? previewData.workers?.length ?? 0} color={Colors.textSecondary} />
                  <StatBox label="أوامر إنتاج" value={previewCounts.productionOrders ?? previewData.productionOrders?.length ?? 0} color={Colors.error} />
                  <StatBox label="حسابات تكلفة" value={previewCounts.artworkCosts ?? previewData.artworkCosts?.length ?? 0} color={Colors.primary} />
                </View>

                <SectionTitle>خيارات الاستعادة</SectionTitle>

                {/* Merge mode */}
                <View style={ms.mergeRow}>
                  {(['replace', 'merge'] as const).map(mode => (
                    <Pressable key={mode} onPress={() => setRestoreOpts(o => ({ ...o, mergeMode: mode }))}
                      style={[ms.mergeBtn, restoreOpts.mergeMode === mode && ms.mergeBtnActive]}>
                      <Text style={[ms.mergeBtnTxt, restoreOpts.mergeMode === mode && { color: Colors.primary, fontWeight: FontWeight.bold }]}>
                        {mode === 'replace' ? 'استبدال كامل' : 'دمج مع الحالي'}
                      </Text>
                      <Text style={[ms.mergeBtnSub, restoreOpts.mergeMode === mode && { color: Colors.primary }]}>
                        {mode === 'replace' ? 'يحذف البيانات الحالية' : 'يضيف دون حذف'}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={ms.selectTitle}>البيانات المراد استعادتها:</Text>
                {[
                  { key: 'artworks' as const, label: 'الأعمال الفنية', count: previewData.artworks?.length },
                  { key: 'customers' as const, label: 'العملاء', count: previewData.customers?.length },
                  { key: 'quotes' as const, label: 'عروض الأسعار', count: previewData.quotes?.length },
                  { key: 'materials' as const, label: 'الخامات', count: previewData.fullMaterials?.length },
                  { key: 'suppliers' as const, label: 'الموردين', count: previewData.suppliers?.length },
                  { key: 'workers' as const, label: 'العمال', count: previewData.workers?.length },
                  { key: 'productionOrders' as const, label: 'أوامر التصنيع', count: previewData.productionOrders?.length },
                  { key: 'artworkCosts' as const, label: 'حسابات التكلفة', count: previewData.artworkCosts?.length },
                  { key: 'categories' as const, label: 'أنواع الأعمال', count: previewData.categories?.length },
                  { key: 'settings' as const, label: 'إعدادات التطبيق', count: null },
                ].map(item => (
                  <ToggleRow
                    key={item.key}
                    label={item.label}
                    sub={item.count != null ? `${item.count} سجل` : undefined}
                    value={restoreOpts[item.key]}
                    onChange={v => setRestoreOpts(o => ({ ...o, [item.key]: v }))}
                  />
                ))}

                {restoreOpts.mergeMode === 'replace' ? (
                  <View style={[ms.infoBox, { backgroundColor: Colors.errorSurface, borderColor: Colors.error + '40' }]}>
                    <MaterialIcons name="warning" size={14} color={Colors.error} />
                    <Text style={[ms.infoTxt, { color: Colors.error }]}>تحذير: الاستبدال الكامل سيحذف البيانات المحددة الحالية بشكل دائم قبل استيراد بيانات النسخة الاحتياطية.</Text>
                  </View>
                ) : null}

                <Pressable onPress={handleRestore} style={[ms.createBtn, { backgroundColor: Colors.warning }]}>
                  <MaterialIcons name="restore" size={20} color="#fff" />
                  <Text style={ms.createBtnTxt}>تنفيذ الاستعادة</Text>
                </Pressable>
              </>
            ) : view === 'restore' && !restorePreview ? (
              <View style={ms.noFileBox}>
                <MaterialIcons name="folder-open" size={56} color={Colors.textMuted} />
                <Text style={ms.noFileTxt}>اختر ملف JSON للاستعادة</Text>
                <Pressable onPress={handlePickRestoreFile} style={ms.pickFileBtn}>
                  <MaterialIcons name="file-open" size={18} color={Colors.textOnPrimary} />
                  <Text style={ms.pickFileBtnTxt}>اختيار ملف</Text>
                </Pressable>
              </View>
            ) : null}

            {/* ── HISTORY VIEW ── */}
            {view === 'history' ? (
              <>
                {backupHistory.length === 0 ? (
                  <View style={ms.emptyBox}>
                    <MaterialIcons name="history" size={48} color={Colors.textMuted} />
                    <Text style={ms.emptyTxt}>لا يوجد سجل نسخ احتياطية</Text>
                  </View>
                ) : (
                  <>
                    <Pressable onPress={() => showAlert('مسح السجل', 'هل تريد مسح كل سجل النسخ الاحتياطية؟', [
                      { text: 'إلغاء', style: 'cancel' },
                      { text: 'مسح', style: 'destructive', onPress: clearBackupHistory },
                    ])} style={ms.clearHistBtn}>
                      <MaterialIcons name="delete-sweep" size={16} color={Colors.error} />
                      <Text style={{ color: Colors.error, fontSize: FontSize.sm }}>مسح السجل</Text>
                    </Pressable>
                    {backupHistory.map(entry => (
                      <View key={entry.id} style={ms.histCard}>
                        <View style={ms.histTop}>
                          <View style={[ms.histTypeBadge, { backgroundColor: entry.type === 'auto' ? Colors.infoSurface : Colors.successSurface }]}>
                            <Text style={{ fontSize: 10, color: entry.type === 'auto' ? Colors.info : Colors.success, fontWeight: FontWeight.bold }}>
                              {entry.type === 'auto' ? 'تلقائي' : 'يدوي'}
                            </Text>
                          </View>
                          <View style={{ flex: 1, alignItems: 'flex-end' }}>
                            <Text style={ms.histName} numberOfLines={1}>{entry.name}</Text>
                            <Text style={ms.histDate}>{new Date(entry.date).toLocaleString('ar-EG')}</Text>
                          </View>
                        </View>
                        <View style={ms.histStats}>
                          {[
                            { l: 'أعمال', v: entry.artworksCount },
                            { l: 'عملاء', v: entry.customersCount },
                            { l: 'عروض', v: entry.quotesCount },
                            { l: 'خامات', v: entry.materialsCount },
                            { l: 'موردين', v: entry.suppliersCount },
                            { l: 'أوامر', v: entry.ordersCount },
                          ].map(s => (
                            <View key={s.l} style={ms.histStat}>
                              <Text style={ms.histStatVal}>{s.v}</Text>
                              <Text style={ms.histStatLbl}>{s.l}</Text>
                            </View>
                          ))}
                          {entry.size ? (
                            <View style={ms.histStat}>
                              <Text style={[ms.histStatVal, { fontSize: FontSize.xs }]}>{entry.size}</Text>
                              <Text style={ms.histStatLbl}>الحجم</Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    ))}
                  </>
                )}
              </>
            ) : null}

            {/* ── SETTINGS VIEW ── */}
            {view === 'settings' ? (
              <>
                <SectionTitle>النسخ التلقائي</SectionTitle>
                <Text style={ms.settingsHint}>اختر تكرار النسخ الاحتياطي التلقائي:</Text>
                <View style={ms.autoBackupRow}>
                  {(['off', 'daily', 'weekly', 'monthly'] as AppSettings['autoBackup'][]).map(opt => (
                    <Pressable key={opt} onPress={() => updateAppSettings({ autoBackup: opt })}
                      style={[ms.autoBtn, appSettings.autoBackup === opt && ms.autoBtnActive]}>
                      <Text style={[ms.autoBtnTxt, appSettings.autoBackup === opt && { color: Colors.primary, fontWeight: FontWeight.bold }]}>
                        {opt === 'off' ? 'إيقاف' : opt === 'daily' ? 'يومي' : opt === 'weekly' ? 'أسبوعي' : 'شهري'}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <SectionTitle>عدد النسخ الاحتفاظية</SectionTitle>
                <Text style={ms.settingsHint}>عدد النسخ الاحتياطية الاحتفاظية بها (الحد الأقصى):</Text>
                <View style={ms.autoBackupRow}>
                  {[5, 10, 20, 50].map(n => (
                    <Pressable key={n} onPress={() => updateAppSettings({ maxBackupVersions: n })}
                      style={[ms.autoBtn, appSettings.maxBackupVersions === n && ms.autoBtnActive]}>
                      <Text style={[ms.autoBtnTxt, appSettings.maxBackupVersions === n && { color: Colors.primary, fontWeight: FontWeight.bold }]}>{n}</Text>
                    </Pressable>
                  ))}
                </View>

                {backupHistory.length > 0 ? (
                  <View style={ms.infoBox}>
                    <MaterialIcons name="info-outline" size={14} color={Colors.info} />
                    <Text style={ms.infoTxt}>آخر نسخة تلقائية: {appSettings.lastAutoBackupDate ? new Date(appSettings.lastAutoBackupDate).toLocaleDateString('ar-EG') : 'لم تنشأ بعد'}</Text>
                  </View>
                ) : null}
              </>
            ) : null}

            {/* ── TRASH VIEW ── */}
            {view === 'trash' ? (
              <>
                {totalTrash === 0 ? (
                  <View style={ms.emptyBox}>
                    <MaterialIcons name="delete" size={48} color={Colors.textMuted} />
                    <Text style={ms.emptyTxt}>سلة المحذوفات فارغة</Text>
                  </View>
                ) : (
                  <>
                    <View style={ms.infoBox}>
                      <MaterialIcons name="info-outline" size={14} color={Colors.info} />
                      <Text style={ms.infoTxt}>العناصر في سلة المحذوفات يمكن استعادتها أو حذفها نهائياً. الحذف النهائي لا يمكن التراجع عنه.</Text>
                    </View>

                    {/* Trash artworks */}
                    {trashArtworks.length > 0 ? (
                      <>
                        <SectionTitle color={Colors.error}>أعمال فنية محذوفة ({trashArtworks.length})</SectionTitle>
                        {trashArtworks.map(t => (
                          <TrashRow key={t.item.id} name={t.item.title} deletedAt={t.deletedAt}
                            onRestore={() => showAlert('استعادة', `استعادة "${t.item.title}"؟`, [{ text: 'إلغاء', style: 'cancel' }, { text: 'استعادة', onPress: () => restoreArtwork(t.item.id) }])}
                            onDelete={() => showAlert('حذف نهائي', `حذف "${t.item.title}" نهائياً؟`, [{ text: 'إلغاء', style: 'cancel' }, { text: 'حذف', style: 'destructive', onPress: () => permanentDeleteArtwork(t.item.id) }])}
                          />
                        ))}
                      </>
                    ) : null}

                    {/* Trash customers */}
                    {trashCustomers.length > 0 ? (
                      <>
                        <SectionTitle color={Colors.error}>عملاء محذوفون ({trashCustomers.length})</SectionTitle>
                        {trashCustomers.map(t => (
                          <TrashRow key={t.item.id} name={t.item.name} deletedAt={t.deletedAt}
                            onRestore={() => showAlert('استعادة', `استعادة "${t.item.name}"؟`, [{ text: 'إلغاء', style: 'cancel' }, { text: 'استعادة', onPress: () => restoreCustomer(t.item.id) }])}
                            onDelete={() => showAlert('حذف نهائي', `حذف "${t.item.name}" نهائياً؟`, [{ text: 'إلغاء', style: 'cancel' }, { text: 'حذف', style: 'destructive', onPress: () => permanentDeleteCustomer(t.item.id) }])}
                          />
                        ))}
                      </>
                    ) : null}

                    {/* Trash quotes */}
                    {trashQuotes.length > 0 ? (
                      <>
                        <SectionTitle color={Colors.error}>عروض أسعار محذوفة ({trashQuotes.length})</SectionTitle>
                        {trashQuotes.map(t => (
                          <TrashRow key={t.item.id} name={`${t.item.quoteNumber} — ${t.item.customerName}`} deletedAt={t.deletedAt}
                            onRestore={() => showAlert('استعادة', `استعادة العرض "${t.item.quoteNumber}"؟`, [{ text: 'إلغاء', style: 'cancel' }, { text: 'استعادة', onPress: () => restoreQuote(t.item.id) }])}
                            onDelete={() => showAlert('حذف نهائي', `حذف العرض نهائياً؟`, [{ text: 'إلغاء', style: 'cancel' }, { text: 'حذف', style: 'destructive', onPress: () => permanentDeleteQuote(t.item.id) }])}
                          />
                        ))}
                      </>
                    ) : null}

                    {/* Trash materials */}
                    {trashMaterials.length > 0 ? (
                      <>
                        <SectionTitle color={Colors.error}>خامات محذوفة ({trashMaterials.length})</SectionTitle>
                        {trashMaterials.map(t => (
                          <TrashRow key={t.item.id} name={t.item.name} deletedAt={t.deletedAt}
                            onRestore={() => showAlert('استعادة', `استعادة "${t.item.name}"؟`, [{ text: 'إلغاء', style: 'cancel' }, { text: 'استعادة', onPress: () => restoreFullMaterial(t.item.id) }])}
                            onDelete={() => showAlert('حذف نهائي', `حذف "${t.item.name}" نهائياً؟`, [{ text: 'إلغاء', style: 'cancel' }, { text: 'حذف', style: 'destructive', onPress: () => permanentDeleteFullMaterial(t.item.id) }])}
                          />
                        ))}
                      </>
                    ) : null}

                    {/* Trash suppliers */}
                    {trashSuppliers.length > 0 ? (
                      <>
                        <SectionTitle color={Colors.error}>موردون محذوفون ({trashSuppliers.length})</SectionTitle>
                        {trashSuppliers.map(t => (
                          <TrashRow key={t.item.id} name={t.item.name} deletedAt={t.deletedAt}
                            onRestore={() => showAlert('استعادة', `استعادة "${t.item.name}"؟`, [{ text: 'إلغاء', style: 'cancel' }, { text: 'استعادة', onPress: () => restoreSupplier(t.item.id) }])}
                            onDelete={() => showAlert('حذف نهائي', `حذف "${t.item.name}" نهائياً؟`, [{ text: 'إلغاء', style: 'cancel' }, { text: 'حذف', style: 'destructive', onPress: () => permanentDeleteSupplier(t.item.id) }])}
                          />
                        ))}
                      </>
                    ) : null}
                  </>
                )}
              </>
            ) : null}

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Trash Row ─────────────────────────────────────────────────────────────
function TrashRow({ name, deletedAt, onRestore, onDelete }: { name: string; deletedAt: string; onRestore: () => void; onDelete: () => void }) {
  return (
    <View style={trow.row}>
      <View style={trow.actions}>
        <Pressable onPress={onDelete} style={[trow.btn, { backgroundColor: Colors.errorSurface }]} hitSlop={6}>
          <MaterialIcons name="delete-forever" size={16} color={Colors.error} />
        </Pressable>
        <Pressable onPress={onRestore} style={[trow.btn, { backgroundColor: Colors.successSurface }]} hitSlop={6}>
          <MaterialIcons name="restore-from-trash" size={16} color={Colors.success} />
          <Text style={{ fontSize: 10, color: Colors.success }}>استعادة</Text>
        </Pressable>
      </View>
      <View style={{ flex: 1, alignItems: 'flex-end' }}>
        <Text style={trow.name} numberOfLines={1}>{name}</Text>
        <Text style={trow.date}>{new Date(deletedAt).toLocaleDateString('ar-EG')}</Text>
      </View>
      <View style={trow.trashIcon}>
        <MaterialIcons name="delete" size={18} color={Colors.error} />
      </View>
    </View>
  );
}

const trow = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: Spacing.sm },
  trashIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.errorSurface, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.medium },
  date: { fontSize: FontSize.xs, color: Colors.textMuted },
  actions: { flexDirection: 'row', gap: Spacing.xs },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: Radius.sm },
});

const ms = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, maxHeight: '95%' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginTop: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center', marginLeft: Spacing.sm },
  headerTitle: { flex: 1, fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'right' },
  busyOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: Colors.overlay, zIndex: 100, alignItems: 'center', justifyContent: 'center', borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl },
  busyTxt: { color: Colors.textPrimary, marginTop: Spacing.md, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  content: { padding: Spacing.base, paddingBottom: Spacing.xxxl },
  adminBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.warningSurface, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.xl, borderWidth: 1, borderColor: Colors.warning + '50', justifyContent: 'center' },
  adminBannerTxt: { fontSize: FontSize.xs, color: Colors.warning, fontWeight: FontWeight.bold },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
  actionsList: { backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', marginBottom: Spacing.xl },
  actionRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: Spacing.md },
  actionIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary, textAlign: 'right' },
  actionSub: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right', marginTop: 2 },
  lastBackupBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.successSurface, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.success + '40', justifyContent: 'flex-end' },
  lastBackupTxt: { fontSize: FontSize.xs, color: Colors.success, fontWeight: FontWeight.medium },
  noBackupBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.warningSurface, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.warning + '40', justifyContent: 'flex-end' },
  noBackupTxt: { fontSize: FontSize.xs, color: Colors.warning, flex: 1, textAlign: 'right' },
  // Create backup
  nameField: { marginBottom: Spacing.base },
  nameInput: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, fontSize: FontSize.base, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.primary + '60', marginBottom: Spacing.xs },
  nameHint: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right' },
  infoBox: { flexDirection: 'row', gap: Spacing.sm, backgroundColor: Colors.infoSurface, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.base, borderWidth: 1, borderColor: Colors.info + '40', alignItems: 'flex-start' },
  infoTxt: { flex: 1, fontSize: FontSize.xs, color: Colors.info, textAlign: 'right' },
  createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.success, borderRadius: Radius.lg, paddingVertical: Spacing.base, marginBottom: Spacing.base },
  createBtnTxt: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#fff' },
  // Restore
  restoreInfoCard: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.lg, padding: Spacing.base, marginBottom: Spacing.xl, borderWidth: 1, borderColor: Colors.border },
  restoreInfoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  restoreInfoLbl: { fontSize: FontSize.xs, color: Colors.textMuted },
  restoreInfoVal: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.semibold, flex: 1, textAlign: 'right' },
  mergeRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  mergeBtn: { flex: 1, padding: Spacing.md, borderRadius: Radius.md, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  mergeBtnActive: { backgroundColor: Colors.primarySurface, borderColor: Colors.primary },
  mergeBtnTxt: { fontSize: FontSize.sm, color: Colors.textSecondary },
  mergeBtnSub: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2, textAlign: 'center' },
  selectTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary, textAlign: 'right', marginBottom: Spacing.sm },
  noFileBox: { alignItems: 'center', paddingVertical: Spacing.xxxl },
  noFileTxt: { color: Colors.textMuted, fontSize: FontSize.base, marginTop: Spacing.md },
  pickFileBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, marginTop: Spacing.xl },
  pickFileBtnTxt: { color: Colors.textOnPrimary, fontWeight: FontWeight.bold, fontSize: FontSize.sm },
  // History
  clearHistBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginBottom: Spacing.md, backgroundColor: Colors.errorSurface, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 8 },
  histCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.base, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  histTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  histTypeBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.full },
  histName: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'right' },
  histDate: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right' },
  histStats: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  histStat: { alignItems: 'center', backgroundColor: Colors.surfaceElevated, borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  histStatVal: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary },
  histStatLbl: { fontSize: 9, color: Colors.textMuted },
  // Settings
  settingsHint: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right', marginBottom: Spacing.md },
  autoBackupRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  autoBtn: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md, borderRadius: Radius.md, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border },
  autoBtnActive: { backgroundColor: Colors.primarySurface, borderColor: Colors.primary },
  autoBtnTxt: { fontSize: FontSize.sm, color: Colors.textSecondary },
  // Empty
  emptyBox: { alignItems: 'center', paddingVertical: Spacing.xxxl },
  emptyTxt: { color: Colors.textMuted, fontSize: FontSize.base, marginTop: Spacing.md },
});
