// Powered by OnSpace.AI
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { useAlert } from '@/template';
import { useLanguage } from '@/contexts/LanguageContext';
import { CustomerCard, CustomerFormModal, QuoteFormModal, EmptyState } from '@/components';
import { Customer } from '@/contexts/AppContext';

export default function CustomersScreen() {
  const { customers, artworks, quotes, addCustomer, updateCustomer, deleteCustomer, addQuote } = useApp();
  const { showAlert } = useAlert();
  const { t } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [quoteCustomer, setQuoteCustomer] = useState<Customer | null>(null);
  const [search, setSearch] = useState('');

  const filtered = customers.filter(c =>
    !search || c.name.includes(search) || c.phone.includes(search) || c.email.includes(search)
  );

  function handleEdit(c: Customer) { setEditingCustomer(c); setShowForm(true); }

  function handleDelete(c: Customer) {
    showAlert(`${t('delete')}`, `هل أنت متأكد من حذف "${c.name}"؟`, [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: () => deleteCustomer(c.id) },
    ]);
  }

  function handleNewQuote(c: Customer) { setQuoteCustomer(c); setShowQuoteForm(true); }

  function getQuotesCount(cId: string) { return quotes.filter(q => q.customerId === cId).length; }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => { setEditingCustomer(null); setShowForm(true); }} style={styles.addBtn}>
          <MaterialIcons name="add" size={22} color={Colors.textOnPrimary} />
        </Pressable>
        <Text style={styles.title}>{t('customerDatabase')}</Text>
      </View>

      <View style={styles.searchBar}>
        <MaterialIcons name="search" size={20} color={Colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t('searchCustomer')}
          placeholderTextColor={Colors.textMuted}
          style={styles.searchInput}
          textAlign="right"
        />
      </View>

      <View style={styles.statsBar}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{quotes.filter(q => q.status === 'accepted').length}</Text>
          <Text style={styles.statLabel}>{t('acceptedDeals')}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{quotes.filter(q => q.status === 'sent').length}</Text>
          <Text style={styles.statLabel}>{t('pendingOffers')}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{customers.length}</Text>
          <Text style={styles.statLabel}>{t('totalCustomers')}</Text>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={c => c.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState icon="people" title={t('customerDatabase')} subtitle="اضغط على + لإضافة أول عميل" />
        }
        renderItem={({ item }) => (
          <CustomerCard
            customer={item}
            quotesCount={getQuotesCount(item.id)}
            onEdit={() => handleEdit(item)}
            onDelete={() => handleDelete(item)}
            onNewQuote={() => handleNewQuote(item)}
          />
        )}
      />

      <CustomerFormModal
        visible={showForm}
        customer={editingCustomer}
        onSave={data => {
          if (editingCustomer) updateCustomer(editingCustomer.id, data);
          else addCustomer(data);
          setShowForm(false); setEditingCustomer(null);
        }}
        onClose={() => { setShowForm(false); setEditingCustomer(null); }}
      />

      <QuoteFormModal
        visible={showQuoteForm}
        customers={customers}
        artworks={artworks}
        preSelectedCustomer={quoteCustomer}
        onSave={data => { addQuote(data); setShowQuoteForm(false); setQuoteCustomer(null); }}
        onClose={() => { setShowQuoteForm(false); setQuoteCustomer(null); }}
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
  statsBar: {
    flexDirection: 'row', backgroundColor: Colors.card,
    marginHorizontal: Spacing.base, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.base,
    borderWidth: 1, borderColor: Colors.border,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.primary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.border, marginVertical: Spacing.xs },
  listContent: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.base },
});
