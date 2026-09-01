// Powered by OnSpace.AI
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { useAlert } from '@/template';
import { useLanguage } from '@/contexts/LanguageContext';
import { QuoteCard, QuoteFormModal, EmptyState, ExportModal } from '@/components';
import { Quote } from '@/contexts/AppContext';

export default function QuotesScreen() {
  const { quotes, customers, artworks, addQuote, updateQuote, deleteQuote } = useApp();
  const { showAlert } = useAlert();
  const { t, currency } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [exportQuote, setExportQuote] = useState<Quote | null>(null);
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

  function handleShare(q: Quote) {
    const text = `${t('priceQuotes')}: ${q.quoteNumber}\n${t('customer')}: ${q.customerName}\n\n${q.items.map(i => `• ${i.title}: ${(i.price * i.quantity).toLocaleString()} ${currency}`).join('\n')}\n\n${t('grandTotal')}: ${q.total.toLocaleString()} ${currency}${q.notes ? `\n\n${t('notes')}: ${q.notes}` : ''}`;
    Share.share({ message: text, title: q.quoteNumber });
  }

  function handleDelete(q: Quote) {
    showAlert(`${t('delete')}`, `هل أنت متأكد من حذف "${q.quoteNumber}"؟`, [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: () => deleteQuote(q.id) },
    ]);
  }

  const statusChangeBtns: { s: Quote['status']; label: string }[] = [
    { s: 'draft', label: t('statusDraft') },
    { s: 'sent', label: t('statusSent') },
    { s: 'accepted', label: t('statusAccepted') },
    { s: 'rejected', label: t('statusRejected') },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => { setEditingQuote(null); setShowForm(true); }} style={styles.addBtn}>
          <MaterialIcons name="add" size={22} color={Colors.textOnPrimary} />
        </Pressable>
        <Text style={styles.title}>{t('priceQuotes')}</Text>
      </View>

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
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState icon="description" title={t('priceQuotes')} subtitle="اضغط على + لإنشاء أول عرض سعر" />
        }
        renderItem={({ item }) => (
          <View>
            <QuoteCard
              quote={item}
              onPress={() => {}}
              onEdit={() => { setEditingQuote(item); setShowForm(true); }}
              onDelete={() => handleDelete(item)}
            />
            <View style={styles.actionRow}>
              {/* Export */}
              <Pressable onPress={() => setExportQuote(item)} style={[styles.actionBtn, styles.exportBtn]}>
                <MaterialIcons name="picture-as-pdf" size={14} color={Colors.primary} />
                <Text style={[styles.actionBtnText, { color: Colors.primary }]}>{t('export')}</Text>
              </Pressable>
              {/* Share */}
              <Pressable onPress={() => handleShare(item)} style={[styles.actionBtn, styles.shareBtn]}>
                <MaterialIcons name="share" size={14} color={Colors.info} />
                <Text style={[styles.actionBtnText, { color: Colors.info }]}>{t('share')}</Text>
              </Pressable>
              {/* Status quick change */}
              {statusChangeBtns.filter(b => b.s !== item.status).map(b => (
                <Pressable
                  key={b.s}
                  onPress={() => updateQuote(item.id, { status: b.s })}
                  style={styles.actionBtn}
                >
                  <Text style={styles.actionBtnText}>{b.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      />

      <QuoteFormModal
        visible={showForm}
        quote={editingQuote}
        customers={customers}
        artworks={artworks}
        onSave={data => {
          if (editingQuote) updateQuote(editingQuote.id, data);
          else addQuote(data);
          setShowForm(false);
          setEditingQuote(null);
        }}
        onClose={() => { setShowForm(false); setEditingQuote(null); }}
      />

      <ExportModal
        visible={exportQuote !== null}
        quote={exportQuote}
        onClose={() => setExportQuote(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  summaryRow: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.base, paddingBottom: Spacing.sm },
  summaryCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.sm, alignItems: 'center', borderWidth: 1,
  },
  summaryValue: { fontSize: FontSize.md, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  summaryLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2, textAlign: 'center' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, marginHorizontal: Spacing.base,
    marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, paddingVertical: Spacing.md, fontSize: FontSize.base, color: Colors.textPrimary, marginRight: Spacing.sm },
  filterOuter: { height: 50 },
  filterContent: { paddingHorizontal: Spacing.base, gap: Spacing.sm, alignItems: 'center' },
  filterChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.full, backgroundColor: Colors.surfaceElevated,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.primarySurface, borderColor: Colors.primary },
  filterChipText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  filterChipTextActive: { color: Colors.primary },
  listContent: { padding: Spacing.base, paddingTop: Spacing.sm },
  actionRow: {
    flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap',
    paddingHorizontal: Spacing.sm, paddingBottom: Spacing.md,
    justifyContent: 'flex-end', marginTop: -Spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.surfaceElevated, borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 5,
    borderWidth: 1, borderColor: Colors.border,
  },
  exportBtn: { backgroundColor: Colors.primarySurface, borderColor: Colors.primary + '60' },
  shareBtn: { backgroundColor: Colors.infoSurface, borderColor: Colors.info + '60' },
  actionBtnText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.semibold },
});
