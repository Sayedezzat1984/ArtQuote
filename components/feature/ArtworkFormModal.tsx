// Powered by OnSpace.AI
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Modal, ScrollView, StyleSheet, Pressable,
  Switch, Alert, TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { globalStyles } from '@/constants/styles';
import { Artwork, Material, ArtworkCategory } from '@/contexts/AppContext';

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

// Draggable image thumbnail component
function DraggableImage({
  uri,
  index,
  isMain,
  onRemove,
  onMoveLeft,
  onMoveRight,
  isFirst,
  isLast,
}: {
  uri: string;
  index: number;
  isMain: boolean;
  onRemove: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <View style={imgStyles.wrap}>
      <Image source={{ uri }} style={imgStyles.img} contentFit="cover" />
      {isMain && (
        <View style={imgStyles.mainBadge}>
          <Text style={imgStyles.mainBadgeText}>رئيسية</Text>
        </View>
      )}
      {/* Reorder arrows */}
      <View style={imgStyles.reorderRow}>
        {!isFirst ? (
          <Pressable onPress={onMoveLeft} style={imgStyles.arrowBtn} hitSlop={4}>
            <MaterialIcons name="chevron-right" size={14} color="#fff" />
          </Pressable>
        ) : <View style={imgStyles.arrowPlaceholder} />}
        {!isLast ? (
          <Pressable onPress={onMoveRight} style={imgStyles.arrowBtn} hitSlop={4}>
            <MaterialIcons name="chevron-left" size={14} color="#fff" />
          </Pressable>
        ) : <View style={imgStyles.arrowPlaceholder} />}
      </View>
      <Pressable onPress={onRemove} style={imgStyles.removeBtn}>
        <MaterialIcons name="close" size={14} color="#fff" />
      </Pressable>
    </View>
  );
}

const imgStyles = StyleSheet.create({
  wrap: { width: 90, height: 90, borderRadius: Radius.md, overflow: 'hidden', position: 'relative' },
  img: { width: '100%', height: '100%' },
  mainBadge: {
    position: 'absolute', bottom: 20, left: 0, right: 0,
    backgroundColor: Colors.primary + 'DD', paddingVertical: 2, alignItems: 'center',
  },
  mainBadgeText: { fontSize: 9, color: '#0d0d0f', fontWeight: FontWeight.bold },
  reorderRow: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 2, paddingVertical: 2,
  },
  arrowBtn: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  arrowPlaceholder: { width: 22 },
  removeBtn: {
    position: 'absolute', top: 4, right: 4,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center',
  },
});

export function ArtworkFormModal({ visible, artwork, materials, artworkCategories, onSave, onClose, onAddCategory, onDeleteCategory }: ArtworkFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [depth, setDepth] = useState('');
  const [dimensionUnit, setDimensionUnit] = useState<'cm' | 'mm'>('cm');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [available, setAvailable] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCatManager, setShowCatManager] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  useEffect(() => {
    if (artwork) {
      setTitle(artwork.title);
      setDescription(artwork.description);
      setCategory(artwork.category);
      setPrice(artwork.price.toString());
      setWidth(artwork.width || '');
      setHeight(artwork.height || '');
      setDepth(artwork.depth || '');
      setDimensionUnit(artwork.dimensionUnit || 'cm');
      setYear(artwork.year);
      setAvailable(artwork.available);
      setImages(artwork.images?.length ? artwork.images : (artwork.image ? [artwork.image] : []));
      setSelectedMaterials(artwork.materialIds || []);
    } else {
      setTitle(''); setDescription('');
      setCategory(artworkCategories[0]?.name || '');
      setPrice(''); setWidth(''); setHeight(''); setDepth('');
      setDimensionUnit('cm'); setYear(new Date().getFullYear().toString());
      setAvailable(true); setImages([]); setSelectedMaterials([]);
    }
  }, [artwork, visible, artworkCategories]);

  async function pickImages() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('خطأ', 'نحتاج إذن الوصول للصور'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets) {
      const uris = result.assets.map(a => a.uri);
      setImages(prev => [...prev, ...uris].slice(0, 10));
    }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('خطأ', 'نحتاج إذن الكاميرا'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      setImages(prev => [...prev, result.assets[0].uri].slice(0, 10));
    }
  }

  function removeImage(idx: number) {
    setImages(prev => prev.filter((_, i) => i !== idx));
  }

  function moveImageLeft(idx: number) {
    if (idx === 0) return;
    setImages(prev => {
      const arr = [...prev];
      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      return arr;
    });
  }

  function moveImageRight(idx: number) {
    setImages(prev => {
      if (idx >= prev.length - 1) return prev;
      const arr = [...prev];
      [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
      return arr;
    });
  }

  function toggleMaterial(id: string) {
    setSelectedMaterials(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function buildDimensions() {
    const parts = [width, height, depth].filter(Boolean);
    if (!parts.length) return '';
    return parts.join('×') + ' ' + dimensionUnit;
  }

  function handleSave() {
    if (!title.trim()) { Alert.alert('خطأ', 'يرجى إدخال عنوان العمل'); return; }
    if (!price || isNaN(Number(price))) { Alert.alert('خطأ', 'يرجى إدخال سعر صحيح'); return; }
    setLoading(true);
    setTimeout(() => {
      const dims = buildDimensions();
      onSave({
        title: title.trim(), description: description.trim(), category,
        price: Number(price), width, height, depth, dimensionUnit,
        dimensions: dims, year: year.trim(), available,
        image: images[0] || null, images, materialIds: selectedMaterials,
      });
      setLoading(false);
    }, 300);
  }

  async function handleAddCategory() {
    if (!newCatName.trim()) return;
    await onAddCategory?.(newCatName.trim());
    setCategory(newCatName.trim());
    setNewCatName('');
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={globalStyles.overlay}>
        <View style={[globalStyles.modalSheet, { maxHeight: '97%' }]}>
          <View style={globalStyles.modalHandle} />

          {/* Back row */}
          <View style={styles.topRow}>
            <Pressable onPress={onClose} style={styles.backBtn}>
              <MaterialIcons name="arrow-back" size={18} color={Colors.textSecondary} />
              <Text style={styles.backBtnText}>رجوع</Text>
            </Pressable>
            <Text style={globalStyles.modalTitle}>{artwork ? 'تعديل العمل الفني' : 'إضافة عمل فني'}</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Images Section */}
            <View style={styles.imgSectionHeader}>
              <Text style={styles.imgHint}>اضغط السهم لتغيير الترتيب · الأولى رئيسية</Text>
              <Text style={styles.sectionLabel}>الصور ({images.length}/10)</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
              <View style={styles.imagesRow}>
                <Pressable onPress={pickImages} style={styles.addImageBtn}>
                  <MaterialIcons name="add-photo-alternate" size={28} color={Colors.primary} />
                  <Text style={styles.addImageText}>صور{'\n'}متعددة</Text>
                </Pressable>
                <Pressable onPress={takePhoto} style={styles.addImageBtn}>
                  <MaterialIcons name="camera-alt" size={28} color={Colors.info} />
                  <Text style={[styles.addImageText, { color: Colors.info }]}>كاميرا</Text>
                </Pressable>
                {images.map((uri, i) => (
                  <DraggableImage
                    key={`${uri}-${i}`}
                    uri={uri}
                    index={i}
                    isMain={i === 0}
                    isFirst={i === 0}
                    isLast={i === images.length - 1}
                    onRemove={() => removeImage(i)}
                    onMoveLeft={() => moveImageLeft(i)}
                    onMoveRight={() => moveImageRight(i)}
                  />
                ))}
              </View>
            </ScrollView>

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
                  <TextInput
                    value={newCatName}
                    onChangeText={setNewCatName}
                    placeholder="اسم النوع الجديد..."
                    placeholderTextColor={Colors.textMuted}
                    style={styles.addCatInput}
                    textAlign="right"
                  />
                </View>
                <View style={styles.catListEdit}>
                  {artworkCategories.map(cat => (
                    <View key={cat.id} style={styles.catEditItem}>
                      <Pressable
                        onPress={() => onDeleteCategory?.(cat.id)}
                        style={styles.catDeleteBtn}
                        hitSlop={8}
                      >
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
                  <Pressable key={cat.id} onPress={() => setCategory(cat.name)}
                    style={[styles.catBtn, category === cat.name && styles.catBtnActive]}>
                    <Text style={[styles.catBtnText, category === cat.name && styles.catBtnTextActive]}>{cat.name}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            {/* Dimensions */}
            <View style={styles.dimHeader}>
              <View style={styles.unitToggle}>
                {(['cm', 'mm'] as const).map(u => (
                  <Pressable key={u} onPress={() => setDimensionUnit(u)} style={[styles.unitBtn, dimensionUnit === u && styles.unitBtnActive]}>
                    <Text style={[styles.unitBtnText, dimensionUnit === u && styles.unitBtnTextActive]}>{u}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.sectionLabel}>الأبعاد</Text>
            </View>
            <View style={styles.dimsRow}>
              <Input label={`ارتفاع (${dimensionUnit})`} value={height} onChangeText={setHeight} placeholder="0" keyboardType="numeric" containerStyle={styles.dimInput} />
              <Input label={`عرض (${dimensionUnit})`} value={width} onChangeText={setWidth} placeholder="0" keyboardType="numeric" containerStyle={styles.dimInput} />
              <Input label={`عمق (${dimensionUnit})`} value={depth} onChangeText={setDepth} placeholder="0" keyboardType="numeric" containerStyle={styles.dimInput} />
            </View>

            <Input label="السعر (ج.م) *" value={price} onChangeText={setPrice} placeholder="0" keyboardType="numeric" />
            <Input label="سنة الإنجاز" value={year} onChangeText={setYear} placeholder="2024" keyboardType="numeric" />

            {/* Materials */}
            {materials.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>الخامات المستخدمة</Text>
                <View style={styles.materialsGrid}>
                  {materials.map(m => (
                    <Pressable key={m.id} onPress={() => toggleMaterial(m.id)}
                      style={[styles.materialChip, selectedMaterials.includes(m.id) && styles.materialChipActive]}>
                      <View style={[styles.materialDot, { backgroundColor: m.color || Colors.primary }]} />
                      <Text style={[styles.materialChipText, selectedMaterials.includes(m.id) && styles.materialChipTextActive]} numberOfLines={1}>
                        {m.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            <View style={styles.switchRow}>
              <Switch value={available} onValueChange={setAvailable}
                trackColor={{ false: Colors.border, true: Colors.primarySurface }}
                thumbColor={available ? Colors.primary : Colors.textMuted} />
              <Text style={styles.switchLabel}>{available ? 'متاح للبيع' : 'مباع / غير متاح'}</Text>
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
  topRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.base,
  },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.surfaceElevated, borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  backBtnText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  imgSectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs,
  },
  imgHint: { fontSize: 10, color: Colors.textMuted, fontStyle: 'italic' },
  sectionLabel: {
    fontSize: FontSize.sm, fontWeight: FontWeight.medium,
    color: Colors.textSecondary, textAlign: 'right', marginBottom: Spacing.sm,
  },
  imagesScroll: { marginBottom: Spacing.base },
  imagesRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: 2, alignItems: 'center' },
  addImageBtn: {
    width: 80, height: 90, borderRadius: Radius.md,
    backgroundColor: Colors.surfaceElevated, borderWidth: 1,
    borderColor: Colors.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  addImageText: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center' },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  manageCatBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primarySurface, borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.primary + '60',
  },
  manageCatBtnText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.semibold },
  catManager: {
    backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  addCatRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md, alignItems: 'center' },
  addCatInput: {
    flex: 1, backgroundColor: Colors.card, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: FontSize.sm, color: Colors.textPrimary,
    borderWidth: 1, borderColor: Colors.border,
  },
  addCatBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  catListEdit: { gap: Spacing.sm },
  catEditItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, justifyContent: 'flex-end' },
  catEditName: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.medium, flex: 1, textAlign: 'right' },
  catDeleteBtn: { padding: 2 },
  catScroll: { marginBottom: Spacing.base },
  catRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: 2 },
  catBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.full, backgroundColor: Colors.surfaceElevated,
    borderWidth: 1, borderColor: Colors.border,
  },
  catBtnActive: { backgroundColor: Colors.primarySurface, borderColor: Colors.primary },
  catBtnText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  catBtnTextActive: { color: Colors.primary },
  dimHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  unitToggle: { flexDirection: 'row', gap: 4 },
  unitBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: 5,
    borderRadius: Radius.full, backgroundColor: Colors.surfaceElevated,
    borderWidth: 1, borderColor: Colors.border,
  },
  unitBtnActive: { backgroundColor: Colors.primarySurface, borderColor: Colors.primary },
  unitBtnText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.semibold },
  unitBtnTextActive: { color: Colors.primary },
  dimsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  dimInput: { flex: 1 },
  materialsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.base },
  materialChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.md, paddingVertical: 7,
    borderRadius: Radius.full, backgroundColor: Colors.surfaceElevated,
    borderWidth: 1, borderColor: Colors.border,
  },
  materialChipActive: { backgroundColor: Colors.primarySurface, borderColor: Colors.primary },
  materialDot: { width: 8, height: 8, borderRadius: 4 },
  materialChipText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  materialChipTextActive: { color: Colors.primary },
  switchRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    justifyContent: 'flex-end', marginBottom: Spacing.xl,
    backgroundColor: Colors.surfaceElevated, padding: Spacing.md, borderRadius: Radius.md,
  },
  switchLabel: { fontSize: FontSize.base, color: Colors.textPrimary, fontWeight: FontWeight.medium },
  btnRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.base },
  halfBtn: { flex: 1 },
});
