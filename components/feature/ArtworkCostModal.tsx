// Powered by OnSpace.AI
import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, Modal, ScrollView, StyleSheet, Pressable,
  TextInput, KeyboardAvoidingView, Platform, Dimensions, Switch, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { ArtworkCostSheet, CostMaterialItem, FullMaterial } from '@/contexts/AppContext';

const SCREEN_H = Dimensions.get('window').height;

interface ArtworkCostModalProps {
  visible: boolean;
  artworkId: string;
  artworkTitle: string;
  onClose: () => void;
}

// Add material row
function AddMaterialRow({ fullMaterials, onAdd }: { fullMaterials: FullMaterial[]; onAdd: (item: Omit<CostMaterialItem, 'id'>) => void }) {
  const [matId, setMatId] = useState('');
  const [typeId, setTypeId] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [showMatList, setShowMatList] = useState(false);
  const [matSearch, setMatSearch] = useState('');

  const filteredMats = fullMaterials.filter(m => !matSearch || m.name.includes(matSearch));
  const selectedMat = fullMaterials.find(m => m.id === matId);
  const selectedType = selectedMat?.types?.find(t => t.id === typeId);

  function selectMaterial(m: FullMaterial) {
    setMatId(m.id); setTypeId('');
    setUnit(m.purchaseUnit || 'كيلو');
    setUnitPrice(m.unitPrice?.toString() || '0');
    setShowMatList(false); setMatSearch('');
  }

  function selectType(t: any) {
    setTypeId(t.id);
    setUnit(t.unit || unit);
    setUnitPrice(t.unitPrice?.toString() || unitPrice);
  }

  function handleAdd() {
    if (!matId || !qty || isNaN(Number(qty)) || Number(qty) <= 0) {
      Alert.alert('خطأ', 'اختر الخامة وأدخل الكمية'); return;
    }
    const q = parseFloat(qty);
    const p = parseFloat(unitPrice) || 0;
    onAdd({
      materialId: matId,
      materialName: selectedMat?.name || '',
      typeId: typeId,
      typeName: selectedType?.name || '',
      quantity: q, unit, unitPrice: p, total: q * p,
    });
    setMatId(''); setTypeId(''); setQty(''); setUnit(''); setUnitPrice('');
  }

  return (
    <View style={amr.container}>
      <Text style={amr.sectionTitle}>+ إضافة خامة</Text>
      {/* Material Selector */}
      <Pressable onPress={() => setShowMatList(true)} style={amr.matSelector}>
        <MaterialIcons name="arrow-drop-down" size={20} color={Colors.textMuted} />
        <Text style={[amr.matSelectorText, matId && { color: Colors.textPrimary }]} numberOfLines={1}>
          {selectedMat?.name || 'اختر الخامة...'}
        </Text>
      </Pressable>

      {/* Material list dropdown */}
      {showMatList ? (
        <View style={amr.matDropdown}>
          <TextInput
            value={matSearch} onChangeText={setMatSearch}
            placeholder="بحث..." placeholderTextColor={Colors.textMuted}
            style={amr.matSearch} textAlign="right"
          />
          <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
            {filteredMats.map(m => (
              <Pressable key={m.id} onPress={() => selectMaterial(m)} style={amr.matItem}>
                <Text style={amr.matItemPrice}>{m.unitPrice?.toLocaleString() || 0} ج.م/{m.purchaseUnit}</Text>
                <Text style={amr.matItemName}>{m.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* Type selector */}
      {selectedMat?.types?.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.sm }}>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            {selectedMat.types.map(t => (
              <Pressable key={t.id} onPress={() => selectType(t)} style={[amr.typeChip, typeId === t.id && amr.typeChipActive]}>
                <Text style={[amr.typeChipText, typeId === t.id && amr.typeChipTextActive]}>{t.name}</Text>
                {t.unitPrice ? <Text style={[amr.typeChipPrice, typeId === t.id && { color: Colors.primary }]}>{t.unitPrice} ج.م</Text> : null}
              </Pressable>
            ))}
          </View>
        </ScrollView>
      ) : null}

      {/* Qty + Unit + Price */}
      <View style={amr.row}>
        <View style={{ flex: 1 }}>
          <Text style={amr.fieldLabel}>سعر/وحدة (ج.م)</Text>
          <TextInput value={unitPrice} onChangeText={setUnitPrice} keyboardType="decimal-pad" style={amr.numInput} textAlign="right" placeholder="0" placeholderTextColor={Colors.textMuted} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={amr.fieldLabel}>الوحدة</Text>
          <TextInput value={unit} onChangeText={setUnit} style={amr.numInput} textAlign="right" placeholder="كيلو" placeholderTextColor={Colors.textMuted} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={amr.fieldLabel}>الكمية *</Text>
          <TextInput value={qty} onChangeText={setQty} keyboardType="decimal-pad" style={amr.numInput} textAlign="right" placeholder="0" placeholderTextColor={Colors.textMuted} />
        </View>
      </View>

      {/* Subtotal preview */}
      {qty && unitPrice && !isNaN(Number(qty)) && !isNaN(Number(unitPrice)) ? (
        <Text style={amr.subtotalPreview}>
          الإجمالي: {(parseFloat(qty) * parseFloat(unitPrice)).toLocaleString()} ج.م
        </Text>
      ) : null}

      <Pressable onPress={handleAdd} style={amr.addBtn}>
        <MaterialIcons name="add" size={18} color={Colors.textOnPrimary} />
        <Text style={amr.addBtnText}>إضافة للقائمة</Text>
      </Pressable>
    </View>
  );
}

const amr = StyleSheet.create({
  container: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.base, borderWidth: 1, borderColor: Colors.border },
  sectionTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary, textAlign: 'right', marginBottom: Spacing.md },
  matSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm },
  matSelectorText: { flex: 1, textAlign: 'right', fontSize: FontSize.sm, color: Colors.textMuted },
  matDropdown: { backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.primary + '60', marginBottom: Spacing.sm, overflow: 'hidden' },
  matSearch: { padding: Spacing.sm, fontSize: FontSize.sm, color: Colors.textPrimary, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surfaceElevated },
  matItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  matItemName: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.medium },
  matItemPrice: { fontSize: FontSize.xs, color: Colors.primary },
  typeChip: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  typeChipActive: { backgroundColor: Colors.primarySurface, borderColor: Colors.primary },
  typeChipText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  typeChipTextActive: { color: Colors.primary },
  typeChipPrice: { fontSize: 9, color: Colors.textMuted, marginTop: 1 },
  row: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  fieldLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'right', marginBottom: 4 },
  numInput: { backgroundColor: Colors.card, borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, fontSize: FontSize.sm, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },
  subtotalPreview: { fontSize: FontSize.sm, color: Colors.primary, textAlign: 'right', fontWeight: FontWeight.bold, marginBottom: Spacing.sm },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: Spacing.md },
  addBtnText: { fontSize: FontSize.sm, color: Colors.textOnPrimary, fontWeight: FontWeight.bold },
});

// ──────────────────────────────────────────────
// Cost field row
// ──────────────────────────────────────────────
function CostField({ label, value, onChange, icon }: { label: string; value: string; onChange: (v: string) => void; icon?: any }) {
  return (
    <View style={cf.row}>
      <TextInput value={value} onChangeText={onChange} keyboardType="decimal-pad" style={cf.input} textAlign="right" placeholder="0" placeholderTextColor={Colors.textMuted} />
      <Text style={cf.suffix}>ج.م</Text>
      <View style={cf.labelWrap}>
        {icon ? <MaterialIcons name={icon} size={16} color={Colors.textMuted} /> : null}
        <Text style={cf.label}>{label}</Text>
      </View>
    </View>
  );
}

const cf = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  labelWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'flex-end' },
  label: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'right', fontWeight: FontWeight.medium },
  input: { width: 100, backgroundColor: Colors.surfaceElevated, borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, fontSize: FontSize.sm, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },
  suffix: { fontSize: FontSize.xs, color: Colors.textMuted },
});

// ──────────────────────────────────────────────
// Main Modal
// ──────────────────────────────────────────────
export function ArtworkCostModal({ visible, artworkId, artworkTitle, onClose }: ArtworkCostModalProps) {
  const { fullMaterials, getArtworkCosts, getLatestCost, addArtworkCost, updateArtworkCost } = useApp();

  const existingCosts = getArtworkCosts(artworkId);
  const latestCost = getLatestCost(artworkId);

  const [matItems, setMatItems] = useState<CostMaterialItem[]>([]);
  const [laborCost, setLaborCost] = useState('');
  const [externalCost, setExternalCost] = useState('');
  const [paintingCost, setPaintingCost] = useState('');
  const [electricalCost, setElectricalCost] = useState('');
  const [transportCost, setTransportCost] = useState('');
  const [packagingCost, setPackagingCost] = useState('');
  const [installationCost, setInstallationCost] = useState('');
  const [otherCost, setOtherCost] = useState('');
  const [emergencyCost, setEmergencyCost] = useState('');
  const [profitPct, setProfitPct] = useState('30');
  const [discountPct, setDiscountPct] = useState('0');
  const [taxPct, setTaxPct] = useState('0');
  const [deliveryCost, setDeliveryCost] = useState('');
  const [installationPriceCost, setInstallationPriceCost] = useState('');
  const [showToCustomer, setShowToCustomer] = useState(false);
  const [costNotes, setCostNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [editingCostId, setEditingCostId] = useState<string | null>(null);

  useEffect(() => {
    if (visible && latestCost) {
      loadCostData(latestCost);
    } else if (visible) {
      resetForm();
    }
  }, [visible, artworkId]);

  function loadCostData(cost: ArtworkCostSheet) {
    setEditingCostId(cost.id);
    setMatItems(cost.materialItems || []);
    setLaborCost(cost.laborCost?.toString() || '');
    setExternalCost(cost.externalManufacturingCost?.toString() || '');
    setPaintingCost(cost.paintingCost?.toString() || '');
    setElectricalCost(cost.electricalCost?.toString() || '');
    setTransportCost(cost.transportCost?.toString() || '');
    setPackagingCost(cost.packagingCost?.toString() || '');
    setInstallationCost(cost.installationCost?.toString() || '');
    setOtherCost(cost.otherCost?.toString() || '');
    setEmergencyCost(cost.emergencyCost?.toString() || '');
    setProfitPct(cost.profitPercentage?.toString() || '30');
    setDiscountPct(cost.discountPercentage?.toString() || '0');
    setTaxPct(cost.taxPercentage?.toString() || '0');
    setDeliveryCost(cost.deliveryCost?.toString() || '');
    setInstallationPriceCost(cost.installationPriceCost?.toString() || '');
    setShowToCustomer(cost.showPriceToCustomer || false);
    setCostNotes(cost.notes || '');
  }

  function resetForm() {
    setEditingCostId(null); setMatItems([]);
    setLaborCost(''); setExternalCost(''); setPaintingCost('');
    setElectricalCost(''); setTransportCost(''); setPackagingCost('');
    setInstallationCost(''); setOtherCost(''); setEmergencyCost('');
    setProfitPct('30'); setDiscountPct('0'); setTaxPct('0');
    setDeliveryCost(''); setInstallationPriceCost('');
    setShowToCustomer(false); setCostNotes('');
  }

  function n(v: string) { return parseFloat(v) || 0; }

  // Calculations
  const totalMatCost = matItems.reduce((s, i) => s + i.total, 0);
  const totalProdCost = totalMatCost + n(laborCost) + n(externalCost) + n(paintingCost) +
    n(electricalCost) + n(transportCost) + n(packagingCost) + n(installationCost) + n(otherCost) + n(emergencyCost);
  const profitAmount = totalProdCost * (n(profitPct) / 100);
  const suggestedPrice = totalProdCost + profitAmount;
  const discountAmount = suggestedPrice * (n(discountPct) / 100);
  const taxAmount = suggestedPrice * (n(taxPct) / 100);
  const finalPrice = suggestedPrice - discountAmount + taxAmount + n(deliveryCost) + n(installationPriceCost);

  function removeMatItem(id: string) { setMatItems(prev => prev.filter(i => i.id !== id)); }

  function handleSave() {
    const costData: Omit<ArtworkCostSheet, 'id' | 'createdAt'> = {
      artworkId, version: existingCosts.length + (editingCostId ? 0 : 1),
      date: new Date().toISOString(),
      materialItems: matItems,
      laborCost: n(laborCost), externalManufacturingCost: n(externalCost),
      paintingCost: n(paintingCost), electricalCost: n(electricalCost),
      transportCost: n(transportCost), packagingCost: n(packagingCost),
      installationCost: n(installationCost), otherCost: n(otherCost), emergencyCost: n(emergencyCost),
      totalMaterialCost: totalMatCost, totalProductionCost: totalProdCost,
      profitPercentage: n(profitPct), profitAmount,
      suggestedPrice, discountPercentage: n(discountPct), discountAmount,
      finalPrice, taxPercentage: n(taxPct), taxAmount,
      deliveryCost: n(deliveryCost), installationPriceCost: n(installationPriceCost),
      showPriceToCustomer: showToCustomer, notes: costNotes,
    };
    if (editingCostId) updateArtworkCost(editingCostId, costData);
    else addArtworkCost(costData);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.overlay}>
          <View style={[s.sheet, { height: SCREEN_H * 0.95 }]}>
            <View style={s.handle} />
            {/* Header */}
            <View style={s.header}>
              <View style={s.headerLeft}>
                <Pressable
                  onPress={() => { resetForm(); setActiveTab('new'); }}
                  style={[s.tabBtn, activeTab === 'new' && s.tabBtnActive]}
                >
                  <Text style={[s.tabBtnText, activeTab === 'new' && s.tabBtnTextActive]}>حاسبة التكلفة</Text>
                </Pressable>
                <Pressable
                  onPress={() => setActiveTab('history')}
                  style={[s.tabBtn, activeTab === 'history' && s.tabBtnActive]}
                >
                  <Text style={[s.tabBtnText, activeTab === 'history' && s.tabBtnTextActive]}>
                    السجل ({existingCosts.length})
                  </Text>
                </Pressable>
              </View>
              <Pressable onPress={onClose} style={s.closeBtn}>
                <MaterialIcons name="close" size={22} color={Colors.textSecondary} />
              </Pressable>
            </View>
            {/* Title */}
            <View style={s.titleBar}>
              <View style={s.adminBadge}>
                <MaterialIcons name="lock" size={12} color={Colors.warning} />
                <Text style={s.adminBadgeText}>للمشرف فقط</Text>
              </View>
              <Text style={s.title} numberOfLines={1}>{artworkTitle}</Text>
            </View>

            {activeTab === 'history' ? (
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: Spacing.base }}>
                {existingCosts.length === 0 ? (
                  <View style={{ alignItems: 'center', padding: Spacing.xxxl }}>
                    <MaterialIcons name="history" size={48} color={Colors.textMuted} />
                    <Text style={{ color: Colors.textMuted, marginTop: Spacing.md }}>لا يوجد سجل تكاليف بعد</Text>
                  </View>
                ) : (
                  existingCosts.map(c => (
                    <Pressable key={c.id} onPress={() => { loadCostData(c); setActiveTab('new'); }} style={s.historyCard}>
                      <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <Text style={s.historyVersion}>نسخة #{c.version} — {new Date(c.date).toLocaleDateString('ar-EG')}</Text>
                        <Text style={s.historyTotal}>تكلفة: {c.totalProductionCost?.toLocaleString() || 0} ج.م</Text>
                        <Text style={s.historyFinal}>سعر نهائي: {c.finalPrice?.toLocaleString() || 0} ج.م</Text>
                      </View>
                      <View style={{ alignItems: 'center' }}>
                        <Text style={s.historyProfit}>+{c.profitPercentage || 0}%</Text>
                        <Text style={s.historyProfitLabel}>ربح</Text>
                      </View>
                    </Pressable>
                  ))
                )}
              </ScrollView>
            ) : (
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: Spacing.base }} keyboardShouldPersistTaps="handled">
                {/* Materials */}
                <SectionTitle>الخامات المستخدمة</SectionTitle>
                {matItems.length > 0 ? (
                  <View style={s.matTable}>
                    <View style={s.matTableHeader}>
                      <Text style={s.matTableHead}>الإجمالي</Text>
                      <Text style={s.matTableHead}>سعر/وحدة</Text>
                      <Text style={s.matTableHead}>الكمية</Text>
                      <Text style={[s.matTableHead, { flex: 2 }]}>الخامة</Text>
                    </View>
                    {matItems.map(item => (
                      <View key={item.id} style={s.matRow}>
                        <Text style={s.matTotal}>{item.total.toLocaleString()}</Text>
                        <Text style={s.matCell}>{item.unitPrice} ج.م/{item.unit}</Text>
                        <Text style={s.matCell}>{item.quantity}</Text>
                        <View style={{ flex: 2, alignItems: 'flex-end' }}>
                          <Text style={s.matName} numberOfLines={1}>{item.materialName}</Text>
                          {item.typeName ? <Text style={s.matType}>{item.typeName}</Text> : null}
                        </View>
                        <Pressable onPress={() => removeMatItem(item.id)} hitSlop={8} style={{ paddingHorizontal: 4 }}>
                          <MaterialIcons name="remove-circle-outline" size={18} color={Colors.error} />
                        </Pressable>
                      </View>
                    ))}
                    <View style={s.matFooter}>
                      <Text style={s.matFooterTotal}>{totalMatCost.toLocaleString()} ج.م</Text>
                      <Text style={s.matFooterLabel}>إجمالي الخامات</Text>
                    </View>
                  </View>
                ) : null}

                {fullMaterials.length > 0 ? (
                  <AddMaterialRow
                    fullMaterials={fullMaterials}
                    onAdd={(item) => setMatItems(prev => [...prev, { ...item, id: Date.now().toString() }])}
                  />
                ) : (
                  <View style={s.noMatsWarning}>
                    <MaterialIcons name="info-outline" size={18} color={Colors.warning} />
                    <Text style={s.noMatsText}>لا توجد خامات مسجلة — أضف خامات أولاً في صفحة إدارة الخامات</Text>
                  </View>
                )}

                {/* Additional Costs */}
                <SectionTitle>التكاليف الإضافية</SectionTitle>
                <CostField label="عمالة" value={laborCost} onChange={setLaborCost} icon="people" />
                <CostField label="تصنيع خارجي" value={externalCost} onChange={setExternalCost} icon="factory" />
                <CostField label="دهان وتشطيب" value={paintingCost} onChange={setPaintingCost} icon="format-paint" />
                <CostField label="كهربائي" value={electricalCost} onChange={setElectricalCost} icon="electrical-services" />
                <CostField label="نقل وشحن" value={transportCost} onChange={setTransportCost} icon="local-shipping" />
                <CostField label="تغليف" value={packagingCost} onChange={setPackagingCost} icon="inventory" />
                <CostField label="تركيب" value={installationCost} onChange={setInstallationCost} icon="build" />
                <CostField label="مصاريف أخرى" value={otherCost} onChange={setOtherCost} icon="more-horiz" />
                <CostField label="طوارئ" value={emergencyCost} onChange={setEmergencyCost} icon="warning" />

                {/* Summary */}
                <View style={s.summaryCard}>
                  <SummaryRow label="إجمالي الخامات" value={totalMatCost} />
                  <SummaryRow label="إجمالي التكلفة الإنتاجية" value={totalProdCost} highlight />

                  <View style={s.divider} />
                  <SectionTitle>التسعير</SectionTitle>

                  <View style={s.pricingRow}>
                    <TextInput value={profitPct} onChangeText={setProfitPct} keyboardType="decimal-pad" style={s.pctInput} textAlign="center" />
                    <Text style={s.pctSuffix}>%</Text>
                    <Text style={s.pricingLabel}>نسبة الربح</Text>
                  </View>
                  <SummaryRow label="قيمة الربح" value={profitAmount} color={Colors.success} />
                  <SummaryRow label="السعر المقترح" value={suggestedPrice} highlight color={Colors.primary} />

                  <View style={s.pricingRow}>
                    <TextInput value={discountPct} onChangeText={setDiscountPct} keyboardType="decimal-pad" style={s.pctInput} textAlign="center" />
                    <Text style={s.pctSuffix}>%</Text>
                    <Text style={s.pricingLabel}>الخصم</Text>
                  </View>
                  {discountAmount > 0 ? <SummaryRow label="قيمة الخصم" value={-discountAmount} color={Colors.warning} /> : null}

                  <View style={s.pricingRow}>
                    <TextInput value={taxPct} onChangeText={setTaxPct} keyboardType="decimal-pad" style={s.pctInput} textAlign="center" />
                    <Text style={s.pctSuffix}>%</Text>
                    <Text style={s.pricingLabel}>ضريبة</Text>
                  </View>
                  <CostField label="توصيل" value={deliveryCost} onChange={setDeliveryCost} />
                  <CostField label="تركيب (للعميل)" value={installationPriceCost} onChange={setInstallationPriceCost} />

                  <View style={s.divider} />
                  <SummaryRow label="السعر النهائي" value={finalPrice} highlight size="xl" color={Colors.primary} />
                </View>

                {/* Show to customer */}
                <View style={s.switchRow}>
                  <Switch value={showToCustomer} onValueChange={setShowToCustomer}
                    trackColor={{ false: Colors.border, true: Colors.primarySurface }}
                    thumbColor={showToCustomer ? Colors.primary : Colors.textMuted} />
                  <Text style={s.switchLabel}>عرض السعر للعميل</Text>
                </View>

                {/* Notes */}
                <Text style={s.fieldLabel}>ملاحظات</Text>
                <TextInput value={costNotes} onChangeText={setCostNotes} multiline style={s.notesInput} textAlign="right" placeholder="ملاحظات على حساب التكلفة..." placeholderTextColor={Colors.textMuted} />

                {/* Save */}
                <Pressable onPress={handleSave} style={s.saveBtn}>
                  <MaterialIcons name="save" size={20} color={Colors.textOnPrimary} />
                  <Text style={s.saveBtnText}>{editingCostId ? 'تحديث حساب التكلفة' : 'حفظ حساب التكلفة'}</Text>
                </Pressable>
                {editingCostId ? (
                  <Pressable onPress={() => { resetForm(); }} style={s.newVersionBtn}>
                    <MaterialIcons name="add" size={16} color={Colors.primary} />
                    <Text style={s.newVersionBtnText}>إنشاء نسخة جديدة</Text>
                  </Pressable>
                ) : null}
              </ScrollView>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary, textAlign: 'right', marginBottom: Spacing.md, marginTop: Spacing.sm, borderRightWidth: 3, borderRightColor: Colors.primary, paddingRight: Spacing.sm }}>
      {children}
    </Text>
  );
}

function SummaryRow({ label, value, highlight, color, size }: { label: string; value: number; highlight?: boolean; color?: string; size?: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
      <Text style={{ fontSize: size === 'xl' ? FontSize.xl : FontSize.base, fontWeight: highlight ? FontWeight.extrabold : FontWeight.bold, color: color || Colors.primary }}>
        {value.toLocaleString()} ج.م
      </Text>
      <Text style={{ fontSize: size === 'xl' ? FontSize.base : FontSize.sm, color: highlight ? Colors.textPrimary : Colors.textSecondary, textAlign: 'right', fontWeight: highlight ? FontWeight.semibold : FontWeight.regular }}>
        {label}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginTop: Spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerLeft: { flexDirection: 'row', gap: Spacing.sm },
  tabBtn: { paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border },
  tabBtnActive: { backgroundColor: Colors.primarySurface, borderColor: Colors.primary },
  tabBtnText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  tabBtnTextActive: { color: Colors.primary, fontWeight: FontWeight.bold },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  titleBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.base, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, flex: 1, textAlign: 'right' },
  adminBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.warningSurface, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderWidth: 1, borderColor: Colors.warning + '50' },
  adminBadgeText: { fontSize: FontSize.xs, color: Colors.warning, fontWeight: FontWeight.bold },
  matTable: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, marginBottom: Spacing.base, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  matTableHeader: { flexDirection: 'row', backgroundColor: Colors.card, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm },
  matTableHead: { flex: 1, fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', fontWeight: FontWeight.bold },
  matRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border, gap: Spacing.sm },
  matTotal: { flex: 1, fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.bold, textAlign: 'center' },
  matCell: { flex: 1, fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'center' },
  matName: { fontSize: FontSize.xs, color: Colors.textPrimary, fontWeight: FontWeight.semibold },
  matType: { fontSize: 10, color: Colors.textMuted },
  matFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md, backgroundColor: Colors.primarySurface },
  matFooterLabel: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },
  matFooterTotal: { fontSize: FontSize.base, color: Colors.primary, fontWeight: FontWeight.extrabold },
  summaryCard: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.lg, padding: Spacing.base, marginBottom: Spacing.base, borderWidth: 1, borderColor: Colors.border },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
  pricingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md, justifyContent: 'flex-end' },
  pctInput: { width: 70, backgroundColor: Colors.card, borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, fontSize: FontSize.base, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.primary + '60', fontWeight: FontWeight.bold },
  pctSuffix: { fontSize: FontSize.sm, color: Colors.textSecondary },
  pricingLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1, textAlign: 'right', fontWeight: FontWeight.medium },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: Spacing.md, marginBottom: Spacing.base, backgroundColor: Colors.surfaceElevated, padding: Spacing.md, borderRadius: Radius.md },
  switchLabel: { fontSize: FontSize.base, color: Colors.textPrimary, fontWeight: FontWeight.medium },
  fieldLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'right', marginBottom: Spacing.xs, fontWeight: FontWeight.medium },
  notesInput: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.md, fontSize: FontSize.sm, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border, height: 80, textAlignVertical: 'top', marginBottom: Spacing.xl },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: Spacing.base, marginBottom: Spacing.md, ...Shadow.gold },
  saveBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textOnPrimary },
  newVersionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: Colors.primary + '80', borderRadius: Radius.lg, paddingVertical: Spacing.md, marginBottom: Spacing.xxxl },
  newVersionBtnText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },
  noMatsWarning: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start', backgroundColor: Colors.warningSurface, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.base, borderWidth: 1, borderColor: Colors.warning + '50' },
  noMatsText: { flex: 1, fontSize: FontSize.xs, color: Colors.warning, textAlign: 'right' },
  historyCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.base, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  historyVersion: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  historyTotal: { fontSize: FontSize.sm, color: Colors.textPrimary },
  historyFinal: { fontSize: FontSize.base, color: Colors.primary, fontWeight: FontWeight.bold },
  historyProfit: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.success },
  historyProfitLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
});
