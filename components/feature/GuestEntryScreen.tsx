// Powered by OnSpace.AI — Guest Entry Screen (default app entry)
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  Animated, Dimensions, Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { upsertDocSilent, fetchOnce, uid } from '@/services/firestoreService';
import { COLLECTIONS, ADMIN_EMAIL } from '@/services/firebase';
import { isTablet } from '@/constants/responsive';

const { width: SW, height: SH } = Dimensions.get('window');
const SESSION_KEY = 'visitor_session';

// ─── Admin Login Sheet ────────────────────────────────────────────────────────
function AdminLoginSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { signIn, authError, authLoading, clearError, resetPassword } = useAuth();
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState(ADMIN_EMAIL);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) return;
    await signIn(email, password);
  }

  async function handleReset() {
    if (!resetEmail.trim()) return;
    setResetLoading(true);
    try { await resetPassword(resetEmail); setResetSent(true); } finally { setResetLoading(false); }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={al.overlay} onPress={onClose}>
        <Pressable style={al.sheet} onPress={e => e.stopPropagation?.()}>
          <View style={al.handle} />
          <View style={al.header}>
            <Pressable onPress={onClose} style={al.closeBtn} hitSlop={8}>
              <MaterialIcons name="close" size={20} color={Colors.textSecondary} />
            </Pressable>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialIcons name="admin-panel-settings" size={20} color={Colors.primary} />
              <Text style={al.headerTitle}>دخول الإدارة</Text>
            </View>
          </View>

          {!showReset ? (
            <View style={al.content}>
              {authError ? (
                <View style={al.errorBox}>
                  <MaterialIcons name="error-outline" size={14} color={Colors.error} />
                  <Text style={al.errorText}>{authError}</Text>
                  <Pressable onPress={clearError} hitSlop={8}>
                    <MaterialIcons name="close" size={12} color={Colors.error} />
                  </Pressable>
                </View>
              ) : null}

              <View style={al.field}>
                <Text style={al.fieldLabel}>البريد الإلكتروني</Text>
                <View style={al.inputRow}>
                  <MaterialIcons name="email" size={16} color={Colors.textMuted} />
                  <TextInput
                    value={email}
                    onChangeText={v => { setEmail(v); clearError(); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={al.input}
                    textAlign="right"
                    placeholder="your@email.com"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
              </View>

              <View style={al.field}>
                <Text style={al.fieldLabel}>كلمة المرور</Text>
                <View style={al.inputRow}>
                  <Pressable onPress={() => setShowPwd(!showPwd)} hitSlop={8}>
                    <MaterialIcons name={showPwd ? 'visibility-off' : 'visibility'} size={16} color={Colors.textMuted} />
                  </Pressable>
                  <TextInput
                    value={password}
                    onChangeText={v => { setPassword(v); clearError(); }}
                    secureTextEntry={!showPwd}
                    style={al.input}
                    textAlign="right"
                    placeholder="••••••••"
                    placeholderTextColor={Colors.textMuted}
                    onSubmitEditing={handleLogin}
                    returnKeyType="go"
                  />
                </View>
              </View>

              <Pressable onPress={() => setShowReset(true)} style={al.forgotRow}>
                <Text style={al.forgotText}>نسيت كلمة المرور؟</Text>
              </Pressable>

              <Pressable
                onPress={handleLogin}
                disabled={authLoading || !password}
                style={[al.loginBtn, (authLoading || !password) && al.loginBtnDisabled]}
              >
                {authLoading
                  ? <ActivityIndicator size="small" color="#0d0d0f" />
                  : (
                    <>
                      <MaterialIcons name="login" size={18} color="#0d0d0f" />
                      <Text style={al.loginBtnText}>دخول كمشرف</Text>
                    </>
                  )}
              </Pressable>
            </View>
          ) : (
            <View style={al.content}>
              {resetSent ? (
                <View style={{ alignItems: 'center', paddingVertical: 24, gap: 12 }}>
                  <MaterialIcons name="check-circle" size={48} color={Colors.success} />
                  <Text style={{ fontSize: FontSize.base, color: Colors.textPrimary, textAlign: 'center' }}>
                    تم إرسال رابط الاستعادة على بريدك الإلكتروني
                  </Text>
                  <Pressable onPress={() => { setShowReset(false); setResetSent(false); }} style={al.loginBtn}>
                    <Text style={al.loginBtnText}>تم</Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  <Text style={{ fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'right', marginBottom: 8 }}>
                    أدخل بريدك الإلكتروني لاستعادة كلمة المرور
                  </Text>
                  <View style={al.inputRow}>
                    <MaterialIcons name="email" size={16} color={Colors.textMuted} />
                    <TextInput
                      value={resetEmail} onChangeText={setResetEmail}
                      keyboardType="email-address" autoCapitalize="none"
                      style={al.input} textAlign="right"
                      placeholder="your@email.com"
                      placeholderTextColor={Colors.textMuted}
                    />
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                    <Pressable onPress={() => setShowReset(false)} style={[al.loginBtn, { flex: 1, backgroundColor: Colors.surfaceElevated }]}>
                      <Text style={[al.loginBtnText, { color: Colors.textSecondary }]}>رجوع</Text>
                    </Pressable>
                    <Pressable onPress={handleReset} disabled={resetLoading} style={[al.loginBtn, { flex: 2 }]}>
                      {resetLoading
                        ? <ActivityIndicator size="small" color="#0d0d0f" />
                        : <Text style={al.loginBtnText}>إرسال رابط الاستعادة</Text>}
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const al = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl,
    paddingBottom: 40,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginTop: 12 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  content: { padding: Spacing.xl },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.errorSurface, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.error + '40',
  },
  errorText: { flex: 1, fontSize: FontSize.sm, color: Colors.error, textAlign: 'right' },
  field: { marginBottom: Spacing.base },
  fieldLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'right', marginBottom: 6, fontWeight: FontWeight.medium },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14,
  },
  input: { flex: 1, paddingVertical: 13, fontSize: FontSize.base, color: Colors.textPrimary },
  forgotRow: { alignItems: 'flex-end', marginBottom: Spacing.base },
  forgotText: { fontSize: FontSize.xs, color: Colors.primary },
  loginBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 14,
    ...Shadow.gold,
  },
  loginBtnDisabled: { opacity: 0.5 },
  loginBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#0d0d0f' },
});

// ─── Main GuestEntryScreen ────────────────────────────────────────────────────
export function GuestEntryScreen() {
  const { enterClientMode } = useAuth();
  const { lang, toggleLang, t } = useLanguage();
  const insets = useSafeAreaInsets();

  const [name, setName]           = useState('');
  const [phone, setPhone]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [showAdmin, setShowAdmin] = useState(false);

  const logoAnim  = useRef(new Animated.Value(0)).current;
  const formAnim  = useRef(new Animated.Value(0)).current;
  const formY     = useRef(new Animated.Value(30)).current;
  const shimmer   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(logoAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(formAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(formY,    { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 0,    useNativeDriver: true }),
        Animated.delay(2500),
      ])
    ).start();
  }, []);

  const shimmerX = shimmer.interpolate({
    inputRange: [0, 1], outputRange: [-SW * 0.6, SW * 0.6],
  });

  async function handleEnter() {
    const trimName  = name.trim();
    const trimPhone = phone.trim();
    if (!trimName)            { setError(lang === 'ar' ? 'يرجى إدخال الاسم' : 'Please enter your name'); return; }
    if (!trimPhone)           { setError(lang === 'ar' ? 'يرجى إدخال رقم الهاتف' : 'Please enter your phone'); return; }
    if (trimPhone.length < 8) { setError(lang === 'ar' ? 'رقم الهاتف غير صحيح' : 'Invalid phone number'); return; }
    setError('');
    setLoading(true);

    try {
      const now = new Date().toISOString();
      let visitor: any;

      try {
        const existing = await fetchOnce(COLLECTIONS.visitors);
        const found = existing.find((v: any) => v.phone === trimPhone);
        if (found) {
          if (found.accessEnabled === false) {
            setError(lang === 'ar' ? 'عذراً، تم تقييد وصولك للمعرض.' : 'Sorry, your gallery access is restricted.');
            setLoading(false);
            return;
          }
          visitor = {
            ...found,
            name: trimName,
            lastVisitDate: now,
            totalVisits: (found.totalVisits || 1) + 1,
            sessionStartedAt: now,
            updatedAt: now,
          };
        }
      } catch {
        // Firestore unreachable — proceed as new visitor
      }

      if (!visitor) {
        visitor = {
          id: uid(),
          name: trimName,
          phone: trimPhone,
          firstVisitDate: now,
          lastVisitDate: now,
          totalVisits: 1,
          artworkViews: [],
          totalArtworkViews: 0,
          lastArtworkViewed: '',
          sessionStartedAt: now,
          accessEnabled: true,
          createdAt: now,
          updatedAt: now,
        };
      }

      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(visitor));
      upsertDocSilent(COLLECTIONS.visitors, visitor.id, visitor).catch(() => {});
      enterClientMode();
    } catch {
      setError(lang === 'ar' ? 'حدث خطأ، حاول مجدداً' : 'An error occurred, please try again');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={gs.root}>
      <LinearGradient
        colors={['#0d0d0f', '#1a1408', '#2b1f00', '#1a1408', '#0d0d0f']}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
      />
      <View style={gs.glow} />

      <SafeAreaView style={gs.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={[gs.scroll, { paddingBottom: insets.bottom + 24 }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Branding ── */}
            <Animated.View style={[gs.brand, { opacity: logoAnim }]}>
              <View style={gs.logoWrap}>
                <View style={gs.logoRing2} />
                <View style={gs.logoRing1} />
                <View style={gs.logoCircle}>
                  <Image
                    source={require('@/assets/images/gallery_logo.png')}
                    style={gs.logoImage}
                    contentFit="cover"
                    transition={200}
                  />
                </View>
              </View>
              <View style={gs.divider} />
              <Text style={gs.brandName}>S.E Gallery</Text>
              <Text style={gs.brandSub}>{t('guestGallerySubtitle')}</Text>
              <View style={gs.starRow}>
                {[0,1,2,3,4].map(i => (
                  <MaterialIcons key={i} name="star" size={11} color={Colors.primary} style={{ opacity: 0.65 }} />
                ))}
              </View>
              <View style={gs.divider} />
            </Animated.View>

            {/* ── Registration Card ── */}
            <Animated.View
              style={[
                gs.card,
                isTablet && gs.cardTablet,
                { opacity: formAnim, transform: [{ translateY: formY }] },
              ]}
            >
              <View style={gs.cardHeader}>
                <MaterialIcons name="person-add" size={20} color={Colors.primary} />
                <Text style={gs.cardTitle}>{t('guestRegTitle')}</Text>
              </View>
              <Text style={gs.cardSub}>{t('guestRegSub')}</Text>

              {/* Name */}
              <View style={gs.fieldGroup}>
                <Text style={gs.fieldLabel}>{t('guestNameLabel')} *</Text>
                <View style={[gs.inputWrap, error && !name.trim() ? gs.inputError : null]}>
                  <TextInput
                    value={name}
                    onChangeText={v => { setName(v); setError(''); }}
                    placeholder={t('guestNamePlaceholder')}
                    placeholderTextColor={Colors.textMuted}
                    style={gs.input}
                    textAlign={lang === 'ar' ? 'right' : 'left'}
                    returnKeyType="next"
                    autoCapitalize="words"
                  />
                  <MaterialIcons name="person" size={18} color={Colors.textMuted} />
                </View>
              </View>

              {/* Phone */}
              <View style={gs.fieldGroup}>
                <Text style={gs.fieldLabel}>{t('guestPhoneLabel')} *</Text>
                <View style={[gs.inputWrap, error && !phone.trim() ? gs.inputError : null]}>
                  <TextInput
                    value={phone}
                    onChangeText={v => { setPhone(v.replace(/[^0-9+\-() ]/g, '')); setError(''); }}
                    placeholder="01XXXXXXXXX"
                    placeholderTextColor={Colors.textMuted}
                    style={gs.input}
                    textAlign={lang === 'ar' ? 'right' : 'left'}
                    keyboardType="phone-pad"
                    returnKeyType="done"
                    onSubmitEditing={handleEnter}
                  />
                  <MaterialIcons name="phone" size={18} color={Colors.textMuted} />
                </View>
              </View>

              {/* Error */}
              {error ? (
                <View style={gs.errorRow}>
                  <MaterialIcons name="error-outline" size={14} color={Colors.error} />
                  <Text style={gs.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Privacy */}
              <View style={gs.privacyNote}>
                <MaterialIcons name="lock" size={12} color={Colors.textMuted} />
                <Text style={gs.privacyText}>{t('guestPrivacy')}</Text>
              </View>

              {/* Primary CTA */}
              <Pressable
                onPress={handleEnter}
                disabled={loading}
                style={({ pressed }) => [
                  gs.ctaBtn,
                  pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                  loading && { opacity: 0.7 },
                ]}
              >
                <Animated.View style={[gs.shimmer, { transform: [{ translateX: shimmerX }] }]} />
                <LinearGradient
                  colors={[Colors.primary + 'FF', '#FFD96A', Colors.primary + 'FF']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={gs.ctaGradient}
                >
                  {loading
                    ? <ActivityIndicator size="small" color="#0d0d0f" />
                    : (
                      <>
                        <MaterialIcons name="photo-library" size={22} color="#0d0d0f" />
                        <Text style={gs.ctaText}>{t('guestEnterVisitor')}</Text>
                      </>
                    )}
                </LinearGradient>
              </Pressable>
            </Animated.View>

            {/* ── Bottom strip ── */}
            <View style={gs.bottomStrip}>
              <View style={gs.stripLine} />
              <MaterialIcons name="diamond" size={10} color={Colors.primary + '50'} />
              <View style={gs.stripLine} />
            </View>

            {/* ── Language Toggle ── */}
            <Pressable onPress={toggleLang} style={gs.langBtn}>
              <Text style={gs.langBtnText}>{lang === 'ar' ? 'EN' : 'عر'}</Text>
            </Pressable>

            {/* ── Admin Login small button ── */}
            <Pressable
              onPress={() => setShowAdmin(true)}
              style={({ pressed }) => [gs.adminBtn, pressed && { opacity: 0.7 }]}
            >
              <MaterialIcons name="settings" size={14} color={Colors.textMuted + 'CC'} />
              <Text style={gs.adminBtnText}>{t('guestAdminBtn')}</Text>
            </Pressable>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <AdminLoginSheet visible={showAdmin} onClose={() => setShowAdmin(false)} />
    </View>
  );
}

const LOGO  = isTablet ? 130 : 108;
const RING1 = LOGO + 28;
const RING2 = LOGO + 58;

const gs = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d0d0f' },
  glow: {
    position: 'absolute',
    top: SH * 0.12,
    alignSelf: 'center',
    width: SW * 0.8,
    height: SW * 0.8,
    borderRadius: SW * 0.4,
    backgroundColor: Colors.primary,
    opacity: 0.06,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 80,
  },
  safe: { flex: 1 },
  scroll: { flexGrow: 1, alignItems: 'center', paddingTop: Spacing.xl },

  brand: { alignItems: 'center', marginBottom: Spacing.xl, paddingHorizontal: 20 },
  logoWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  logoRing2: {
    position: 'absolute', width: RING2, height: RING2, borderRadius: RING2 / 2,
    borderWidth: 1, borderColor: Colors.primary + '20',
  },
  logoRing1: {
    position: 'absolute', width: RING1, height: RING1, borderRadius: RING1 / 2,
    borderWidth: 1.5, borderColor: Colors.primary + '40',
  },
  logoCircle: {
    width: LOGO, height: LOGO, borderRadius: LOGO / 2,
    backgroundColor: '#1a1408', borderWidth: 2, borderColor: Colors.primary + '70',
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 16, elevation: 10,
  },
  logoImage: { width: '100%', height: '100%' },
  divider: { width: 54, height: 1.5, backgroundColor: Colors.primary, opacity: 0.45, marginVertical: 14, borderRadius: 1 },
  brandName: {
    fontSize: isTablet ? 42 : 34, fontWeight: FontWeight.extrabold, color: Colors.primary,
    letterSpacing: 1.5, textAlign: 'center',
    textShadowColor: Colors.primary + '50', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 12,
  },
  brandSub: { fontSize: isTablet ? FontSize.lg : FontSize.base, color: '#C8A84B', letterSpacing: 1.2, marginTop: 4, opacity: 0.85 },
  starRow: { flexDirection: 'row', gap: 5, marginTop: 8 },

  card: {
    width: '92%', backgroundColor: 'rgba(26,20,8,0.92)',
    borderRadius: Radius.xl, padding: Spacing.xl,
    borderWidth: 1, borderColor: Colors.primary + '30',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 16, elevation: 8,
  },
  cardTablet: { width: '55%', minWidth: 360 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'flex-end', marginBottom: 4 },
  cardTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  cardSub: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'right', marginBottom: Spacing.xl },

  fieldGroup: { marginBottom: Spacing.base },
  fieldLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary, textAlign: 'right', marginBottom: 6 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.primary + '25',
  },
  inputError: { borderColor: Colors.error, backgroundColor: Colors.errorSurface + '20' },
  input: { flex: 1, paddingVertical: 14, fontSize: FontSize.base, color: Colors.textPrimary },

  errorRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.errorSurface, borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm, justifyContent: 'flex-end',
    borderWidth: 1, borderColor: Colors.error + '40',
  },
  errorText: { fontSize: FontSize.sm, color: Colors.error, flex: 1, textAlign: 'right' },

  privacyNote: { flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center', marginBottom: Spacing.xl },
  privacyText: { fontSize: FontSize.xs, color: Colors.textMuted },

  ctaBtn: {
    borderRadius: Radius.xl, overflow: 'hidden',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45, shadowRadius: 14, elevation: 10,
  },
  ctaGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: isTablet ? 18 : 16, paddingHorizontal: 24,
  },
  ctaText: { fontSize: isTablet ? FontSize.xl : FontSize.lg, fontWeight: FontWeight.extrabold, color: '#0d0d0f', letterSpacing: 0.5 },
  shimmer: {
    position: 'absolute', top: 0, bottom: 0, width: 80,
    backgroundColor: 'rgba(255,255,255,0.2)',
    transform: [{ skewX: '-20deg' }], zIndex: 1,
  },

  bottomStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    width: '50%', marginTop: Spacing.xl, marginBottom: Spacing.sm,
  },
  stripLine: { flex: 1, height: 1, backgroundColor: Colors.primary, opacity: 0.18 },

  // Language Toggle button
  langBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 28, paddingVertical: 9,
    borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.primary + '40',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: Spacing.sm,
  },
  langBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.extrabold, color: Colors.primary, letterSpacing: 1 },

  // Admin button (subtle, bottom)
  adminBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: Radius.full,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginBottom: Spacing.md,
  },
  adminBtnText: { fontSize: FontSize.xs, color: Colors.textMuted + 'CC', letterSpacing: 0.5 },
});
