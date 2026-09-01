// Powered by OnSpace.AI
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { Customer } from '@/contexts/AppContext';

interface CustomerCardProps {
  customer: Customer;
  quotesCount: number;
  onEdit: () => void;
  onDelete: () => void;
  onNewQuote: () => void;
}

export function CustomerCard({ customer, quotesCount, onEdit, onDelete, onNewQuote }: CustomerCardProps) {
  const initials = customer.name.split(' ').slice(0, 2).map(n => n[0]).join('');

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>{initials}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{customer.name}</Text>
          <Text style={styles.phone}>{customer.phone}</Text>
          {customer.email ? <Text style={styles.email} numberOfLines={1}>{customer.email}</Text> : null}
        </View>
      </View>
      {customer.address ? (
        <View style={styles.addressRow}>
          <MaterialIcons name="location-on" size={14} color={Colors.textMuted} />
          <Text style={styles.address} numberOfLines={1}>{customer.address}</Text>
        </View>
      ) : null}
      {customer.notes ? (
        <Text style={styles.notes} numberOfLines={2}>{customer.notes}</Text>
      ) : null}
      <View style={styles.footer}>
        <View style={styles.quotesCount}>
          <MaterialIcons name="description" size={14} color={Colors.primary} />
          <Text style={styles.quotesText}>{quotesCount} عرض سعر</Text>
        </View>
        <View style={styles.actions}>
          <Pressable onPress={onNewQuote} style={styles.quoteBtn} hitSlop={8}>
            <MaterialIcons name="add-circle-outline" size={16} color={Colors.success} />
            <Text style={[styles.actionText, { color: Colors.success }]}>عرض سعر</Text>
          </Pressable>
          <Pressable onPress={onEdit} style={styles.actionBtn} hitSlop={8}>
            <MaterialIcons name="edit" size={16} color={Colors.primary} />
          </Pressable>
          <Pressable onPress={onDelete} style={styles.actionBtn} hitSlop={8}>
            <MaterialIcons name="delete-outline" size={16} color={Colors.error} />
          </Pressable>
        </View>
      </View>
    </View>
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
  header: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primarySurface,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  info: { flex: 1, alignItems: 'flex-end' },
  name: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  phone: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: 2,
  },
  email: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'right',
    marginTop: 1,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.sm,
    justifyContent: 'flex-end',
  },
  address: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    flex: 1,
    textAlign: 'right',
  },
  notes: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'right',
    lineHeight: 20,
    marginBottom: Spacing.sm,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  quotesCount: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  quotesText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.medium },
  actions: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  quoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.successSurface,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
});
