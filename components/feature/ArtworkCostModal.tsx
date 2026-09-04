// Powered by OnSpace.AI
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Modal, ScrollView, StyleSheet, Pressable,
  TextInput, KeyboardAvoidingView, Platform, Dimensions, Switch, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import {
  ArtworkCostSheet, CostMaterialItem, LaborRecord,
  ExternalLaborRecord, TransportRecord, PackagingRecord, OtherExpense,
  FullMaterial, Worker, DEFAULT_MANUFACTURING_STAGES,
} from '@/contexts/AppContext';

const SCREEN_H = Dimensions.get('window').height;

// ─── helpers ───────────────────────────────────────────────────────────────
function n(v: string | number) { return parseFloat(String(v)) || 0; }
function uid() { return Date.now().toString() + Math.random().toString(36).slice(2, 7); }

// ─── Section Title ──────────────────────────────────────────────────────────
function STitle({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <Text style={[st.txt, color ? { color, borderRightColor: color } : {}]}>{children}</Text>
  );
}
const st = StyleSheet.create({
  txt: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary, textAlign: 'right', marginBottom: Spacing.md, marginTop: Spacing.base, borderRightWidth: 3, borderRightColor: Colors.primary, paddingRight: Spacing.sm },
});

// ─── NumInput ────────────────────────────────────────────────────────────────
function NI({ label, value, onChange, suffix, flex, small }: { label: string; value: string; onChange: (v: string) => void; suffix?: string; flex?: number; small?: boolean }) {
  return (
    <View style={{ flex: flex || 1, marginBottom: Spacing.sm }}>
      <Text style={ni.label}>{label}</Text>
      <View style={ni.row}>
        {suffix ? <Text style={ni.suf}>{suffix}</Text> : null}
        <TextInput value={value} onChangeText={v => onChange(v.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad"
          style={[ni.input, small && { paddingVertical: 6, fontSize: FontSize.xs }]} textAlign="right"
          placeholder="0" placeholderTextColor={Colors.textMuted} />
      </View>
    </View>
  );
}
const ni = StyleSheet.create({
  label: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'right', marginBottom: 3, fontWeight: FontWeight.medium },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceElevated, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  input: { flex: 1, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, fontSize: FontSize.sm, color: Colors.textPrimary },
  suf: { paddingHorizontal: Spacing.sm, fontSize: FontSize.xs, color: Colors.textMuted, borderLeftWidth: 1, borderLeftColor: Colors.border, paddingVertical: Spacing.sm },
});

// ─── Summary Row ─────────────────────────────────────────────────────────────
function SRow({ label, value, highlight, color, big, indent }: { label: string; value: number; highlight?: boolean; color?: string; big?: boolean; indent?: boolean }) {
  const c = color || (highlight ? Colors.primary : Colors.textSecondary);
  return (
    <View style={[sr.row, indent && { paddingRight: 16 }]}>
      <Text style={[sr.val, { color: c, fontSize: big ? FontSize.xl : FontSize.sm, fontWeight: big ? FontWeight.extrabold : (highlight ? FontWeight.bold : FontWeight.regular) }]}>
        {value < 0 ? '-' : ''}{Math.abs(value).toLocaleString()} ج.م
      </Text>
      <Text style={[sr.lbl, highlight && { color: Colors.textPrimary, fontWeight: FontWeight.semibold }]}>{label}</Text>
    </View>
  );
}
const sr = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  val: { fontSize: FontSize.sm, color: Colors.primary },
  lbl: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'right', flex: 1, marginRight: 8 },
});

// ─── Stage Chip ────────────────────────────────────────────────────────────
function StageChip({ stages, selected, onSelect }: { stages: { id: string; name: string }[]; selected: string; onSelect: (id: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.sm }}>
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        {stages.map(s => (
          <Pressable key={s.id} onPress={() => onSelect(s.id)} style={[sc.chip, selected === s.id && sc.chipActive]}>
            <Text style={[sc.chipTxt, selected === s.id && sc.chipTxtActive]}>{s.name}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
const sc = StyleSheet.create({
  chip: { paddingHorizontal: Spacing.md, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primarySurface, borderColor: Colors.primary },
  chipTxt: { fontSize: FontSize.xs, color: Colors.textSecondary },
  chipTxtActive: { color: Colors.primary, fontWeight: FontWeight.bold },
});

// ─── Materials Add Panel ────────────────────────────────────────────────────
function MaterialsPanel({ fullMaterials, stages, onAdd }: {
  fullMaterials: FullMaterial[];
  stages: { id: string; name: string }[];
  onAdd: (item: CostMaterialItem) => void;
}) {
  const [matId, setMatId] = useState('');
  const [typeId, setTypeId] = useState('');
  const [stageId, setStageId] = useState('');
  const [qty, setQty] = useState('');
  const [plannedQty, setPlannedQty] = useState('');
  const [unit, setUnit] = useState('');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');
  const [showList, setShowList] = useState(false);

  const selectedMat = fullMaterials.find(m => m.id === matId);
  const selectedType = selectedMat?.types?.find(t => t.id === typeId);
  const filteredMats = fullMaterials.filter(m => !search || m.name.includes(search) || m.category?.includes(search));
  const actualQty = n(qty);
  const unitPrice = n(price);
  const total = actualQty * unitPrice;
  const plannedTotal = n(plannedQty) * unitPrice;

  function selectMat(m: FullMaterial) {
    setMatId(m.id); setTypeId('');
    setUnit(m.purchaseUnit || 'كيلو');
    setPrice(m.unitPrice?.toString() || '0');
    setShowList(false); setSearch('');
  }

  function handleAdd() {
    if (!matId || !qty || actualQty <= 0) { Alert.alert('خطأ', 'اختر خامة وأدخل الكمية'); return; }
    const stageName = stages.find(s => s.id === stageId)?.name || '';
    onAdd({
      id: uid(), materialId: matId, materialName: selectedMat?.name || '',
      typeId, typeName: selectedType?.name || '',
      quantity: actualQty, plannedQuantity: n(plannedQty) || actualQty,
      unit, unitPrice, total, plannedTotal: plannedTotal || total,
      stageId, notes,
    });
    setMatId(''); setTypeId(''); setQty(''); setPlannedQty(''); setUnit(''); setPrice(''); setNotes('');
  }

  return (
    <View style={mp.wrap}>
      <Text style={mp.title}>+ إضافة خامة</Text>
      <Pressable onPress={() => setShowList(true)} style={mp.matBtn}>
        <MaterialIcons name="arrow-drop-down" size={18} color={Colors.textMuted} />
        <Text style={[mp.matBtnTxt, matId && { color: Colors.textPrimary }]} numberOfLines={1}>
          {selectedMat?.name || 'اختر الخامة...'}
        </Text>
      </Pressable>
      {showList ? (
        <View style={mp.dropdown}>
          <TextInput value={search} onChangeText={setSearch} placeholder="بحث..." placeholderTextColor={Colors.textMuted} style={mp.search} textAlign="right" />
          <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled>
            {filteredMats.map(m => (
              <Pressable key={m.id} onPress={() => selectMat(m)} style={mp.matItem}>
                <Text style={mp.matItemPrice}>{m.unitPrice?.toLocaleString()} ج.م/{m.purchaseUnit}</Text>
                <Text style={mp.matItemName}>{m.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
      {selectedMat?.types?.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.sm }}>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            {selectedMat.types.map(t => (
              <Pressable key={t.id} onPress={() => { setTypeId(t.id); if (t.unitPrice) setPrice(t.unitPrice.toString()); if (t.unit) setUnit(t.unit); }}
                style={[mp.typeChip, typeId === t.id && mp.typeChipActive]}>
                <Text style={[mp.typeChipTxt, typeId === t.id && { color: Colors.primary }]}>{t.name}</Text>
                {t.unitPrice ? <Text style={mp.typeChipPrice}>{t.unitPrice} ج.م</Text> : null}
              </Pressable>
            ))}
          </View>
        </ScrollView>
      ) : null}
      <Text style={mp.subTitle}>المرحلة:</Text>
      <StageChip stages={stages} selected={stageId} onSelect={setStageId} />
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        <NI label="الكمية الفعلية *" value={qty} onChange={setQty} flex={1} />
        <NI label="الكمية المخططة" value={plannedQty} onChange={setPlannedQty} flex={1} />
        <NI label="الوحدة" value={unit} onChange={setUnit} flex={1} small />
      </View>
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        <NI label="سعر/وحدة (ج.م)" value={price} onChange={setPrice} flex={1} />
        {qty && price ? (
          <View style={{ flex: 1, justifyContent: 'flex-end', marginBottom: Spacing.sm }}>
            <Text style={mp.totalPreview}>{total.toLocaleString()} ج.م</Text>
          </View>
        ) : null}
      </View>
      {qty && plannedQty && n(qty) !== n(plannedQty) ? (
        <View style={mp.variance}>
          <Text style={{ fontSize: FontSize.xs, color: n(qty) > n(plannedQty) ? Colors.error : Colors.success }}>
            {n(qty) > n(plannedQty) ? '▲ زيادة: ' : '▼ وفر: '}
            {Math.abs(n(qty) - n(plannedQty)).toLocaleString()} {unit} — {Math.abs((n(qty) - n(plannedQty)) * unitPrice).toLocaleString()} ج.م
          </Text>
        </View>
      ) : null}
      <Pressable onPress={handleAdd} style={mp.addBtn}>
        <MaterialIcons name="add" size={16} color={Colors.textOnPrimary} />
        <Text style={mp.addBtnTxt}>إضافة للقائمة</Text>
      </Pressable>
    </View>
  );
}
const mp = StyleSheet.create({
  wrap: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.base, borderWidth: 1, borderColor: Colors.border },
  title: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary, textAlign: 'right', marginBottom: Spacing.md },
  subTitle: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'right', marginBottom: 4 },
  matBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', backgroundColor: Colors.card, borderRadius: Radius.sm, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm },
  matBtnTxt: { flex: 1, textAlign: 'right', fontSize: FontSize.sm, color: Colors.textMuted },
  dropdown: { backgroundColor: Colors.card, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.primary + '60', marginBottom: Spacing.sm, overflow: 'hidden' },
  search: { padding: Spacing.sm, fontSize: FontSize.sm, color: Colors.textPrimary, borderBottomWidth: 1, borderBottomColor: Colors.border },
  matItem: { flexDirection: 'row', justifyContent: 'space-between', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  matItemName: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.medium },
  matItemPrice: { fontSize: FontSize.xs, color: Colors.primary },
  typeChip: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  typeChipActive: { backgroundColor: Colors.primarySurface, borderColor: Colors.primary },
  typeChipTxt: { fontSize: FontSize.xs, color: Colors.textSecondary },
  typeChipPrice: { fontSize: 9, color: Colors.textMuted, marginTop: 1 },
  totalPreview: { textAlign: 'center', fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.bold, backgroundColor: Colors.primarySurface, padding: Spacing.sm, borderRadius: Radius.sm },
  variance: { backgroundColor: Colors.warningSurface, borderRadius: Radius.sm, padding: Spacing.sm, marginBottom: Spacing.sm },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: Spacing.md },
  addBtnTxt: { fontSize: FontSize.sm, color: Colors.textOnPrimary, fontWeight: FontWeight.bold },
});

// ─── Materials Table ────────────────────────────────────────────────────────
function MatTable({ items, stages, onRemove }: { items: CostMaterialItem[]; stages: { id: string; name: string }[]; onRemove: (id: string) => void }) {
  if (!items.length) return null;
  const total = items.reduce((s, i) => s + i.total, 0);
  const plannedTotal = items.reduce((s, i) => s + (i.plannedTotal || i.total), 0);
  return (
    <View style={mt.wrap}>
      {items.map(item => {
        const stageName = stages.find(s => s.id === item.stageId)?.name || '';
        const variance = item.total - (item.plannedTotal || item.total);
        return (
          <View key={item.id} style={mt.row}>
            <Pressable onPress={() => onRemove(item.id)} hitSlop={8}>
              <MaterialIcons name="remove-circle-outline" size={18} color={Colors.error} />
            </Pressable>
            <View style={{ flex: 1, paddingHorizontal: Spacing.sm, alignItems: 'flex-end' }}>
              <Text style={mt.name}>{item.materialName}{item.typeName ? ` — ${item.typeName}` : ''}</Text>
              <Text style={mt.meta}>{item.quantity} {item.unit} × {item.unitPrice.toLocaleString()} ج.م{stageName ? ` · ${stageName}` : ''}</Text>
              {variance !== 0 ? (
                <Text style={[mt.variance, { color: variance > 0 ? Colors.error : Colors.success }]}>
                  {variance > 0 ? 'زيادة' : 'وفر'} {Math.abs(variance).toLocaleString()} ج.م
                </Text>
              ) : null}
            </View>
            <Text style={mt.total}>{item.total.toLocaleString()}</Text>
          </View>
        );
      })}
      <View style={mt.footer}>
        {plannedTotal !== total ? (
          <Text style={[mt.footerSub, { color: total > plannedTotal ? Colors.error : Colors.success }]}>
            مخطط: {plannedTotal.toLocaleString()} ج.م
          </Text>
        ) : null}
        <Text style={mt.footerTotal}>{total.toLocaleString()} ج.م</Text>
        <Text style={mt.footerLabel}>إجمالي الخامات</Text>
      </View>
    </View>
  );
}
const mt = StyleSheet.create({
  wrap: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, marginBottom: Spacing.base, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  name: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.semibold },
  meta: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  variance: { fontSize: 10, marginTop: 2 },
  total: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.bold, minWidth: 60, textAlign: 'right' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md, backgroundColor: Colors.primarySurface },
  footerLabel: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },
  footerTotal: { fontSize: FontSize.base, color: Colors.primary, fontWeight: FontWeight.extrabold },
  footerSub: { fontSize: FontSize.xs },
});

// ─── Labor Panel ────────────────────────────────────────────────────────────
function LaborPanel({ workers, stages, onAdd }: {
  workers: Worker[];
  stages: { id: string; name: string }[];
  onAdd: (r: LaborRecord) => void;
}) {
  const [workerId, setWorkerId] = useState('');
  const [stageId, setStageId] = useState('');
  const [numWorkers, setNumWorkers] = useState('1');
  const [numDays, setNumDays] = useState('');
  const [dailyWage, setDailyWage] = useState('');
  const [isBatch, setIsBatch] = useState(false);
  const [notes, setNotes] = useState('');

  const selectedWorker = workers.find(w => w.id === workerId);
  const total = n(numWorkers) * n(numDays) * n(dailyWage);

  function handleAdd() {
    if (!numDays || !dailyWage) { Alert.alert('خطأ', 'أدخل عدد الأيام واليومية'); return; }
    const stageName = stages.find(s => s.id === stageId)?.name || '';
    onAdd({
      id: uid(),
      workerId, workerName: selectedWorker?.name || 'عامل',
      craft: selectedWorker?.craft || '',
      stageId, stageName,
      numWorkers: n(numWorkers), numDays: n(numDays), dailyWage: n(dailyWage),
      isBatchCost: isBatch, total, notes,
    });
    setWorkerId(''); setNumWorkers('1'); setNumDays(''); setDailyWage(''); setNotes('');
  }

  return (
    <View style={lp.wrap}>
      <Text style={lp.title}>+ إضافة عمالة</Text>
      {workers.length > 0 ? (
        <>
          <Text style={lp.sub}>العامل:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.sm }}>
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              {workers.map(w => (
                <Pressable key={w.id} onPress={() => { setWorkerId(w.id); setDailyWage(w.dailyWage?.toString() || ''); }}
                  style={[sc.chip, workerId === w.id && sc.chipActive]}>
                  <Text style={[sc.chipTxt, workerId === w.id && sc.chipTxtActive]}>{w.name}</Text>
                  <Text style={{ fontSize: 9, color: Colors.textMuted, textAlign: 'center' }}>{w.craft}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </>
      ) : null}
      <Text style={lp.sub}>المرحلة:</Text>
      <StageChip stages={stages} selected={stageId} onSelect={setStageId} />
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        <NI label="عدد العمال" value={numWorkers} onChange={setNumWorkers} flex={1} />
        <NI label="عدد الأيام" value={numDays} onChange={setNumDays} flex={1} />
        <NI label="اليومية (ج.م)" value={dailyWage} onChange={setDailyWage} flex={1} />
      </View>
      {total > 0 ? <Text style={lp.preview}>{total.toLocaleString()} ج.م = {numWorkers} عامل × {numDays} يوم × {dailyWage} ج.م</Text> : null}
      <View style={lp.switchRow}>
        <Switch value={isBatch} onValueChange={setIsBatch} trackColor={{ false: Colors.border, true: Colors.primarySurface }} thumbColor={isBatch ? Colors.primary : Colors.textMuted} />
        <Text style={lp.switchTxt}>{isBatch ? 'تكلفة ثابتة للدفعة كلها' : 'تكلفة لكل قطعة'}</Text>
      </View>
      <Pressable onPress={handleAdd} style={mp.addBtn}>
        <MaterialIcons name="add" size={16} color={Colors.textOnPrimary} />
        <Text style={mp.addBtnTxt}>إضافة عمالة</Text>
      </Pressable>
    </View>
  );
}
const lp = StyleSheet.create({
  wrap: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.base, borderWidth: 1, borderColor: Colors.border },
  title: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#9C6FFF', textAlign: 'right', marginBottom: Spacing.md },
  sub: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'right', marginBottom: 4 },
  preview: { fontSize: FontSize.xs, color: Colors.primary, textAlign: 'right', marginBottom: Spacing.sm, fontWeight: FontWeight.semibold },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: Spacing.md, marginBottom: Spacing.sm, backgroundColor: Colors.card, padding: Spacing.sm, borderRadius: Radius.sm },
  switchTxt: { fontSize: FontSize.xs, color: Colors.textSecondary },
});

// ─── Records List ──────────────────────────────────────────────────────────
function RecordsList({ items, labelKey, valueKey, onRemove, color }: {
  items: any[]; labelKey: string; valueKey: string; onRemove: (id: string) => void; color?: string;
}) {
  if (!items.length) return null;
  return (
    <View style={rl.wrap}>
      {items.map(item => (
        <View key={item.id} style={rl.row}>
          <Pressable onPress={() => onRemove(item.id)} hitSlop={8}>
            <MaterialIcons name="remove-circle-outline" size={16} color={Colors.error} />
          </Pressable>
          <View style={{ flex: 1, paddingHorizontal: Spacing.sm, alignItems: 'flex-end' }}>
            <Text style={rl.name}>{item[labelKey]}</Text>
            {item.stageName ? <Text style={rl.meta}>{item.stageName}</Text> : null}
            {item.isBatchCost ? <Text style={rl.badge}>ثابتة للدفعة</Text> : null}
          </View>
          <Text style={[rl.total, color ? { color } : {}]}>{(item[valueKey] || 0).toLocaleString()} ج.م</Text>
        </View>
      ))}
    </View>
  );
}
const rl = StyleSheet.create({
  wrap: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, marginBottom: Spacing.base, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  name: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.medium },
  meta: { fontSize: FontSize.xs, color: Colors.textMuted },
  badge: { fontSize: 10, color: Colors.info, marginTop: 2 },
  total: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.bold, minWidth: 60, textAlign: 'right' },
});

// ─── External Labor (مصنعيات) Panel ────────────────────────────────────────
function ExtLaborPanel({ stages, onAdd }: { stages: { id: string; name: string }[]; onAdd: (r: ExternalLaborRecord) => void }) {
  const [service, setService] = useState('');
  const [workshop, setWorkshop] = useState('');
  const [stageId, setStageId] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('قطعة');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');

  const total = n(qty) * n(price);

  function handleAdd() {
    if (!service.trim() || !qty || !price) { Alert.alert('خطأ', 'أدخل اسم الخدمة والكمية والسعر'); return; }
    const stageName = stages.find(s => s.id === stageId)?.name || '';
    onAdd({ id: uid(), serviceName: service, workshopOrPerson: workshop, stageId, stageName, quantity: n(qty), unit, pricePerUnit: n(price), total, notes });
    setService(''); setWorkshop(''); setQty(''); setUnit('قطعة'); setPrice(''); setNotes('');
  }

  return (
    <View style={el.wrap}>
      <Text style={el.title}>+ إضافة مصنعية</Text>
      <View style={{ marginBottom: Spacing.sm }}>
        <Text style={ni.label}>اسم الخدمة *</Text>
        <TextInput value={service} onChangeText={setService} style={el.input} textAlign="right" placeholder="مثال: دهان، حدادة..." placeholderTextColor={Colors.textMuted} />
      </View>
      <View style={{ marginBottom: Spacing.sm }}>
        <Text style={ni.label}>الورشة / الشخص</Text>
        <TextInput value={workshop} onChangeText={setWorkshop} style={el.input} textAlign="right" placeholder="اسم الورشة..." placeholderTextColor={Colors.textMuted} />
      </View>
      <Text style={ni.label}>المرحلة:</Text>
      <StageChip stages={stages} selected={stageId} onSelect={setStageId} />
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        <NI label="الكمية" value={qty} onChange={setQty} flex={1} />
        <NI label="الوحدة" value={unit} onChange={setUnit} flex={1} small />
        <NI label="السعر/وحدة" value={price} onChange={setPrice} suffix="ج.م" flex={1} />
      </View>
      {total > 0 ? <Text style={lp.preview}>{qty} {unit} × {price} ج.م = {total.toLocaleString()} ج.م</Text> : null}
      <Pressable onPress={handleAdd} style={mp.addBtn}>
        <MaterialIcons name="add" size={16} color={Colors.textOnPrimary} />
        <Text style={mp.addBtnTxt}>إضافة مصنعية</Text>
      </Pressable>
    </View>
  );
}
const el = StyleSheet.create({
  wrap: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.base, borderWidth: 1, borderColor: Colors.border },
  title: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.success, textAlign: 'right', marginBottom: Spacing.md },
  input: { backgroundColor: Colors.card, borderRadius: Radius.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: FontSize.sm, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },
});

// ─── Transport Panel ────────────────────────────────────────────────────────
function TransportPanel({ onAdd }: { onAdd: (r: TransportRecord) => void }) {
  const [desc, setDesc] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [trips, setTrips] = useState('1');
  const [perTrip, setPerTrip] = useState('');
  const [loading_, setLoading] = useState('0');
  const [unloading, setUnloading] = useState('0');
  const [additional, setAdditional] = useState('0');
  const [assignedTo, setAssignedTo] = useState('materials');
  const [included, setIncluded] = useState(false);

  const total = n(trips) * n(perTrip) + n(loading_) + n(unloading) + n(additional);

  function handleAdd() {
    if (!desc.trim()) { Alert.alert('خطأ', 'أدخل وصف النقل'); return; }
    onAdd({ id: uid(), description: desc, from, to, numTrips: n(trips), costPerTrip: n(perTrip), loadingCost: n(loading_), unloadingCost: n(unloading), additionalCost: n(additional), total, assignedTo, includedInManufacturing: included, notes: '' });
    setDesc(''); setFrom(''); setTo(''); setTrips('1'); setPerTrip(''); setLoading('0'); setUnloading('0'); setAdditional('0'); setIncluded(false);
  }

  return (
    <View style={tp.wrap}>
      <Text style={tp.title}>+ إضافة نقل</Text>
      <View style={{ marginBottom: Spacing.sm }}>
        <Text style={ni.label}>الوصف *</Text>
        <TextInput value={desc} onChangeText={setDesc} style={el.input} textAlign="right" placeholder="وصف النقل..." placeholderTextColor={Colors.textMuted} />
      </View>
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        <View style={{ flex: 1, marginBottom: Spacing.sm }}>
          <Text style={ni.label}>من</Text>
          <TextInput value={from} onChangeText={setFrom} style={el.input} textAlign="right" placeholder="المصدر" placeholderTextColor={Colors.textMuted} />
        </View>
        <View style={{ flex: 1, marginBottom: Spacing.sm }}>
          <Text style={ni.label}>إلى</Text>
          <TextInput value={to} onChangeText={setTo} style={el.input} textAlign="right" placeholder="الوجهة" placeholderTextColor={Colors.textMuted} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        <NI label="عدد الرحلات" value={trips} onChange={setTrips} flex={1} />
        <NI label="تكلفة الرحلة" value={perTrip} onChange={setPerTrip} suffix="ج.م" flex={1} />
      </View>
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        <NI label="شحن" value={loading_} onChange={setLoading} suffix="ج.م" flex={1} />
        <NI label="تفريغ" value={unloading} onChange={setUnloading} suffix="ج.م" flex={1} />
        <NI label="إضافي" value={additional} onChange={setAdditional} suffix="ج.م" flex={1} />
      </View>
      {total > 0 ? <Text style={lp.preview}>الإجمالي: {total.toLocaleString()} ج.م</Text> : null}
      <View style={[lp.switchRow, { marginTop: Spacing.sm }]}>
        <Switch value={included} onValueChange={setIncluded} trackColor={{ false: Colors.border, true: Colors.warningSurface }} thumbColor={included ? Colors.warning : Colors.textMuted} />
        <Text style={lp.switchTxt}>{included ? 'مشمول في سعر التصنيع — لن يُضاف' : 'تكلفة إضافية'}</Text>
      </View>
      <Pressable onPress={handleAdd} style={[mp.addBtn, { backgroundColor: Colors.info }]}>
        <MaterialIcons name="add" size={16} color="#fff" />
        <Text style={mp.addBtnTxt}>إضافة نقل</Text>
      </Pressable>
    </View>
  );
}
const tp = StyleSheet.create({
  wrap: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.base, borderWidth: 1, borderColor: Colors.border },
  title: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.info, textAlign: 'right', marginBottom: Spacing.md },
});

// ─── Packaging Panel ────────────────────────────────────────────────────────
function PackagingPanel({ fullMaterials, onAdd }: { fullMaterials: FullMaterial[]; onAdd: (r: PackagingRecord) => void }) {
  const [type, setType] = useState('');
  const [matId, setMatId] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('قطعة');
  const [price, setPrice] = useState('');
  const [labor, setLabor] = useState('0');
  const [artQty, setArtQty] = useState('1');
  const [included, setIncluded] = useState(false);

  const selectedMat = fullMaterials.find(m => m.id === matId);
  const total = (n(qty) * n(price) + n(labor)) * n(artQty);

  const PACK_TYPES = ['كرتون', 'فقاعات هواء', 'فوم', 'صندوق خشب', 'ستريتش', 'شريط لاصق', 'أركان واقية'];

  function handleAdd() {
    if (!type.trim()) { Alert.alert('خطأ', 'اختر نوع التغليف'); return; }
    onAdd({ id: uid(), packagingType: type, materialId: matId, materialName: selectedMat?.name || '', quantity: n(qty), unit, unitPrice: n(price), laborCost: n(labor), artworkQuantity: n(artQty), total, includedInSupplierPrice: included, notes: '' });
    setType(''); setMatId(''); setQty(''); setUnit('قطعة'); setPrice(''); setLabor('0'); setIncluded(false);
  }

  return (
    <View style={pp.wrap}>
      <Text style={pp.title}>+ إضافة تغليف</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.sm }}>
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          {PACK_TYPES.map(pt => (
            <Pressable key={pt} onPress={() => setType(pt)} style={[sc.chip, type === pt && sc.chipActive]}>
              <Text style={[sc.chipTxt, type === pt && sc.chipTxtActive]}>{pt}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        <NI label="الكمية" value={qty} onChange={setQty} flex={1} />
        <NI label="الوحدة" value={unit} onChange={setUnit} flex={1} small />
        <NI label="سعر/وحدة" value={price} onChange={setPrice} suffix="ج.م" flex={1} />
      </View>
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        <NI label="عمالة تغليف" value={labor} onChange={setLabor} suffix="ج.م" flex={1} />
        <NI label="عدد القطع" value={artQty} onChange={setArtQty} flex={1} />
      </View>
      {total > 0 ? <Text style={lp.preview}>الإجمالي: {total.toLocaleString()} ج.م</Text> : null}
      <View style={[lp.switchRow, { marginTop: Spacing.sm }]}>
        <Switch value={included} onValueChange={setIncluded} trackColor={{ false: Colors.border, true: Colors.warningSurface }} thumbColor={included ? Colors.warning : Colors.textMuted} />
        <Text style={lp.switchTxt}>{included ? 'مشمول في سعر المورد — لن يُضاف' : 'تكلفة إضافية'}</Text>
      </View>
      <Pressable onPress={handleAdd} style={[mp.addBtn, { backgroundColor: Colors.warning }]}>
        <MaterialIcons name="add" size={16} color="#fff" />
        <Text style={mp.addBtnTxt}>إضافة تغليف</Text>
      </Pressable>
    </View>
  );
}
const pp = StyleSheet.create({
  wrap: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.base, borderWidth: 1, borderColor: Colors.border },
  title: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.warning, textAlign: 'right', marginBottom: Spacing.md },
});

// ─── Other Expenses Panel ───────────────────────────────────────────────────
function OtherExpPanel({ onAdd }: { onAdd: (r: OtherExpense) => void }) {
  const [name, setName] = useState('');
  const [cat, setCat] = useState('');
  const [qty, setQty] = useState('1');
  const [cost, setCost] = useState('');
  const [isBatch, setIsBatch] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const total = n(qty) * n(cost);

  function handleAdd() {
    if (!name.trim() || !cost) { Alert.alert('خطأ', 'أدخل الاسم والتكلفة'); return; }
    onAdd({ id: uid(), name, category: cat, quantity: n(qty), unitCost: n(cost), total, date, isBatchCost: isBatch, notes: '' });
    setName(''); setCat(''); setQty('1'); setCost(''); setIsBatch(false);
  }

  return (
    <View style={oe.wrap}>
      <Text style={oe.title}>+ مصروف آخر</Text>
      <View style={{ marginBottom: Spacing.sm }}>
        <Text style={ni.label}>اسم المصروف *</Text>
        <TextInput value={name} onChangeText={setName} style={el.input} textAlign="right" placeholder="اسم المصروف..." placeholderTextColor={Colors.textMuted} />
      </View>
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        <NI label="الكمية" value={qty} onChange={setQty} flex={1} />
        <NI label="التكلفة/وحدة" value={cost} onChange={setCost} suffix="ج.م" flex={1} />
      </View>
      {total > 0 ? <Text style={lp.preview}>الإجمالي: {total.toLocaleString()} ج.م</Text> : null}
      <View style={lp.switchRow}>
        <Switch value={isBatch} onValueChange={setIsBatch} trackColor={{ false: Colors.border, true: Colors.primarySurface }} thumbColor={isBatch ? Colors.primary : Colors.textMuted} />
        <Text style={lp.switchTxt}>{isBatch ? 'ثابتة للدفعة' : 'لكل قطعة'}</Text>
      </View>
      <Pressable onPress={handleAdd} style={[mp.addBtn, { backgroundColor: Colors.error }]}>
        <MaterialIcons name="add" size={16} color="#fff" />
        <Text style={mp.addBtnTxt}>إضافة مصروف</Text>
      </Pressable>
    </View>
  );
}
const oe = StyleSheet.create({
  wrap: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.base, borderWidth: 1, borderColor: Colors.border },
  title: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.error, textAlign: 'right', marginBottom: Spacing.md },
});

// ─── Main Modal ──────────────────────────────────────────────────────────────
type Tab = 'materials' | 'labor' | 'external_labor' | 'transport' | 'packaging' | 'other' | 'pricing' | 'history';

export function ArtworkCostModal({ visible, artworkId, artworkTitle, onClose }: {
  visible: boolean; artworkId: string; artworkTitle: string; onClose: () => void;
}) {
  const { fullMaterials, workers, getArtworkCosts, getLatestCost, addArtworkCost, updateArtworkCost } = useApp();
  const existingCosts = getArtworkCosts(artworkId);
  const latestCost = getLatestCost(artworkId);

  const stages = DEFAULT_MANUFACTURING_STAGES;

  // State
  const [productionQty, setProductionQty] = useState('1');
  const [matItems, setMatItems] = useState<CostMaterialItem[]>([]);
  const [laborRecords, setLaborRecords] = useState<LaborRecord[]>([]);
  const [extLaborRecords, setExtLaborRecords] = useState<ExternalLaborRecord[]>([]);
  const [transportRecords, setTransportRecords] = useState<TransportRecord[]>([]);
  const [packagingRecords, setPackagingRecords] = useState<PackagingRecord[]>([]);
  const [otherExpenses, setOtherExpenses] = useState<OtherExpense[]>([]);
  // Legacy simple cost fields
  const [laborCost, setLaborCost] = useState('');
  const [externalCost, setExternalCost] = useState('');
  const [paintingCost, setPaintingCost] = useState('');
  const [electricalCost, setElectricalCost] = useState('');
  const [emergencyCost, setEmergencyCost] = useState('');
  // Pricing
  const [profitPct, setProfitPct] = useState('30');
  const [discountPct, setDiscountPct] = useState('0');
  const [applyTax, setApplyTax] = useState(false);
  const [taxPct, setTaxPct] = useState('14');
  const [deliveryCost, setDeliveryCost] = useState('');
  const [installationCost, setInstallationCost] = useState('');
  const [showToCustomer, setShowToCustomer] = useState(false);
  const [costNotes, setCostNotes] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('materials');
  const [editingCostId, setEditingCostId] = useState<string | null>(null);

  useEffect(() => {
    if (visible && latestCost) loadCostData(latestCost);
    else if (visible) resetForm();
  }, [visible, artworkId]);

  function loadCostData(cost: ArtworkCostSheet) {
    setEditingCostId(cost.id);
    setProductionQty(cost.productionQuantity?.toString() || '1');
    setMatItems(cost.materialItems || []);
    setLaborRecords(cost.laborRecords || []);
    setExtLaborRecords(cost.externalLaborRecords || []);
    setTransportRecords(cost.transportRecords || []);
    setPackagingRecords(cost.packagingRecords || []);
    setOtherExpenses(cost.otherExpenses || []);
    setLaborCost(cost.laborCost?.toString() || '');
    setExternalCost(cost.externalManufacturingCost?.toString() || '');
    setPaintingCost(cost.paintingCost?.toString() || '');
    setElectricalCost(cost.electricalCost?.toString() || '');
    setEmergencyCost(cost.emergencyCost?.toString() || '');
    setProfitPct(cost.profitPercentage?.toString() || '30');
    setDiscountPct(cost.discountPercentage?.toString() || '0');
    setApplyTax(cost.applyTax || false);
    setTaxPct(cost.taxPercentage?.toString() || '14');
    setDeliveryCost(cost.deliveryCost?.toString() || '');
    setInstallationCost(cost.installationPriceCost?.toString() || '');
    setShowToCustomer(cost.showPriceToCustomer || false);
    setCostNotes(cost.notes || '');
  }

  function resetForm() {
    setEditingCostId(null);
    setProductionQty('1');
    setMatItems([]); setLaborRecords([]); setExtLaborRecords([]);
    setTransportRecords([]); setPackagingRecords([]); setOtherExpenses([]);
    setLaborCost(''); setExternalCost(''); setPaintingCost('');
    setElectricalCost(''); setEmergencyCost('');
    setProfitPct('30'); setDiscountPct('0'); setApplyTax(false); setTaxPct('14');
    setDeliveryCost(''); setInstallationCost('');
    setShowToCustomer(false); setCostNotes('');
    setActiveTab('materials');
  }

  const pQty = Math.max(1, n(productionQty));

  // ─── Calculations ──────────────────────────────────────────────────────
  const totalMatCost = matItems.reduce((s, i) => s + i.total, 0);

  const totalLaborCost = laborRecords.reduce((s, r) => {
    return s + (r.isBatchCost ? r.total : r.total * pQty);
  }, 0) + n(laborCost);

  const totalExtLaborCost = extLaborRecords.reduce((s, r) => s + r.total, 0);

  const totalTransportCost = transportRecords
    .filter(r => !r.includedInManufacturing)
    .reduce((s, r) => s + r.total, 0);

  const totalPackagingCost = packagingRecords
    .filter(r => !r.includedInSupplierPrice)
    .reduce((s, r) => s + r.total, 0);

  const totalOtherCost = otherExpenses.reduce((s, e) => {
    return s + (e.isBatchCost ? e.total : e.total * pQty);
  }, 0);

  const totalExternalManuf = n(externalCost);
  const totalPaintingElectrical = n(paintingCost) + n(electricalCost) + n(emergencyCost);

  const totalProdCostBeforeTax =
    totalMatCost + totalLaborCost + totalExtLaborCost +
    totalTransportCost + totalPackagingCost + totalOtherCost +
    totalExternalManuf + totalPaintingElectrical;

  const taxAmount = applyTax ? totalProdCostBeforeTax * (n(taxPct) / 100) : 0;
  const totalCostAfterTax = totalProdCostBeforeTax + taxAmount;
  const costPerPiece = totalCostAfterTax / pQty;

  const profitAmount = costPerPiece * (n(profitPct) / 100);
  const suggestedPrice = costPerPiece + profitAmount;
  const discountAmount = suggestedPrice * (n(discountPct) / 100);
  const finalPrice = suggestedPrice - discountAmount + n(deliveryCost) + n(installationCost);

  function handleSave() {
    const costData: Omit<ArtworkCostSheet, 'id' | 'createdAt'> = {
      artworkId, version: existingCosts.length + (editingCostId ? 0 : 1),
      date: new Date().toISOString(),
      productionQuantity: pQty,
      materialItems: matItems,
      laborRecords, externalLaborRecords: extLaborRecords,
      transportRecords, packagingRecords, otherExpenses,
      laborCost: n(laborCost), externalManufacturingCost: n(externalCost),
      paintingCost: n(paintingCost), electricalCost: n(electricalCost),
      transportCost: totalTransportCost, packagingCost: totalPackagingCost,
      installationCost: 0, otherCost: totalOtherCost, emergencyCost: n(emergencyCost),
      totalMaterialCost: totalMatCost,
      totalLaborCost, totalExternalLaborCost: totalExtLaborCost,
      totalTransportCost, totalPackagingCost, totalOtherExpensesCost: totalOtherCost,
      totalProductionCost: totalProdCostBeforeTax,
      costPerPiece,
      applyTax, taxPercentage: n(taxPct), taxAmount,
      totalCostAfterTax,
      profitPercentage: n(profitPct), profitAmount,
      suggestedPrice, discountPercentage: n(discountPct), discountAmount,
      finalPrice,
      deliveryCost: n(deliveryCost), installationPriceCost: n(installationCost),
      showPriceToCustomer: showToCustomer, notes: costNotes,
    };
    if (editingCostId) updateArtworkCost(editingCostId, costData);
    else addArtworkCost(costData);
    onClose();
  }

  const TABS: { id: Tab; label: string; icon: any; color: string }[] = [
    { id: 'materials', label: 'الخامات', icon: 'category', color: Colors.primary },
    { id: 'labor', label: 'عمالة', icon: 'people', color: '#9C6FFF' },
    { id: 'external_labor', label: 'مصنعيات', icon: 'handyman', color: Colors.success },
    { id: 'transport', label: 'نقل', icon: 'local-shipping', color: Colors.info },
    { id: 'packaging', label: 'تغليف', icon: 'inventory', color: Colors.warning },
    { id: 'other', label: 'أخرى', icon: 'more-horiz', color: Colors.error },
    { id: 'pricing', label: 'التسعير', icon: 'attach-money', color: Colors.primary },
    { id: 'history', label: `سجل (${existingCosts.length})`, icon: 'history', color: Colors.textMuted },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={ms.overlay}>
          <View style={[ms.sheet, { height: SCREEN_H * 0.95 }]}>
            <View style={ms.handle} />
            {/* Header */}
            <View style={ms.header}>
              <View style={ms.adminBadge}>
                <MaterialIcons name="lock" size={12} color={Colors.warning} />
                <Text style={ms.adminBadgeTxt}>للمشرف فقط</Text>
              </View>
              <Text style={ms.titleTxt} numberOfLines={1}>{artworkTitle}</Text>
              <Pressable onPress={onClose} style={ms.closeBtn}>
                <MaterialIcons name="close" size={20} color={Colors.textSecondary} />
              </Pressable>
            </View>
            {/* Qty + summary strip */}
            <View style={ms.qtyStrip}>
              <View style={ms.qtyBlock}>
                <Text style={ms.qtyLabel}>كمية التصنيع</Text>
                <TextInput value={productionQty} onChangeText={v => setProductionQty(v.replace(/[^0-9]/g, ''))} keyboardType="number-pad" style={ms.qtyInput} textAlign="center" />
                <Text style={ms.qtyUnit}>قطعة</Text>
              </View>
              <View style={ms.costStrip}>
                <View style={ms.costItem}>
                  <Text style={ms.costItemVal}>{totalProdCostBeforeTax.toLocaleString()}</Text>
                  <Text style={ms.costItemLbl}>الإجمالي</Text>
                </View>
                <View style={ms.costDivider} />
                <View style={ms.costItem}>
                  <Text style={[ms.costItemVal, { color: Colors.primary }]}>{costPerPiece.toLocaleString()}</Text>
                  <Text style={ms.costItemLbl}>للقطعة</Text>
                </View>
                <View style={ms.costDivider} />
                <View style={ms.costItem}>
                  <Text style={[ms.costItemVal, { color: Colors.success }]}>{finalPrice.toLocaleString()}</Text>
                  <Text style={ms.costItemLbl}>البيع النهائي</Text>
                </View>
              </View>
            </View>

            {/* Tab bar */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={ms.tabBar}>
              <View style={ms.tabRow}>
                {TABS.map(tab => (
                  <Pressable key={tab.id} onPress={() => setActiveTab(tab.id)}
                    style={[ms.tabBtn, activeTab === tab.id && { borderBottomColor: tab.color, borderBottomWidth: 2 }]}>
                    <MaterialIcons name={tab.icon} size={14} color={activeTab === tab.id ? tab.color : Colors.textMuted} />
                    <Text style={[ms.tabTxt, activeTab === tab.id && { color: tab.color, fontWeight: FontWeight.bold }]}>{tab.label}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            {/* Content */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={ms.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

              {/* MATERIALS TAB */}
              {activeTab === 'materials' ? (
                <>
                  <STitle>الخامات المستخدمة</STitle>
                  <MatTable items={matItems} stages={stages} onRemove={id => setMatItems(prev => prev.filter(i => i.id !== id))} />
                  {fullMaterials.length > 0 ? (
                    <MaterialsPanel fullMaterials={fullMaterials} stages={stages} onAdd={item => setMatItems(prev => [...prev, item])} />
                  ) : (
                    <View style={ms.noData}>
                      <MaterialIcons name="info-outline" size={18} color={Colors.warning} />
                      <Text style={ms.noDataTxt}>لا توجد خامات — أضف من صفحة إدارة الخامات أولاً</Text>
                    </View>
                  )}
                </>
              ) : null}

              {/* LABOR TAB */}
              {activeTab === 'labor' ? (
                <>
                  <STitle color="#9C6FFF">العمالة واليوميات</STitle>
                  <RecordsList items={laborRecords} labelKey="workerName" valueKey="total"
                    onRemove={id => setLaborRecords(prev => prev.filter(r => r.id !== id))} color="#9C6FFF" />
                  <LaborPanel workers={workers} stages={stages} onAdd={r => setLaborRecords(prev => [...prev, r])} />
                  <STitle color="#9C6FFF">تكاليف عمالة إضافية (ج.م)</STitle>
                  <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                    <NI label="أجر عمالة" value={laborCost} onChange={setLaborCost} suffix="ج.م" flex={1} />
                    <NI label="دهان وتشطيب" value={paintingCost} onChange={setPaintingCost} suffix="ج.م" flex={1} />
                  </View>
                  <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                    <NI label="كهربائي" value={electricalCost} onChange={setElectricalCost} suffix="ج.م" flex={1} />
                    <NI label="طوارئ" value={emergencyCost} onChange={setEmergencyCost} suffix="ج.م" flex={1} />
                  </View>
                </>
              ) : null}

              {/* EXTERNAL LABOR TAB */}
              {activeTab === 'external_labor' ? (
                <>
                  <STitle color={Colors.success}>مصنعيات خارجية</STitle>
                  <RecordsList items={extLaborRecords} labelKey="serviceName" valueKey="total"
                    onRemove={id => setExtLaborRecords(prev => prev.filter(r => r.id !== id))} color={Colors.success} />
                  <ExtLaborPanel stages={stages} onAdd={r => setExtLaborRecords(prev => [...prev, r])} />
                  <STitle color={Colors.success}>تصنيع خارجي (مصانع / ورش)</STitle>
                  <NI label="تكلفة التصنيع الخارجي الإجمالية (ج.م)" value={externalCost} onChange={setExternalCost} suffix="ج.م" />
                </>
              ) : null}

              {/* TRANSPORT TAB */}
              {activeTab === 'transport' ? (
                <>
                  <STitle color={Colors.info}>سجلات النقل</STitle>
                  {transportRecords.length > 0 ? (
                    <View style={rl.wrap}>
                      {transportRecords.map(r => (
                        <View key={r.id} style={rl.row}>
                          <Pressable onPress={() => setTransportRecords(prev => prev.filter(x => x.id !== r.id))} hitSlop={8}>
                            <MaterialIcons name="remove-circle-outline" size={16} color={Colors.error} />
                          </Pressable>
                          <View style={{ flex: 1, paddingHorizontal: Spacing.sm, alignItems: 'flex-end' }}>
                            <Text style={rl.name}>{r.description}</Text>
                            <Text style={rl.meta}>{r.from} ← {r.to} · {r.numTrips} رحلة</Text>
                            {r.includedInManufacturing ? <Text style={[rl.badge, { color: Colors.warning }]}>مشمول في سعر التصنيع</Text> : null}
                          </View>
                          <Text style={[rl.total, { color: r.includedInManufacturing ? Colors.textMuted : Colors.info }]}>
                            {r.includedInManufacturing ? '0' : r.total.toLocaleString()} ج.م
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                  <TransportPanel onAdd={r => setTransportRecords(prev => [...prev, r])} />
                </>
              ) : null}

              {/* PACKAGING TAB */}
              {activeTab === 'packaging' ? (
                <>
                  <STitle color={Colors.warning}>التغليف</STitle>
                  {packagingRecords.length > 0 ? (
                    <View style={rl.wrap}>
                      {packagingRecords.map(r => (
                        <View key={r.id} style={rl.row}>
                          <Pressable onPress={() => setPackagingRecords(prev => prev.filter(x => x.id !== r.id))} hitSlop={8}>
                            <MaterialIcons name="remove-circle-outline" size={16} color={Colors.error} />
                          </Pressable>
                          <View style={{ flex: 1, paddingHorizontal: Spacing.sm, alignItems: 'flex-end' }}>
                            <Text style={rl.name}>{r.packagingType}</Text>
                            <Text style={rl.meta}>{r.quantity} {r.unit} × {r.unitPrice} ج.م + عمالة {r.laborCost} ج.م</Text>
                            {r.includedInSupplierPrice ? <Text style={[rl.badge, { color: Colors.warning }]}>مشمول في سعر المورد</Text> : null}
                          </View>
                          <Text style={[rl.total, { color: r.includedInSupplierPrice ? Colors.textMuted : Colors.warning }]}>
                            {r.includedInSupplierPrice ? '0' : r.total.toLocaleString()} ج.م
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                  <PackagingPanel fullMaterials={fullMaterials} onAdd={r => setPackagingRecords(prev => [...prev, r])} />
                </>
              ) : null}

              {/* OTHER TAB */}
              {activeTab === 'other' ? (
                <>
                  <STitle color={Colors.error}>مصروفات أخرى</STitle>
                  {otherExpenses.length > 0 ? (
                    <View style={rl.wrap}>
                      {otherExpenses.map(e => (
                        <View key={e.id} style={rl.row}>
                          <Pressable onPress={() => setOtherExpenses(prev => prev.filter(x => x.id !== e.id))} hitSlop={8}>
                            <MaterialIcons name="remove-circle-outline" size={16} color={Colors.error} />
                          </Pressable>
                          <View style={{ flex: 1, paddingHorizontal: Spacing.sm, alignItems: 'flex-end' }}>
                            <Text style={rl.name}>{e.name}</Text>
                            <Text style={rl.meta}>{e.quantity} × {e.unitCost.toLocaleString()} ج.م</Text>
                            {e.isBatchCost ? <Text style={rl.badge}>ثابتة للدفعة</Text> : null}
                          </View>
                          <Text style={[rl.total, { color: Colors.error }]}>{e.total.toLocaleString()} ج.م</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                  <OtherExpPanel onAdd={e => setOtherExpenses(prev => [...prev, e])} />
                </>
              ) : null}

              {/* PRICING TAB */}
              {activeTab === 'pricing' ? (
                <>
                  {/* Cost Summary */}
                  <STitle>ملخص التكلفة</STitle>
                  <View style={ms.summaryCard}>
                    <SRow label="إجمالي الخامات" value={totalMatCost} />
                    <SRow label="إجمالي العمالة" value={totalLaborCost} />
                    <SRow label="المصنعيات الخارجية" value={totalExtLaborCost} />
                    <SRow label="التصنيع الخارجي" value={totalExternalManuf} />
                    <SRow label="النقل والشحن" value={totalTransportCost} />
                    <SRow label="التغليف" value={totalPackagingCost} />
                    <SRow label="مصروفات أخرى" value={totalOtherCost} />
                    <SRow label="دهان وكهربائي وطوارئ" value={totalPaintingElectrical} />
                    <View style={ms.divider} />
                    <SRow label="تكلفة الإنتاج قبل الضريبة" value={totalProdCostBeforeTax} highlight />
                    {pQty > 1 ? <SRow label={`عدد القطع: ${pQty}`} value={0} /> : null}

                    {/* Tax */}
                    <View style={[lp.switchRow, { marginTop: Spacing.md }]}>
                      <Switch value={applyTax} onValueChange={setApplyTax}
                        trackColor={{ false: Colors.border, true: Colors.errorSurface }}
                        thumbColor={applyTax ? Colors.error : Colors.textMuted} />
                      <Text style={lp.switchTxt}>تطبيق ضريبة</Text>
                    </View>
                    {applyTax ? (
                      <>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm }}>
                          <NI label="نسبة الضريبة %" value={taxPct} onChange={setTaxPct} flex={1} />
                          <View style={{ flex: 2 }}>
                            <Text style={ni.label}>قيمة الضريبة</Text>
                            <Text style={{ fontSize: FontSize.base, color: Colors.error, fontWeight: FontWeight.bold, textAlign: 'right', padding: Spacing.sm }}>{taxAmount.toLocaleString()} ج.م</Text>
                          </View>
                        </View>
                        <SRow label="الإجمالي بعد الضريبة" value={totalCostAfterTax} highlight color={Colors.error} />
                      </>
                    ) : null}

                    <View style={ms.divider} />
                    {/* Per piece */}
                    {pQty > 1 ? (
                      <>
                        <View style={ms.perPieceBox}>
                          <Text style={ms.perPieceVal}>{costPerPiece.toLocaleString()} ج.م</Text>
                          <Text style={ms.perPieceLbl}>تكلفة القطعة الواحدة</Text>
                        </View>
                        <Text style={ms.batchNote}>إجمالي أمر التصنيع ({pQty} قطعة): {totalCostAfterTax.toLocaleString()} ج.م</Text>
                      </>
                    ) : null}

                    {/* Profit */}
                    <View style={ms.divider} />
                    <STitle>التسعير والربح</STitle>
                    <View style={ms.pctRow}>
                      <TextInput value={profitPct} onChangeText={v => setProfitPct(v.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" style={ms.pctInput} textAlign="center" />
                      <Text style={ms.pctLabel}>% نسبة الربح</Text>
                    </View>
                    <SRow label="قيمة الربح" value={profitAmount} color={Colors.success} />
                    <SRow label="السعر المقترح للقطعة" value={suggestedPrice} highlight color={Colors.primary} />

                    <View style={ms.pctRow}>
                      <TextInput value={discountPct} onChangeText={v => setDiscountPct(v.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" style={ms.pctInput} textAlign="center" />
                      <Text style={ms.pctLabel}>% خصم</Text>
                    </View>
                    {discountAmount > 0 ? <SRow label="قيمة الخصم" value={-discountAmount} color={Colors.warning} /> : null}
                    <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                      <NI label="توصيل (ج.م)" value={deliveryCost} onChange={setDeliveryCost} flex={1} />
                      <NI label="تركيب (ج.م)" value={installationCost} onChange={setInstallationCost} flex={1} />
                    </View>

                    <View style={ms.divider} />
                    <View style={ms.finalBox}>
                      <Text style={ms.finalVal}>{finalPrice.toLocaleString()} ج.م</Text>
                      <Text style={ms.finalLbl}>السعر النهائي للبيع</Text>
                    </View>
                  </View>

                  <View style={[lp.switchRow, { marginTop: Spacing.md }]}>
                    <Switch value={showToCustomer} onValueChange={setShowToCustomer}
                      trackColor={{ false: Colors.border, true: Colors.primarySurface }}
                      thumbColor={showToCustomer ? Colors.primary : Colors.textMuted} />
                    <Text style={lp.switchTxt}>عرض السعر النهائي للعميل</Text>
                  </View>

                  <Text style={ni.label}>ملاحظات</Text>
                  <TextInput value={costNotes} onChangeText={setCostNotes} multiline style={ms.notesInput}
                    textAlign="right" placeholder="ملاحظات..." placeholderTextColor={Colors.textMuted} />

                  <Pressable onPress={handleSave} style={ms.saveBtn}>
                    <MaterialIcons name="save" size={20} color={Colors.textOnPrimary} />
                    <Text style={ms.saveBtnTxt}>{editingCostId ? 'تحديث حساب التكلفة' : 'حفظ حساب التكلفة'}</Text>
                  </Pressable>
                  {editingCostId ? (
                    <Pressable onPress={resetForm} style={ms.newVersionBtn}>
                      <MaterialIcons name="add" size={16} color={Colors.primary} />
                      <Text style={ms.newVersionTxt}>إنشاء نسخة جديدة</Text>
                    </Pressable>
                  ) : null}
                </>
              ) : null}

              {/* HISTORY TAB */}
              {activeTab === 'history' ? (
                <>
                  <STitle>سجل حسابات التكلفة</STitle>
                  {existingCosts.length === 0 ? (
                    <View style={{ alignItems: 'center', padding: Spacing.xxxl }}>
                      <MaterialIcons name="history" size={48} color={Colors.textMuted} />
                      <Text style={{ color: Colors.textMuted, marginTop: Spacing.md }}>لا يوجد سجل بعد</Text>
                    </View>
                  ) : (
                    existingCosts.map(c => (
                      <Pressable key={c.id} onPress={() => { loadCostData(c); setActiveTab('materials'); }} style={ms.histCard}>
                        <View style={{ alignItems: 'flex-end', gap: 4 }}>
                          <Text style={ms.histVersion}>نسخة #{c.version} — {new Date(c.date).toLocaleDateString('ar-EG')}</Text>
                          <Text style={ms.histTotal}>تكلفة الإنتاج: {c.totalProductionCost?.toLocaleString() || 0} ج.م</Text>
                          {(c.productionQuantity || 1) > 1 ? (
                            <Text style={{ fontSize: FontSize.xs, color: Colors.textMuted }}>
                              {c.productionQuantity} قطعة · للقطعة: {c.costPerPiece?.toLocaleString() || 0} ج.م
                            </Text>
                          ) : null}
                          <Text style={ms.histFinal}>سعر نهائي: {c.finalPrice?.toLocaleString() || 0} ج.م</Text>
                        </View>
                        <View style={{ alignItems: 'center' }}>
                          <Text style={ms.histProfit}>+{c.profitPercentage || 0}%</Text>
                          <Text style={ms.histProfitLbl}>ربح</Text>
                          <MaterialIcons name="edit" size={14} color={Colors.primary} style={{ marginTop: 4 }} />
                        </View>
                      </Pressable>
                    ))
                  )}
                </>
              ) : null}

              <View style={{ height: 40 }} />
            </ScrollView>

            {/* Bottom save shortcut (visible on non-pricing tabs) */}
            {activeTab !== 'pricing' && activeTab !== 'history' ? (
              <View style={ms.bottomBar}>
                <Pressable onPress={() => setActiveTab('pricing')} style={ms.nextBtn}>
                  <Text style={ms.nextBtnTxt}>التسعير والحفظ</Text>
                  <MaterialIcons name="arrow-back" size={18} color={Colors.textOnPrimary} />
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const ms = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginTop: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: Spacing.sm },
  titleTxt: { flex: 1, fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'right' },
  adminBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.warningSurface, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderWidth: 1, borderColor: Colors.warning + '50' },
  adminBadgeTxt: { fontSize: 10, color: Colors.warning, fontWeight: FontWeight.bold },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  // Qty strip
  qtyStrip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: Spacing.md, backgroundColor: Colors.surfaceElevated },
  qtyBlock: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  qtyLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  qtyInput: { width: 44, backgroundColor: Colors.card, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.primary + '60', paddingVertical: 4, fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.primary },
  qtyUnit: { fontSize: FontSize.xs, color: Colors.textMuted },
  costStrip: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  costItem: { alignItems: 'center' },
  costItemVal: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  costItemLbl: { fontSize: 9, color: Colors.textMuted },
  costDivider: { width: 1, height: 24, backgroundColor: Colors.border },
  // Tabs
  tabBar: { borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface },
  tabRow: { flexDirection: 'row', paddingHorizontal: Spacing.sm },
  tabBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: 12, borderBottomWidth: 0, borderBottomColor: 'transparent' },
  tabTxt: { fontSize: FontSize.xs, color: Colors.textMuted },
  content: { padding: Spacing.base, paddingBottom: 20 },
  // Summary card
  summaryCard: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.lg, padding: Spacing.base, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.base },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
  perPieceBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.primarySurface, borderRadius: Radius.md, padding: Spacing.md, marginVertical: Spacing.sm },
  perPieceVal: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.primary },
  perPieceLbl: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },
  batchNote: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'right', marginBottom: Spacing.sm },
  finalBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.primary, borderRadius: Radius.lg, padding: Spacing.base, marginTop: Spacing.sm },
  finalVal: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textOnPrimary },
  finalLbl: { fontSize: FontSize.sm, color: Colors.textOnPrimary + 'CC', fontWeight: FontWeight.medium },
  pctRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md, justifyContent: 'flex-end' },
  pctInput: { width: 72, backgroundColor: Colors.card, borderRadius: Radius.sm, paddingVertical: Spacing.sm, fontSize: FontSize.base, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.primary + '60', fontWeight: FontWeight.bold },
  pctLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1, textAlign: 'right', fontWeight: FontWeight.medium },
  notesInput: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.md, height: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.xl, fontSize: FontSize.sm, color: Colors.textPrimary },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: Spacing.base, marginBottom: Spacing.md, ...Shadow.gold },
  saveBtnTxt: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textOnPrimary },
  newVersionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: Colors.primary + '80', borderRadius: Radius.lg, paddingVertical: Spacing.md, marginBottom: Spacing.xxxl },
  newVersionTxt: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },
  noData: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start', backgroundColor: Colors.warningSurface, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.warning + '50' },
  noDataTxt: { flex: 1, fontSize: FontSize.xs, color: Colors.warning, textAlign: 'right' },
  histCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.base, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  histVersion: { fontSize: FontSize.sm, color: Colors.textSecondary },
  histTotal: { fontSize: FontSize.sm, color: Colors.textPrimary },
  histFinal: { fontSize: FontSize.base, color: Colors.primary, fontWeight: FontWeight.bold },
  histProfit: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.success },
  histProfitLbl: { fontSize: FontSize.xs, color: Colors.textMuted },
  bottomBar: { borderTopWidth: 1, borderTopColor: Colors.border, padding: Spacing.md, backgroundColor: Colors.surface },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: Spacing.md },
  nextBtnTxt: { fontSize: FontSize.base, color: Colors.textOnPrimary, fontWeight: FontWeight.bold },
});
