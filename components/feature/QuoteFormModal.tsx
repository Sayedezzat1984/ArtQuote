// Powered by OnSpace.AI
import React, { useState, useEffect } from 'react';
import { View, Text, Modal, ScrollView, StyleSheet, Pressable, Alert, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { globalStyles } from '@/constants/styles';
import { Quote, QuoteItem, Customer, Artwork } from '@/contexts/AppContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuoteFormModalProps {
  visible: boolean;
  quote?: Quote | null;
  customers: Customer[];
  artworks: Artwork[];
  preSelectedCustomer?: Customer | null;
  onSave: (data: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt'>) => void;
  onClose: () => void;
}

const STATUS_OPTIONS: { value: Quote['status']; label: string }[] = [
  { value: 'draft', label: 'مسودة' },
  { value: 'sent', label: 'مُرسل' },
  { value: 'accepted', label: 'مقبول' },
  { value: 'rejected', label: 'مرفوض' },
];

export function QuoteFormModal({ visible, quote, customers, artworks, preSelectedCustomer, onSave, onClose }: QuoteFormModalProps) {
  const { currency, t } = useLanguage();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [discount, setDiscount] = useState('0');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<Quote['status']>('draft');
  const [validUntil, setValidUntil] = useState('');
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showArtworkPicker, setShowArtworkPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const discountAmt = Math.min(Number(discount) || 0, subtotal);
  const total = subtotal - discountAmt;

  useEffect(() => {
    if (quote) {
      const cust = customers.find(c => c.id === quote.customerId) || null;
      setSelectedCustomer(cust);
      setItems(quote.items);
      setDiscount(quote.discount.toString());
      setNotes(quote.notes);
      setStatus(quote.status);
      setValidUntil(quote.validUntil ? new Date(quote.validUntil).toLocaleDateString('ar-SA') : '');
    } else {
      setSelectedCustomer(preSelectedCustomer || null);
      setItems([]);
      setDiscount('0');
      setNotes('');
      setStatus('draft');
      const d = new Date(); d.setDate(d.getDate() + 30);
      setValidUntil(d.toLocaleDateString('ar-SA'));
    }
  }, [quote, visible, preSelectedCustomer, customers]);

  function addArtwork(artwork: Artwork) {
    const existing = items.find(i => i.artworkId === artwork.id);
    if (existing) {
      setItems(items.map(i => i.artworkId === artwork.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setItems([...items, { artworkId: artwork.id, title: artwork.title, price: artwork.price, quantity: 1 }]);
    }
    setShowArtworkPicker(false);
  }

  function updateQty(artworkId: string, qty: number) {
    if (qty <= 0) { setItems(items.filter(i => i.artworkId !== artworkId)); return; }
    setItems(items.map(i => i.artworkId === artworkId ? { ...i, quantity: qty } : i));
  }

  function updatePrice(artworkId: string, priceStr: string) {
    const p = Number(priceStr);
    if (!isNaN(p) && p >= 0) setItems(items.map(i => i.artworkId === artworkId ? { ...i, price: p } : i));
  }

  function handleSave() {
    if (!selectedCustomer) { Alert.alert('خطأ', 'يرجى اختيار العميل'); return; }
    if (items.length === 0) { Alert.alert('خطأ', 'يرجى إضافة منتج واحد على الأقل'); return; }
    setLoading(true);
    setTimeout(() => {
      onSave({
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        items, subtotal,
        discount: discountAmt,
        total,
        status,
        notes: notes.trim(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
      setLoading(false);
    }, 300);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={globalStyles.overlay}>
        <View style={[globalStyles.modalSheet, { maxHeight: '98%' }]}>
          <View style={globalStyles.modalHandle} />
          <Text style={globalStyles.modalTitle}>{quote ? 'تعديل عرض السعر' : 'عرض سعر جديد'}</Text>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* Customer */}
            <Text style={styles.sectionLabel}>العميل *</Text>
            <Pressable onPress={() => setShowCustomerPicker(true)} style={styles.pickerBtn}>
              {selectedCustomer ? (
                <View style={styles.selectedCustomer}>
                  <View>
                    <Text style={styles.selectedName}>{selectedCustomer.name}</Text>
                    <Text style={styles.selectedPhone}>{selectedCustomer.phone}</Text>
                  </View>
                  <MaterialIcons name="swap-horiz" size={20} color={Colors.primary} />
                </View>
              ) : (
                <View style={styles.pickerPlaceholder}>
                  <MaterialIcons name="person-add" size={20} color={Colors.primary} />
                  <Text style={styles.pickerPlaceholderText}>اختر العميل</Text>
                </View>
              )}
            </Pressable>

            {/* Items */}
            <View style={styles.itemsHeader}>
              <Button title="+ إضافة منتج" onPress={() => setShowArtworkPicker(true)} size="sm" />
              <Text style={styles.sectionLabel}>المنتجات</Text>
            </View>

            {items.map(item => (
              <View key={item.artworkId} style={styles.itemCard}>
                <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                <View style={styles.itemControls}>
                  <View style={styles.qtyControl}>
                    <Pressable onPress={() => updateQty(item.artworkId, item.quantity - 1)} style={styles.qtyBtn}>
                      <MaterialIcons name="remove" size={16} color={Colors.textPrimary} />
                    </Pressable>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <Pressable onPress={() => updateQty(item.artworkId, item.quantity + 1)} style={styles.qtyBtn}>
                      <MaterialIcons name="add" size={16} color={Colors.textPrimary} />
                    </Pressable>
                  </View>
                  <Input
                    value={item.price.toString()}
                    onChangeText={v => updatePrice(item.artworkId, v)}
                    keyboardType="numeric"
                    containerStyle={styles.priceInput}
                  />
                  <Pressable onPress={() => updateQty(item.artworkId, 0)} hitSlop={8}>
                    <MaterialIcons name="close" size={18} color={Colors.error} />
                  </Pressable>
                </View>
                <Text style={styles.itemSubtotal}>{t('total')}: {(item.price * item.quantity).toLocaleString()} {currency}</Text>
              </View>
            ))}

            {items.length === 0 ? (
              <View style={styles.emptyItems}>
                <MaterialIcons name="shopping-cart" size={24} color={Colors.textMuted} />
                <Text style={styles.emptyItemsText}>لم تضف أي منتجات بعد</Text>
              </View>
            ) : null}

            {/* Totals */}
            <View style={styles.totalsCard}>
              <View style={styles.totalRow}>
                <Text style={styles.totalValue}>{subtotal.toLocaleString()} {currency}</Text>
                <Text style={styles.totalLabel}>المجموع الفرعي</Text>
              </View>
              <View style={styles.discountRow}>
                <Input
                  value={discount}
                  onChangeText={setDiscount}
                  keyboardType="numeric"
                  containerStyle={styles.discountInput}
                  placeholder="0"
                />
                <Text style={styles.totalLabel}>{t('discount')} ({currency})</Text>
              </View>
              <View style={[styles.totalRow, styles.grandTotal]}>
                <Text style={styles.grandTotalValue}>{total.toLocaleString()} {currency}</Text>
                <Text style={styles.grandTotalLabel}>الإجمالي النهائي</Text>
              </View>
            </View>

            {/* Status */}
            <Text style={styles.sectionLabel}>حالة العرض</Text>
            <View style={styles.statusRow}>
              {STATUS_OPTIONS.map(s => (
                <Pressable key={s.value} onPress={() => setStatus(s.value)} style={[styles.statusBtn, status === s.value && styles.statusBtnActive]}>
                  <Text style={[styles.statusBtnText, status === s.value && styles.statusBtnTextActive]}>{s.label}</Text>
                </Pressable>
              ))}
            </View>

            <Input label="ملاحظات" value={notes} onChangeText={setNotes} placeholder="شروط الدفع، التوصيل، إلخ..." multiline numberOfLines={3} />

            <View style={styles.btnRow}>
              <Button title="إلغاء" onPress={onClose} variant="ghost" style={styles.halfBtn} />
              <Button title={quote ? 'حفظ التعديلات' : 'إنشاء العرض'} onPress={handleSave} loading={loading} style={styles.halfBtn} />
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Customer Picker */}
      <Modal visible={showCustomerPicker} transparent animationType="slide" onRequestClose={() => setShowCustomerPicker(false)}>
        <View style={globalStyles.overlay}>
          <View style={globalStyles.modalSheet}>
            <View style={globalStyles.modalHandle} />
            <Text style={globalStyles.modalTitle}>اختر العميل</Text>
            <FlatList
              data={customers}
              keyExtractor={c => c.id}
              renderItem={({ item }) => (
                <Pressable onPress={() => { setSelectedCustomer(item); setShowCustomerPicker(false); }} style={styles.customerPickerItem}>
                  <Text style={styles.customerPickerName}>{item.name}</Text>
                  <Text style={styles.customerPickerPhone}>{item.phone}</Text>
                </Pressable>
              )}
              style={{ maxHeight: 400 }}
            />
          </View>
        </View>
      </Modal>

      {/* Artwork Picker */}
      <Modal visible={showArtworkPicker} transparent animationType="slide" onRequestClose={() => setShowArtworkPicker(false)}>
        <View style={globalStyles.overlay}>
          <View style={globalStyles.modalSheet}>
            <View style={globalStyles.modalHandle} />
            <Text style={globalStyles.modalTitle}>اختر العمل الفني</Text>
            <FlatList
              data={artworks}
              keyExtractor={a => a.id}
              renderItem={({ item }) => (
                <Pressable onPress={() => addArtwork(item)} style={styles.artworkPickerItem}>
                  <View style={styles.artworkPickerInfo}>
                    <Badge label={item.available ? 'متاح' : 'مباع'} variant={item.available ? 'success' : 'error'} />
                    <Text style={styles.artworkPickerTitle} numberOfLines={1}>{item.title}</Text>
                  </View>
                  <Text style={styles.artworkPickerPrice}>{item.price.toLocaleString()} {currency}</Text>
                </Pressable>
              )}
              style={{ maxHeight: 400 }}
            />
          </View>
        </View>
      </Modal>
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
  },
  pickerBtn: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.base,
  },
  selectedCustomer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedName: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'right' },
  selectedPhone: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'right' },
  pickerPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    justifyContent: 'flex-end',
  },
  pickerPlaceholderText: { fontSize: FontSize.base, color: Colors.primary },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  itemCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary, textAlign: 'right', marginBottom: Spacing.sm },
  itemControls: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, justifyContent: 'flex-end', marginBottom: Spacing.xs },
  qtyControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.sm, overflow: 'hidden' },
  qtyBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surfaceHighlight },
  qtyText: { paddingHorizontal: Spacing.sm, fontSize: FontSize.base, color: Colors.textPrimary, fontWeight: FontWeight.bold },
  priceInput: { width: 90, marginBottom: 0 },
  itemSubtotal: { fontSize: FontSize.xs, color: Colors.primary, textAlign: 'right', fontWeight: FontWeight.medium },
  emptyItems: {
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    marginBottom: Spacing.base,
  },
  emptyItemsText: { fontSize: FontSize.sm, color: Colors.textMuted },
  totalsCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  totalValue: { fontSize: FontSize.base, color: Colors.textPrimary, fontWeight: FontWeight.medium },
  discountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  discountInput: { width: 100, marginBottom: 0 },
  grandTotal: {
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  grandTotalLabel: { fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: FontWeight.semibold },
  grandTotalValue: { fontSize: FontSize.xl, color: Colors.primary, fontWeight: FontWeight.bold },
  statusRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.base, flexWrap: 'wrap', justifyContent: 'flex-end' },
  statusBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusBtnActive: { backgroundColor: Colors.primarySurface, borderColor: Colors.primary },
  statusBtnText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  statusBtnTextActive: { color: Colors.primary },
  btnRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.base },
  halfBtn: { flex: 1 },
  customerPickerItem: {
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  customerPickerName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary, textAlign: 'right' },
  customerPickerPhone: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'right' },
  artworkPickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  artworkPickerInfo: { flexDirection: 'column', alignItems: 'flex-end', gap: 4, flex: 1 },
  artworkPickerTitle: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary, textAlign: 'right' },
  artworkPickerPrice: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.primary, marginLeft: Spacing.md },
});
