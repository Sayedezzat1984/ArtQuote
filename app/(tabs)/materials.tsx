// Powered by OnSpace.AI
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, TextInput, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { globalStyles } from '@/constants/styles';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components';
import { useApp } from '@/hooks/useApp';
import { useAlert } from '@/template';
import { Material } from '@/contexts/AppContext';

export default function MaterialsScreen() {
  const { materials, addMaterial, updateMaterial, deleteMaterial } = useApp();
  const { showAlert } = useAlert();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingMat, setEditingMat] = useState<Material | null>(null);
  const [matName, setMatName] = useState('');
  const [matDesc, setMatDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = materials.filter(m =>
    !search || m.name.includes(search) || m.description.includes(search)
  );

  function openAdd() { setEditingMat(null); setMatName(''); setMatDesc(''); setShowForm(true); }
  function openEdit(mat: Material) { setEditingMat(mat); setMatName(mat.name); setMatDesc(mat.description); setShowForm(true); }

  function handleDelete(mat: Material) {
    showAlert('حذف الخامة', `هل أنت متأكد من حذف "${mat.name}"؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف', style: 'destructive',
        onPress: () => deleteMaterial(mat.id),
      },
    ]);
  }

  async function handleSave() {
    if (!matName.trim()) { Alert.alert('خطأ', 'يرجى إدخال اسم الخامة'); return; }
    setSaving(true);
    if (editingMat) {
      await updateMaterial(editingMat.id, { name: matName.trim(), description: matDesc.trim() });
    } else {
      await addMaterial({ name: matName.trim(), description: matDesc.trim() });
    }
    setSaving(false);
    setShowForm(false);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={openAdd} style={styles.addBtn}>
          <MaterialIcons name="add" size={22} color={Colors.textOnPrimary} />
        </Pressable>
        <Text style={styles.title}>الخامات</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <MaterialIcons name="layers" size={20} color={Colors.primary} />
          <Text style={styles.statVal}>{materials.length}</Text>
          <Text style={styles.statLabel}>إجمالي الخامات</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <MaterialIcons name="search" size={20} color={Colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="ابحث في الخامات..."
          placeholderTextColor={Colors.textMuted}
          style={styles.searchInput}
          textAlign="right"
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={m => m.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState icon="layers" title="الخامات" subtitle="اضغط على + لإضافة أول خامة" />
        }
        renderItem={({ item }) => (
          <View style={styles.matCard}>
            <View style={styles.matContent}>
              <View style={styles.matActions}>
                <Pressable onPress={() => openEdit(item)} style={styles.iconBtn} hitSlop={8}>
                  <MaterialIcons name="edit" size={17} color={Colors.primary} />
                </Pressable>
                <Pressable onPress={() => handleDelete(item)} style={[styles.iconBtn, styles.deleteIconBtn]} hitSlop={8}>
                  <MaterialIcons name="delete-outline" size={17} color={Colors.error} />
                </Pressable>
              </View>
              <View style={styles.matInfo}>
                <Text style={styles.matName}>{item.name}</Text>
                {item.description ? (
                  <Text style={styles.matDesc} numberOfLines={2}>{item.description}</Text>
                ) : null}
              </View>
              <View style={styles.matIconWrap}>
                <MaterialIcons name="layers" size={22} color={Colors.primary} />
              </View>
            </View>
          </View>
        )}
      />

      {/* Add/Edit Modal */}
      <Modal visible={showForm} transparent animationType="slide" onRequestClose={() => setShowForm(false)}>
        <View style={globalStyles.overlay}>
          <View style={globalStyles.modalSheet}>
            <View style={globalStyles.modalHandle} />
            <Text style={globalStyles.modalTitle}>
              {editingMat ? 'تعديل الخامة' : 'إضافة خامة جديدة'}
            </Text>
            <Input
              label="اسم الخامة *"
              value={matName}
              onChangeText={setMatName}
              placeholder="مثال: الجرانيت الأسود"
            />
            <Input
              label="الوصف"
              value={matDesc}
              onChangeText={setMatDesc}
              placeholder="وصف الخامة وخصائصها..."
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalBtnRow}>
              <Button title="إلغاء" onPress={() => setShowForm(false)} variant="ghost" style={styles.halfBtn} />
              <Button
                title={editingMat ? 'حفظ التعديلات' : 'إضافة'}
                onPress={handleSave}
                loading={saving}
                style={styles.halfBtn}
              />
            </View>
            <View style={{ height: Spacing.xl }} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  statsRow: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
  statCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  statVal: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.primary },
  statLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1, textAlign: 'right' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, marginHorizontal: Spacing.base,
    marginBottom: Spacing.base, borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: {
    flex: 1, paddingVertical: Spacing.md,
    fontSize: FontSize.base, color: Colors.textPrimary, marginRight: Spacing.sm,
  },
  listContent: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.base },
  matCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  matContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    gap: Spacing.md,
  },
  matIconWrap: {
    width: 46, height: 46,
    borderRadius: 23,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matInfo: { flex: 1, alignItems: 'flex-end' },
  matName: {
    fontSize: FontSize.base, fontWeight: FontWeight.bold,
    color: Colors.textPrimary, textAlign: 'right', marginBottom: 2,
  },
  matDesc: {
    fontSize: FontSize.sm, color: Colors.textSecondary,
    textAlign: 'right', lineHeight: 18,
  },
  matActions: { flexDirection: 'column', gap: Spacing.sm },
  iconBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center', justifyContent: 'center',
  },
  deleteIconBtn: { backgroundColor: Colors.errorSurface },
  modalBtnRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.sm },
  halfBtn: { flex: 1 },
});
