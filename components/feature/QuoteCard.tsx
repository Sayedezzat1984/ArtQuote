// Powered by OnSpace.AI
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { Badge } from '@/components/ui/Badge';
import { Quote } from '@/contexts/AppContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuoteCardProps {
  quote: Quote;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const statusConfig: Record<Quote['status'], { label: string; variant: 'primary' | 'warning' | 'success' | 'error' }> = {
  draft: { label: 'مسودة', variant: 'default' as any },
  sent: { label: 'مُرسل', variant: 'primary' },
  accepted: { label: 'مقبول', variant: 'success' },
  rejected: { label: 'مرفوض', variant: 'error' },
};

export function QuoteCard({ quote, onPress, onEdit, onDelete }: QuoteCardProps) {
  const { currency, t } = useLanguage();
  const status = statusConfig[quote.status];
  const date = new Date(quote.createdAt).toLocaleDateString();

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Badge label={status.label} variant={status.variant} />
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.quoteNum}>{quote.quoteNumber}</Text>
          <Text style={styles.date}>{date}</Text>
        </View>
      </View>
      <View style={styles.separator} />
      <View style={styles.customerRow}>
        <MaterialIcons name="person" size={16} color={Colors.textMuted} />
        <Text style={styles.customerName}>{quote.customerName}</Text>
      </View>
      <View style={styles.itemsPreview}>
        {quote.items.slice(0, 2).map((item, i) => (
          <View key={i} style={styles.item}>
            <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.itemPrice}>{(item.price * item.quantity).toLocaleString()} {currency}</Text>
          </View>
        ))}
        {quote.items.length > 2 ? (
          <Text style={styles.moreItems}>+{quote.items.length - 2} منتجات أخرى</Text>
        ) : null}
      </View>
      <View style={styles.footer}>
        <View style={styles.actions}>
          <Pressable onPress={onEdit} style={styles.actionBtn} hitSlop={8}>
            <MaterialIcons name="edit" size={16} color={Colors.primary} />
          </Pressable>
          <Pressable onPress={onDelete} style={[styles.actionBtn, styles.deleteBtn]} hitSlop={8}>
            <MaterialIcons name="delete-outline" size={16} color={Colors.error} />
          </Pressable>
        </View>
        <View>
          <Text style={styles.totalLabel}>الإجمالي</Text>
          <Text style={styles.total}>{quote.total.toLocaleString()} {currency}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  headerLeft: {},
  headerRight: { alignItems: 'flex-end' },
  quoteNum: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  date: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  separator: { height: 1, backgroundColor: Colors.border, marginBottom: Spacing.md },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
    justifyContent: 'flex-end',
  },
  customerName: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  itemsPreview: { gap: Spacing.xs, marginBottom: Spacing.md },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    padding: Spacing.sm,
    borderRadius: Radius.sm,
  },
  itemTitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
    textAlign: 'right',
  },
  itemPrice: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
    marginLeft: Spacing.sm,
  },
  moreItems: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: { backgroundColor: Colors.errorSurface },
  totalLabel: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right', marginBottom: 2 },
  total: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    textAlign: 'right',
  },
});
