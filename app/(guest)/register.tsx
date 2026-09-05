// Powered by OnSpace.AI — Welcome / Landing Screen
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  Modal, TextInput, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { useVisitor } from '@/contexts/VisitorContext';
import { useAuth } from '@/contexts/AuthContext';
import { isTablet } from '@/constants/responsive';
import { ADMIN_EMAIL } from '@/services/firebase';

const SAVED_VISITOR_KEY = 'saved_visitor_info';

interface SavedVisitor {
  name: string;
  phone: string;
}

// ─── Admin Auth Modal ─────────────────────────────────────────────────────────
function AdminAuthModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { signIn, authLoading, authError, clearError } = useAuth();
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const pwRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setPassword('');
      setLocalError('');
      clearError();
      setTimeout(() => pwRef.current?.focus(), 300);
    }
  }, [visible]);

  async function handleAdminLogin() {
    if (!password.trim()) { setLocalError('أدخل كلمة المرور'); return; }
    setLocalError('');
    try {
      await signIn(ADMIN_EMAIL, password.trim());
      onClose();
    } catch { /* authError is set by AuthContext */ }
  }

  const errorMsg = localError || authError;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={am.overlay} onPress={onClose}>
        <Pressable style={am.card} onPress={e => e.stopPropagation?.()}>
          <Pressable onPress={onClose} style={am.closeBtn} hitSlop={8}>
            <MaterialIcons name="close" size={18} color={Colors.textMuted} />
          </Pressable>
          <View style={am.iconWrap}>
            <MaterialIcons name="admin-panel-settings" size={28} color={Colors.primary} />
          </View>
          <Text style={am.title}>دخول الإدارة</Text>
          <Text style={am.sub}>Admin Access</Text>
          <View style={[am.inputWrap, errorMsg ? am.inputError : null]}>
            <TextInput
              ref={pwRef}
              value={password}
              onChangeText={v => { setPassword(v); setLocalError(''); clearError(); }}
              placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              style={am.input}
              textAlign="right"
              returnKeyType="done"
              onSubmitEditing={handleAdminLogin}
            />
            <MaterialIcons name="lock" size={18} color={Colors.textMuted} />
          </View>
          {errorMsg ? (
            <View style={am.errorRow}>
              <MaterialIcons name="error-outline" size={13} color={Colors.error} />
              <Text style={am.errorText}>{errorMsg}</Text>
            </View>
          ) : null}
          <Pressable
            onPress={handleAdminLogin}
            disabled={authLoading}
            style={({ pressed }) => [am.loginBtn, pressed && { opacity: 0.85 }, authLoading && { opacity: 0.7 }]}
          >
            {authLoading
              ? <ActivityIndicator size="small" color="#0d0d0f" />
              : <Text style={am.loginBtnText}>دخول</Text>}
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const am = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl, width: '100%', maxWidth: 320, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, ...Shadow.md },
  closeBtn: { position: 'absolute', top: 14, left: 14, width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  iconWrap: { width: 58, height: 58, borderRadius: 29, backgroundColor: Colors.primarySurface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.primary + '40', marginBottom: Spacing.md },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: 2 },
  sub: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: Spacing.xl, letterSpacing: 1 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', width: '100%', backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm, gap: Spacing.sm },
  inputError: { borderColor: Colors.error },
  input: { flex: 1, paddingVertical: 13, fontSize: FontSize.base, color: Colors.textPrimary },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.errorSurface, borderRadius: Radius.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, width: '100%', justifyContent: 'flex-end', marginBottom: Spacing.sm },
  errorText: { fontSize: FontSize.xs, color: Colors.error, flex: 1, textAlign: 'right' },
  loginBtn: { width: '100%', backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 13, alignItems: 'center', marginTop: Spacing.sm },
  loginBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#0d0d0f' },
});

// ─── Visitor Registration Modal ───────────────────────────────────────────────
function VisitorRegisterModal({
  visible,
  onClose,
  onSuccess,
  savedVisitor,
}: {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  savedVisitor: SavedVisitor | null;
}) {
  const { registerVisitor, checkAccessEnabled } = useVisitor();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible && savedVisitor) {
      setName(savedVisitor.name);
      setPhone(savedVisitor.phone);
    } else if (visible) {
      setName('');
      setPhone('');
    }
    setError('');
  }, [visible, savedVisitor]);

  const handleEnter = useCallback(async () => {
    const trimName = name.trim();
    const trimPhone = phone.trim();
    if (!trimName) { setError('يرجى إدخال الاسم'); return; }
    if (!trimPhone || trimPhone.length < 8) { setError('يرجى إدخال رقم هاتف صحيح'); return; }
    setError('');
    setLoading(true);
    try {
      await AsyncStorage.setItem(SAVED_VISITOR_KEY, JSON.stringify({ name: trimName, phone: trimPhone }));
      const visitor = await registerVisitor(trimName, trimPhone);
      const allowed = await checkAccessEnabled(visitor.id);
      if (allowed) {
        onSuccess();
      } else {
        setError('عذراً، وصولك للمعرض غير متاح حالياً. يرجى التواصل معنا.');
      }
    } catch {
      setError('حدث خطأ، حاول مجدداً');
    } finally {
      setLoading(false);
    }
  }, [name, phone, registerVisitor, checkAccessEnabled, onSuccess]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={rm.overlay} onPress={onClose}>
          <Pressable style={rm.sheet} onPress={e => e.stopPropagation?.()}>
            <View style={rm.handle} />
            <View style={rm.header}>
              <Pressable onPress={onClose} style={rm.closeBtn}>
                <MaterialIcons name="close" size={20} color={Colors.textSecondary} />
              </Pressable>
              <Text style={rm.title}>بيانات الزائر</Text>
            </View>

            <ScrollView contentContainerStyle={rm.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={rm.subtitle}>أدخل بياناتك للوصول إلى المعرض</Text>

              {/* Name */}
              <View style={rm.fieldGroup}>
                <Text style={rm.label}>الاسم</Text>
                <View style={rm.inputWrap}>
                  <TextInput
                    value={name}
                    onChangeText={v => { setName(v); setError(''); }}
                    placeholder="اسمك الكريم"
                    placeholderTextColor={Colors.textMuted}
                    style={rm.input}
                    textAlign="right"
                    returnKeyType="next"
                    autoCapitalize="words"
                  />
                  <MaterialIcons name="person" size={18} color={Colors.textMuted} />
                </View>
              </View>

              {/* Phone */}
              <View style={rm.fieldGroup}>
                <Text style={rm.label}>رقم الهاتف</Text>
                <View style={rm.inputWrap}>
                  <TextInput
                    value={phone}
                    onChangeText={v => { setPhone(v.replace(/[^0-9+\-() ]/g, '')); setError(''); }}
                    placeholder="01XXXXXXXXX"
                    placeholderTextColor={Colors.textMuted}
                    style={rm.input}
                    textAlign="right"
                    keyboardType="phone-pad"
                    returnKeyType="done"
                    onSubmitEditing={handleEnter}
                  />
                  <MaterialIcons name="phone" size={18} color={Colors.textMuted} />
                </View>
              </View>

              {error ? (
                <View style={rm.errorRow}>
                  <MaterialIcons name="error-outline" size={14} color={Colors.error} />
                  <Text style={rm.errorText}>{error}</Text>
                </View>
              ) : null}

              <View style={rm.privacyRow}>
                <MaterialIcons name="shield" size={12} color={Colors.textMuted} />
                <Text style={rm.privacyText}>بياناتك محمية ولن تُشارك مع أي طرف</Text>
              </View>

              <Pressable
                onPress={handleEnter}
                disabled={loading}
                style={({ pressed }) => [rm.enterBtn, pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] }, loading && { opacity: 0.75 }]}
              >
                {loading
                  ? <ActivityIndicator size="small" color="#0d0d0f" />
                  : <>
                      <MaterialIcons name="arrow-back" size={20} color="#0d0d0f" />
                      <Text style={rm.enterBtnText}>دخول المعرض</Text>
                    </>}
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const rm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, paddingBottom: 36 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginTop: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.base, paddingTop: Spacing.md },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'right', marginBottom: Spacing.xl, lineHeight: 20 },
  fieldGroup: { marginBottom: Spacing.md },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary, textAlign: 'right', marginBottom: 6 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceElevated, borderRadius: Radius.lg, paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm },
  input: { flex: 1, paddingVertical: 15, fontSize: isTablet ? FontSize.lg : FontSize.base, color: Colors.textPrimary },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.errorSurface, borderRadius: Radius.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, marginBottom: Spacing.sm, justifyContent: 'flex-end', borderWidth: 1, borderColor: Colors.error + '40' },
  errorText: { fontSize: FontSize.sm, color: Colors.error, flex: 1, textAlign: 'right' },
  privacyRow: { flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center', marginBottom: Spacing.xl, marginTop: Spacing.xs },
  privacyText: { fontSize: FontSize.xs, color: Colors.textMuted },
  enterBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: Radius.xl, paddingVertical: isTablet ? 18 : 16, marginBottom: Spacing.md, ...Shadow.gold },
  enterBtnText: { fontSize: isTablet ? FontSize.xl : FontSize.lg, fontWeight: FontWeight.extrabold, color: '#0d0d0f', letterSpacing: 0.5 },
});

// ─── Main Landing Screen ──────────────────────────────────────────────────────
export default function LandingScreen() {
  const { isLoadingVisitor } = useVisitor();
  const router = useRouter();

  const [savedVisitor, setSavedVisitor] = useState<SavedVisitor | null>(null);
  const [showVisitorModal, setShowVisitorModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadSavedVisitor();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  async function loadSavedVisitor() {
    try {
      const raw = await AsyncStorage.getItem(SAVED_VISITOR_KEY);
      if (raw) setSavedVisitor(JSON.parse(raw));
    } catch {}
  }

  function handleVisitorSuccess() {
    setShowVisitorModal(false);
    router.replace('/(guest)/');
  }

  if (isLoadingVisitor) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Tiny Admin Button — top-left, very subtle */}
      <Pressable
        onPress={() => setShowAdminModal(true)}
        style={styles.adminBtn}
        hitSlop={16}
        accessibilityLabel="admin"
      >
        <MaterialIcons name="settings" size={15} color={Colors.textMuted} />
        <Text style={styles.adminBtnText}>الإدارة</Text>
      </Pressable>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

          {/* ── Brand / Logo ──────────────────────────────────── */}
          <View style={styles.brandSection}>
            <View style={styles.logoOuter}>
              <View style={styles.logoInner}>
                <MaterialIcons
                  name="palette"
                  size={isTablet ? 60 : 48}
                  color={Colors.primary}
                />
              </View>
            </View>

            {/* Gold decorative line */}
            <View style={styles.topLine}>
              <View style={styles.linePart} />
              <MaterialIcons name="auto-awesome" size={12} color={Colors.primary} />
              <View style={styles.linePart} />
            </View>

            <Text style={styles.brandName}>S.Ezzat Art</Text>
            <Text style={styles.brandTagline}>معرض الأعمال الفنية</Text>
            <Text style={styles.brandTaglineEn}>Fine Art Gallery</Text>

            {/* Bottom divider */}
            <View style={styles.topLine}>
              <View style={styles.linePart} />
              <MaterialIcons name="star" size={10} color={Colors.primary + '60'} />
              <View style={styles.linePart} />
              <MaterialIcons name="star" size={10} color={Colors.primary + '60'} />
              <View style={styles.linePart} />
            </View>
          </View>

          {/* ── Welcome Back (returning visitor) ────────────── */}
          {savedVisitor ? (
            <View style={styles.returningWrap}>
              <MaterialIcons name="waving-hand" size={16} color={Colors.primary} />
              <Text style={styles.returningText}>
                {'أهلاً بعودتك، '}
                <Text style={styles.returningName}>{savedVisitor.name}</Text>
              </Text>
            </View>
          ) : null}

          {/* ── Main CTA — Enter as Visitor ───────────────────── */}
          <View style={styles.ctaSection}>
            <Pressable
              onPress={() => setShowVisitorModal(true)}
              style={({ pressed }) => [
                styles.visitorBtn,
                pressed && { opacity: 0.88, transform: [{ scale: 0.97 }] },
              ]}
            >
              <View style={styles.visitorBtnContent}>
                <View style={styles.visitorBtnIcon}>
                  <MaterialIcons name="photo-library" size={28} color="#0d0d0f" />
                </View>
                <View style={styles.visitorBtnText}>
                  <Text style={styles.visitorBtnTitle}>دخول كزائر</Text>
                  <Text style={styles.visitorBtnSub}>Visitor Access</Text>
                </View>
                <MaterialIcons name="arrow-back" size={22} color="#0d0d0f" />
              </View>
            </Pressable>

            {/* Subtle hint text */}
            <Text style={styles.hintText}>
              {savedVisitor ? 'سيتم استخدام بياناتك المحفوظة' : 'أدخل اسمك ورقم هاتفك للوصول إلى الأعمال'}
            </Text>
          </View>

          {/* ── Features Row ─────────────────────────────────── */}
          <View style={styles.featuresRow}>
            {[
              { icon: 'image', label: 'أعمال فنية' },
              { icon: 'straighten', label: 'مواصفات' },
              { icon: 'chat', label: 'تواصل' },
            ].map(f => (
              <View key={f.label} style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <MaterialIcons name={f.icon as any} size={18} color={Colors.primary} />
                </View>
                <Text style={styles.featureLabel}>{f.label}</Text>
              </View>
            ))}
          </View>

          {/* ── Footer ───────────────────────────────────────── */}
          <View style={styles.footer}>
            <MaterialIcons name="star" size={7} color={Colors.primary + '40'} />
            <Text style={styles.footerText}>S.Ezzat Art · Fine Art Gallery</Text>
            <MaterialIcons name="star" size={7} color={Colors.primary + '40'} />
          </View>

        </Animated.View>
      </ScrollView>

      {/* Visitor Register Modal */}
      <VisitorRegisterModal
        visible={showVisitorModal}
        onClose={() => setShowVisitorModal(false)}
        onSuccess={handleVisitorSuccess}
        savedVisitor={savedVisitor}
      />

      {/* Admin Auth Modal */}
      <AdminAuthModal
        visible={showAdminModal}
        onClose={() => setShowAdminModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Tiny admin button — top-left, very subtle
  adminBtn: {
    position: 'absolute',
    top: 14,
    left: 14,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  adminBtnText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },

  scroll: { flexGrow: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 60,
    minHeight: 600,
  },

  // Brand section
  brandSection: { alignItems: 'center', marginBottom: Spacing.xxl, width: '100%' },
  logoOuter: {
    width: isTablet ? 130 : 104,
    height: isTablet ? 130 : 104,
    borderRadius: isTablet ? 65 : 52,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary + '30',
    marginBottom: Spacing.xl,
    ...Shadow.gold,
  },
  logoInner: {
    width: isTablet ? 90 : 72,
    height: isTablet ? 90 : 72,
    borderRadius: isTablet ? 45 : 36,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '50',
  },
  topLine: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '55%', marginVertical: Spacing.md },
  linePart: { flex: 1, height: 1, backgroundColor: Colors.primary + '30' },

  brandName: {
    fontSize: isTablet ? 48 : 38,
    fontWeight: FontWeight.extrabold,
    color: Colors.primary,
    letterSpacing: 2,
    marginBottom: 6,
    textAlign: 'center',
  },
  brandTagline: {
    fontSize: isTablet ? FontSize.xl : FontSize.lg,
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 4,
    textAlign: 'center',
  },
  brandTaglineEn: {
    fontSize: isTablet ? FontSize.base : FontSize.sm,
    color: Colors.textMuted,
    letterSpacing: 2,
    marginBottom: Spacing.md,
    fontStyle: 'italic',
  },

  // Returning visitor
  returningWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primarySurface,
    borderRadius: Radius.full,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    marginBottom: Spacing.xl,
    ...Shadow.sm,
  },
  returningText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  returningName: { fontWeight: FontWeight.bold, color: Colors.primary },

  // CTA section
  ctaSection: { width: '100%', alignItems: 'center', marginBottom: Spacing.xl },

  visitorBtn: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.xxl,
    paddingVertical: isTablet ? 22 : 18,
    paddingHorizontal: 24,
    ...Shadow.gold,
  },
  visitorBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  visitorBtnIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visitorBtnText: { flex: 1, alignItems: 'flex-end' },
  visitorBtnTitle: {
    fontSize: isTablet ? 26 : 22,
    fontWeight: FontWeight.extrabold,
    color: '#0d0d0f',
    letterSpacing: 0.5,
  },
  visitorBtnSub: {
    fontSize: FontSize.sm,
    color: '#0d0d0f',
    opacity: 0.6,
    letterSpacing: 1,
    marginTop: 2,
  },
  hintText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.md,
    paddingHorizontal: 10,
  },

  // Features
  featuresRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
    width: '100%',
    justifyContent: 'center',
  },
  featureItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
    maxWidth: 100,
  },
  featureIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: FontWeight.medium, textAlign: 'center' },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerText: { fontSize: 10, color: Colors.textMuted + '70', letterSpacing: 1 },
});
