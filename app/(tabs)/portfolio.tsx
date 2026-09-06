// Powered by OnSpace.AI
import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  TextInput, Modal, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { useAlert } from '@/template';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArtworkCard, ArtworkFormModal, EmptyState } from '@/components';
import { ArtworkDetailModal } from '@/components/feature/ArtworkDetailModal';
import { Artwork } from '@/contexts/AppContext';
import { isTablet, pagePadding, numColumns, contentMaxWidth } from '@/constants/responsive';
import { useAuth } from '@/contexts/AuthContext';

type SortKey = 'newest' | 'oldest' | 'priceHigh' | 'priceLow' | 'title';
type AvailFilter = 'all' | 'available' | 'sold';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'newest', label: 'الأحدث' },
  { key: 'oldest', label: 'الأقدم' },
  { key: 'priceHigh', label: 'سعر: الأعلى' },
  { key: 'priceLow', label: 'سعر: الأقل' },
  { key: 'title', label: 'أبجدي' },
];

export default function PortfolioScreen() {
  const { artworks, materials, artworkCategories, addArtwork, updateArtwork, deleteArtwork, addArtworkCategory, deleteArtworkCategory } = useApp();
  const { showAlert } = useAlert();
  const { t, lang, currency } = useLanguage();
  const { isAdmin } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
  const [detailArtwork, setDetailArtwork] = useState<Artwork | null>(null);

  // Keep detailArtwork in sync with Firestore updates
  useEffect(() => {
    if (!detailArtwork) return;
    const updated = artworks.find(a => a.id === detailArtwork.id);
    if (updated) setDetailArtwork(updated);
  }, [artworks]);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('الكل');
  const [availFilter, setAvailFilter] = useState<AvailFilter>('all');

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [materialFilter, setMaterialFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('newest');

  const ALL_LABEL = lang === 'ar' ? 'الكل' : 'All';
  const categoryLabels = [ALL_LABEL, ...artworkCategories.map(c => c.name)];

  const hasActiveFilters = minPrice || maxPrice || yearFilter || materialFilter || sortKey !== 'newest' || availFilter !== 'all';

  const filtered = useMemo(() => {
    let result = artworks.filter(a => {
      const matchSearch = !search || a.title.includes(search) || a.description.includes(search) || a.category.includes(search);
      const matchCat = categoryFilter === ALL_LABEL || a.category === categoryFilter;
      const matchAvail = availFilter === 'all' || (availFilter === 'available' && a.available) || (availFilter === 'sold' && !a.available);
      const matchMinPrice = !minPrice || a.price >= Number(minPrice);
      const matchMaxPrice = !maxPrice || a.price <= Number(maxPrice);
      const matchYear = !yearFilter || a.year === yearFilter;
      const matchMaterial = !materialFilter || (a.materialIds || []).some(mid => {
        const mat = materials.find(m => m.id === mid);
        return mat?.name.includes(materialFilter);
      });
      return matchSearch && matchCat && matchAvail && matchMinPrice && matchMaxPrice && matchYear && matchMaterial;
    });

    switch (sortKey) {
      case 'newest': result = [...result].sort((a, b) => b.createdAt.localeCompare(a.createdAt)); break;
      case 'oldest': result = [...result].sort((a, b) => a.createdAt.localeCompare(b.createdAt)); break;
      case 'priceHigh': result = [...result].sort((a, b) => b.price - a.price); break;
      case 'priceLow': result = [...result].sort((a, b) => a.price - b.price); break;
      case 'title': result = [...result].sort((a, b) => a.title.localeCompare(b.title)); break;
    }
    return result;
  }, [artworks, search, categoryFilter, availFilter, minPrice, maxPrice, yearFilter, materialFilter, sortKey, materials, ALL_LABEL]);

  const totalValue = filtered.reduce((s, a) => s + a.price, 0);

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

  function handleSaveToArtwork(artworkId: string, newImages: string[]) {
    updateArtwork(artworkId, { images: newImages, image: newImages[0] || null });
    if (detailArtwork && detailArtwork.id === artworkId) {
      setDetailArtwork({ ...detailArtwork, images: newImages, image: newImages[0] || null });
    }
  }

  function clearFilters() {
    setMinPrice(''); setMaxPrice(''); setYearFilter('');
    setMaterialFilter(''); setSortKey('newest'); setAvailFilter('all');
  }

  const cols = isTablet ? 2 : 1;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        {isAdmin ? (
          <Pressable onPress={() => { setEditingArtwork(null); setShowForm(true); }} style={styles.addBtn}>
            <MaterialIcons name="add" size={22} color={Colors.textOnPrimary} />
          </Pressable>
        ) : (
          <View style={styles.addBtnDisabled}>
            <MaterialIcons name="lock" size={18} color={Colors.textMuted} />
          </View>
        )}
        <Text style={styles.title}>{t('artworkAlbum')}</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchRow}>
        <Pressable
          onPress={() => setShowAdvanced(true)}
          style={[styles.advancedBtn, hasActiveFilters && styles.advancedBtnActive]}
        >
          <MaterialIcons name="tune" size={20} color={hasActiveFilters ? Colors.primary : Colors.textMuted} />
          {hasActiveFilters ? <View style={styles.filterDot} /> : null}
        </Pressable>
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
          {search ? (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <MaterialIcons name="close" size={16} color={Colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
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

      {/* Stats + Avail Row */}
      <View style={styles.statsRow}>
        <View style={styles.availGroup}>
          {(['all', 'available', 'sold'] as AvailFilter[]).map(f => {
            const labels: Record<AvailFilter, string> = { all: 'الكل', available: 'متاح', sold: 'مباع' };
            return (
              <Pressable key={f} onPress={() => setAvailFilter(f)} style={[styles.availBtn, availFilter === f && styles.availBtnActive]}>
                <Text style={[styles.availBtnText, availFilter === f && styles.availBtnTextActive]}>{labels[f]}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.miniStats}>
          <Text style={styles.miniStatText}>{filtered.length} عمل</Text>
          <Text style={styles.miniStatSep}>·</Text>
          <Text style={[styles.miniStatText, { color: Colors.primary }]}>{totalValue.toLocaleString()} {currency}</Text>
        </View>
      </View>

      {/* Sort Row */}
      <View style={styles.sortOuter}>
        <FlatList
          data={SORT_OPTIONS}
          horizontal
          keyExtractor={i => i.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sortContent}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setSortKey(item.key)}
              style={[styles.sortChip, sortKey === item.key && styles.sortChipActive]}
            >
              {sortKey === item.key ? <MaterialIcons name="check" size={12} color={Colors.primary} /> : null}
              <Text style={[styles.sortChipText, sortKey === item.key && styles.sortChipTextActive]}>{item.label}</Text>
            </Pressable>
          )}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={a => a.id}
        numColumns={cols}
        key={`cols-${cols}`}
        columnWrapperStyle={cols > 1 ? styles.columnWrapper : undefined}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState icon="palette" title={t('artworkAlbum')} subtitle={
            hasActiveFilters || search ? 'لا توجد نتائج تطابق البحث — جرّب تعديل الفلاتر' : 'اضغط على + لإضافة أول عمل فني'
          } />
        }
        renderItem={({ item }) => (
          <View style={cols > 1 ? styles.colItem : undefined}>
            <ArtworkCard
              artwork={item}
              materials={materials}
              onPress={() => setDetailArtwork(item)}
              onEdit={isAdmin ? () => handleEdit(item) : undefined}
              onDelete={isAdmin ? () => handleDelete(item) : undefined}
            />
          </View>
        )}
      />

      {isAdmin ? (
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
      ) : null}

      <ArtworkDetailModal
        visible={detailArtwork !== null}
        artwork={detailArtwork}
        materials={materials}
        onClose={() => setDetailArtwork(null)}
        onEdit={() => handleEdit(detailArtwork!)}
        onDelete={() => handleDelete(detailArtwork!)}
        onSaveImages={(newImages) => detailArtwork && handleSaveToArtwork(detailArtwork.id, newImages)}
      />

      {/* Advanced Search Modal */}
      <Modal visible={showAdvanced} transparent animationType="slide" onRequestClose={() => setShowAdvanced(false)}>
        <View style={styles.advOverlay}>
          <View style={styles.advSheet}>
            <View style={styles.advHandle} />
            <View style={styles.advHeader}>
              <Pressable onPress={clearFilters} style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>مسح الكل</Text>
              </Pressable>
              <Text style={styles.advTitle}>بحث متقدم</Text>
              <Pressable onPress={() => setShowAdvanced(false)} style={styles.advCloseBtn}>
                <MaterialIcons name="close" size={20} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.advContent}>
              <Text style={styles.advSectionLabel}>نطاق السعر (ج.م)</Text>
              <View style={styles.rangeRow}>
                <View style={styles.rangeInput}>
                  <Text style={styles.rangeHint}>حتى</Text>
                  <TextInput value={maxPrice} onChangeText={setMaxPrice} placeholder="الحد الأقصى" placeholderTextColor={Colors.textMuted} keyboardType="numeric" style={styles.rangeTextInput} textAlign="right" />
                </View>
                <MaterialIcons name="remove" size={16} color={Colors.textMuted} />
                <View style={styles.rangeInput}>
                  <Text style={styles.rangeHint}>من</Text>
                  <TextInput value={minPrice} onChangeText={setMinPrice} placeholder="الحد الأدنى" placeholderTextColor={Colors.textMuted} keyboardType="numeric" style={styles.rangeTextInput} textAlign="right" />
                </View>
              </View>

              <Text style={styles.advSectionLabel}>سنة الإنجاز</Text>
              <View style={styles.advInputWrap}>
                <MaterialIcons name="calendar-today" size={18} color={Colors.textMuted} />
                <TextInput value={yearFilter} onChangeText={setYearFilter} placeholder="مثال: 2024" placeholderTextColor={Colors.textMuted} keyboardType="numeric" style={styles.advTextInput} textAlign="right" />
              </View>

              <Text style={styles.advSectionLabel}>الخامة</Text>
              <View style={styles.advInputWrap}>
                <MaterialIcons name="category" size={18} color={Colors.textMuted} />
                <TextInput value={materialFilter} onChangeText={setMaterialFilter} placeholder="ابحث باسم الخامة..." placeholderTextColor={Colors.textMuted} style={styles.advTextInput} textAlign="right" />
              </View>
              {materials.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.base }}>
                  <View style={{ flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: 2 }}>
                    {materials.map(m => (
                      <Pressable key={m.id} onPress={() => setMaterialFilter(materialFilter === m.name ? '' : m.name)} style={[styles.matChip, materialFilter === m.name && styles.matChipActive]}>
                        <View style={[styles.matDot, { backgroundColor: m.color || Colors.primary }]} />
                        <Text style={[styles.matChipText, materialFilter === m.name && styles.matChipTextActive]}>{m.name}</Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              ) : null}

              <Text style={styles.advSectionLabel}>الترتيب</Text>
              <View style={styles.sortGrid}>
                {SORT_OPTIONS.map(s => (
                  <Pressable key={s.key} onPress={() => setSortKey(s.key)} style={[styles.sortGridItem, sortKey === s.key && styles.sortGridItemActive]}>
                    <Text style={[styles.sortGridText, sortKey === s.key && styles.sortGridTextActive]}>{s.label}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.advSectionLabel}>الحالة</Text>
              <View style={styles.availAdvRow}>
                {([{ key: 'all', label: 'الكل', icon: 'apps' }, { key: 'available', label: 'متاح للبيع', icon: 'check-circle' }, { key: 'sold', label: 'مباع', icon: 'cancel' }] as { key: AvailFilter; label: string; icon: any }[]).map(f => (
                  <Pressable key={f.key} onPress={() => setAvailFilter(f.key)} style={[styles.availAdvBtn, availFilter === f.key && styles.availAdvBtnActive]}>
                    <MaterialIcons name={f.icon} size={18} color={availFilter === f.key ? Colors.primary : Colors.textMuted} />
                    <Text style={[styles.availAdvText, availFilter === f.key && styles.availAdvTextActive]}>{f.label}</Text>
                  </Pressable>
                ))}
              </View>

              <Pressable onPress={() => setShowAdvanced(false)} style={styles.applyBtn}>
                <Text style={styles.applyBtnText}>تطبيق ({filtered.length} نتيجة)</Text>
              </Pressable>
            </ScrollView>
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
    paddingHorizontal: pagePadding, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { fontSize: isTablet ? FontSize.xxl : FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  addBtn: {
    width: isTablet ? 48 : 40, height: isTablet ? 48 : 40,
    borderRadius: isTablet ? 24 : 20,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  addBtnDisabled: {
    width: isTablet ? 48 : 40, height: isTablet ? 48 : 40,
    borderRadius: isTablet ? 24 : 20,
    backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: pagePadding, paddingVertical: Spacing.sm, gap: Spacing.sm,
  },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, paddingVertical: Spacing.md, fontSize: FontSize.base, color: Colors.textPrimary, marginRight: Spacing.sm },
  advancedBtn: {
    width: 44, height: 44, borderRadius: Radius.md,
    backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border, position: 'relative',
  },
  advancedBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primarySurface },
  filterDot: { position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.primary },
  filterOuter: { height: 50 },
  filterContent: { paddingHorizontal: pagePadding, gap: Spacing.sm, alignItems: 'center' },
  filterChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border },
  filterChipActive: { backgroundColor: Colors.primarySurface, borderColor: Colors.primary },
  filterChipText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  filterChipTextActive: { color: Colors.primary },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: pagePadding, paddingBottom: Spacing.xs },
  availGroup: { flexDirection: 'row', gap: Spacing.xs },
  availBtn: { paddingHorizontal: Spacing.md, paddingVertical: 5, borderRadius: Radius.full, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border },
  availBtnActive: { backgroundColor: Colors.primarySurface, borderColor: Colors.primary },
  availBtnText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.medium },
  availBtnTextActive: { color: Colors.primary, fontWeight: FontWeight.bold },
  miniStats: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  miniStatText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.medium },
  miniStatSep: { fontSize: FontSize.xs, color: Colors.textMuted },
  sortOuter: { height: 44 },
  sortContent: { paddingHorizontal: pagePadding, gap: Spacing.sm, alignItems: 'center' },
  sortChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 5, borderRadius: Radius.full, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border },
  sortChipActive: { borderColor: Colors.primary },
  sortChipText: { fontSize: FontSize.xs, color: Colors.textMuted },
  sortChipTextActive: { color: Colors.primary, fontWeight: FontWeight.semibold },
  listContent: { padding: pagePadding, paddingTop: Spacing.sm },
  columnWrapper: { gap: Spacing.md },
  colItem: { flex: 1 },
  // Advanced modal
  advOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  advSheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl,
    maxHeight: '92%', overflow: 'hidden',
    ...(isTablet ? { marginHorizontal: 60 } : {}),
  },
  advHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginTop: Spacing.md },
  advHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  advTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  advCloseBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  clearBtn: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.error + '80', backgroundColor: Colors.errorSurface },
  clearBtnText: { fontSize: FontSize.xs, color: Colors.error, fontWeight: FontWeight.semibold },
  advContent: { padding: Spacing.base, paddingBottom: Spacing.xl * 2 },
  advSectionLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textSecondary, textAlign: 'right', marginBottom: Spacing.sm, marginTop: Spacing.md },
  rangeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  rangeInput: { flex: 1, backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  rangeHint: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right', marginBottom: 2 },
  rangeTextInput: { fontSize: FontSize.base, color: Colors.textPrimary, padding: 0 },
  advInputWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm },
  advTextInput: { flex: 1, paddingVertical: Spacing.md, fontSize: FontSize.base, color: Colors.textPrimary },
  matChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border },
  matChipActive: { backgroundColor: Colors.primarySurface, borderColor: Colors.primary },
  matDot: { width: 8, height: 8, borderRadius: 4 },
  matChipText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  matChipTextActive: { color: Colors.primary, fontWeight: FontWeight.semibold },
  sortGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  sortGridItem: { paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.md, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border },
  sortGridItemActive: { backgroundColor: Colors.primarySurface, borderColor: Colors.primary },
  sortGridText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  sortGridTextActive: { color: Colors.primary, fontWeight: FontWeight.bold },
  availAdvRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.base },
  availAdvBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing.md, borderRadius: Radius.md, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border },
  availAdvBtnActive: { backgroundColor: Colors.primarySurface, borderColor: Colors.primary },
  availAdvText: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: FontWeight.medium },
  availAdvTextActive: { color: Colors.primary, fontWeight: FontWeight.bold },
  applyBtn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: Spacing.base, alignItems: 'center', marginTop: Spacing.md },
  applyBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#0d0d0f' },
});
