// Powered by OnSpace.AI
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { useAlert } from '@/template';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArtworkCard, ArtworkFormModal, EmptyState } from '@/components';
import { ArtworkDetailModal } from '@/components/feature/ArtworkDetailModal';
import { MaterialsModal } from '@/components/feature/MaterialsModal';
import { Artwork } from '@/contexts/AppContext';

const CATEGORIES_AR = ['الكل', 'زيت على قماش', 'ألوان مائية', 'أكريليك', 'رسم بالقلم', 'خط عربي', 'ديجيتال آرت', 'أقسام', 'وحدات إضاءة', 'نحت حر', 'كونسول', 'جداريات', 'مجسمات', 'أخرى'];
const CATEGORIES_EN = ['All', 'Oil on Canvas', 'Watercolor', 'Acrylic', 'Pencil', 'Arabic Calligraphy', 'Digital Art', 'Sections', 'Lighting Units', 'Free Sculpture', 'Console', 'Murals', 'Sculptures', 'Other'];

export default function PortfolioScreen() {
  const { artworks, materials, addArtwork, updateArtwork, deleteArtwork } = useApp();
  const { showAlert } = useAlert();
  const { t, lang } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [showMaterials, setShowMaterials] = useState(false);
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
  const [detailArtwork, setDetailArtwork] = useState<Artwork | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(0);
  const [filter, setFilter] = useState(0);

  const CATEGORIES = lang === 'ar' ? CATEGORIES_AR : CATEGORIES_EN;
  const FILTERS = lang === 'ar' ? ['الكل', 'متاح', 'مباع'] : ['All', 'Available', 'Sold'];

  const filtered = artworks.filter(a => {
    const matchSearch = !search || a.title.includes(search) || a.description.includes(search);
    const matchCat = category === 0 || a.category === CATEGORIES_AR[category];
    const matchFilter = filter === 0 || (filter === 1 && a.available) || (filter === 2 && !a.available);
    return matchSearch && matchCat && matchFilter;
  });

  function handleEdit(artwork: Artwork) { setDetailArtwork(null); setEditingArtwork(artwork); setShowForm(true); }

  function handleDelete(artwork: Artwork) {
    showAlert(`${t('delete')}`, `هل أنت متأكد من حذف "${artwork.title}"؟`, [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: () => { deleteArtwork(artwork.id); setDetailArtwork(null); } },
    ]);
  }

  function handleSave(data: Omit<Artwork, 'id' | 'createdAt'>) {
    if (editingArtwork) updateArtwork(editingArtwork.id, data);
    else addArtwork(data);
    setShowForm(false);
    setEditingArtwork(null);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerRight}>
          <Pressable onPress={() => { setEditingArtwork(null); setShowForm(true); }} style={styles.addBtn}>
            <MaterialIcons name="add" size={22} color={Colors.textOnPrimary} />
          </Pressable>
          <Pressable onPress={() => setShowMaterials(true)} style={styles.materialsBtn}>
            <MaterialIcons name="layers" size={18} color={Colors.primary} />
            <Text style={styles.materialsBtnText}>الخامات ({materials.length})</Text>
          </Pressable>
        </View>
        <Text style={styles.title}>{t('artworkAlbum')}</Text>
      </View>

      <View style={styles.searchBar}>
        <MaterialIcons name="search" size={20} color={Colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t('searchArtwork')}
          placeholderTextColor={Colors.textMuted}
          style={styles.searchInput}
          textAlign="right"
        />
      </View>

      {/* Category Filter */}
      <View style={styles.filterOuter}>
        <FlatList
          data={CATEGORIES}
          horizontal
          keyExtractor={(_, i) => i.toString()}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
          renderItem={({ item, index }) => (
            <Pressable
              onPress={() => setCategory(index)}
              style={[styles.filterChip, category === index && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, category === index && styles.filterChipTextActive]}>{item}</Text>
            </Pressable>
          )}
        />
      </View>

      {/* Availability Filter */}
      <View style={styles.availRow}>
        {FILTERS.map((f, i) => (
          <Pressable key={i} onPress={() => setFilter(i)} style={[styles.availBtn, filter === i && styles.availBtnActive]}>
            <Text style={[styles.availBtnText, filter === i && styles.availBtnTextActive]}>{f}</Text>
          </Pressable>
        ))}
        <View style={{ flex: 1 }} />
        <Text style={styles.countText}>{filtered.length} {t('works')}</Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={a => a.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState icon="palette" title={t('artworkAlbum')} subtitle="اضغط على + لإضافة أول عمل فني" />
        }
        renderItem={({ item }) => (
          <ArtworkCard
            artwork={item}
            materials={materials}
            onPress={() => setDetailArtwork(item)}
            onEdit={() => handleEdit(item)}
            onDelete={() => handleDelete(item)}
          />
        )}
      />

      <ArtworkFormModal
        visible={showForm}
        artwork={editingArtwork}
        materials={materials}
        onSave={handleSave}
        onClose={() => { setShowForm(false); setEditingArtwork(null); }}
      />

      <ArtworkDetailModal
        visible={detailArtwork !== null}
        artwork={detailArtwork}
        materials={materials}
        onClose={() => setDetailArtwork(null)}
        onEdit={() => handleEdit(detailArtwork!)}
        onDelete={() => handleDelete(detailArtwork!)}
      />

      <MaterialsModal visible={showMaterials} onClose={() => setShowMaterials(false)} />
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
  headerRight: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  materialsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.primarySurface, borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderWidth: 1, borderColor: Colors.primary + '60',
  },
  materialsBtnText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.semibold },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, margin: Spacing.base,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, paddingVertical: Spacing.md, fontSize: FontSize.base, color: Colors.textPrimary, marginRight: Spacing.sm },
  filterOuter: { height: 52 },
  filterContent: { paddingHorizontal: Spacing.base, gap: Spacing.sm, alignItems: 'center' },
  filterChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.full, backgroundColor: Colors.surfaceElevated,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.primarySurface, borderColor: Colors.primary },
  filterChipText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  filterChipTextActive: { color: Colors.primary },
  availRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, gap: Spacing.sm,
  },
  availBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: Radius.full, backgroundColor: Colors.surfaceElevated,
    borderWidth: 1, borderColor: Colors.border,
  },
  availBtnActive: { backgroundColor: Colors.primarySurface, borderColor: Colors.primary },
  availBtnText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.medium },
  availBtnTextActive: { color: Colors.primary },
  countText: { fontSize: FontSize.xs, color: Colors.textMuted },
  listContent: { padding: Spacing.base, paddingTop: Spacing.sm },
});
