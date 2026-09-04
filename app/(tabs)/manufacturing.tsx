// Powered by OnSpace.AI
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, TextInput,
  Modal, ScrollView, KeyboardAvoidingView, Platform, Dimensions, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { useAlert } from '@/template';
import { isTablet, pagePadding } from '@/constants/responsive';
import {
  Worker, ProductionOrder, ProductionOrderStatus,
  DEFAULT_MANUFACTURING_STAGES, ExternalManufacturing,
} from '@/contexts/AppContext';

const SCREEN_H = Dimensions.get('window').height;

// ─── helpers ──────────────────────────────────────────────────────────────
function n(v: string | number) { return parseFloat(String(v)) || 0; }
function uid() { return Date.now().toString() + Math.random().toString(36).slice(2, 5); }

const CRAFTS = ['عامل فيبرجلاس', 'بياض', 'نجار', 'حداد', 'كهربائي', 'مركّب', 'مساعد', 'عامل عام', 'دهان', 'ميكانيكي'];
const ORDER_STATUSES: { id: ProductionOrderStatus; label: string; color: string }[] = [
  { id: 'new', label: 'جديد', color: Colors.info },
  { id: 'preparing', label: 'تجهيز', color: '#9C6FFF' },
  { id: 'in_production', label: 'في التصنيع', color: Colors.primary },
  { id: 'external_manufacturing', label: 'تصنيع خارجي', color: Colors.warning },
  { id: 'finishing', label: 'تشطيب', color: Colors.success },
  { id: 'packaging', label: 'تغليف', color: '#5BAFFF' },
  { id: 'ready', label: 'جاهز', color: Colors.success },
  { id: 'delivered', label: 'تم التسليم', color: Colors.textMuted },
  { id: 'cancelled', label: 'ملغي', color: Colors.error },
];

function statusInfo(status: ProductionOrderStatus) {
  return ORDER_STATUSES.find(s => s.id === status) || ORDER_STATUSES[0];
}

// ─── Worker Form Modal ────────────────────────────────────────────────────
function WorkerFormModal({ visible, worker, onSave, onClose }: {
  visible: boolean; worker: Worker | null;
  onSave: (data: Omit<Worker, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [craft, setCraft] = useState('');
  const [wage, setWage] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    if (worker) {
      setName(worker.name || ''); setCraft(worker.craft || '');
      setWage(worker.dailyWage?.toString() || '');
      setPhone(worker.phone || ''); setNotes(worker.notes || '');
    } else {
      setName(''); setCraft(''); setWage(''); setPhone(''); setNotes('');
    }
  }, [worker, visible]);

  function handleSave() {
    if (!name.trim()) { Alert.alert('خطأ', 'أدخل اسم العامل'); return; }
    onSave({ name: name.trim(), craft: craft.trim(), dailyWage: n(wage), phone: phone.trim(), notes: notes.trim() });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={wf.overlay}>
          <View style={[wf.sheet, { height: SCREEN_H * 0.75 }]}>
            <View style={wf.handle} />
            <View style={wf.header}>
              <Pressable onPress={onClose} style={wf.closeBtn}>
                <MaterialIcons name="close" size={20} color={Colors.textSecondary} />
              </Pressable>
              <Text style={wf.title}>{worker ? 'تعديل عامل' : 'إضافة عامل'}</Text>
            </View>
            <ScrollView contentContainerStyle={wf.content} showsVerticalScrollIndicator={false}>
              <WField label="اسم العامل *" value={name} onChange={setName} />
              <Text style={wf.subLabel}>المهنة:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.base }}>
                <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                  {CRAFTS.map(c => (
                    <Pressable key={c} onPress={() => setCraft(c)} style={[wf.craftChip, craft === c && wf.craftChipActive]}>
                      <Text style={[wf.craftChipTxt, craft === c && { color: Colors.primary }]}>{c}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
              <WField label="المهنة (يدوي)" value={craft} onChange={setCraft} placeholder="أدخل المهنة..." />
              <WField label="اليومية (ج.م)" value={wage} onChange={setWage} keyboard="decimal-pad" />
              <WField label="المحمول" value={phone} onChange={setPhone} keyboard="phone-pad" />
              <WField label="ملاحظات" value={notes} onChange={setNotes} multiline />
              <View style={wf.btnRow}>
                <Pressable onPress={onClose} style={[wf.btn, { backgroundColor: Colors.surfaceElevated }]}>
                  <Text style={{ color: Colors.textSecondary, fontWeight: FontWeight.semibold }}>إلغاء</Text>
                </Pressable>
                <Pressable onPress={handleSave} style={[wf.btn, { backgroundColor: Colors.primary, flex: 1 }]}>
                  <Text style={{ color: Colors.textOnPrimary, fontWeight: FontWeight.bold }}>{worker ? 'حفظ' : 'إضافة'}</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function WField({ label, value, onChange, placeholder, keyboard, multiline }: any) {
  return (
    <View style={{ marginBottom: Spacing.md }}>
      <Text style={wf.fieldLabel}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} placeholder={placeholder || ''} placeholderTextColor={Colors.textMuted}
        keyboardType={keyboard || 'default'} multiline={multiline}
        style={[wf.fieldInput, multiline && { height: 70, textAlignVertical: 'top' }]}
        textAlign="right" />
    </View>
  );
}

const wf = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginTop: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.base },
  subLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'right', marginBottom: Spacing.sm },
  craftChip: { paddingHorizontal: Spacing.md, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border },
  craftChipActive: { backgroundColor: Colors.primarySurface, borderColor: Colors.primary },
  craftChipTxt: { fontSize: FontSize.xs, color: Colors.textSecondary },
  fieldLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'right', marginBottom: 4, fontWeight: FontWeight.medium },
  fieldInput: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, fontSize: FontSize.base, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },
  btnRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xl },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.base, paddingHorizontal: Spacing.xl, borderRadius: Radius.md },
});

// ─── External Manufacturing Form ───────────────────────────────────────────
function ExtManufFormModal({ visible, item, artworks, suppliers, onSave, onClose }: {
  visible: boolean; item: ExternalManufacturing | null;
  artworks: any[]; suppliers: any[];
  onSave: (data: Omit<ExternalManufacturing, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}) {
  const [workshop, setWorkshop] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [artworkId, setArtworkId] = useState('');
  const [stageId, setStageId] = useState('');
  const [description, setDescription] = useState('');
  const [qty, setQty] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [extMaterials, setExtMaterials] = useState('');
  const [transport, setTransport] = useState('');
  const [other, setOther] = useState('');
  const [transportIncluded, setTransportIncluded] = useState(false);
  const [materialsIncluded, setMaterialsIncluded] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    if (item) {
      setWorkshop(item.workshopName || ''); setSupplierId(item.supplierId || '');
      setArtworkId(item.artworkId || ''); setStageId(item.stageId || '');
      setDescription(item.description || ''); setQty(item.quantity?.toString() || '');
      setPricePerUnit(item.pricePerUnit?.toString() || '');
      setExtMaterials(item.externalMaterialsCost?.toString() || '');
      setTransport(item.transportCost?.toString() || '');
      setOther(item.otherExpenses?.toString() || '');
      setTransportIncluded(item.transportIncluded || false);
      setMaterialsIncluded(item.materialsIncluded || false);
      setDate(item.date?.slice(0, 10) || new Date().toISOString().slice(0, 10));
      setNotes(item.notes || '');
    } else {
      setWorkshop(''); setSupplierId(''); setArtworkId(''); setStageId('');
      setDescription(''); setQty(''); setPricePerUnit('');
      setExtMaterials(''); setTransport(''); setOther('');
      setTransportIncluded(false); setMaterialsIncluded(false);
      setDate(new Date().toISOString().slice(0, 10)); setNotes('');
    }
  }, [item, visible]);

  const baseTotal = n(qty) * n(pricePerUnit);
  const extMat = materialsIncluded ? 0 : n(extMaterials);
  const transCost = transportIncluded ? 0 : n(transport);
  const total = baseTotal + extMat + transCost + n(other);
  const selectedSupplier = suppliers.find((s: any) => s.id === supplierId);

  function handleSave() {
    if (!workshop.trim()) { Alert.alert('خطأ', 'أدخل اسم الورشة'); return; }
    const stageName = DEFAULT_MANUFACTURING_STAGES.find(s => s.id === stageId)?.name || '';
    onSave({
      workshopName: workshop, supplierId, supplierName: selectedSupplier?.name || '',
      artworkId, stageId, stageName, description, quantity: n(qty),
      pricePerUnit: n(pricePerUnit),
      externalMaterialsCost: n(extMaterials), transportCost: n(transport), otherExpenses: n(other),
      total, transportIncluded, materialsIncluded,
      date: date + 'T00:00:00.000Z', notes,
    });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={wf.overlay}>
          <View style={[wf.sheet, { height: SCREEN_H * 0.92 }]}>
            <View style={wf.handle} />
            <View style={wf.header}>
              <Pressable onPress={onClose} style={wf.closeBtn}><MaterialIcons name="close" size={20} color={Colors.textSecondary} /></Pressable>
              <Text style={wf.title}>{item ? 'تعديل تصنيع خارجي' : 'إضافة تصنيع خارجي'}</Text>
            </View>
            <ScrollView contentContainerStyle={wf.content} showsVerticalScrollIndicator={false}>
              <WField label="اسم الورشة / المصنع *" value={workshop} onChange={setWorkshop} />

              {suppliers.length > 0 ? (
                <>
                  <Text style={wf.fieldLabel}>المورد:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.base }}>
                    <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                      {suppliers.map((s: any) => (
                        <Pressable key={s.id} onPress={() => setSupplierId(s.id)} style={[wf.craftChip, supplierId === s.id && wf.craftChipActive]}>
                          <Text style={[wf.craftChipTxt, supplierId === s.id && { color: Colors.primary }]}>{s.name}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </>
              ) : null}

              {artworks.length > 0 ? (
                <>
                  <Text style={wf.fieldLabel}>العمل الفني:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.base }}>
                    <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                      {artworks.slice(0, 10).map((a: any) => (
                        <Pressable key={a.id} onPress={() => setArtworkId(a.id)} style={[wf.craftChip, artworkId === a.id && wf.craftChipActive]}>
                          <Text style={[wf.craftChipTxt, artworkId === a.id && { color: Colors.primary }]} numberOfLines={1}>{a.title}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </>
              ) : null}

              <Text style={wf.fieldLabel}>المرحلة:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.base }}>
                <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                  {DEFAULT_MANUFACTURING_STAGES.map(s => (
                    <Pressable key={s.id} onPress={() => setStageId(s.id)} style={[wf.craftChip, stageId === s.id && wf.craftChipActive]}>
                      <Text style={[wf.craftChipTxt, stageId === s.id && { color: Colors.primary }]}>{s.name}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              <WField label="الوصف" value={description} onChange={setDescription} multiline />
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Text style={wf.fieldLabel}>الكمية</Text>
                  <TextInput value={qty} onChangeText={v => setQty(v.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" style={wf.fieldInput} textAlign="right" placeholder="0" placeholderTextColor={Colors.textMuted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={wf.fieldLabel}>سعر/وحدة (ج.م)</Text>
                  <TextInput value={pricePerUnit} onChangeText={v => setPricePerUnit(v.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" style={wf.fieldInput} textAlign="right" placeholder="0" placeholderTextColor={Colors.textMuted} />
                </View>
              </View>
              {baseTotal > 0 ? <Text style={{ textAlign: 'right', color: Colors.primary, fontWeight: FontWeight.bold, marginBottom: Spacing.sm }}>{qty} × {pricePerUnit} = {baseTotal.toLocaleString()} ج.م</Text> : null}

              <Text style={[wf.fieldLabel, { marginTop: Spacing.md }]}>تكاليف إضافية:</Text>
              <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm }}>
                <Switch value={materialsIncluded} onValueChange={setMaterialsIncluded}
                  trackColor={{ false: Colors.border, true: Colors.warningSurface }}
                  thumbColor={materialsIncluded ? Colors.warning : Colors.textMuted} />
                <Text style={{ color: Colors.textSecondary, fontSize: FontSize.sm }}>خامات مشمولة في السعر</Text>
              </View>
              {!materialsIncluded ? (
                <View style={{ marginBottom: Spacing.sm }}>
                  <Text style={wf.fieldLabel}>تكلفة خامات خارجية (ج.م)</Text>
                  <TextInput value={extMaterials} onChangeText={v => setExtMaterials(v.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" style={wf.fieldInput} textAlign="right" placeholder="0" placeholderTextColor={Colors.textMuted} />
                </View>
              ) : null}
              <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm }}>
                <Switch value={transportIncluded} onValueChange={setTransportIncluded}
                  trackColor={{ false: Colors.border, true: Colors.warningSurface }}
                  thumbColor={transportIncluded ? Colors.warning : Colors.textMuted} />
                <Text style={{ color: Colors.textSecondary, fontSize: FontSize.sm }}>نقل مشمول في السعر</Text>
              </View>
              {!transportIncluded ? (
                <View style={{ marginBottom: Spacing.sm }}>
                  <Text style={wf.fieldLabel}>تكلفة النقل (ج.م)</Text>
                  <TextInput value={transport} onChangeText={v => setTransport(v.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" style={wf.fieldInput} textAlign="right" placeholder="0" placeholderTextColor={Colors.textMuted} />
                </View>
              ) : null}
              <View style={{ marginBottom: Spacing.sm }}>
                <Text style={wf.fieldLabel}>مصاريف أخرى (ج.م)</Text>
                <TextInput value={other} onChangeText={v => setOther(v.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" style={wf.fieldInput} textAlign="right" placeholder="0" placeholderTextColor={Colors.textMuted} />
              </View>

              <View style={{ backgroundColor: Colors.primarySurface, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.base, flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.primary }}>{total.toLocaleString()} ج.م</Text>
                <Text style={{ color: Colors.primary, fontSize: FontSize.sm }}>الإجمالي</Text>
              </View>

              <WField label="تاريخ التنفيذ" value={date} onChange={setDate} placeholder="YYYY-MM-DD" />
              <WField label="ملاحظات" value={notes} onChange={setNotes} multiline />

              <View style={wf.btnRow}>
                <Pressable onPress={onClose} style={[wf.btn, { backgroundColor: Colors.surfaceElevated }]}>
                  <Text style={{ color: Colors.textSecondary, fontWeight: FontWeight.semibold }}>إلغاء</Text>
                </Pressable>
                <Pressable onPress={handleSave} style={[wf.btn, { backgroundColor: Colors.primary, flex: 1 }]}>
                  <Text style={{ color: Colors.textOnPrimary, fontWeight: FontWeight.bold }}>{item ? 'حفظ' : 'إضافة'}</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Production Order Form Modal ───────────────────────────────────────────
function OrderFormModal({ visible, order, artworks, customers, onSave, onClose }: {
  visible: boolean; order: ProductionOrder | null;
  artworks: any[]; customers: any[];
  onSave: (data: Omit<ProductionOrder, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
}) {
  const [artworkId, setArtworkId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [plannedQty, setPlannedQty] = useState('1');
  const [actualQty, setActualQty] = useState('0');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [deliveryDate, setDeliveryDate] = useState('');
  const [status, setStatus] = useState<ProductionOrderStatus>('new');
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    if (order) {
      setArtworkId(order.artworkId || ''); setCustomerId(order.customerId || '');
      setPlannedQty(order.plannedQuantity?.toString() || '1');
      setActualQty(order.actualQuantity?.toString() || '0');
      setStartDate(order.startDate?.slice(0, 10) || new Date().toISOString().slice(0, 10));
      setDeliveryDate(order.deliveryDate?.slice(0, 10) || '');
      setStatus(order.status || 'new'); setNotes(order.notes || '');
    } else {
      setArtworkId(''); setCustomerId('');
      setPlannedQty('1'); setActualQty('0');
      setStartDate(new Date().toISOString().slice(0, 10));
      setDeliveryDate(''); setStatus('new'); setNotes('');
    }
  }, [order, visible]);

  const selectedArtwork = artworks.find((a: any) => a.id === artworkId);
  const selectedCustomer = customers.find((c: any) => c.id === customerId);

  function handleSave() {
    if (!artworkId) { Alert.alert('خطأ', 'اختر عملاً فنياً'); return; }
    onSave({
      artworkId, artworkTitle: selectedArtwork?.title || '',
      customerId, customerName: selectedCustomer?.name || '',
      plannedQuantity: n(plannedQty), actualQuantity: n(actualQty),
      startDate: startDate + 'T00:00:00.000Z',
      deliveryDate: deliveryDate ? deliveryDate + 'T00:00:00.000Z' : '',
      status, stages: [], materialItems: [], laborRecords: [],
      externalLaborRecords: [], transportRecords: [], packagingRecords: [],
      otherExpenses: [], externalManufacturingIds: [],
      totalMaterialCost: 0, totalLaborCost: 0, totalExternalLaborCost: 0,
      totalExternalManufacturingCost: 0, totalTransportCost: 0,
      totalPackagingCost: 0, totalOtherExpenses: 0,
      productionCostBeforeTax: 0, applyTax: false, taxPercentage: 0, taxAmount: 0,
      totalCostAfterTax: 0, costPerPiece: 0,
      profitPercentage: 30, profitAmount: 0, suggestedSellingPrice: 0,
      discountPercentage: 0, discountAmount: 0, finalSellingPrice: 0,
      notes,
    });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={wf.overlay}>
          <View style={[wf.sheet, { height: SCREEN_H * 0.88 }]}>
            <View style={wf.handle} />
            <View style={wf.header}>
              <Pressable onPress={onClose} style={wf.closeBtn}><MaterialIcons name="close" size={20} color={Colors.textSecondary} /></Pressable>
              <Text style={wf.title}>{order ? 'تعديل الأمر' : 'أمر تصنيع جديد'}</Text>
            </View>
            <ScrollView contentContainerStyle={wf.content} showsVerticalScrollIndicator={false}>
              {artworks.length > 0 ? (
                <>
                  <Text style={wf.fieldLabel}>العمل الفني *:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.base }}>
                    <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                      {artworks.map((a: any) => (
                        <Pressable key={a.id} onPress={() => setArtworkId(a.id)} style={[wf.craftChip, artworkId === a.id && wf.craftChipActive]}>
                          <Text style={[wf.craftChipTxt, artworkId === a.id && { color: Colors.primary }]} numberOfLines={1}>{a.title}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </>
              ) : (
                <View style={{ backgroundColor: Colors.warningSurface, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.base }}>
                  <Text style={{ color: Colors.warning, textAlign: 'right', fontSize: FontSize.sm }}>أضف أعمالاً فنية أولاً في صفحة البورتفوليو</Text>
                </View>
              )}

              {customers.length > 0 ? (
                <>
                  <Text style={wf.fieldLabel}>العميل:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.base }}>
                    <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                      {customers.map((c: any) => (
                        <Pressable key={c.id} onPress={() => setCustomerId(c.id)} style={[wf.craftChip, customerId === c.id && wf.craftChipActive]}>
                          <Text style={[wf.craftChipTxt, customerId === c.id && { color: Colors.primary }]} numberOfLines={1}>{c.name}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </>
              ) : null}

              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Text style={wf.fieldLabel}>الكمية المخططة</Text>
                  <TextInput value={plannedQty} onChangeText={v => setPlannedQty(v.replace(/[^0-9]/g, ''))} keyboardType="number-pad" style={wf.fieldInput} textAlign="center" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={wf.fieldLabel}>الكمية الفعلية</Text>
                  <TextInput value={actualQty} onChangeText={v => setActualQty(v.replace(/[^0-9]/g, ''))} keyboardType="number-pad" style={wf.fieldInput} textAlign="center" />
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                <WField label="تاريخ البدء" value={startDate} onChange={setStartDate} placeholder="YYYY-MM-DD" />
                <WField label="موعد التسليم" value={deliveryDate} onChange={setDeliveryDate} placeholder="YYYY-MM-DD" />
              </View>

              <Text style={wf.fieldLabel}>الحالة:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.base }}>
                <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                  {ORDER_STATUSES.map(s => (
                    <Pressable key={s.id} onPress={() => setStatus(s.id)} style={[wf.craftChip, status === s.id && { backgroundColor: s.color + '20', borderColor: s.color }]}>
                      <Text style={[wf.craftChipTxt, status === s.id && { color: s.color }]}>{s.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              <WField label="ملاحظات" value={notes} onChange={setNotes} multiline />

              <View style={wf.btnRow}>
                <Pressable onPress={onClose} style={[wf.btn, { backgroundColor: Colors.surfaceElevated }]}>
                  <Text style={{ color: Colors.textSecondary, fontWeight: FontWeight.semibold }}>إلغاء</Text>
                </Pressable>
                <Pressable onPress={handleSave} style={[wf.btn, { backgroundColor: Colors.primary, flex: 1 }]}>
                  <Text style={{ color: Colors.textOnPrimary, fontWeight: FontWeight.bold }}>{order ? 'حفظ' : 'إنشاء الأمر'}</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Worker Card ────────────────────────────────────────────────────────────
function WorkerCard({ worker, onEdit, onDelete }: { worker: Worker; onEdit: () => void; onDelete: () => void }) {
  return (
    <View style={wc.card}>
      <View style={wc.top}>
        <View style={wc.actions}>
          <Pressable onPress={onDelete} style={[wc.actionBtn, { backgroundColor: Colors.errorSurface }]} hitSlop={6}>
            <MaterialIcons name="delete-outline" size={16} color={Colors.error} />
          </Pressable>
          <Pressable onPress={onEdit} style={[wc.actionBtn, { backgroundColor: Colors.surfaceElevated }]} hitSlop={6}>
            <MaterialIcons name="edit" size={16} color={Colors.textSecondary} />
          </Pressable>
        </View>
        <View style={wc.info}>
          <Text style={wc.name}>{worker.name}</Text>
          <Text style={wc.craft}>{worker.craft}</Text>
        </View>
        <View style={wc.avatar}>
          <MaterialIcons name="person" size={24} color={Colors.primary} />
        </View>
      </View>
      <View style={wc.bottom}>
        {worker.phone ? <Text style={wc.phone}>{worker.phone}</Text> : null}
        <Text style={wc.wage}>{worker.dailyWage?.toLocaleString() || 0} ج.م/يوم</Text>
      </View>
    </View>
  );
}
const wc = StyleSheet.create({
  card: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.base, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  top: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primarySurface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.primary + '40' },
  info: { flex: 1, alignItems: 'flex-end' },
  name: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  craft: { fontSize: FontSize.sm, color: Colors.textSecondary },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: { width: 32, height: 32, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  wage: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.primary },
  phone: { fontSize: FontSize.xs, color: Colors.textMuted },
});

// ─── Order Card ─────────────────────────────────────────────────────────────
function OrderCard({ order, onEdit, onDelete, onStatusChange }: {
  order: ProductionOrder; onEdit: () => void; onDelete: () => void;
  onStatusChange: (id: string, status: ProductionOrderStatus) => void;
}) {
  const si = statusInfo(order.status);
  const progress = order.plannedQuantity > 0 ? (order.actualQuantity / order.plannedQuantity) * 100 : 0;

  return (
    <View style={oc.card}>
      <View style={oc.header}>
        <View style={[oc.statusBadge, { backgroundColor: si.color + '20', borderColor: si.color + '60' }]}>
          <Text style={[oc.statusTxt, { color: si.color }]}>{si.label}</Text>
        </View>
        <View style={oc.titleArea}>
          <Text style={oc.artworkTitle} numberOfLines={1}>{order.artworkTitle}</Text>
          <Text style={oc.orderNum}>{order.orderNumber}</Text>
          {order.customerName ? <Text style={oc.customer}>{order.customerName}</Text> : null}
        </View>
        <View style={oc.actions}>
          <Pressable onPress={onDelete} style={[oc.actionBtn, { backgroundColor: Colors.errorSurface }]} hitSlop={4}>
            <MaterialIcons name="delete-outline" size={14} color={Colors.error} />
          </Pressable>
          <Pressable onPress={onEdit} style={[oc.actionBtn, { backgroundColor: Colors.surfaceElevated }]} hitSlop={4}>
            <MaterialIcons name="edit" size={14} color={Colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      {/* Progress */}
      <View style={oc.progressRow}>
        <Text style={oc.progressTxt}>{order.actualQuantity} / {order.plannedQuantity} قطعة</Text>
        <View style={oc.progressBar}>
          <View style={[oc.progressFill, { width: `${Math.min(progress, 100)}%`, backgroundColor: si.color }]} />
        </View>
        <Text style={[oc.progressPct, { color: si.color }]}>{Math.round(progress)}%</Text>
      </View>

      {/* Dates */}
      {(order.startDate || order.deliveryDate) ? (
        <View style={oc.dates}>
          {order.startDate ? <Text style={oc.date}>بدء: {new Date(order.startDate).toLocaleDateString('ar-EG')}</Text> : null}
          {order.deliveryDate ? (() => {
            const delivery = new Date(order.deliveryDate);
            const now2 = new Date();
            const diffDays = Math.ceil((delivery.getTime() - now2.getTime()) / (1000 * 60 * 60 * 24));
            const isUrgent = !['delivered','cancelled'].includes(order.status) && diffDays <= 3;
            return (
              <View style={[oc.deliveryChip, isUrgent && { backgroundColor: (diffDays < 0 ? Colors.errorSurface : Colors.warningSurface) }]}>
                {isUrgent ? <MaterialIcons name={diffDays < 0 ? 'error' : 'warning'} size={12} color={diffDays < 0 ? Colors.error : Colors.warning} /> : null}
                <Text style={[oc.date, isUrgent && { color: diffDays < 0 ? Colors.error : Colors.warning, fontWeight: '700' }]}>
                  تسليم: {delivery.toLocaleDateString('ar-EG')}
                  {isUrgent ? (diffDays < 0 ? ` (متأخر ${Math.abs(diffDays)} يوم)` : diffDays === 0 ? ' (اليوم!)' : ` (خلال ${diffDays} أيام)`) : ''}
                </Text>
              </View>
            );
          })() : null}
        </View>
      ) : null}

      {/* Quick status change */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={oc.statusScroll}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {ORDER_STATUSES.map(s => (
            <Pressable key={s.id} onPress={() => onStatusChange(order.id, s.id)}
              style={[oc.statusChip, order.status === s.id && { backgroundColor: s.color + '20', borderColor: s.color }]}>
              <Text style={[oc.statusChipTxt, order.status === s.id && { color: s.color, fontWeight: FontWeight.bold }]}>{s.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
const oc = StyleSheet.create({
  card: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.base, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.md },
  titleArea: { flex: 1, alignItems: 'flex-end' },
  artworkTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'right' },
  orderNum: { fontSize: FontSize.xs, color: Colors.textMuted, fontFamily: 'monospace' },
  customer: { fontSize: FontSize.xs, color: Colors.textSecondary },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 1 },
  statusTxt: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  actions: { flexDirection: 'row', gap: Spacing.xs },
  actionBtn: { width: 28, height: 28, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  progressTxt: { fontSize: FontSize.xs, color: Colors.textSecondary, minWidth: 70 },
  progressBar: { flex: 1, height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressPct: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, minWidth: 36 },
  dates: { flexDirection: 'row', gap: Spacing.base, marginBottom: Spacing.sm, justifyContent: 'flex-end', flexWrap: 'wrap', alignItems: 'center' },
  date: { fontSize: FontSize.xs, color: Colors.textMuted },
  deliveryChip: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 3, borderRadius: Radius.sm },
  statusScroll: { marginTop: Spacing.xs },
  statusChip: { paddingHorizontal: Spacing.sm, paddingVertical: 5, borderRadius: Radius.full, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border },
  statusChipTxt: { fontSize: 10, color: Colors.textSecondary },
});

// ─── External Mfg Card ──────────────────────────────────────────────────────
function ExtMfgCard({ item, artworks, onEdit, onDelete }: { item: ExternalManufacturing; artworks: any[]; onEdit: () => void; onDelete: () => void }) {
  const artwork = artworks.find((a: any) => a.id === item.artworkId);
  return (
    <View style={ec.card}>
      <View style={ec.top}>
        <View style={ec.actions}>
          <Pressable onPress={onDelete} style={[ec.btn, { backgroundColor: Colors.errorSurface }]} hitSlop={6}>
            <MaterialIcons name="delete-outline" size={14} color={Colors.error} />
          </Pressable>
          <Pressable onPress={onEdit} style={[ec.btn, { backgroundColor: Colors.surfaceElevated }]} hitSlop={6}>
            <MaterialIcons name="edit" size={14} color={Colors.textSecondary} />
          </Pressable>
        </View>
        <View style={ec.info}>
          <Text style={ec.workshop}>{item.workshopName}</Text>
          {item.stageName ? <Text style={ec.stage}>{item.stageName}</Text> : null}
          {artwork ? <Text style={ec.artwork}>{artwork.title}</Text> : null}
        </View>
        <View style={ec.icon}>
          <MaterialIcons name="factory" size={22} color={Colors.success} />
        </View>
      </View>
      <View style={ec.bottom}>
        <Text style={ec.total}>{item.total.toLocaleString()} ج.م</Text>
        <Text style={ec.meta}>{item.quantity} قطعة × {item.pricePerUnit.toLocaleString()} ج.م</Text>
        {item.date ? <Text style={ec.date}>{new Date(item.date).toLocaleDateString('ar-EG')}</Text> : null}
      </View>
    </View>
  );
}
const ec = StyleSheet.create({
  card: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.base, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: Spacing.sm },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.successSurface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.success + '40' },
  info: { flex: 1, alignItems: 'flex-end' },
  workshop: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  stage: { fontSize: FontSize.xs, color: Colors.primary },
  artwork: { fontSize: FontSize.xs, color: Colors.textSecondary },
  actions: { flexDirection: 'row', gap: Spacing.xs },
  btn: { width: 28, height: 28, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  total: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.success },
  meta: { fontSize: FontSize.xs, color: Colors.textMuted },
  date: { fontSize: FontSize.xs, color: Colors.textMuted },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────
type Section = 'dashboard' | 'orders' | 'workers' | 'external';

export default function ManufacturingScreen() {
  const {
    artworks, customers, suppliers,
    workers, productionOrders, externalManufacturing,
    addWorker, updateWorker, deleteWorker,
    addProductionOrder, updateProductionOrder, deleteProductionOrder,
    addExternalManufacturing, updateExternalManufacturing, deleteExternalManufacturing,
  } = useApp();
  const { showAlert } = useAlert();

  const [section, setSection] = useState<Section>('dashboard');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProductionOrderStatus>('all');

  // Worker form
  const [showWorkerForm, setShowWorkerForm] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  // Order form
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ProductionOrder | null>(null);
  // External mfg form
  const [showExtForm, setShowExtForm] = useState(false);
  const [editingExt, setEditingExt] = useState<ExternalManufacturing | null>(null);

  // Dashboard stats
  const activeOrders = productionOrders.filter(o => !['delivered', 'cancelled'].includes(o.status));
  const totalMfgCost = externalManufacturing.reduce((s, m) => s + m.total, 0);
  const totalLaborWage = workers.reduce((s, w) => s + w.dailyWage, 0);

  const now = new Date();
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const urgentOrders = useMemo(() => productionOrders.filter(o => {
    if (!o.deliveryDate) return false;
    if (['delivered', 'cancelled'].includes(o.status)) return false;
    const delivery = new Date(o.deliveryDate);
    return delivery <= in3Days;
  }).sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime()),
  [productionOrders]);

  function getDeliveryStatus(deliveryDate: string) {
    const delivery = new Date(deliveryDate);
    const diffMs = delivery.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: `متأخر ${Math.abs(diffDays)} يوم`, color: Colors.error, icon: 'error' as const };
    if (diffDays === 0) return { label: 'اليوم!', color: Colors.error, icon: 'warning' as const };
    if (diffDays === 1) return { label: 'غداً', color: Colors.warning, icon: 'warning' as const };
    return { label: `خلال ${diffDays} أيام`, color: Colors.warning, icon: 'schedule' as const };
  }

  const filteredOrders = useMemo(() => productionOrders.filter(o => {
    const matchSearch = !search || o.artworkTitle.includes(search) || o.orderNumber.includes(search) || o.customerName?.includes(search);
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  }), [productionOrders, search, statusFilter]);

  const filteredWorkers = useMemo(() => workers.filter(w =>
    !search || w.name.includes(search) || w.craft.includes(search)
  ), [workers, search]);

  const filteredExt = useMemo(() => externalManufacturing.filter(m =>
    !search || m.workshopName.includes(search) || m.stageName?.includes(search)
  ), [externalManufacturing, search]);

  function handleDeleteWorker(w: Worker) {
    showAlert('حذف العامل', `حذف "${w.name}"؟`, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: () => deleteWorker(w.id) },
    ]);
  }

  function handleDeleteOrder(o: ProductionOrder) {
    showAlert('حذف الأمر', `حذف "${o.orderNumber}"؟`, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: () => deleteProductionOrder(o.id) },
    ]);
  }

  function handleDeleteExt(m: ExternalManufacturing) {
    showAlert('حذف', `حذف سجل "${m.workshopName}"؟`, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: () => deleteExternalManufacturing(m.id) },
    ]);
  }

  const SECTIONS: { id: Section; label: string; icon: any; color: string; count?: number }[] = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: 'dashboard', color: Colors.primary },
    { id: 'orders', label: 'أوامر التصنيع', icon: 'assignment', color: Colors.info, count: activeOrders.length },
    { id: 'workers', label: 'العمالة', icon: 'people', color: '#9C6FFF', count: workers.length },
    { id: 'external', label: 'تصنيع خارجي', icon: 'factory', color: Colors.success, count: externalManufacturing.length },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        {(section === 'orders' || section === 'workers' || section === 'external') ? (
          <Pressable onPress={() => {
            if (section === 'workers') { setEditingWorker(null); setShowWorkerForm(true); }
            else if (section === 'orders') { setEditingOrder(null); setShowOrderForm(true); }
            else if (section === 'external') { setEditingExt(null); setShowExtForm(true); }
          }} style={styles.addBtn}>
            <MaterialIcons name="add" size={22} color={Colors.textOnPrimary} />
          </Pressable>
        ) : <View style={{ width: 40 }} />}
        <Text style={styles.title}>
          {SECTIONS.find(s => s.id === section)?.label || 'التصنيع'}
        </Text>
      </View>

      {/* Section Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sectTabBar}>
        <View style={styles.sectTabRow}>
          {SECTIONS.map(s => (
            <Pressable key={s.id} onPress={() => { setSection(s.id); setSearch(''); }}
              style={[styles.sectTab, section === s.id && { backgroundColor: s.color + '20', borderColor: s.color }]}>
              <MaterialIcons name={s.icon} size={16} color={section === s.id ? s.color : Colors.textMuted} />
              <Text style={[styles.sectTabTxt, section === s.id && { color: s.color, fontWeight: FontWeight.bold }]}>{s.label}</Text>
              {s.count ? (
                <View style={[styles.countBadge, { backgroundColor: s.color }]}>
                  <Text style={styles.countBadgeTxt}>{s.count}</Text>
                </View>
              ) : null}
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Search (not on dashboard) */}
      {section !== 'dashboard' ? (
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={18} color={Colors.textMuted} />
          <TextInput value={search} onChangeText={setSearch} placeholder="بحث..." placeholderTextColor={Colors.textMuted} style={styles.searchInput} textAlign="right" />
          {search ? <Pressable onPress={() => setSearch('')} hitSlop={8}><MaterialIcons name="close" size={16} color={Colors.textMuted} /></Pressable> : null}
        </View>
      ) : null}

      {/* ── DASHBOARD ── */}
      {section === 'dashboard' ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.dashContent}>
          <View style={styles.adminBanner}>
            <MaterialIcons name="lock" size={14} color={Colors.warning} />
            <Text style={styles.adminBannerTxt}>قسم خاص — للمشرف فقط</Text>
          </View>

          {/* Urgent Orders Alert */}
          {urgentOrders.length > 0 ? (
            <View style={styles.urgentBox}>
              <View style={styles.urgentHeader}>
                <View style={styles.urgentBadge}>
                  <Text style={styles.urgentBadgeTxt}>{urgentOrders.length}</Text>
                </View>
                <Text style={styles.urgentTitle}>أوامر تحتاج انتباهاً عاجلاً</Text>
                <MaterialIcons name="notifications-active" size={20} color={Colors.error} />
              </View>
              {urgentOrders.map(o => {
                const si = statusInfo(o.status);
                const ds = getDeliveryStatus(o.deliveryDate);
                return (
                  <Pressable key={o.id} onPress={() => setSection('orders')} style={styles.urgentRow}>
                    <View style={[styles.urgentDelivery, { backgroundColor: ds.color + '20' }]}>
                      <MaterialIcons name={ds.icon} size={14} color={ds.color} />
                      <Text style={[styles.urgentDeliveryTxt, { color: ds.color }]}>{ds.label}</Text>
                    </View>
                    <View style={{ flex: 1, alignItems: 'flex-end', paddingHorizontal: Spacing.sm }}>
                      <Text style={styles.urgentOrderTitle} numberOfLines={1}>{o.artworkTitle}</Text>
                      <Text style={styles.urgentOrderMeta}>{o.orderNumber}{o.customerName ? ` · ${o.customerName}` : ''}</Text>
                    </View>
                    <View style={[styles.urgentStatusBadge, { backgroundColor: si.color + '20', borderColor: si.color + '60' }]}>
                      <Text style={[styles.urgentStatusTxt, { color: si.color }]}>{si.label}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {/* Stats grid */}
          <View style={styles.statsGrid}>
            {[
              { label: 'أوامر نشطة', value: activeOrders.length, icon: 'assignment', color: Colors.primary },
              { label: 'إجمالي الأوامر', value: productionOrders.length, icon: 'list', color: Colors.info },
              { label: 'العمال المسجلون', value: workers.length, icon: 'people', color: '#9C6FFF' },
              { label: 'تصنيع خارجي', value: externalManufacturing.length, icon: 'factory', color: Colors.success },
            ].map(stat => (
              <View key={stat.label} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                  <MaterialIcons name={stat.icon as any} size={22} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Cost cards */}
          <View style={styles.costCards}>
            <View style={[styles.costCard, { borderColor: Colors.success + '50' }]}>
              <MaterialIcons name="factory" size={20} color={Colors.success} />
              <Text style={[styles.costVal, { color: Colors.success }]}>{totalMfgCost.toLocaleString()}</Text>
              <Text style={styles.costLbl}>إجمالي التصنيع الخارجي (ج.م)</Text>
            </View>
            <View style={[styles.costCard, { borderColor: '#9C6FFF50' }]}>
              <MaterialIcons name="people" size={20} color="#9C6FFF" />
              <Text style={[styles.costVal, { color: '#9C6FFF' }]}>{totalLaborWage.toLocaleString()}</Text>
              <Text style={styles.costLbl}>مجموع يوميات العمال (ج.م)</Text>
            </View>
          </View>

          {/* Active Orders List */}
          {activeOrders.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>الأوامر النشطة</Text>
              {activeOrders.slice(0, 5).map(o => {
                const si = statusInfo(o.status);
                return (
                  <View key={o.id} style={styles.dashOrderRow}>
                    <View style={[styles.dashStatusDot, { backgroundColor: si.color }]} />
                    <View style={{ flex: 1, alignItems: 'flex-end', paddingHorizontal: Spacing.sm }}>
                      <Text style={styles.dashOrderTitle}>{o.artworkTitle}</Text>
                      <Text style={styles.dashOrderMeta}>{o.orderNumber} · {si.label}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.dashOrderQty}>{o.actualQuantity}/{o.plannedQuantity}</Text>
                      <Text style={styles.dashOrderQtyLbl}>قطعة</Text>
                    </View>
                  </View>
                );
              })}
              {activeOrders.length > 5 ? (
                <Pressable onPress={() => setSection('orders')} style={styles.viewAllBtn}>
                  <Text style={styles.viewAllTxt}>عرض كل الأوامر ({activeOrders.length})</Text>
                </Pressable>
              ) : null}
            </>
          ) : (
            <View style={styles.emptyDash}>
              <MaterialIcons name="assignment" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyDashTxt}>لا توجد أوامر تصنيع نشطة</Text>
              <Pressable onPress={() => setSection('orders')} style={styles.emptyDashBtn}>
                <Text style={styles.emptyDashBtnTxt}>إضافة أمر تصنيع</Text>
              </Pressable>
            </View>
          )}

          {/* Order status breakdown */}
          {productionOrders.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>توزيع الأوامر حسب الحالة</Text>
              <View style={styles.statusBreakdown}>
                {ORDER_STATUSES.map(s => {
                  const count = productionOrders.filter(o => o.status === s.id).length;
                  if (!count) return null;
                  return (
                    <View key={s.id} style={[styles.statusBreakItem, { borderColor: s.color + '50' }]}>
                      <Text style={[styles.statusBreakCount, { color: s.color }]}>{count}</Text>
                      <Text style={styles.statusBreakLabel}>{s.label}</Text>
                    </View>
                  );
                })}
              </View>
            </>
          ) : null}
        </ScrollView>
      ) : null}

      {/* ── ORDERS ── */}
      {section === 'orders' ? (
        <>
          {/* Status filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
            <View style={styles.filterRow}>
              <Pressable onPress={() => setStatusFilter('all')} style={[styles.filterChip, statusFilter === 'all' && styles.filterChipActive]}>
                <Text style={[styles.filterChipTxt, statusFilter === 'all' && styles.filterChipTxtActive]}>الكل ({productionOrders.length})</Text>
              </Pressable>
              {ORDER_STATUSES.map(s => {
                const count = productionOrders.filter(o => o.status === s.id).length;
                if (!count) return null;
                return (
                  <Pressable key={s.id} onPress={() => setStatusFilter(s.id)}
                    style={[styles.filterChip, statusFilter === s.id && { backgroundColor: s.color + '20', borderColor: s.color }]}>
                    <Text style={[styles.filterChipTxt, statusFilter === s.id && { color: s.color }]}>{s.label} ({count})</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
          <FlatList
            data={filteredOrders} keyExtractor={o => o.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            numColumns={isTablet ? 2 : 1}
            key={isTablet ? 'tablet' : 'phone'}
            columnWrapperStyle={isTablet ? { gap: Spacing.md } : undefined}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <MaterialIcons name="assignment" size={48} color={Colors.textMuted} />
                <Text style={styles.emptyTxt}>{search ? 'لا نتائج' : 'اضغط + لإضافة أول أمر تصنيع'}</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={isTablet ? { flex: 1 } : undefined}>
                <OrderCard
                  order={item}
                  onEdit={() => { setEditingOrder(item); setShowOrderForm(true); }}
                  onDelete={() => handleDeleteOrder(item)}
                  onStatusChange={(id, status) => updateProductionOrder(id, { status })}
                />
              </View>
            )}
          />
        </>
      ) : null}

      {/* ── WORKERS ── */}
      {section === 'workers' ? (
        <FlatList
          data={filteredWorkers} keyExtractor={w => w.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          numColumns={isTablet ? 2 : 1}
          key={isTablet ? 'tablet' : 'phone'}
          columnWrapperStyle={isTablet ? { gap: Spacing.md } : undefined}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons name="people" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTxt}>{search ? 'لا نتائج' : 'اضغط + لإضافة عامل'}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={isTablet ? { flex: 1 } : undefined}>
              <WorkerCard
                worker={item}
                onEdit={() => { setEditingWorker(item); setShowWorkerForm(true); }}
                onDelete={() => handleDeleteWorker(item)}
              />
            </View>
          )}
        />
      ) : null}

      {/* ── EXTERNAL MFG ── */}
      {section === 'external' ? (
        <>
          {externalManufacturing.length > 0 ? (
            <View style={styles.extSummary}>
              <View style={styles.extSumCard}>
                <Text style={styles.extSumVal}>{externalManufacturing.length}</Text>
                <Text style={styles.extSumLbl}>سجل</Text>
              </View>
              <View style={[styles.extSumCard, { borderColor: Colors.success + '50' }]}>
                <Text style={[styles.extSumVal, { color: Colors.success }]}>{totalMfgCost.toLocaleString()}</Text>
                <Text style={styles.extSumLbl}>الإجمالي ج.م</Text>
              </View>
            </View>
          ) : null}
          <FlatList
            data={filteredExt} keyExtractor={m => m.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            numColumns={isTablet ? 2 : 1}
            key={isTablet ? 'tablet' : 'phone'}
            columnWrapperStyle={isTablet ? { gap: Spacing.md } : undefined}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <MaterialIcons name="factory" size={48} color={Colors.textMuted} />
                <Text style={styles.emptyTxt}>{search ? 'لا نتائج' : 'اضغط + لإضافة تصنيع خارجي'}</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={isTablet ? { flex: 1 } : undefined}>
                <ExtMfgCard
                  item={item} artworks={artworks}
                  onEdit={() => { setEditingExt(item); setShowExtForm(true); }}
                  onDelete={() => handleDeleteExt(item)}
                />
              </View>
            )}
          />
        </>
      ) : null}

      {/* Modals */}
      <WorkerFormModal
        visible={showWorkerForm} worker={editingWorker}
        onSave={data => {
          if (editingWorker) updateWorker(editingWorker.id, data);
          else addWorker(data);
          setShowWorkerForm(false); setEditingWorker(null);
        }}
        onClose={() => { setShowWorkerForm(false); setEditingWorker(null); }}
      />
      <OrderFormModal
        visible={showOrderForm} order={editingOrder}
        artworks={artworks} customers={customers}
        onSave={data => {
          if (editingOrder) updateProductionOrder(editingOrder.id, data);
          else addProductionOrder(data);
          setShowOrderForm(false); setEditingOrder(null);
        }}
        onClose={() => { setShowOrderForm(false); setEditingOrder(null); }}
      />
      <ExtManufFormModal
        visible={showExtForm} item={editingExt}
        artworks={artworks} suppliers={suppliers}
        onSave={data => {
          if (editingExt) updateExternalManufacturing(editingExt.id, data);
          else addExternalManufacturing(data);
          setShowExtForm(false); setEditingExt(null);
        }}
        onClose={() => { setShowExtForm(false); setEditingExt(null); }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: pagePadding, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: isTablet ? FontSize.xxl : FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  addBtn: { width: isTablet ? 48 : 40, height: isTablet ? 48 : 40, borderRadius: isTablet ? 24 : 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  sectTabBar: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  sectTabRow: { flexDirection: 'row', paddingHorizontal: pagePadding, paddingVertical: Spacing.sm, gap: Spacing.sm },
  sectTab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border },
  sectTabTxt: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.medium },
  countBadge: { minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  countBadgeTxt: { fontSize: 10, color: '#fff', fontWeight: FontWeight.bold },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, paddingHorizontal: Spacing.md, margin: pagePadding, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, paddingVertical: Spacing.md, fontSize: FontSize.base, color: Colors.textPrimary, marginRight: Spacing.sm },
  list: { padding: pagePadding, paddingTop: Spacing.sm },
  emptyState: { alignItems: 'center', padding: Spacing.xxxl },
  emptyTxt: { color: Colors.textMuted, marginTop: Spacing.md, fontSize: FontSize.base, textAlign: 'center' },
  // Dashboard
  dashContent: { padding: pagePadding },
  adminBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.warningSurface, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.xl, borderWidth: 1, borderColor: Colors.warning + '50', justifyContent: 'center' },
  adminBannerTxt: { fontSize: FontSize.sm, color: Colors.warning, fontWeight: FontWeight.bold },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.xl },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.base, alignItems: 'flex-end', borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  statIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  statValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right' },
  costCards: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  costCard: { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.base, alignItems: 'flex-end', borderWidth: 1, borderColor: Colors.border },
  costVal: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, marginVertical: 4 },
  costLbl: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right' },
  sectionTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'right', marginBottom: Spacing.md, marginTop: Spacing.sm },
  dashOrderRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  dashStatusDot: { width: 10, height: 10, borderRadius: 5 },
  dashOrderTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  dashOrderMeta: { fontSize: FontSize.xs, color: Colors.textMuted },
  dashOrderQty: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.primary },
  dashOrderQtyLbl: { fontSize: 10, color: Colors.textMuted },
  viewAllBtn: { alignItems: 'center', padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, marginBottom: Spacing.xl },
  viewAllTxt: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  emptyDash: { alignItems: 'center', paddingVertical: Spacing.xxxl },
  emptyDashTxt: { color: Colors.textMuted, fontSize: FontSize.base, marginTop: Spacing.md },
  emptyDashBtn: { marginTop: Spacing.base, backgroundColor: Colors.primarySurface, borderRadius: Radius.md, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, borderWidth: 1, borderColor: Colors.primary },
  emptyDashBtnTxt: { color: Colors.primary, fontWeight: FontWeight.semibold },
  statusBreakdown: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
  statusBreakItem: { flex: 1, minWidth: '30%', backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', borderWidth: 1 },
  statusBreakCount: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold },
  statusBreakLabel: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },
  // Filter bar
  filterBar: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  filterRow: { flexDirection: 'row', paddingHorizontal: pagePadding, paddingVertical: Spacing.sm, gap: Spacing.sm },
  filterChip: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border },
  filterChipActive: { backgroundColor: Colors.primarySurface, borderColor: Colors.primary },
  filterChipTxt: { fontSize: FontSize.xs, color: Colors.textSecondary },
  filterChipTxtActive: { color: Colors.primary, fontWeight: FontWeight.semibold },
  // Urgent orders
  urgentBox: { backgroundColor: Colors.errorSurface, borderRadius: Radius.lg, padding: Spacing.base, marginBottom: Spacing.xl, borderWidth: 1, borderColor: Colors.error + '40' },
  urgentHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  urgentTitle: { flex: 1, fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.error, textAlign: 'right' },
  urgentBadge: { minWidth: 24, height: 24, borderRadius: 12, backgroundColor: Colors.error, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  urgentBadgeTxt: { fontSize: FontSize.xs, color: '#fff', fontWeight: FontWeight.bold },
  urgentRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.error + '30' },
  urgentDelivery: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.sm, flexDirection: 'row', alignItems: 'center', gap: 3, minWidth: 80, justifyContent: 'center' },
  urgentDeliveryTxt: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  urgentOrderTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  urgentOrderMeta: { fontSize: FontSize.xs, color: Colors.textMuted },
  urgentStatusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 1 },
  urgentStatusTxt: { fontSize: 10, fontWeight: FontWeight.bold },
  extSummary: { flexDirection: 'row', gap: Spacing.md, padding: pagePadding, paddingBottom: Spacing.sm },
  extSumCard: { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  extSumVal: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  extSumLbl: { fontSize: FontSize.xs, color: Colors.textMuted },
});
