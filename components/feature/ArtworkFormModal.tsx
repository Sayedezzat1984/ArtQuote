// Powered by OnSpace.AI
import React, { useState, useEffect } from 'react';
import { View, Text, Modal, ScrollView, StyleSheet, Pressable, Switch, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { globalStyles } from '@/constants/styles';
import { Artwork, ArtworkDimensions } from '@/contexts/AppContext';
import { useApp } from '@/hooks/useApp';

interface ArtworkFormModalProps {
  visible: boolean;
  artwork?: Artwork | null;
  onSave: (data: Omit<Artwork, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

const CATEGORIES = [
  'أقسام', 'وحدات إضاءة', 'نحت حر', 'كونسول', 'جداريات', 'مجسمات', 'أخرى',
];

const EMPTY_DIMS: ArtworkDimensions = { length: '', width: '', height: '', unit: 'cm' };

export function ArtworkFormModal({ visible, artwork, onSave, onClose }: ArtworkFormModalProps) {
  const { materials: allMaterials } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [price, setPrice] = useState('');
  const [dimensions, setDimensions] = useState<ArtworkDimensions>(EMPTY_DIMS);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [available, setAvailable] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (artwork) {
      setTitle(artwork.title);
      setDescription(artwork.description);
      setCategory(artwork.category);
      setPrice(artwork.price.toString());
      setDimensions(
        typeof artwork.dimensions === 'object' && 'unit' in artwork.dimensions
          ? artwork.dimensions
          : EMPTY_DIMS
      );
      setYear(artwork.year);
      setAvailable(artwork.available);
      const imgs = artwork.images && artwork.images.length > 0
        ? artwork.images
        : artwork.image ? [artwork.image] : [];
      setImages(imgs);
      setSelectedMaterials(artwork.materials || []);
    } else {
      setTitle(''); setDescription(''); setCategory(CATEGORIES[0]);
      setPrice(''); setDimensions(EMPTY_DIMS);
      setYear(new Date().getFullYear().toString());
      setAvailable(true); setImages([]); setSelectedMaterials([]);
    }
  }, [artwork, visible]);

  async function pickImages() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('خطأ', 'نحتاج إذن الوصول للصور'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
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

  function toggleMaterial(name: string) {
    setSelectedMaterials(prev =>
      prev.includes(name) ? prev.filter(m => m !== name) : [...prev, name]
    );
  }

  function handleSave() {
    if (!title.trim()) { Alert.alert('خطأ', 'يرجى إدخال عنوان العمل'); return; }
    if (!price || isNaN(Number(price))) { Alert.alert('خطأ', 'يرجى إدخال سعر صحيح'); return; }
    setLoading(true);
    setTimeout(() => {
      onSave({
        title: title.trim(),
        description: description.trim(),
        category,
        price: Number(price),
        dimensions,
        year: year.trim(),
        available,
        image: images[0] || null,
        images,
        materials: selectedMaterials,
      });
      setLoading(false);
    }, 300);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={globalStyles.overlay}>
        <View style={[globalStyles.modalSheet, { maxHeight: '97%' }]}>
          <View style={globalStyles.modalHandle} />
          <Text style={globalStyles.modalTitle}>{artwork ? 'تعديل العمل' : 'إضافة عمل جديد'}</Text>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* ── Images Section ── */}
            <Text style={styles.sectionLabel}>صور العمل ({images.length}/10)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imagesRow}>
              {images.map((uri, i) => (
                <View key={i} style={styles.imgThumb}>
                  <Image source={{ uri }} style={styles.thumbImg} contentFit="cover" transition={150} />
                  {i === 0 ? (
                    <View style={styles.mainBadge}><Text style={styles.mainBadgeText}>رئيسية</Text></View>
                  ) : null}
                  <Pressable onPress={() => removeImage(i)} style={styles.removeImgBtn} hitSlop={4}>
                    <MaterialIcons name="close" size={14} color="#fff" />
                  </Pressable>
                </View>
              ))}
              {images.length < 10 ? (
                <Pressable onPress={pickImages} style={styles.addImgBtn}>
                  <MaterialIcons name="add-photo-alternate" size={28} color={Colors.primary} />
                  <Text style={styles.addImgText}>إضافة</Text>
                </Pressable>
              ) : null}
            </ScrollView>
            <View style={styles.imageActions}>
              <Button title="من المعرض" onPress={pickImages} variant="ghost" size="sm" />
              <Button title="كاميرا" onPress={takePhoto} variant="ghost" size="sm" />
            </View>

            {/* ── Basic Info ── */}
            <Input label="عنوان العمل *" value={title} onChangeText={setTitle} placeholder="مثال: مجسم الثور البرونزي" />
            <Input
              label="وصف العمل"
              value={description}
              onChangeText={setDescription}
              placeholder="وصف تفصيلي للعمل الفني..."
              multiline
              numberOfLines={3}
            />

            {/* ── Category ── */}
            <Text style={styles.sectionLabel}>التصنيف</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.base }}>
              <View style={styles.chipRow}>
                {CATEGORIES.map(cat => (
                  <Pressable key={cat} onPress={() => setCategory(cat)} style={[styles.chip, category === cat && styles.chipActive]}>
                    <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            {/* ── Price & Year ── */}
            <View style={styles.row}>
              <Input
                label="السعر (ج.م) *"
                value={price}
                onChangeText={setPrice}
                placeholder="0"
                keyboardType="numeric"
                containerStyle={styles.half}
              />
              <View style={{ width: Spacing.md }} />
              <Input
                label="سنة الإنجاز"
                value={year}
                onChangeText={setYear}
                placeholder="2024"
                keyboardType="numeric"
                containerStyle={styles.half}
              />
            </View>

            {/* ── Dimensions ── */}
            <Text style={styles.sectionLabel}>الأبعاد (أرقام فقط)</Text>
            <View style={styles.dimsRow}>
              <Input
                label="الطول"
                value={dimensions.length}
                onChangeText={v => setDimensions(d => ({ ...d, length: v.replace(/[^0-9.]/g, '') }))}
                placeholder="0"
                keyboardType="numeric"
                containerStyle={styles.dimInput}
              />
              <Input
                label="العرض"
                value={dimensions.width}
                onChangeText={v => setDimensions(d => ({ ...d, width: v.replace(/[^0-9.]/g, '') }))}
                placeholder="0"
                keyboardType="numeric"
                containerStyle={styles.dimInput}
              />
              <Input
                label="الارتفاع"
                value={dimensions.height}
                onChangeText={v => setDimensions(d => ({ ...d, height: v.replace(/[^0-9.]/g, '') }))}
                placeholder="0"
                keyboardType="numeric"
                containerStyle={styles.dimInput}
              />
            </View>
            {/* Unit selector */}
            <View style={styles.unitRow}>
              <Text style={styles.unitLabel}>الوحدة:</Text>
              {(['cm', 'mm'] as const).map(unit => (
                <Pressable
                  key={unit}
                  onPress={() => setDimensions(d => ({ ...d, unit }))}
                  style={[styles.unitBtn, dimensions.unit === unit && styles.unitBtnActive]}
                >
                  <Text style={[styles.unitBtnText, dimensions.unit === unit && styles.unitBtnTextActive]}>{unit}</Text>
                </Pressable>
              ))}
            </View>

            {/* ── Materials ── */}
            <Text style={styles.sectionLabel}>الخامات ({selectedMaterials.length} محددة)</Text>
            {allMaterials.length === 0 ? (
              <Text style={styles.noMatsText}>أضف خامات من صفحة الخامات أولاً</Text>
            ) : (
              <View style={styles.materialsGrid}>
                {allMaterials.map(mat => {
                  const selected = selectedMaterials.includes(mat.name);
                  return (
                    <Pressable
                      key={mat.id}
                      onPress={() => toggleMaterial(mat.name)}
                      style={[styles.matChip, selected && styles.matChipActive]}
                    >
                      {selected ? <MaterialIcons name="check" size={13} color={Colors.primary} /> : null}
                      <Text style={[styles.matChipText, selected && styles.matChipTextActive]}>{mat.name}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* ── Availability ── */}
            <View style={styles.switchRow}>
              <Switch
                value={available}
                onValueChange={setAvailable}
                trackColor={{ false: Colors.border, true: Colors.primarySurface }}
                thumbColor={available ? Colors.primary : Colors.textMuted}
              />
              <Text style={styles.switchLabel}>{available ? 'متاح للبيع' : 'مباع / غير متاح'}</Text>
            </View>

            <View style={styles.btnRow}>
              <Button title="إلغاء" onPress={onClose} variant="ghost" style={styles.halfBtn} />
              <Button title={artwork ? 'حفظ التعديلات' : 'إضافة العمل'} onPress={handleSave} loading={loading} style={styles.halfBtn} />
            </View>
            <View style={{ height: Spacing.xxl }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  imagesRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
    paddingHorizontal: 2,
  },
  imgThumb: {
    width: 90, height: 90,
    borderRadius: Radius.md,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  thumbImg: { width: '100%', height: '100%' },
  mainBadge: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(201,168,76,0.85)',
    alignItems: 'center', paddingVertical: 2,
  },
  mainBadgeText: { fontSize: 9, color: '#000', fontWeight: FontWeight.bold },
  removeImgBtn: {
    position: 'absolute', top: 3, right: 3,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10, width: 20, height: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  addImgBtn: {
    width: 90, height: 90,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addImgText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.medium },
  imageActions: {
    flexDirection: 'row', gap: Spacing.sm,
    justifyContent: 'center', marginBottom: Spacing.base,
  },
  chipRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: 2 },
  chip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1, borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primarySurface, borderColor: Colors.primary },
  chipText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  chipTextActive: { color: Colors.primary },
  row: { flexDirection: 'row' },
  half: { flex: 1 },
  dimsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  dimInput: { flex: 1 },
  unitRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    justifyContent: 'flex-end', marginBottom: Spacing.base,
  },
  unitLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginRight: Spacing.xs },
  unitBtn: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderRadius: Radius.full, borderWidth: 1.5,
    borderColor: Colors.border, backgroundColor: Colors.surfaceElevated,
  },
  unitBtnActive: { backgroundColor: Colors.primarySurface, borderColor: Colors.primary },
  unitBtnText: { fontSize: FontSize.base, color: Colors.textSecondary, fontWeight: FontWeight.bold },
  unitBtnTextActive: { color: Colors.primary },
  materialsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, justifyContent: 'flex-end', marginBottom: Spacing.base },
  matChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: 7,
    borderRadius: Radius.full, borderWidth: 1,
    borderColor: Colors.border, backgroundColor: Colors.surfaceElevated,
  },
  matChipActive: { backgroundColor: Colors.primarySurface, borderColor: Colors.primary },
  matChipText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  matChipTextActive: { color: Colors.primary },
  noMatsText: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'right', marginBottom: Spacing.base },
  switchRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    justifyContent: 'flex-end', marginBottom: Spacing.xl,
    backgroundColor: Colors.surfaceElevated,
    padding: Spacing.md, borderRadius: Radius.md,
  },
  switchLabel: { fontSize: FontSize.base, color: Colors.textPrimary, fontWeight: FontWeight.medium },
  btnRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.sm },
  halfBtn: { flex: 1 },
});
