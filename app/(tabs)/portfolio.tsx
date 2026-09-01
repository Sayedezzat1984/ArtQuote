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
import { Artwork } from '@/contexts/AppContext';

export default function PortfolioScreen() {
  const { artworks, materials, artworkCategories, addArtwork, updateArtwork, deleteArtwork, addArtworkCategory, deleteArtworkCategory } = useApp();
  const { showAlert } = useAlert();
  const { t, lang } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
  const [detailArtwork, setDetailArtwork] = useState<Artwork | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('الكل');
  const [filter, setFilter] = useState(0);

  const ALL_LABEL = lang === 'ar' ? 'الكل' : 'All';
  const FILTERS = lang === 'ar' ? ['الكل', 'متاح', 'مباع'] : ['All', 'Available', 'Sold'];
  const categoryLabels = [ALL_LABEL, ...artworkCategories.map(c => c.name)];

  const filtered = artworks.filter(a => {
    const matchSearch = !search || a.title.includes(search) || a.description.includes(search);
    const matchCat = categoryFilter === ALL_LABEL || a.category === categoryFilter;
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
        <Pressable onPress={() => { setEditingArtwork(null); setShowForm(true); }} style={styles.addBtn}>
          <MaterialIcons name="add" size={22} color={Colors.textOnPrimary} />
        </Pressable>
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
          data={categoryLabels}
          horizontal
          keyExtractor={(_, i) => i.toString()}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setCategoryFilter(item)}
              style={[styles.filterChip, categoryFilter === item && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, categoryFilter === item && styles.filterChipTextActive]}>{item}</Text>
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
        artworkCategories={artworkCategories}
        onSave={handleSave}
        onClose={() => { setShowForm(false); setEditingArtwork(null); }}
        onAddCategory={addArtworkCategory}
        onDeleteCategory={deleteArtworkCategory}
      />

      <ArtworkDetailModal
        visible={detailArtwork !== null}
        artwork={detailArtwork}
        materials={materials}
        onClose={() => setDetailArtwork(null)}
        onEdit={() => handleEdit(detailArtwork!)}
        onDelete={() => handleDelete(detailArtwork!)}
      />
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
