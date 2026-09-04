// Powered by OnSpace.AI
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { useAlert } from '@/template';
import { useLanguage } from '@/contexts/LanguageContext';
import { QuoteCard, QuoteFormModal, QuoteDetailModal, EmptyState } from '@/components';
import { Quote } from '@/contexts/AppContext';
import { isTablet, pagePadding } from '@/constants/responsive';
import { useAuth } from '@/contexts/AuthContext';

export default function QuotesScreen() {
  const { quotes, customers, artworks, addQuote, updateQuote, deleteQuote } = useApp();
  const { showAlert } = useAlert();
  const { t, currency } = useLanguage();
  const { isAdmin } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [detailQuote, setDetailQuote] = useState<Quote | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Quote['status']>('all');

  const STATUS_FILTERS: { key: 'all' | Quote['status']; label: string }[] = [
    { key: 'all', label: t('all') },
    { key: 'draft', label: t('statusDraft') },
    { key: 'sent', label: t('statusSent') },
    { key: 'accepted', label: t('statusAccepted') },
    { key: 'rejected', label: t('statusRejected') },
  ];

  const filtered = quotes.filter(q => {
    const matchSearch = !search || q.customerName.includes(search) || q.quoteNumber.includes(search);
    const matchStatus = statusFilter === 'all' || q.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalAccepted = quotes.filter(q => q.status === 'accepted').reduce((s, q) => s + q.total, 0);
  const totalPending = quotes.filter(q => q.status === 'sent').reduce((s, q) => s + q.total, 0);

  function handleDelete(q: Quote) {
    showAlert(`${t('delete')}`, `هل أنت متأكد من حذف "${q.quoteNumber}"؟`, [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: () => { deleteQuote(q.id); setDetailQuote(null); } },
    ]);
  }

  function handleEdit(q: Quote) {
    setDetailQuote(null);
    setTimeout(() => { setEditingQuote(q); setShowForm(true); }, 350);
  }

  const cols = isTablet ? 2 : 1;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        {isAdmin ? (
          <Pressable onPress={() => { setEditingQuote(null); setShowForm(true); }} style={styles.addBtn}>
            <MaterialIcons name="add" size={22} color={Colors.textOnPrimary} />
          </Pressable>
        ) : (
          <View style={[styles.addBtn, { backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border }]}>
            <MaterialIcons name="lock" size={18} color={Colors.textMuted} />
          </View>
        )}
        <Text style={styles.title}>{t('priceQuotes')}</Text>
      </View>
      {!isAdmin ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.infoSurface, paddingHorizontal: pagePadding, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.info + '30', justifyContent: 'center' }}>
          <MaterialIcons name="visibility" size={14} color={Colors.info} />
          <Text style={{ fontSize: FontSize.xs, color: Colors.info, fontWeight: FontWeight.medium }}>وضع العرض فقط — عروض الأسعار خاصة بالمشرف</Text>
        </View>
      ) : null}

      {/* Revenue Summary */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { borderColor: Colors.success + '50' }]}>
          <Text style={[styles.summaryValue, { color: Colors.success }]}>{totalAccepted.toLocaleString()}</Text>
          <Text style={styles.summaryLabel}>{t('acceptedAmtLabel')} ({currency})</Text>
        </View>
        <View style={[styles.summaryCard, { borderColor: Colors.primary + '50' }]}>
          <Text style={[styles.summaryValue, { color: Colors.primary }]}>{totalPending.toLocaleString()}</Text>
          <Text style={styles.summaryLabel}>{t('pendingAmtLabel')} ({currency})</Text>
        </View>
        <View style={[styles.summaryCard, { borderColor: Colors.border }]}>
          <Text style={styles.summaryValue}>{quotes.length}</Text>
          <Text style={styles.summaryLabel}>{t('totalQuotes')}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <MaterialIcons name="search" size={20} color={Colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={`${t('searchCustomer')}`}
          placeholderTextColor={Colors.textMuted}
          style={styles.searchInput}
          textAlign="right"
        />
      </View>

      {/* Status Filter */}
      <View style={styles.filterOuter}>
        <FlatList
          data={STATUS_FILTERS}
          horizontal
          keyExtractor={i => i.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setStatusFilter(item.key)}
              style={[styles.filterChip, statusFilter === item.key && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, statusFilter === item.key && styles.filterChipTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          )}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={q => q.id}
        numColumns={cols}
        key={`cols-${cols}`}
        columnWrapperStyle={cols > 1 ? styles.columnWrapper : undefined}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState icon="description" title={t('priceQuotes')} subtitle="اضغط على + لإنشاء أول عرض سعر" />
        }
        renderItem={({ item }) => (
          <View style={[styles.cardWrapper, cols > 1 && styles.colItem]}>
            <Pressable onPress={() => setDetailQuote(item)}>
              <QuoteCard
                quote={item}
                onPress={() => setDetailQuote(item)}
                onEdit={isAdmin ? () => handleEdit(item) : undefined}
                onDelete={isAdmin ? () => handleDelete(item) : undefined}
              />
            </Pressable>
            {/* Quick status chips — Admin only */}
            {isAdmin ? (
              <View style={styles.quickStatusRow}>
                {(['draft', 'sent', 'accepted', 'rejected'] as Quote['status'][]).filter(s => s !== item.status).map(s => {
                  const labels: Record<Quote['status'], string> = { draft: t('statusDraft'), sent: t('statusSent'), accepted: t('statusAccepted'), rejected: t('statusRejected') };
                  return (
                    <Pressable key={s} onPress={() => updateQuote(item.id, { status: s })} style={styles.quickStatusBtn}>
                      <Text style={styles.quickStatusText}>{labels[s]}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>
        )}
      />

      {isAdmin ? (
        <QuoteFormModal
          visible={showForm}
          quote={editingQuote}
          customers={customers}
          artworks={artworks}
          onSave={data => {
            if (editingQuote) updateQuote(editingQuote.id, data);
            else addQuote(data);
            setShowForm(false); setEditingQuote(null);
          }}
          onClose={() => { setShowForm(false); setEditingQuote(null); }}
        />
      ) : null}

      <QuoteDetailModal
        visible={detailQuote !== null}
        quote={detailQuote}
        artworks={artworks}
        customers={customers}
        onClose={() => setDetailQuote(null)}
        onEdit={isAdmin ? () => detailQuote && handleEdit(detailQuote) : undefined}
        onDelete={isAdmin ? () => detailQuote && handleDelete(detailQuote) : undefined}
      />
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
  summaryRow: { flexDirection: 'row', gap: Spacing.sm, padding: pagePadding, paddingBottom: Spacing.sm },
  summaryCard: { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.md, padding: isTablet ? Spacing.base : Spacing.sm, alignItems: 'center', borderWidth: 1 },
  summaryValue: { fontSize: isTablet ? FontSize.lg : FontSize.md, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  summaryLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2, textAlign: 'center' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, marginHorizontal: pagePadding,
    marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, paddingVertical: Spacing.md, fontSize: FontSize.base, color: Colors.textPrimary, marginRight: Spacing.sm },
  filterOuter: { height: 50 },
  filterContent: { paddingHorizontal: pagePadding, gap: Spacing.sm, alignItems: 'center' },
  filterChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border },
  filterChipActive: { backgroundColor: Colors.primarySurface, borderColor: Colors.primary },
  filterChipText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  filterChipTextActive: { color: Colors.primary },
  listContent: { padding: pagePadding, paddingTop: Spacing.sm },
  columnWrapper: { gap: Spacing.md },
  colItem: { flex: 1 },
  cardWrapper: { marginBottom: Spacing.xs },
  quickStatusRow: {
    flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap',
    paddingHorizontal: Spacing.sm, paddingBottom: Spacing.md,
    justifyContent: 'flex-end', marginTop: -Spacing.sm,
  },
  quickStatusBtn: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 5, borderWidth: 1, borderColor: Colors.border },
  quickStatusText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.semibold },
});
