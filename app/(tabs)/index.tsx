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

export default function HomeScreen() {
  const { artworks, customers, quotes } = useApp();
  const { t, currency, lang, toggleLang } = useLanguage();
  const router = useRouter();
  const [showBackup, setShowBackup] = useState(false);

  const totalRevenue = quotes
    .filter(q => q.status === 'accepted')
    .reduce((s, q) => s + q.total, 0);

  const pendingQuotes = quotes.filter(q => q.status === 'sent').length;
  const availableArtworks = artworks.filter(a => a.available).length;
  const recentQuotes = quotes.slice(0, 3);
  const recentArtworks = artworks.slice(0, 3);

  const stats = [
    { label: t('artworks'), value: artworks.length, icon: 'palette' as const, color: Colors.primary, route: '/(tabs)/portfolio' },
    { label: t('customers'), value: customers.length, icon: 'people' as const, color: Colors.info, route: '/(tabs)/customers' },
    { label: t('tabQuotes'), value: quotes.length, icon: 'description' as const, color: Colors.success, route: '/(tabs)/quotes' },
    { label: t('availableForSale'), value: availableArtworks, icon: 'star' as const, color: Colors.warning, route: '/(tabs)/portfolio' },
  ];

  const statusColors: Record<string, string> = {
    draft: Colors.textMuted, sent: Colors.primary,
    accepted: Colors.success, rejected: Colors.error,
  };
  const statusLabels: Record<string, string> = {
    draft: t('statusDraft'), sent: t('statusSent'),
    accepted: t('statusAccepted'), rejected: t('statusRejected'),
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable onPress={() => setShowBackup(true)} style={styles.iconBtn}>
              <MaterialIcons name="cloud-upload" size={20} color={Colors.textSecondary} />
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
            {pendingQuotes > 0 ? (
              <Text style={styles.pendingText}>{pendingQuotes} {t('pendingWaiting')}</Text>
            ) : null}
          </View>
          <View style={styles.revenueIcon}>
            <MaterialIcons name="trending-up" size={32} color={Colors.primary} />
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map(stat => (
            <Pressable
              key={stat.label}
              onPress={() => router.push(stat.route as any)}
              style={({ pressed }) => [styles.statCard, pressed && styles.pressed]}
            >
              <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                <MaterialIcons name={stat.icon} size={22} color={stat.color} />
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
            { label: t('newCustomer'), icon: 'person-add' as const, route: '/(tabs)/customers', color: Colors.info },
          ].map(action => (
            <Pressable
              key={action.label}
              onPress={() => router.push(action.route as any)}
              style={({ pressed }) => [styles.quickBtn, pressed && styles.pressed]}
            >
              <MaterialIcons name={action.icon} size={24} color={action.color} />
              <Text style={styles.quickBtnText}>{action.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Recent Quotes */}
        {recentQuotes.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <Pressable onPress={() => router.push('/(tabs)/quotes')}>
                <Text style={styles.seeAll}>{t('viewAll')}</Text>
              </Pressable>
              <Text style={styles.sectionTitle}>{t('recentQuotes')}</Text>
            </View>
            {recentQuotes.map(q => (
              <Pressable key={q.id} onPress={() => router.push('/(tabs)/quotes')} style={styles.recentCard}>
                <View style={styles.recentLeft}>
                  <View style={[styles.statusDot, { backgroundColor: statusColors[q.status] }]} />
                  <Text style={[styles.statusLabel, { color: statusColors[q.status] }]}>{statusLabels[q.status]}</Text>
                </View>
                <View style={styles.recentCenter}>
                  <Text style={styles.recentCustomer}>{q.customerName}</Text>
                  <Text style={styles.recentNum}>{q.quoteNumber}</Text>
                </View>
                <Text style={styles.recentTotal}>{q.total.toLocaleString()} {currency}</Text>
              </Pressable>
            ))}
          </>
        ) : null}

        {/* Recent Artworks */}
        {recentArtworks.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <Pressable onPress={() => router.push('/(tabs)/portfolio')}>
                <Text style={styles.seeAll}>{t('viewAll')}</Text>
              </Pressable>
              <Text style={styles.sectionTitle}>{t('recentArtworks')}</Text>
            </View>
            {recentArtworks.map(a => (
              <Pressable key={a.id} onPress={() => router.push('/(tabs)/portfolio')} style={styles.recentCard}>
                <View style={[styles.availableDot, { backgroundColor: a.available ? Colors.success : Colors.error }]} />
                <View style={styles.recentCenter}>
                  <Text style={styles.recentCustomer}>{a.title}</Text>
                  <Text style={styles.recentNum}>{a.category} · {a.year}</Text>
                </View>
                <Text style={styles.recentTotal}>{a.price.toLocaleString()} {currency}</Text>
              </Pressable>
            ))}
          </>
        ) : null}

        <View style={{ height: 20 }} />
      </ScrollView>

      <BackupModal visible={showBackup} onClose={() => setShowBackup(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { padding: Spacing.base },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  headerRight: { alignItems: 'flex-end' },
  headerLeft: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', marginTop: 4 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primarySurface,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary },
  greeting: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'right' },
  subtitle: { fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'right' },
  revenueCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    ...Shadow.gold,
  },
  revenueLeft: { flex: 1, alignItems: 'flex-end' },
  revenueLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.sm },
  revenueAmount: { fontSize: FontSize.xxxl, fontWeight: FontWeight.extrabold, color: Colors.primary },
  pendingText: { fontSize: FontSize.sm, color: Colors.warning, marginTop: Spacing.xs },
  revenueIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.xl },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    alignItems: 'flex-end',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  statIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },
  statValue: { fontSize: FontSize.xxxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2, textAlign: 'right' },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'right', marginBottom: Spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  seeAll: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.medium },
  quickActions: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  quickBtn: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickBtnText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium, textAlign: 'center' },
  recentCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recentLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 60 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  recentCenter: { flex: 1, paddingHorizontal: Spacing.md, alignItems: 'flex-end' },
  recentCustomer: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary, textAlign: 'right' },
  recentNum: { fontSize: FontSize.xs, color: Colors.textMuted },
  recentTotal: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary },
  availableDot: { width: 10, height: 10, borderRadius: 5 },
});
