// Powered by OnSpace.AI
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, ScrollView, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useApp } from '@/hooks/useApp';
import { useAlert } from '@/template';
import { useLanguage } from '@/contexts/LanguageContext';
import { Material } from '@/contexts/AppContext';
import { globalStyles } from '@/constants/styles';
import { isTablet, pagePadding } from '@/constants/responsive';

const PRESET_COLORS = [
  '#C9A84C', '#4CAF82', '#6A9FE8', '#E86A6A', '#E8A44A',
  '#A084E8', '#E88AAA', '#84C9E8', '#8AE8A0', '#E8D884',
];

type UnitType = 'meter' | 'sheet' | 'kg' | 'gram' | 'box' | 'liter' | 'piece' | 'roll';

const UNIT_OPTIONS: { key: UnitType; label: string; short: string }[] = [
  { key: 'meter', label: 'متر', short: 'م' },
  { key: 'sheet', label: 'لوح', short: 'لوح' },
  { key: 'kg', label: 'كيلوجرام', short: 'كجم' },
  { key: 'gram', label: 'جرام', short: 'جم' },
  { key: 'box', label: 'علبة', short: 'علبة' },
  { key: 'liter', label: 'لتر', short: 'لتر' },
  { key: 'piece', label: 'قطعة', short: 'قطعة' },
  { key: 'roll', label: 'رول', short: 'رول' },
];

function getUnitLabel(key?: string) {
  return UNIT_OPTIONS.find(u => u.key === key)?.label || 'وحدة';
}
function getUnitShort(key?: string) {
  return UNIT_OPTIONS.find(u => u.key === key)?.short || 'وحدة';
}

interface MaterialFormProps {
  material?: Material | null;
  onSave: (data: Omit<Material, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

function MaterialForm({ material, onSave, onClose }: MaterialFormProps) {
  const [name, setName] = useState(material?.name || '');
  const [description, setDescription] = useState(material?.description || '');
  const [color, setColor] = useState(material?.color || PRESET_COLORS[0]);
  const [supplier, setSupplier] = useState(material?.supplier || '');
  const [notes, setNotes] = useState(material?.notes || '');
  const [unitType, setUnitType] = useState<UnitType>((material?.unitType as UnitType) || 'piece');
  const [unitPrice, setUnitPrice] = useState(material?.unitPrice?.toString() || '');
  const [stock, setStock] = useState(material?.stock?.toString() || '');

  const selectedUnit = UNIT_OPTIONS.find(u => u.key === unitType);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.formContent}
    >
      <Input label="اسم الخامة *" value={name} onChangeText={setName} placeholder="مثال: طلاء، إضاءة LED، رخام..." />
      <Input label="الوصف" value={description} onChangeText={setDescription} placeholder="وصف الخامة وخصائصها..." multiline numberOfLines={3} />
      <Input label="المورد / المصدر" value={supplier} onChangeText={setSupplier} placeholder="اسم الشركة أو المورد" />

      <Text style={styles.fieldLabel}>وحدة القياس</Text>
      <View style={styles.unitsGrid}>
        {UNIT_OPTIONS.map(u => (
          <Pressable
            key={u.key}
            onPress={() => setUnitType(u.key)}
            style={[styles.unitChip, unitType === u.key && styles.unitChipActive]}
          >
            <Text style={[styles.unitChipText, unitType === u.key && styles.unitChipTextActive]}>{u.label}</Text>
            <Text style={[styles.unitChipShort, unitType === u.key && styles.unitChipShortActive]}>{u.short}</Text>
          </Pressable>
        ))}
      </View>

      <Input
        label={`سعر الوحدة (ج.م / ${selectedUnit?.label})`}
        value={unitPrice}
        onChangeText={setUnitPrice}
        placeholder="0.00"
        keyboardType="numeric"
      />
      <Input
        label={`الكمية المتاحة (${selectedUnit?.short})`}
        value={stock}
        onChangeText={setStock}
        placeholder="0"
        keyboardType="numeric"
      />

      <Text style={styles.fieldLabel}>اللون التعريفي</Text>
      <View style={styles.colorsRow}>
        {PRESET_COLORS.map(c => (
          <Pressable
            key={c}
            onPress={() => setColor(c)}
            style={[styles.colorCircle, { backgroundColor: c }, color === c && styles.colorCircleActive]}
          >
            {color === c && <MaterialIcons name="check" size={14} color="#fff" />}
          </Pressable>
        ))}
      </View>

      <Input label="ملاحظات إضافية" value={notes} onChangeText={setNotes} placeholder="تعليمات الاستخدام، التخزين..." multiline numberOfLines={2} />

      <View style={styles.btnRow}>
        <Button title="إلغاء" onPress={onClose} variant="ghost" style={styles.half} />
        <Button
          title={material ? 'حفظ التعديلات' : 'إضافة الخامة'}
          onPress={() => {
            if (!name.trim()) return;
            onSave({
              name: name.trim(), description, color, supplier, notes,
              unitType, unitPrice: unitPrice ? Number(unitPrice) : 0,
              stock: stock ? Number(stock) : 0,
            });
          }}
          style={styles.half}
        />
      </View>
    </ScrollView>
  );
}

export default function MaterialsScreen() {
  const { materials, addMaterial, updateMaterial, deleteMaterial } = useApp();
  const { showAlert } = useAlert();
  const { currency } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [search, setSearch] = useState('');

  const filtered = materials.filter(m =>
    !search || m.name.includes(search) || (m.supplier || '').includes(search)
  );

  const totalStockValue = materials.reduce((sum, m) => sum + (m.unitPrice || 0) * (m.stock || 0), 0);

  function openForm(mat: Material | null) {
    setEditing(mat);
    setFormKey(k => k + 1);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  function handleDelete(m: Material) {
    showAlert('حذف الخامة', `هل تريد حذف "${m.name}"؟`, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: () => deleteMaterial(m.id) },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => openForm(null)} style={styles.addBtn}>
          <MaterialIcons name="add" size={22} color={Colors.textOnPrimary} />
        </Pressable>
        <Text style={styles.title}>إدارة الخامات</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{materials.length}</Text>
          <Text style={styles.statLabel}>إجمالي الخامات</Text>
        </View>
        <View style={[styles.statCard, { borderColor: Colors.primary + '50' }]}>
          <Text style={[styles.statValue, { color: Colors.primary }]}>{totalStockValue.toLocaleString()}</Text>
          <Text style={styles.statLabel}>قيمة المخزون ({currency})</Text>
        </View>
        <View style={[styles.statCard, { borderColor: Colors.success + '50' }]}>
          <Text style={[styles.statValue, { color: Colors.success }]}>
            {materials.filter(m => (m.stock || 0) > 0).length}
          </Text>
          <Text style={styles.statLabel}>خامات متوفرة</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <MaterialIcons name="search" size={20} color={Colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="ابحث عن خامة..."
          placeholderTextColor={Colors.textMuted}
          style={styles.searchInput}
          textAlign="right"
        />
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={m => m.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="layers" size={56} color={Colors.textMuted} />
            <Text style={styles.emptyText}>لا توجد خامات بعد</Text>
            <Text style={styles.emptySubText}>اضغط + لإضافة أول خامة</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.materialCard}>
            <View style={styles.materialHeader}>
              <View style={styles.materialActions}>
                <Pressable onPress={() => handleDelete(item)} style={[styles.iconBtn, styles.deleteSmall]} hitSlop={8}>
                  <MaterialIcons name="delete-outline" size={16} color={Colors.error} />
                </Pressable>
                <Pressable onPress={() => openForm(item)} style={[styles.iconBtn, styles.editSmall]} hitSlop={8}>
                  <MaterialIcons name="edit" size={16} color={Colors.primary} />
                </Pressable>
              </View>
              <View style={styles.materialInfo}>
                <View style={styles.materialNameRow}>
                  <View style={[styles.colorDot, { backgroundColor: item.color || Colors.primary }]} />
                  <Text style={styles.materialName}>{item.name}</Text>
                </View>
                {item.supplier ? <Text style={styles.materialSupplier}>{item.supplier}</Text> : null}
              </View>
            </View>

            <View style={styles.unitPriceRow}>
              {item.unitType ? (
                <View style={styles.unitBadge}>
                  <MaterialIcons name="straighten" size={12} color={Colors.info} />
                  <Text style={styles.unitBadgeText}>{getUnitLabel(item.unitType)}</Text>
                </View>
              ) : null}
              {item.unitPrice ? (
                <View style={styles.priceBadge}>
                  <Text style={styles.priceBadgeText}>{item.unitPrice.toLocaleString()} {currency} / {getUnitShort(item.unitType)}</Text>
                </View>
              ) : null}
              {item.stock ? (
                <View style={styles.stockBadge}>
                  <MaterialIcons name="inventory" size={12} color={Colors.success} />
                  <Text style={styles.stockBadgeText}>{item.stock} {getUnitShort(item.unitType)}</Text>
                </View>
              ) : null}
            </View>

            {item.description ? (
              <Text style={styles.materialDesc} numberOfLines={2}>{item.description}</Text>
            ) : null}
            {item.notes ? (
              <Text style={styles.materialNotes} numberOfLines={1}>{item.notes}</Text>
            ) : null}
          </View>
        )}
      />

      {/* Form Modal */}
      <Modal
        visible={showForm}
        transparent
        animationType="slide"
        onRequestClose={closeForm}
      >
        <KeyboardAvoidingView
          style={styles.kavWrapper}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={styles.modalOverlay} onPress={closeForm} />
          <View style={styles.formSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Pressable onPress={closeForm} style={styles.backBtn}>
                <MaterialIcons name="arrow-back" size={20} color={Colors.textSecondary} />
                <Text style={styles.backBtnText}>رجوع</Text>
              </Pressable>
              <Text style={styles.modalTitle}>{editing ? 'تعديل الخامة' : 'خامة جديدة'}</Text>
            </View>
            <MaterialForm
              key={formKey}
              material={editing}
              onSave={async data => {
                if (editing) await updateMaterial(editing.id, data);
                else await addMaterial(data);
                closeForm();
              }}
              onClose={closeForm}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  addBtn: {
    width: isTablet ? 48 : 40, height: isTablet ? 48 : 40,
    borderRadius: isTablet ? 24 : 20,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, padding: pagePadding, paddingBottom: Spacing.sm },
  statCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  statValue: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2, textAlign: 'center' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, marginHorizontal: Spacing.base, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, paddingVertical: Spacing.md, fontSize: FontSize.base, color: Colors.textPrimary, marginRight: Spacing.sm },
  listContent: { padding: Spacing.base, paddingTop: Spacing.sm },
  empty: { alignItems: 'center', paddingVertical: 60, gap: Spacing.md },
  emptyText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textSecondary },
  emptySubText: { fontSize: FontSize.sm, color: Colors.textMuted },
  materialCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.base, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border, ...Shadow.sm,
  },
  materialHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  materialInfo: { flex: 1, alignItems: 'flex-end' },
  materialNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  materialName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  materialSupplier: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2, textAlign: 'right' },
  materialActions: { flexDirection: 'row', gap: Spacing.sm },
  iconBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  editSmall: { backgroundColor: Colors.primarySurface, borderColor: Colors.primary + '60' },
  deleteSmall: { backgroundColor: Colors.errorSurface, borderColor: Colors.error + '60' },
  unitPriceRow: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'flex-end', flexWrap: 'wrap', marginBottom: Spacing.sm },
  unitBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.infoSurface, borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 3, borderWidth: 1, borderColor: Colors.info + '40',
  },
  unitBadgeText: { fontSize: 11, color: Colors.info, fontWeight: FontWeight.medium },
  priceBadge: {
    backgroundColor: Colors.primarySurface, borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 3, borderWidth: 1, borderColor: Colors.primary + '40',
  },
  priceBadgeText: { fontSize: 11, color: Colors.primary, fontWeight: FontWeight.bold },
  stockBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.successSurface, borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 3, borderWidth: 1, borderColor: Colors.success + '40',
  },
  stockBadgeText: { fontSize: 11, color: Colors.success, fontWeight: FontWeight.medium },
  materialDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'right', lineHeight: 20 },
  materialNotes: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right', marginTop: 4, fontStyle: 'italic' },
  // Modal
  kavWrapper: { flex: 1, justifyContent: 'flex-end' },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay },
  formSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    paddingHorizontal: Spacing.base,
    maxHeight: '90%',
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: Colors.border,
    borderRadius: Radius.full, alignSelf: 'center', marginVertical: Spacing.md,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.base,
  },
  modalTitle: {
    fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'center',
  },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.surfaceElevated, borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  backBtnText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  // Form fields
  formContent: { paddingBottom: Spacing.xxxl },
  fieldLabel: {
    fontSize: FontSize.sm, fontWeight: FontWeight.medium,
    color: Colors.textSecondary, textAlign: 'right',
    marginBottom: Spacing.sm, marginTop: Spacing.sm,
  },
  unitsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.base, justifyContent: 'flex-end' },
  unitChip: {
    alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.full, backgroundColor: Colors.surfaceElevated,
    borderWidth: 1, borderColor: Colors.border, minWidth: 60,
  },
  unitChipActive: { backgroundColor: Colors.primarySurface, borderColor: Colors.primary },
  unitChipText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  unitChipTextActive: { color: Colors.primary, fontWeight: FontWeight.bold },
  unitChipShort: { fontSize: 10, color: Colors.textMuted },
  unitChipShortActive: { color: Colors.primary },
  colorsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.base, justifyContent: 'flex-end' },
  colorCircle: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  colorCircleActive: { borderColor: Colors.textPrimary, transform: [{ scale: 1.15 }] },
  btnRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.base },
  half: { flex: 1 },
});
