// Powered by OnSpace.AI
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { useLanguage } from '@/contexts/LanguageContext';
import { BackupModal } from '@/components/feature/BackupModal';
import { QuoteDetailModal } from '@/components/feature/QuoteDetailModal';
import { Quote } from '@/contexts/AppContext';
import { isTablet, pagePadding, contentMaxWidth } from '@/constants/responsive';

export default function HomeScreen() {
  const { artworks, customers, quotes, fullMaterials, suppliers, artworkCosts, trashArtworks, trashCustomers, trashQuotes, trashMaterials, trashSuppliers } = useApp();
  const { t, currency, lang, toggleLang } = useLanguage();
  const router = useRouter();
  const [showBackup, setShowBackup] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  const totalTrashCount = (trashArtworks?.length || 0) + (trashCustomers?.length || 0) + (trashQuotes?.length || 0) + (trashMaterials?.length || 0) + (trashSuppliers?.length || 0);
  const totalRevenue = quotes.filter(q => q.status === 'accepted').reduce((s, q) => s + q.total, 0);
  const pendingQuotes = quotes.filter(q => q.status === 'sent').length;
  const availableArtworks = artworks.filter(a => a.available).length;
  const lowStockMaterials = fullMaterials.filter(m => m.currentStock <= m.minStock && m.minStock > 0).length;
  const totalInventoryValue = fullMaterials.reduce((s, m) => s + (m.unitPrice || 0) * (m.currentStock || 0), 0);
  const recentQuotes = quotes.slice(0, isTablet ? 8 : 5);
  const recentArtworks = artworks.slice(0, isTablet ? 6 : 3);

  const stats = [
    { label: t('artworks'), value: artworks.length, icon: 'palette' as const, color: Colors.primary, route: '/(tabs)/portfolio' },
    { label: t('customers'), value: customers.length, icon: 'people' as const, color: Colors.info, route: '/(tabs)/customers' },
    { label: t('tabQuotes'), value: quotes.length, icon: 'description' as const, color: Colors.success, route: '/(tabs)/quotes' },
    { label: t('availableForSale'), value: availableArtworks, icon: 'star' as const, color: Colors.warning, route: '/(tabs)/portfolio' },
    { label: t('totalMaterials'), value: fullMaterials.length, icon: 'inventory-2' as const, color: '#9C6FFF', route: '/(tabs)/materials' },
    { label: t('totalSuppliers'), value: suppliers.length, icon: 'people-outline' as const, color: '#5BAFFF', route: '/(tabs)/suppliers' },
  ];

  const statusColors: Record<string, string> = { draft: Colors.textMuted, sent: Colors.primary, accepted: Colors.success, rejected: Colors.error };
  const statusLabels: Record<string, string> = { draft: t('statusDraft'), sent: t('statusSent'), accepted: t('statusAccepted'), rejected: t('statusRejected') };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable onPress={() => setShowBackup(true)} style={styles.iconBtn}>
              <MaterialIcons name="cloud-upload" size={20} color={Colors.textSecondary} />
              {totalTrashCount > 0 ? <View style={styles.trashBadge}><Text style={styles.trashBadgeTxt}>{totalTrashCount}</Text></View> : null}
            </Pressable>
            <Pressable onPress={toggleLang} style={styles.langBtn}>
              <Text style={styles.langBtnText}>{lang === 'ar' ? 'EN' : 'ع'}</Text>
            </Pressable>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.greeting}>{t('welcome')}</Text>
            <Text style={styles.subtitle}>{t('dashboard')}</Text>
          </View>
        </View>

        {/* Revenue Card */}
        <View style={styles.revenueCard}>
          <View style={styles.revenueLeft}>
            <Text style={styles.revenueLabel}>{t('totalRevenue')}</Text>
            <Text style={styles.revenueAmount}>{totalRevenue.toLocaleString()} {currency}</Text>
            {pendingQuotes > 0 ? <Text style={styles.pendingText}>{pendingQuotes} {t('pendingWaiting')}</Text> : null}
          </View>
          <View style={styles.revenueIcon}>
            <MaterialIcons name="trending-up" size={isTablet ? 44 : 32} color={Colors.primary} />
          </View>
        </View>

        {/* Admin Stats Row */}
        {(fullMaterials.length > 0 || suppliers.length > 0) ? (
          <View style={styles.adminRow}>
            <Pressable onPress={() => router.push('/(tabs)/materials' as any)} style={styles.adminCard}>
              <View style={[styles.adminIcon, { backgroundColor: '#9C6FFF20' }]}>
                <MaterialIcons name="inventory-2" size={18} color="#9C6FFF" />
              </View>
              <Text style={[styles.adminValue, { color: '#9C6FFF' }]}>{totalInventoryValue.toLocaleString()}</Text>
              <Text style={styles.adminLabel}>قيمة المخزون</Text>
              <Text style={styles.adminCurrency}>{currency}</Text>
            </Pressable>
            {lowStockMaterials > 0 ? (
              <Pressable onPress={() => router.push('/(tabs)/materials' as any)} style={[styles.adminCard, { borderColor: Colors.error + '50' }]}>
                <View style={[styles.adminIcon, { backgroundColor: Colors.errorSurface }]}>
                  <MaterialIcons name="warning" size={18} color={Colors.error} />
                </View>
                <Text style={[styles.adminValue, { color: Colors.error }]}>{lowStockMaterials}</Text>
                <Text style={styles.adminLabel}>خامات منخفضة</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={() => router.push('/(tabs)/suppliers' as any)} style={styles.adminCard}>
              <View style={[styles.adminIcon, { backgroundColor: Colors.infoSurface }]}>
                <MaterialIcons name="people-outline" size={18} color={Colors.info} />
              </View>
              <Text style={[styles.adminValue, { color: Colors.info }]}>{suppliers.length}</Text>
              <Text style={styles.adminLabel}>موردين</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.slice(0, 4).map(stat => (
            <Pressable key={stat.label} onPress={() => router.push(stat.route as any)} style={({ pressed }) => [styles.statCard, pressed && styles.pressed]}>
              <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                <MaterialIcons name={stat.icon} size={isTablet ? 26 : 22} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>{t('quickActions')}</Text>
        <View style={styles.quickActions}>
          {[
            { label: t('newQuote'), icon: 'add-circle' as const, route: '/(tabs)/quotes', color: Colors.primary },
            { label: t('addArtwork'), icon: 'add-photo-alternate' as const, route: '/(tabs)/portfolio', color: Colors.success },
            { label: t('addMaterial'), icon: 'inventory-2' as const, route: '/(tabs)/materials', color: '#9C6FFF' },
            { label: t('addSupplier'), icon: 'person-add' as const, route: '/(tabs)/suppliers', color: Colors.info },
          ].map(action => (
            <Pressable key={action.label} onPress={() => router.push(action.route as any)} style={({ pressed }) => [styles.quickBtn, pressed && styles.pressed]}>
              <MaterialIcons name={action.icon} size={isTablet ? 28 : 22} color={action.color} />
              <Text style={styles.quickBtnText}>{action.label}</Text>
            </Pressable>
          ))}
        </View>

        {isTablet ? (
          <View style={styles.tabletTwoCol}>
            <View style={styles.tabletCol}>
              {recentQuotes.length > 0 ? (
                <>
                  <View style={styles.sectionHeader}>
                    <Pressable onPress={() => router.push('/(tabs)/quotes')}><Text style={styles.seeAll}>{t('viewAll')}</Text></Pressable>
                    <Text style={styles.sectionTitle}>{t('recentQuotes')}</Text>
                  </View>
                  {recentQuotes.map(q => (
                    <Pressable key={q.id} onPress={() => setSelectedQuote(q)} style={({ pressed }) => [styles.recentCard, pressed && styles.pressed]}>
                      <View style={styles.recentLeft}>
                        <View style={[styles.statusDot, { backgroundColor: statusColors[q.status] }]} />
                        <Text style={[styles.statusLabel, { color: statusColors[q.status] }]}>{statusLabels[q.status]}</Text>
                      </View>
                      <View style={styles.recentCenter}>
                        <Text style={styles.recentCustomer}>{q.customerName}</Text>
                        <Text style={styles.recentNum}>{q.quoteNumber}</Text>
                      </View>
                      <View style={styles.recentRight}>
                        <Text style={styles.recentTotal}>{q.total.toLocaleString()}</Text>
                        <Text style={styles.recentCurrency}>{currency}</Text>
                      </View>
                    </Pressable>
                  ))}
                </>
              ) : null}
            </View>
            <View style={styles.tabletCol}>
              {recentArtworks.length > 0 ? (
                <>
                  <View style={styles.sectionHeader}>
                    <Pressable onPress={() => router.push('/(tabs)/portfolio')}><Text style={styles.seeAll}>{t('viewAll')}</Text></Pressable>
                    <Text style={styles.sectionTitle}>{t('recentArtworks')}</Text>
                  </View>
                  {recentArtworks.map(a => (
                    <Pressable key={a.id} onPress={() => router.push('/(tabs)/portfolio')} style={styles.recentCard}>
                      <View style={[styles.availableDot, { backgroundColor: a.available ? Colors.success : Colors.error }]} />
                      <View style={styles.recentCenter}>
                        <Text style={styles.recentCustomer}>{a.title}</Text>
                        <Text style={styles.recentNum}>{a.category} · {a.year}</Text>
                      </View>
                      <View style={styles.recentRight}>
                        <Text style={styles.recentTotal}>{a.price.toLocaleString()}</Text>
                        <Text style={styles.recentCurrency}>{currency}</Text>
                      </View>
                    </Pressable>
                  ))}
                </>
              ) : null}
            </View>
          </View>
        ) : (
          <>
            {recentQuotes.length > 0 ? (
              <>
                <View style={styles.sectionHeader}>
                  <Pressable onPress={() => router.push('/(tabs)/quotes')}><Text style={styles.seeAll}>{t('viewAll')}</Text></Pressable>
                  <Text style={styles.sectionTitle}>{t('recentQuotes')}</Text>
                </View>
                {recentQuotes.map(q => (
                  <Pressable key={q.id} onPress={() => setSelectedQuote(q)} style={({ pressed }) => [styles.recentCard, pressed && styles.pressed]}>
                    <View style={styles.recentLeft}>
                      <View style={[styles.statusDot, { backgroundColor: statusColors[q.status] }]} />
                      <Text style={[styles.statusLabel, { color: statusColors[q.status] }]}>{statusLabels[q.status]}</Text>
                    </View>
                    <View style={styles.recentCenter}>
                      <Text style={styles.recentCustomer}>{q.customerName}</Text>
                      <Text style={styles.recentNum}>{q.quoteNumber} · {q.items.length} {lang === 'ar' ? 'منتج' : 'items'}</Text>
                    </View>
                    <View style={styles.recentRight}>
                      <Text style={styles.recentTotal}>{q.total.toLocaleString()}</Text>
                      <Text style={styles.recentCurrency}>{currency}</Text>
                    </View>
                  </Pressable>
                ))}
              </>
            ) : null}
            {recentArtworks.length > 0 ? (
              <>
                <View style={styles.sectionHeader}>
                  <Pressable onPress={() => router.push('/(tabs)/portfolio')}><Text style={styles.seeAll}>{t('viewAll')}</Text></Pressable>
                  <Text style={styles.sectionTitle}>{t('recentArtworks')}</Text>
                </View>
                {recentArtworks.map(a => (
                  <Pressable key={a.id} onPress={() => router.push('/(tabs)/portfolio')} style={styles.recentCard}>
                    <View style={[styles.availableDot, { backgroundColor: a.available ? Colors.success : Colors.error }]} />
                    <View style={styles.recentCenter}>
                      <Text style={styles.recentCustomer}>{a.title}</Text>
                      <Text style={styles.recentNum}>{a.category} · {a.year}</Text>
                    </View>
                    <View style={styles.recentRight}>
                      <Text style={styles.recentTotal}>{a.price.toLocaleString()}</Text>
                      <Text style={styles.recentCurrency}>{currency}</Text>
                    </View>
                  </Pressable>
                ))}
              </>
            ) : null}
          </>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      <BackupModal visible={showBackup} onClose={() => setShowBackup(false)} />
      <QuoteDetailModal visible={selectedQuote !== null} quote={selectedQuote} artworks={artworks} customers={customers} onClose={() => setSelectedQuote(null)} onEdit={() => { setSelectedQuote(null); router.push('/(tabs)/quotes'); }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { padding: pagePadding, ...(contentMaxWidth ? { alignSelf: 'center' as const, width: '100%', maxWidth: contentMaxWidth } : {}) },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.xl },
  headerRight: { alignItems: 'flex-end' },
  headerLeft: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', marginTop: 4 },
  iconBtn: { width: isTablet ? 44 : 38, height: isTablet ? 44 : 38, borderRadius: isTablet ? 22 : 19, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  trashBadge: { position: 'absolute', top: -4, left: -4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: Colors.error, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  trashBadgeTxt: { fontSize: 9, color: '#fff', fontWeight: FontWeight.bold },
  langBtn: { width: isTablet ? 44 : 38, height: isTablet ? 44 : 38, borderRadius: isTablet ? 22 : 19, backgroundColor: Colors.primarySurface, borderWidth: 1, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  langBtnText: { fontSize: isTablet ? FontSize.base : FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary },
  greeting: { fontSize: isTablet ? FontSize.xxxl : FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'right' },
  subtitle: { fontSize: isTablet ? FontSize.md : FontSize.base, color: Colors.textSecondary, textAlign: 'right' },
  revenueCard: { backgroundColor: Colors.card, borderRadius: Radius.xl, padding: isTablet ? Spacing.xxl : Spacing.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.primary + '40', ...Shadow.gold },
  revenueLeft: { flex: 1, alignItems: 'flex-end' },
  revenueLabel: { fontSize: isTablet ? FontSize.base : FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.sm },
  revenueAmount: { fontSize: isTablet ? 36 : FontSize.xxxl, fontWeight: FontWeight.extrabold, color: Colors.primary },
  pendingText: { fontSize: FontSize.sm, color: Colors.warning, marginTop: Spacing.xs },
  revenueIcon: { width: isTablet ? 72 : 60, height: isTablet ? 72 : 60, borderRadius: isTablet ? 36 : 30, backgroundColor: Colors.primarySurface, alignItems: 'center', justifyContent: 'center' },
  // Admin row
  adminRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  adminCard: { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  adminIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  adminValue: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  adminLabel: { fontSize: 10, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },
  adminCurrency: { fontSize: 9, color: Colors.textMuted },
  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: isTablet ? Spacing.base : Spacing.md, marginBottom: Spacing.xl },
  statCard: { flex: 1, minWidth: isTablet ? '22%' : '45%', backgroundColor: Colors.card, borderRadius: Radius.lg, padding: isTablet ? Spacing.lg : Spacing.base, alignItems: 'flex-end', borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  statIcon: { width: isTablet ? 48 : 40, height: isTablet ? 48 : 40, borderRadius: isTablet ? 24 : 20, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  statValue: { fontSize: isTablet ? FontSize.xxxl + 4 : FontSize.xxxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  statLabel: { fontSize: isTablet ? FontSize.sm : FontSize.xs, color: Colors.textMuted, marginTop: 2, textAlign: 'right' },
  sectionTitle: { fontSize: isTablet ? FontSize.xl : FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'right', marginBottom: Spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  seeAll: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.medium },
  quickActions: { flexDirection: 'row', gap: isTablet ? Spacing.lg : Spacing.sm, marginBottom: Spacing.xl, flexWrap: 'wrap' },
  quickBtn: { flex: 1, minWidth: isTablet ? '22%' : '45%', backgroundColor: Colors.card, borderRadius: Radius.md, padding: isTablet ? Spacing.lg : Spacing.md, alignItems: 'center', gap: Spacing.xs, borderWidth: 1, borderColor: Colors.border },
  quickBtnText: { fontSize: isTablet ? FontSize.sm : FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium, textAlign: 'center' },
  tabletTwoCol: { flexDirection: 'row', gap: Spacing.xl, alignItems: 'flex-start' },
  tabletCol: { flex: 1 },
  recentCard: { backgroundColor: Colors.card, borderRadius: Radius.md, padding: isTablet ? Spacing.base : Spacing.md, flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  recentLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 60 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  recentCenter: { flex: 1, paddingHorizontal: Spacing.md, alignItems: 'flex-end' },
  recentCustomer: { fontSize: isTablet ? FontSize.base : FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary, textAlign: 'right' },
  recentNum: { fontSize: FontSize.xs, color: Colors.textMuted },
  recentRight: { alignItems: 'flex-end' },
  recentTotal: { fontSize: isTablet ? FontSize.md : FontSize.base, fontWeight: FontWeight.bold, color: Colors.primary },
  recentCurrency: { fontSize: FontSize.xs, color: Colors.textMuted },
  availableDot: { width: 10, height: 10, borderRadius: 5 },
});
