// Powered by OnSpace.AI
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, TextInput,
  Modal, ScrollView, KeyboardAvoidingView, Platform, Dimensions, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { CloudImagePicker, UploadedImage, toUploadedImages, toUriArray } from '@/components/feature/CloudImagePicker';
import { isCloudinaryUrl } from '@/services/cloudinaryService';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { useAlert } from '@/template';
import { useLanguage } from '@/contexts/LanguageContext';
import { isTablet, pagePadding } from '@/constants/responsive';
import { FullMaterial, MaterialType, Supplier } from '@/contexts/AppContext';

const SCREEN_H = Dimensions.get('window').height;

const MATERIAL_CATEGORIES = [
  'فايبرجلاس', 'بوليستر', 'دهانات', 'معادن', 'أخشاب', 'زجاج', 'أحجار', 'مواد لاصقة',
  'مكونات كهربائية', 'إضاءة', 'تغليف', 'أكريليك', 'رخام', 'حجر جيري', 'أخرى',
];

const PURCHASE_UNITS = ['قطعة', 'جرام', 'كيلو', 'طن', 'مل', 'لتر', 'متر', 'م²', 'م³', 'لوح', 'رول', 'كرتونة', 'علبة'];

// ──────────────────────────────────────────────
// Price History Modal
// ──────────────────────────────────────────────
function PriceHistoryModal({ visible, material, onClose }: { visible: boolean; material: FullMaterial | null; onClose: () => void }) {
  if (!material) return null;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={ph.overlay}>
        <View style={ph.sheet}>
          <View style={ph.handle} />
          <View style={ph.header}>
            <Pressable onPress={onClose} style={ph.closeBtn}>
              <MaterialIcons name="close" size={20} color={Colors.textSecondary} />
            </Pressable>
            <Text style={ph.title}>سجل أسعار: {material.name}</Text>
          </View>
          {material.priceHistory?.length > 0 ? (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: Spacing.base }}>
              {material.priceHistory.map((h, i) => (
                <View key={h.id} style={ph.row}>
                  <View style={ph.rowLeft}>
                    <Text style={ph.dateText}>{new Date(h.date).toLocaleDateString('ar-EG')}</Text>
                    {h.notes ? <Text style={ph.notesText}>{h.notes}</Text> : null}
                    <Text style={ph.supplierText}>{h.supplierName}</Text>
                  </View>
                  <View style={ph.rowRight}>
                    <View style={ph.priceChange}>
                      <Text style={ph.newPrice}>{h.newPrice.toLocaleString()} ج.م</Text>
                      <MaterialIcons name="arrow-back" size={12} color={Colors.textMuted} />
                      <Text style={ph.oldPrice}>{h.oldPrice.toLocaleString()}</Text>
                    </View>
                    <Text style={[ph.diffText, { color: h.newPrice > h.oldPrice ? Colors.error : Colors.success }]}>
                      {h.newPrice > h.oldPrice ? '▲' : '▼'} {Math.abs(h.newPrice - h.oldPrice).toLocaleString()}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxxl }}>
              <MaterialIcons name="history" size={48} color={Colors.textMuted} />
              <Text style={{ color: Colors.textMuted, marginTop: Spacing.md, textAlign: 'center' }}>لا يوجد سجل أسعار بعد</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const ph = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, maxHeight: '85%' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginTop: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, flex: 1, textAlign: 'right' },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowLeft: { flex: 1, alignItems: 'flex-end', gap: 2 },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  dateText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  notesText: { fontSize: FontSize.xs, color: Colors.textMuted },
  supplierText: { fontSize: FontSize.xs, color: Colors.textMuted },
  priceChange: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  newPrice: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.primary },
  oldPrice: { fontSize: FontSize.xs, color: Colors.textMuted },
  diffText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
});

// ──────────────────────────────────────────────
// Update Price Modal
// ──────────────────────────────────────────────
function UpdatePriceModal({ visible, material, suppliers, onUpdate, onClose }: {
  visible: boolean; material: FullMaterial | null; suppliers: Supplier[];
  onUpdate: (newPrice: number, supplierId: string, supplierName: string, notes: string) => void;
  onClose: () => void;
}) {
  const [price, setPrice] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    if (material) {
      setPrice(material.unitPrice?.toString() || '');
      setSupplierId(material.supplierId || '');
      setNotes('');
    }
  }, [material, visible]);

  if (!material) return null;

  function handleSave() {
    const p = parseFloat(price);
    if (isNaN(p) || p <= 0) { Alert.alert('خطأ', 'أدخل سعراً صحيحاً'); return; }
    const sup = suppliers.find(s => s.id === supplierId);
    onUpdate(p, supplierId, sup?.name || 'غير محدد', notes);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={up.overlay}>
          <View style={up.sheet}>
            <View style={up.handle} />
            <View style={up.header}>
              <Pressable onPress={onClose} style={up.closeBtn}>
                <MaterialIcons name="close" size={20} color={Colors.textSecondary} />
              </Pressable>
              <Text style={up.title}>تحديث سعر: {material.name}</Text>
            </View>
            <ScrollView contentContainerStyle={{ padding: Spacing.base }}>
              <Text style={up.currentPrice}>السعر الحالي: {material.unitPrice?.toLocaleString() || 0} ج.م</Text>
              <Text style={up.label}>السعر الجديد (ج.م) *</Text>
              <TextInput value={price} onChangeText={setPrice} keyboardType="decimal-pad" style={up.input} textAlign="right" placeholder="أدخل السعر الجديد" placeholderTextColor={Colors.textMuted} />
              <Text style={up.label}>المورد</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
                <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                  {suppliers.map(s => (
                    <Pressable key={s.id} onPress={() => setSupplierId(s.id)} style={[up.supChip, supplierId === s.id && up.supChipActive]}>
                      <Text style={[up.supChipText, supplierId === s.id && up.supChipTextActive]}>{s.name}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
              <Text style={up.label}>ملاحظات</Text>
              <TextInput value={notes} onChangeText={setNotes} style={[up.input, { height: 80 }]} textAlign="right" multiline placeholder="سبب التغيير، ملاحظات..." placeholderTextColor={Colors.textMuted} />
              <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.base }}>
                <Pressable onPress={onClose} style={[up.btn, { backgroundColor: Colors.surfaceElevated, flex: 1 }]}>
                  <Text style={{ color: Colors.textSecondary, fontWeight: FontWeight.semibold }}>إلغاء</Text>
                </Pressable>
                <Pressable onPress={handleSave} style={[up.btn, { backgroundColor: Colors.primary, flex: 1 }]}>
                  <Text style={{ color: Colors.textOnPrimary, fontWeight: FontWeight.bold }}>حفظ</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const up = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, maxHeight: '80%' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginTop: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, flex: 1, textAlign: 'right' },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  currentPrice: { fontSize: FontSize.sm, color: Colors.primary, textAlign: 'right', marginBottom: Spacing.base, fontWeight: FontWeight.semibold },
  label: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'right', marginBottom: Spacing.xs, fontWeight: FontWeight.medium },
  input: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.md, fontSize: FontSize.base, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md, textAlignVertical: 'top' },
  supChip: { paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border },
  supChipActive: { backgroundColor: Colors.primarySurface, borderColor: Colors.primary },
  supChipText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  supChipTextActive: { color: Colors.primary, fontWeight: FontWeight.semibold },
  btn: { paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center' },
});

// ──────────────────────────────────────────────
// Material Form Modal
// ──────────────────────────────────────────────
function MaterialFormModal({ visible, material, suppliers, onSave, onClose }: {
  visible: boolean; material: FullMaterial | null;
  suppliers: Supplier[];
  onSave: (data: Omit<FullMaterial, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [category, setCategory] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [purchaseUnit, setPurchaseUnit] = useState('كيلو');
  const [unitPrice, setUnitPrice] = useState('');
  const [currency, setCurrency] = useState('ج.م');
  const [minStock, setMinStock] = useState('');
  const [currentStock, setCurrentStock] = useState('');
  const [color, setColor] = useState('');
  const [notes, setNotes] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<UploadedImage[]>([]);
  const [types, setTypes] = useState<MaterialType[]>([]);
  const [showAddType, setShowAddType] = useState(false);
  const [typeName, setTypeName] = useState('');
  const [typeCode, setTypeCode] = useState('');
  const [typeUnit, setTypeUnit] = useState('');
  const [typePrice, setTypePrice] = useState('');

  React.useEffect(() => {
    if (material) {
      setName(material.name || ''); setNameEn(material.nameEn || '');
      setCategory(material.category || ''); setCode(material.code || '');
      setDescription(material.description || ''); setBrand(material.brand || '');
      setSupplierId(material.supplierId || ''); setSupplierName(material.supplierName || '');
      setPurchaseUnit(material.purchaseUnit || 'كيلو');
      setUnitPrice(material.unitPrice?.toString() || '');
      setCurrency(material.currency || 'ج.م');
      setMinStock(material.minStock?.toString() || '');
      setCurrentStock(material.currentStock?.toString() || '');
      setColor(material.color || ''); setNotes(material.notes || '');
      setImage(material.image || null);
      setUploadedImage(material.image ? toUploadedImages([material.image]) : []);
      setTypes(material.types || []);
    } else {
      setName(''); setNameEn(''); setCategory(''); setCode(''); setDescription('');
      setBrand(''); setSupplierId(''); setSupplierName('');
      setPurchaseUnit('كيلو'); setUnitPrice(''); setCurrency('ج.م');
      setMinStock(''); setCurrentStock(''); setColor(''); setNotes('');
      setImage(null);
      setUploadedImage([]);
      setTypes([]);
    }
    setShowAddType(false); setTypeName(''); setTypeCode(''); setTypeUnit(''); setTypePrice('');
  }, [material, visible]);

function addType() {
    if (!typeName.trim()) return;
    const newType: MaterialType = {
      id: Date.now().toString(), name: typeName, code: typeCode,
      description: '', unit: typeUnit, unitPrice: parseFloat(typePrice) || 0,
      supplierId: '', brand: '', colorCode: '', notes: '',
    };
    setTypes(prev => [...prev, newType]);
    setTypeName(''); setTypeCode(''); setTypeUnit(''); setTypePrice('');
    setShowAddType(false);
  }

  function removeType(id: string) { setTypes(prev => prev.filter(t => t.id !== id)); }

  function selectSupplier(s: Supplier) { setSupplierId(s.id); setSupplierName(s.name); }

  function handleSave() {
    if (!name.trim()) { Alert.alert('خطأ', 'يرجى إدخال اسم الخامة'); return; }
    const anyUploading = uploadedImage.some(img => img.isUploading);
    if (anyUploading) { Alert.alert('انتظر', 'جارٍ رفع الصورة — يرجى الانتظار'); return; }
    const finalImage = uploadedImage.length > 0 ? (uploadedImage[0].secure_url || uploadedImage[0].uri) : null;
    onSave({
      name: name.trim(), nameEn: nameEn.trim(), category, code: code.trim(),
      description: description.trim(), brand: brand.trim(), supplierId, supplierName,
      purchaseUnit, unitPrice: parseFloat(unitPrice) || 0, currency,
      lastPurchasePrice: parseFloat(unitPrice) || 0,
      averagePrice: parseFloat(unitPrice) || 0,
      minStock: parseFloat(minStock) || 0, currentStock: parseFloat(currentStock) || 0,
      color: color.trim(), notes: notes.trim(), image: finalImage, types,
      priceHistory: material?.priceHistory || [],
    });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={mf.overlay}>
          <View style={[mf.sheet, { height: SCREEN_H * 0.92 }]}>
            <View style={mf.handle} />
            <View style={mf.header}>
              <Pressable onPress={onClose} style={mf.backBtn}>
                <MaterialIcons name="arrow-back" size={18} color={Colors.textSecondary} />
                <Text style={mf.backText}>رجوع</Text>
              </Pressable>
              <Text style={mf.title}>{material ? 'تعديل الخامة' : 'إضافة خامة جديدة'}</Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={mf.content}>
              {/* Image — Cloudinary Upload */}
              <View style={{ marginBottom: Spacing.base }}>
                <CloudImagePicker
                  images={uploadedImage}
                  onChange={setUploadedImage}
                  maxImages={1}
                  folder="sayed_ezzat/materials"
                  label="صورة الخامة"
                />
              </View>

              <Field label="اسم الخامة *" value={name} onChange={setName} placeholder="مثال: فايبرجلاس" />
              <Field label="الاسم بالإنجليزية" value={nameEn} onChange={setNameEn} placeholder="Fiberglass" />
              <Field label="كود الخامة" value={code} onChange={setCode} placeholder="FBG-001" />

              <Text style={mf.sectionLabel}>نوع الخامة</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.base }}>
                <View style={{ flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: 2 }}>
                  {MATERIAL_CATEGORIES.map(c => (
                    <Pressable key={c} onPress={() => setCategory(c)} style={[mf.chip, category === c && mf.chipActive]}>
                      <Text style={[mf.chipText, category === c && mf.chipTextActive]}>{c}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              <Field label="التوصيف" value={description} onChange={setDescription} multiline />
              <Field label="الماركة / البراند" value={brand} onChange={setBrand} />

              {/* Supplier */}
              {suppliers.length > 0 ? (
                <>
                  <Text style={mf.sectionLabel}>المورد</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.base }}>
                    <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                      {suppliers.map(s => (
                        <Pressable key={s.id} onPress={() => selectSupplier(s)} style={[mf.chip, supplierId === s.id && mf.chipActive]}>
                          <Text style={[mf.chipText, supplierId === s.id && mf.chipTextActive]}>{s.name}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </>
              ) : null}

              {/* Purchasing */}
              <Text style={mf.sectionLabel}>بيانات الشراء</Text>
              <View style={mf.row2}>
                <View style={{ flex: 1 }}>
                  <Text style={mf.fieldLabel}>وحدة الشراء</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', gap: 6, paddingBottom: Spacing.sm }}>
                      {PURCHASE_UNITS.map(u => (
                        <Pressable key={u} onPress={() => setPurchaseUnit(u)} style={[mf.unitChip, purchaseUnit === u && mf.unitChipActive]}>
                          <Text style={[mf.unitChipText, purchaseUnit === u && mf.unitChipTextActive]}>{u}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>
              <View style={mf.row2}>
                <NumField label="سعر الوحدة" value={unitPrice} onChange={setUnitPrice} suffix="ج.م" />
              </View>

              {/* Stock */}
              <Text style={mf.sectionLabel}>المخزون</Text>
              <View style={mf.row2}>
                <NumField label="المخزون الحالي" value={currentStock} onChange={setCurrentStock} />
                <NumField label="الحد الأدنى" value={minStock} onChange={setMinStock} />
              </View>

              <Field label="ملاحظات" value={notes} onChange={setNotes} multiline />

              {/* Types */}
              <View style={mf.typeHeader}>
                <Pressable onPress={() => setShowAddType(!showAddType)} style={mf.addTypeBtn}>
                  <MaterialIcons name="add" size={16} color={Colors.primary} />
                  <Text style={mf.addTypeBtnText}>إضافة نوع</Text>
                </Pressable>
                <Text style={mf.sectionLabel}>أنواع الخامة ({types.length})</Text>
              </View>

              {showAddType ? (
                <View style={mf.addTypeForm}>
                  <Field label="اسم النوع *" value={typeName} onChange={setTypeName} />
                  <View style={mf.row2}>
                    <Field label="الكود" value={typeCode} onChange={setTypeCode} containerStyle={{ flex: 1 }} />
                    <Field label="الوحدة" value={typeUnit} onChange={setTypeUnit} containerStyle={{ flex: 1 }} />
                  </View>
                  <NumField label="السعر" value={typePrice} onChange={setTypePrice} suffix="ج.م" />
                  <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm }}>
                    <Pressable onPress={() => setShowAddType(false)} style={[mf.typeActionBtn, { backgroundColor: Colors.surfaceElevated }]}>
                      <Text style={{ color: Colors.textSecondary, fontSize: FontSize.sm }}>إلغاء</Text>
                    </Pressable>
                    <Pressable onPress={addType} style={[mf.typeActionBtn, { backgroundColor: Colors.primary, flex: 1 }]}>
                      <Text style={{ color: Colors.textOnPrimary, fontSize: FontSize.sm, fontWeight: FontWeight.bold }}>إضافة النوع</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}

              {types.map(t => (
                <View key={t.id} style={mf.typeRow}>
                  <Pressable onPress={() => removeType(t.id)} hitSlop={8}>
                    <MaterialIcons name="remove-circle" size={20} color={Colors.error} />
                  </Pressable>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.semibold }}>{t.name}</Text>
                    {t.code ? <Text style={{ fontSize: FontSize.xs, color: Colors.textMuted }}>{t.code}</Text> : null}
                  </View>
                  <Text style={{ fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.bold }}>{t.unitPrice?.toLocaleString() || 0} ج.م/{t.unit || 'وحدة'}</Text>
                </View>
              ))}

              <View style={mf.btnRow}>
                <Pressable onPress={onClose} style={[mf.actionBtn, { backgroundColor: Colors.surfaceElevated }]}>
                  <Text style={{ color: Colors.textSecondary, fontWeight: FontWeight.semibold }}>إلغاء</Text>
                </Pressable>
                <Pressable onPress={handleSave} style={[mf.actionBtn, { backgroundColor: Colors.primary, flex: 1 }]}>
                  <MaterialIcons name="save" size={18} color={Colors.textOnPrimary} />
                  <Text style={{ color: Colors.textOnPrimary, fontWeight: FontWeight.bold }}>{material ? 'حفظ التعديلات' : 'إضافة الخامة'}</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({ label, value, onChange, placeholder, multiline, containerStyle }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean; containerStyle?: any }) {
  return (
    <View style={[{ marginBottom: Spacing.md }, containerStyle]}>
      <Text style={mf.fieldLabel}>{label}</Text>
      <TextInput
        value={value} onChangeText={onChange} multiline={multiline}
        placeholder={placeholder} placeholderTextColor={Colors.textMuted}
        style={[mf.fieldInput, multiline && { height: 80, textAlignVertical: 'top' }]}
        textAlign="right"
      />
    </View>
  );
}

function NumField({ label, value, onChange, suffix, containerStyle }: { label: string; value: string; onChange: (v: string) => void; suffix?: string; containerStyle?: any }) {
  return (
    <View style={[{ flex: 1, marginBottom: Spacing.md }, containerStyle]}>
      <Text style={mf.fieldLabel}>{label}{suffix ? ` (${suffix})` : ''}</Text>
      <TextInput
        value={value} onChangeText={onChange} keyboardType="decimal-pad"
        placeholderTextColor={Colors.textMuted} placeholder="0"
        style={mf.fieldInput} textAlign="right"
      />
    </View>
  );
}

const mf = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginTop: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'right' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.surfaceElevated, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 8, borderWidth: 1, borderColor: Colors.border },
  backText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  content: { padding: Spacing.base, paddingBottom: Spacing.xxxl },
  imgPicker: { width: 100, height: 100, borderRadius: Radius.lg, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: Spacing.base, overflow: 'hidden' },
  imgPreview: { width: '100%', height: '100%' },
  imgHint: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4 },
  sectionLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textSecondary, textAlign: 'right', marginBottom: Spacing.sm },
  fieldLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'right', marginBottom: Spacing.xs, fontWeight: FontWeight.medium },
  fieldInput: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, fontSize: FontSize.base, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primarySurface, borderColor: Colors.primary },
  chipText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  chipTextActive: { color: Colors.primary, fontWeight: FontWeight.semibold },
  unitChip: { paddingHorizontal: Spacing.sm, paddingVertical: 5, borderRadius: Radius.full, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border },
  unitChipActive: { backgroundColor: Colors.primarySurface, borderColor: Colors.primary },
  unitChipText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  unitChipTextActive: { color: Colors.primary, fontWeight: FontWeight.semibold },
  row2: { flexDirection: 'row', gap: Spacing.md },
  typeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  addTypeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primarySurface, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 6, borderWidth: 1, borderColor: Colors.primary + '60' },
  addTypeBtnText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.semibold },
  addTypeForm: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  typeActionBtn: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, borderRadius: Radius.md, alignItems: 'center' },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  btnRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xl },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing.base, paddingHorizontal: Spacing.xl, borderRadius: Radius.md },
});

// ──────────────────────────────────────────────
// Material Card
// ──────────────────────────────────────────────
function MaterialCard({ material, onEdit, onDelete, onPriceHistory, onUpdatePrice }: {
  material: FullMaterial;
  onEdit: () => void; onDelete: () => void;
  onPriceHistory: () => void; onUpdatePrice: () => void;
}) {
  const isLowStock = material.currentStock <= material.minStock && material.minStock > 0;
  return (
    <View style={mc.card}>
      <View style={mc.top}>
        {material.image ? (
          <Image source={{ uri: material.image }} style={mc.img} contentFit="cover" />
        ) : (
          <View style={mc.imgPlaceholder}>
            <MaterialIcons name="category" size={24} color={Colors.textMuted} />
          </View>
        )}
        <View style={mc.info}>
          <View style={mc.titleRow}>
            {material.category ? <Text style={mc.category}>{material.category}</Text> : null}
            <Text style={mc.name} numberOfLines={1}>{material.name}</Text>
          </View>
          {material.code ? <Text style={mc.code}>{material.code}</Text> : null}
          {material.brand ? <Text style={mc.brand}>{material.brand}</Text> : null}
          <View style={mc.priceRow}>
            <Text style={mc.unit}>/{material.purchaseUnit || 'وحدة'}</Text>
            <Text style={mc.price}>{material.unitPrice?.toLocaleString() || 0} ج.م</Text>
          </View>
        </View>
      </View>
      {/* Stock indicator */}
      <View style={mc.stockRow}>
        <View style={[mc.stockBadge, { backgroundColor: isLowStock ? Colors.errorSurface : Colors.successSurface }]}>
          <MaterialIcons name={isLowStock ? 'warning' : 'inventory'} size={12} color={isLowStock ? Colors.error : Colors.success} />
          <Text style={[mc.stockText, { color: isLowStock ? Colors.error : Colors.success }]}>
            {material.currentStock || 0} {material.purchaseUnit || ''}
            {isLowStock ? ' — منخفض' : ''}
          </Text>
        </View>
        {material.types?.length > 0 ? (
          <Text style={mc.typesCount}>{material.types.length} أنواع</Text>
        ) : null}
        {material.supplierName ? <Text style={mc.supplier}>{material.supplierName}</Text> : null}
      </View>
      {/* Actions */}
      <View style={mc.actions}>
        <Pressable onPress={onDelete} style={[mc.actionBtn, { backgroundColor: Colors.errorSurface }]} hitSlop={4}>
          <MaterialIcons name="delete-outline" size={16} color={Colors.error} />
        </Pressable>
        <Pressable onPress={onEdit} style={[mc.actionBtn, { backgroundColor: Colors.surfaceElevated }]} hitSlop={4}>
          <MaterialIcons name="edit" size={16} color={Colors.textSecondary} />
        </Pressable>
        <Pressable onPress={onPriceHistory} style={[mc.actionBtn, { backgroundColor: Colors.infoSurface }]} hitSlop={4}>
          <MaterialIcons name="history" size={16} color={Colors.info} />
        </Pressable>
        <Pressable onPress={onUpdatePrice} style={[mc.actionBtn, { flex: 1, backgroundColor: Colors.primarySurface, borderColor: Colors.primary + '60', borderWidth: 1 }]}>
          <MaterialIcons name="price-change" size={14} color={Colors.primary} />
          <Text style={{ fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.semibold }}>تحديث السعر</Text>
        </Pressable>
      </View>
    </View>
  );
}

const mc = StyleSheet.create({
  card: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.base, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  top: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  img: { width: 64, height: 64, borderRadius: Radius.md },
  imgPlaceholder: { width: 64, height: 64, borderRadius: Radius.md, backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, alignItems: 'flex-end' },
  titleRow: { alignItems: 'flex-end', marginBottom: 2 },
  name: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'right' },
  category: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.semibold, textAlign: 'right' },
  code: { fontSize: FontSize.xs, color: Colors.textMuted, fontFamily: 'monospace' },
  brand: { fontSize: FontSize.xs, color: Colors.textSecondary },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2, marginTop: Spacing.xs },
  price: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.primary },
  unit: { fontSize: FontSize.xs, color: Colors.textMuted },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md, flexWrap: 'wrap', justifyContent: 'flex-end' },
  stockBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.full },
  stockText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  typesCount: { fontSize: FontSize.xs, color: Colors.textMuted },
  supplier: { fontSize: FontSize.xs, color: Colors.textMuted },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, width: 36, height: 36, borderRadius: Radius.sm },
});

// ──────────────────────────────────────────────
// Main Screen
// ──────────────────────────────────────────────
export default function MaterialsScreen() {
  const { fullMaterials, suppliers, addFullMaterial, updateFullMaterial, deleteFullMaterial, updateMaterialPrice } = useApp();
  const { showAlert } = useAlert();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('الكل');
  const [showForm, setShowForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<FullMaterial | null>(null);
  const [priceHistoryMat, setPriceHistoryMat] = useState<FullMaterial | null>(null);
  const [updatePriceMat, setUpdatePriceMat] = useState<FullMaterial | null>(null);

  const cats = ['الكل', ...MATERIAL_CATEGORIES];
  const filtered = useMemo(() => fullMaterials.filter(m => {
    const matchSearch = !search || m.name.includes(search) || m.code?.includes(search) || m.category?.includes(search) || m.brand?.includes(search);
    const matchCat = catFilter === 'الكل' || m.category === catFilter;
    return matchSearch && matchCat;
  }), [fullMaterials, search, catFilter]);

  const totalValue = fullMaterials.reduce((s, m) => s + (m.unitPrice || 0) * (m.currentStock || 0), 0);
  const lowStock = fullMaterials.filter(m => m.currentStock <= m.minStock && m.minStock > 0).length;

  function handleDelete(m: FullMaterial) {
    showAlert('حذف الخامة', `هل أنت متأكد من حذف "${m.name}"؟`, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: () => deleteFullMaterial(m.id) },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => { setEditingMaterial(null); setShowForm(true); }} style={styles.addBtn}>
          <MaterialIcons name="add" size={22} color={Colors.textOnPrimary} />
        </Pressable>
        <Text style={styles.title}>إدارة الخامات</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{fullMaterials.length}</Text>
          <Text style={styles.statLabel}>إجمالي الخامات</Text>
        </View>
        <View style={[styles.statCard, { borderColor: lowStock > 0 ? Colors.error + '50' : Colors.border }]}>
          <Text style={[styles.statValue, { color: lowStock > 0 ? Colors.error : Colors.textPrimary }]}>{lowStock}</Text>
          <Text style={styles.statLabel}>مخزون منخفض</Text>
        </View>
        <View style={[styles.statCard, { borderColor: Colors.primary + '40' }]}>
          <Text style={[styles.statValue, { color: Colors.primary, fontSize: FontSize.base }]}>{totalValue.toLocaleString()}</Text>
          <Text style={styles.statLabel}>قيمة المخزون ج.م</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <MaterialIcons name="search" size={20} color={Colors.textMuted} />
        <TextInput value={search} onChangeText={setSearch} placeholder="ابحث عن خامة..." placeholderTextColor={Colors.textMuted} style={styles.searchInput} textAlign="right" />
        {search ? <Pressable onPress={() => setSearch('')} hitSlop={8}><MaterialIcons name="close" size={16} color={Colors.textMuted} /></Pressable> : null}
      </View>

      {/* Category Filter */}
      <View style={styles.filterOuter}>
        <FlatList
          data={cats} horizontal keyExtractor={(_, i) => i.toString()}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
          renderItem={({ item }) => (
            <Pressable onPress={() => setCatFilter(item)} style={[styles.filterChip, catFilter === item && styles.filterChipActive]}>
              <Text style={[styles.filterChipText, catFilter === item && styles.filterChipTextActive]}>{item}</Text>
            </Pressable>
          )}
        />
      </View>

      <FlatList
        data={filtered} keyExtractor={m => m.id}
        numColumns={isTablet ? 2 : 1}
        key={isTablet ? 'tablet' : 'phone'}
        columnWrapperStyle={isTablet ? { gap: Spacing.md } : undefined}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', padding: Spacing.xxxl }}>
            <MaterialIcons name="inventory-2" size={56} color={Colors.textMuted} />
            <Text style={{ color: Colors.textMuted, marginTop: Spacing.md, fontSize: FontSize.base, textAlign: 'center' }}>
              {search ? 'لا توجد نتائج' : 'اضغط + لإضافة أول خامة'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={isTablet ? { flex: 1 } : undefined}>
            <MaterialCard
              material={item}
              onEdit={() => { setEditingMaterial(item); setShowForm(true); }}
              onDelete={() => handleDelete(item)}
              onPriceHistory={() => setPriceHistoryMat(item)}
              onUpdatePrice={() => setUpdatePriceMat(item)}
            />
          </View>
        )}
      />

      <MaterialFormModal
        visible={showForm} material={editingMaterial} suppliers={suppliers}
        onSave={data => {
          if (editingMaterial) updateFullMaterial(editingMaterial.id, data);
          else addFullMaterial(data);
          setShowForm(false); setEditingMaterial(null);
        }}
        onClose={() => { setShowForm(false); setEditingMaterial(null); }}
      />

      <PriceHistoryModal
        visible={priceHistoryMat !== null} material={priceHistoryMat}
        onClose={() => setPriceHistoryMat(null)}
      />

      <UpdatePriceModal
        visible={updatePriceMat !== null} material={updatePriceMat} suppliers={suppliers}
        onUpdate={(price, supId, supName, notes) => {
          if (updatePriceMat) updateMaterialPrice(updatePriceMat.id, price, supId, supName, notes);
          setUpdatePriceMat(null);
        }}
        onClose={() => setUpdatePriceMat(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: pagePadding, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: isTablet ? FontSize.xxl : FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  addBtn: { width: isTablet ? 48 : 40, height: isTablet ? 48 : 40, borderRadius: isTablet ? 24 : 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, padding: pagePadding, paddingBottom: Spacing.sm },
  statCard: { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  statValue: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2, textAlign: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, paddingHorizontal: Spacing.md, margin: pagePadding, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, paddingVertical: Spacing.md, fontSize: FontSize.base, color: Colors.textPrimary, marginRight: Spacing.sm },
  filterOuter: { height: 50 },
  filterContent: { paddingHorizontal: pagePadding, gap: Spacing.sm, alignItems: 'center' },
  filterChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border },
  filterChipActive: { backgroundColor: Colors.primarySurface, borderColor: Colors.primary },
  filterChipText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  filterChipTextActive: { color: Colors.primary },
  list: { padding: pagePadding, paddingTop: Spacing.sm },
});
