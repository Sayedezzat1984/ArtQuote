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
import { Artwork } from '@/contexts/AppContext';

interface ArtworkFormModalProps {
  visible: boolean;
  artwork?: Artwork | null;
  onSave: (data: Omit<Artwork, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

const CATEGORIES = ['زيت على قماش', 'ألوان مائية', 'أكريليك', 'رسم بالقلم', 'خط عربي', 'ديجيتال آرت', 'نحت', 'أخرى'];

export function ArtworkFormModal({ visible, artwork, onSave, onClose }: ArtworkFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [price, setPrice] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [available, setAvailable] = useState(true);
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (artwork) {
      setTitle(artwork.title);
      setDescription(artwork.description);
      setCategory(artwork.category);
      setPrice(artwork.price.toString());
      setDimensions(artwork.dimensions);
      setYear(artwork.year);
      setAvailable(artwork.available);
      setImage(artwork.image);
    } else {
      setTitle(''); setDescription(''); setCategory(CATEGORIES[0]);
      setPrice(''); setDimensions(''); setYear(new Date().getFullYear().toString());
      setAvailable(true); setImage(null);
    }
  }, [artwork, visible]);

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('خطأ', 'نحتاج إذن الوصول للصور');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
    }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('خطأ', 'نحتاج إذن الكاميرا');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
    }
  }

  function handleSave() {
    if (!title.trim()) { Alert.alert('خطأ', 'يرجى إدخال عنوان العمل'); return; }
    if (!price || isNaN(Number(price))) { Alert.alert('خطأ', 'يرجى إدخال سعر صحيح'); return; }
    setLoading(true);
    setTimeout(() => {
      onSave({ title: title.trim(), description: description.trim(), category, price: Number(price), dimensions: dimensions.trim(), year: year.trim(), available, image });
      setLoading(false);
    }, 300);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={globalStyles.overlay}>
        <View style={globalStyles.modalSheet}>
          <View style={globalStyles.modalHandle} />
          <Text style={globalStyles.modalTitle}>{artwork ? 'تعديل العمل الفني' : 'إضافة عمل فني جديد'}</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Image Section */}
            <Pressable onPress={pickImage} style={styles.imagePickerBtn}>
              {image ? (
                <Image source={{ uri: image }} style={styles.previewImage} contentFit="cover" />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <MaterialIcons name="add-photo-alternate" size={36} color={Colors.primary} />
                  <Text style={styles.imagePlaceholderText}>اضغط لإضافة صورة</Text>
                </View>
              )}
            </Pressable>
            {image ? (
              <View style={styles.imageActions}>
                <Button title="تغيير الصورة" onPress={pickImage} variant="ghost" size="sm" />
                <Button title="كاميرا" onPress={takePhoto} variant="ghost" size="sm" />
                <Button title="حذف الصورة" onPress={() => setImage(null)} variant="danger" size="sm" />
              </View>
            ) : (
              <View style={styles.imageActions}>
                <Button title="من المعرض" onPress={pickImage} variant="ghost" size="sm" />
                <Button title="التقاط صورة" onPress={takePhoto} variant="ghost" size="sm" />
              </View>
            )}

            <Input label="عنوان العمل *" value={title} onChangeText={setTitle} placeholder="مثال: لوحة الغروب الذهبي" />
            <Input label="الوصف" value={description} onChangeText={setDescription} placeholder="وصف العمل الفني..." multiline numberOfLines={3} />

            <Text style={styles.sectionLabel}>التصنيف</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              <View style={styles.catRow}>
                {CATEGORIES.map(cat => (
                  <Pressable key={cat} onPress={() => setCategory(cat)} style={[styles.catBtn, category === cat && styles.catBtnActive]}>
                    <Text style={[styles.catBtnText, category === cat && styles.catBtnTextActive]}>{cat}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <View style={styles.row}>
              <Input label="السعر (ر.س) *" value={price} onChangeText={setPrice} placeholder="0" keyboardType="numeric" containerStyle={styles.half} />
              <View style={{ width: Spacing.md }} />
              <Input label="الأبعاد" value={dimensions} onChangeText={setDimensions} placeholder="60×80 سم" containerStyle={styles.half} />
            </View>
            <Input label="سنة الإنجاز" value={year} onChangeText={setYear} placeholder="2024" keyboardType="numeric" />

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
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  imagePickerBtn: {
    height: 180,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  previewImage: { width: '100%', height: '100%' },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  imagePlaceholderText: { fontSize: FontSize.sm, color: Colors.textMuted },
  imageActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  sectionLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginBottom: Spacing.sm,
  },
  catScroll: { marginBottom: Spacing.base },
  catRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: 2 },
  catBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catBtnActive: { backgroundColor: Colors.primarySurface, borderColor: Colors.primary },
  catBtnText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  catBtnTextActive: { color: Colors.primary },
  row: { flexDirection: 'row' },
  half: { flex: 1 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    justifyContent: 'flex-end',
    marginBottom: Spacing.xl,
    backgroundColor: Colors.surfaceElevated,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  switchLabel: { fontSize: FontSize.base, color: Colors.textPrimary, fontWeight: FontWeight.medium },
  btnRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.base },
  halfBtn: { flex: 1 },
});
