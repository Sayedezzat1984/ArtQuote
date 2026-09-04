// Powered by OnSpace.AI
import React, { useState, useEffect } from 'react';
import {
  View, Text, Modal, ScrollView, StyleSheet, Pressable,
  Switch, Alert, TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { globalStyles } from '@/constants/styles';
import { Artwork, Material, ArtworkCategory } from '@/contexts/AppContext';
import { CloudImagePicker, UploadedImage, toUploadedImages, toUriArray } from '@/components/feature/CloudImagePicker';

interface ArtworkFormModalProps {
  visible: boolean;
  artwork?: Artwork | null;
  materials: Material[];
  artworkCategories: ArtworkCategory[];
  onSave: (data: Omit<Artwork, 'id' | 'createdAt'>) => void;
  onClose: () => void;
  onAddCategory?: (name: string) => Promise<void>;
  onDeleteCategory?: (id: string) => Promise<void>;
}

// Numeric-only input field
function NumInput({ label, value, onChange, placeholder, unit, style }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; unit?: string; style?: any;
}) {
  return (
    <View style={[numS.wrap, style]}>
      <Text style={numS.label}>{label}{unit ? ` (${unit})` : ''}</Text>
      <TextInput
        value={value} onChangeText={(t) => onChange(t.replace(/[^0-9.]/g, ''))}
        keyboardType="decimal-pad" placeholder={placeholder || '0'}
        placeholderTextColor={Colors.textMuted}
        style={numS.input} textAlign="right"
      />
    </View>
  );
}

const numS = StyleSheet.create({
  wrap: { marginBottom: Spacing.sm },
  label: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'right', marginBottom: 4, fontWeight: FontWeight.medium },
  input: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, fontSize: FontSize.sm, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },
});

export function ArtworkFormModal({ visible, artwork, materials, artworkCategories, onSave, onClose, onAddCategory, onDeleteCategory }: ArtworkFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');

  // Separate measurement fields
  const [height, setHeight] = useState('');
  const [width, setWidth] = useState('');
  const [length, setLength] = useState('');
  const [depth, setDepth] = useState('');
  const [diameter, setDiameter] = useState('');
  const [thickness, setThickness] = useState('');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState<'gram' | 'kg' | 'ton'>('kg');
  const [dimensionUnit, setDimensionUnit] = useState<'mm' | 'cm' | 'meter'>('cm');
  const [quantity, setQuantity] = useState('');

  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [available, setAvailable] = useState(true);
  const [showPriceToCustomer, setShowPriceToCustomer] = useState(true);
  const [visibleToVisitors, setVisibleToVisitors] = useState(true);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCatManager, setShowCatManager] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  useEffect(() => {
    if (artwork) {
      setTitle(artwork.title || ''); setDescription(artwork.description || '');
      setCategory(artwork.category || '');
      setPrice(artwork.price?.toString() || '');
      setHeight(artwork.height || ''); setWidth(artwork.width || '');
      setLength((artwork as any).length || ''); setDepth(artwork.depth || '');
      setDiameter((artwork as any).diameter || ''); setThickness((artwork as any).thickness || '');
      setWeight((artwork as any).weight || '');
      setWeightUnit((artwork as any).weightUnit || 'kg');
      setDimensionUnit(artwork.dimensionUnit || 'cm');
      setQuantity((artwork as any).quantity || '');
      setYear(artwork.year || new Date().getFullYear().toString());
      setAvailable(artwork.available !== false);
      setShowPriceToCustomer((artwork as any).showPriceToCustomer !== false);
      setVisibleToVisitors((artwork as any).visibleToVisitors !== false);
      const existingImages = artwork.images?.length ? artwork.images : (artwork.image ? [artwork.image] : []);
      setUploadedImages(toUploadedImages(existingImages));
      setSelectedMaterials(artwork.materialIds || []);
    } else {
      setTitle(''); setDescription('');
      setCategory(artworkCategories[0]?.name || '');
      setPrice(''); setHeight(''); setWidth(''); setLength(''); setDepth('');
      setDiameter(''); setThickness(''); setWeight('');
      setWeightUnit('kg'); setDimensionUnit('cm'); setQuantity('');
      setYear(new Date().getFullYear().toString());
      setAvailable(true); setShowPriceToCustomer(true); setVisibleToVisitors(true); setUploadedImages([]); setSelectedMaterials([]);
    }
  }, [artwork, visible, artworkCategories]);

  function toggleMaterial(id: string) { setSelectedMaterials(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); }

  function buildDimensions() {
    const parts = [height, width, depth].filter(Boolean);
    if (!parts.length) return '';
    return parts.join('×') + ' ' + dimensionUnit;
  }

  function handleSave() {
    if (!title.trim()) { Alert.alert('خطأ', 'يرجى إدخال عنوان العمل'); return; }
    if (!price || isNaN(Number(price))) { Alert.alert('خطأ', 'يرجى إدخال سعر صحيح'); return; }
    const anyUploading = uploadedImages.some(img => img.isUploading);
    if (anyUploading) { Alert.alert('انتظر', 'جارٍ رفع الصور — يرجى الانتظار حتى تكتمل'); return; }
    setLoading(true);
    setTimeout(() => {
      const finalUris = toUriArray(uploadedImages);
      onSave({
        title: title.trim(), description: description.trim(), category,
        price: Number(price),
        height, width, length, depth, diameter, thickness,
        weight, weightUnit, dimensionUnit, quantity,
        dimensions: buildDimensions(),
        year: year.trim(), available, showPriceToCustomer, visibleToVisitors,
        image: finalUris[0] || null, images: finalUris, materialIds: selectedMaterials,
      });
      setLoading(false);
    }, 300);
  }

  async function handleAddCategory() {
    if (!newCatName.trim()) return;
    await onAddCategory?.(newCatName.trim());
    setCategory(newCatName.trim()); setNewCatName('');
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={globalStyles.overlay}>
        <View style={[globalStyles.modalSheet, { maxHeight: '97%' }]}>
          <View style={globalStyles.modalHandle} />
          <View style={styles.topRow}>
            <Pressable onPress={onClose} style={styles.backBtn}>
              <MaterialIcons name="arrow-back" size={18} color={Colors.textSecondary} />
              <Text style={styles.backBtnText}>رجوع</Text>
            </Pressable>
            <Text style={globalStyles.modalTitle}>{artwork ? 'تعديل العمل الفني' : 'إضافة عمل فني'}</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Images — Cloudinary Upload */}
            <View style={{ marginBottom: Spacing.base }}>
              <CloudImagePicker
                images={uploadedImages}
                onChange={setUploadedImages}
                maxImages={10}
                folder="sayed_ezzat/artworks"
                label={`الصور (${uploadedImages.length}/10) — الأولى رئيسية`}
              />
            </View>

            <Input label="عنوان العمل *" value={title} onChangeText={setTitle} placeholder="مثال: مجسم الصقر" />
            <Input label="الوصف" value={description} onChangeText={setDescription} placeholder="وصف العمل الفني..." multiline numberOfLines={3} />

            {/* Category */}
            <View style={styles.catHeader}>
              <Pressable onPress={() => setShowCatManager(!showCatManager)} style={styles.manageCatBtn}>
                <MaterialIcons name={showCatManager ? 'close' : 'edit'} size={14} color={Colors.primary} />
                <Text style={styles.manageCatBtnText}>{showCatManager ? 'إغلاق' : 'إدارة الأنواع'}</Text>
              </Pressable>
              <Text style={styles.sectionLabel}>نوع العمل</Text>
            </View>
            {showCatManager ? (
              <View style={styles.catManager}>
                <View style={styles.addCatRow}>
                  <Pressable onPress={handleAddCategory} style={styles.addCatBtn}>
                    <MaterialIcons name="add" size={18} color={Colors.textOnPrimary} />
                  </Pressable>
                  <TextInput value={newCatName} onChangeText={setNewCatName} placeholder="اسم النوع الجديد..." placeholderTextColor={Colors.textMuted} style={styles.addCatInput} textAlign="right" />
                </View>
                <View style={styles.catListEdit}>
                  {artworkCategories.map(cat => (
                    <View key={cat.id} style={styles.catEditItem}>
                      <Pressable onPress={() => onDeleteCategory?.(cat.id)} style={styles.catDeleteBtn} hitSlop={8}>
                        <MaterialIcons name="remove-circle" size={18} color={Colors.error} />
                      </Pressable>
                      <Text style={styles.catEditName}>{cat.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              <View style={styles.catRow}>
                {artworkCategories.map(cat => (
                  <Pressable key={cat.id} onPress={() => setCategory(cat.name)} style={[styles.catBtn, category === cat.name && styles.catBtnActive]}>
                    <Text style={[styles.catBtnText, category === cat.name && styles.catBtnTextActive]}>{cat.name}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            {/* ── Measurements ── */}
            <View style={styles.measHeader}>
              <View style={styles.unitGroup}>
                <Text style={styles.unitGroupLabel}>الطول:</Text>
                {(['mm', 'cm', 'meter'] as const).map(u => (
                  <Pressable key={u} onPress={() => setDimensionUnit(u)} style={[styles.unitChip, dimensionUnit === u && styles.unitChipActive]}>
                    <Text style={[styles.unitChipText, dimensionUnit === u && styles.unitChipTextActive]}>{u}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.sectionLabel}>الأبعاد والمقاسات</Text>
            </View>
            <View style={styles.dimsGrid}>
              <NumInput label="الارتفاع" value={height} onChange={setHeight} unit={dimensionUnit} style={styles.dimCell} />
              <NumInput label="العرض" value={width} onChange={setWidth} unit={dimensionUnit} style={styles.dimCell} />
              <NumInput label="الطول" value={length} onChange={setLength} unit={dimensionUnit} style={styles.dimCell} />
              <NumInput label="العمق" value={depth} onChange={setDepth} unit={dimensionUnit} style={styles.dimCell} />
              <NumInput label="القطر" value={diameter} onChange={setDiameter} unit={dimensionUnit} style={styles.dimCell} />
              <NumInput label="السمك" value={thickness} onChange={setThickness} unit={dimensionUnit} style={styles.dimCell} />
            </View>

            {/* Weight */}
            <View style={styles.weightRow}>
              <View style={styles.unitGroup}>
                {(['gram', 'kg', 'ton'] as const).map(u => {
                  const labels = { gram: 'جرام', kg: 'كيلو', ton: 'طن' };
                  return (
                    <Pressable key={u} onPress={() => setWeightUnit(u)} style={[styles.unitChip, weightUnit === u && styles.unitChipActive]}>
                      <Text style={[styles.unitChipText, weightUnit === u && styles.unitChipTextActive]}>{labels[u]}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.sectionLabel}>الوزن</Text>
            </View>
            <NumInput label="الوزن" value={weight} onChange={setWeight} unit={weightUnit === 'gram' ? 'جرام' : weightUnit === 'kg' ? 'كيلو' : 'طن'} />

            <NumInput label="الكمية" value={quantity} onChange={setQuantity} placeholder="1" />

            <Input label="السعر (ج.م) *" value={price} onChangeText={(t) => setPrice(t.replace(/[^0-9.]/g, ''))} placeholder="0" keyboardType="numeric" />
            <Input label="سنة الإنجاز" value={year} onChangeText={setYear} placeholder="2024" keyboardType="numeric" />

            {/* Materials */}
            {materials.length > 0 ? (
              <>
                <Text style={styles.sectionLabel}>الخامات المستخدمة</Text>
                <View style={styles.materialsGrid}>
                  {materials.map(m => (
                    <Pressable key={m.id} onPress={() => toggleMaterial(m.id)} style={[styles.materialChip, selectedMaterials.includes(m.id) && styles.materialChipActive]}>
                      <View style={[styles.materialDot, { backgroundColor: (m as any).color || Colors.primary }]} />
                      <Text style={[styles.materialChipText, selectedMaterials.includes(m.id) && styles.materialChipTextActive]} numberOfLines={1}>{m.name}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}

            <View style={styles.switchRow}>
              <Switch value={available} onValueChange={setAvailable} trackColor={{ false: Colors.border, true: Colors.primarySurface }} thumbColor={available ? Colors.primary : Colors.textMuted} />
              <Text style={styles.switchLabel}>{available ? 'متاح للبيع' : 'مباع / غير متاح'}</Text>
            </View>
            <View style={[styles.switchRow, { marginTop: -Spacing.sm }]}>
              <Switch value={showPriceToCustomer} onValueChange={setShowPriceToCustomer} trackColor={{ false: Colors.border, true: Colors.infoSurface }} thumbColor={showPriceToCustomer ? Colors.info : Colors.textMuted} />
              <Text style={styles.switchLabel}>{showPriceToCustomer ? 'يظهر السعر للعميل' : 'السعر مخفي عن العميل'}</Text>
            </View>
            <View style={[styles.switchRow, { marginTop: -Spacing.sm }]}>
              <Switch value={visibleToVisitors} onValueChange={setVisibleToVisitors} trackColor={{ false: Colors.border, true: '#E8F5E9' }} thumbColor={visibleToVisitors ? Colors.success : Colors.textMuted} />
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={styles.switchLabel}>{visibleToVisitors ? 'ظاهر للزوار ✓' : 'مخفي عن الزوار'}</Text>
                <Text style={{ fontSize: 10, color: Colors.textMuted, textAlign: 'right', marginTop: 2 }}>{visibleToVisitors ? 'يظهر هذا العمل في معرض الزوار' : 'يظهر في وضع المشرف فقط'}</Text>
              </View>
            </View>

            <View style={styles.btnRow}>
              <Button title="إلغاء" onPress={onClose} variant="ghost" style={styles.halfBtn} />
              <Button title={artwork ? 'حفظ التعديلات' : 'إضافة العمل'} onPress={handleSave} loading={loading} style={styles.halfBtn} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.base },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.surfaceElevated, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 8, borderWidth: 1, borderColor: Colors.border },
  backBtnText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  sectionLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary, textAlign: 'right', marginBottom: Spacing.sm },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  manageCatBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primarySurface, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 6, borderWidth: 1, borderColor: Colors.primary + '60' },
  manageCatBtnText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.semibold },
  catManager: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  addCatRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md, alignItems: 'center' },
  addCatInput: { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: FontSize.sm, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },
  addCatBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  catListEdit: { gap: Spacing.sm },
  catEditItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, justifyContent: 'flex-end' },
  catEditName: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.medium, flex: 1, textAlign: 'right' },
  catDeleteBtn: { padding: 2 },
  catScroll: { marginBottom: Spacing.base },
  catRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: 2 },
  catBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border },
  catBtnActive: { backgroundColor: Colors.primarySurface, borderColor: Colors.primary },
  catBtnText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  catBtnTextActive: { color: Colors.primary },
  measHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  unitGroup: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  unitGroupLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginRight: 2 },
  unitChip: { paddingHorizontal: Spacing.sm, paddingVertical: 5, borderRadius: Radius.full, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border },
  unitChipActive: { backgroundColor: Colors.primarySurface, borderColor: Colors.primary },
  unitChipText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.semibold },
  unitChipTextActive: { color: Colors.primary },
  dimsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  dimCell: { width: '31%' },
  weightRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  materialsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.base },
  materialChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.md, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border },
  materialChipActive: { backgroundColor: Colors.primarySurface, borderColor: Colors.primary },
  materialDot: { width: 8, height: 8, borderRadius: 4 },
  materialChipText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  materialChipTextActive: { color: Colors.primary },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, justifyContent: 'flex-end', marginBottom: Spacing.md, backgroundColor: Colors.surfaceElevated, padding: Spacing.md, borderRadius: Radius.md },
  switchLabel: { fontSize: FontSize.base, color: Colors.textPrimary, fontWeight: FontWeight.medium },
  btnRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.base },
  halfBtn: { flex: 1 },
});
