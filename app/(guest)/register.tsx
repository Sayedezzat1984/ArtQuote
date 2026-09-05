// Powered by OnSpace.AI — Visitor Start Screen (dominant) + tiny Admin access
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  Modal, Animated,
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

// ─── Admin Auth Modal ────────────────────────────────────────────────────────
function AdminAuthModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
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
      // signIn success → onAuthStateChanged sets appMode='admin' → _layout re-routes
      onClose();
    } catch {
      // authError is set by AuthContext
    }
  }

  const errorMsg = localError || authError;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={am.overlay} onPress={onClose}>
        <Pressable style={am.card} onPress={e => e.stopPropagation?.()}>
          {/* Close */}
          <Pressable onPress={onClose} style={am.closeBtn} hitSlop={8}>
            <MaterialIcons name="close" size={18} color={Colors.textMuted} />
          </Pressable>

          {/* Icon */}
          <View style={am.iconWrap}>
            <MaterialIcons name="admin-panel-settings" size={28} color={Colors.primary} />
          </View>
          <Text style={am.title}>دخول المشرف</Text>
          <Text style={am.sub}>كلمة مرور المشرف</Text>

          {/* Password */}
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.md,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  sub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  inputError: {
    borderColor: Colors.error,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.errorSurface,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    width: '100%',
    justifyContent: 'flex-end',
    marginBottom: Spacing.sm,
  },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.error,
    flex: 1,
    textAlign: 'right',
  },
  loginBtn: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  loginBtnText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: '#0d0d0f',
  },
});

// ─── Main Start Screen ────────────────────────────────────────────────────────
export default function VisitorStartScreen() {
  const { registerVisitor, currentVisitor, isLoadingVisitor, checkAccessEnabled } = useVisitor();
  const router = useRouter();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [savedVisitor, setSavedVisitor] = useState<SavedVisitor | null>(null);
  const [isReturning, setIsReturning] = useState(false);
  const [showChangeVisitor, setShowChangeVisitor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdminModal, setShowAdminModal] = useState(false);

  // Fade-in animation for welcome text
  const welcomeFade = useRef(new Animated.Value(0)).current;

  // Load saved visitor info on mount
  useEffect(() => {
    loadSavedVisitor();
  }, []);

  // Animate welcome text when returning visitor detected
  useEffect(() => {
    if (isReturning) {
      Animated.timing(welcomeFade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } else {
      welcomeFade.setValue(0);
    }
  }, [isReturning]);

  async function loadSavedVisitor() {
    try {
      const raw = await AsyncStorage.getItem(SAVED_VISITOR_KEY);
      if (raw) {
        const saved: SavedVisitor = JSON.parse(raw);
        setSavedVisitor(saved);
        setName(saved.name);
        setPhone(saved.phone);
        setIsReturning(true);
      }
    } catch {}
  }

  function handleChangeVisitor() {
    setName('');
    setPhone('');
    setIsReturning(false);
    setSavedVisitor(null);
    setShowChangeVisitor(false);
    setError('');
    AsyncStorage.removeItem(SAVED_VISITOR_KEY).catch(() => {});
    AsyncStorage.removeItem('visitor_session').catch(() => {});
  }

  const handleEnterGallery = useCallback(async () => {
    const trimName = name.trim();
    const trimPhone = phone.trim();

    if (!trimName) { setError('يرجى إدخال الاسم'); return; }
    if (!trimPhone || trimPhone.length < 8) { setError('يرجى إدخال رقم هاتف صحيح'); return; }

    setError('');
    setLoading(true);

    try {
      // Save visitor info locally for next visit
      await AsyncStorage.setItem(SAVED_VISITOR_KEY, JSON.stringify({ name: trimName, phone: trimPhone }));

      const visitor = await registerVisitor(trimName, trimPhone);

      // Check access from server
      const allowed = await checkAccessEnabled(visitor.id);
      if (allowed) {
        router.replace('/(guest)/');
      } else {
        setError('عذراً، وصولك للمعرض غير متاح حالياً. يرجى التواصل معنا.');
      }
    } catch {
      setError('حدث خطأ، حاول مجدداً');
    } finally {
      setLoading(false);
    }
  }, [name, phone, registerVisitor, checkAccessEnabled, router]);

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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Tiny admin lock — top-left, very subtle */}
        <Pressable
          onPress={() => setShowAdminModal(true)}
          style={styles.adminLockBtn}
          hitSlop={16}
          accessibilityLabel="admin"
        >
          <MaterialIcons name="lock" size={16} color={Colors.textMuted} />
        </Pressable>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Branding ───────────────────────────────────────── */}
          <View style={styles.brandSection}>
            <View style={styles.logoCircle}>
              <MaterialIcons
                name="palette"
                size={isTablet ? 56 : 46}
                color={Colors.primary}
              />
            </View>
            <Text style={styles.brandName}>سيد عزت</Text>
            <Text style={styles.brandTagline}>معرض الأعمال الفنية</Text>

            {/* Decorative divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <MaterialIcons name="auto-awesome" size={14} color={Colors.primary + '80'} />
              <View style={styles.dividerLine} />
            </View>
          </View>

          {/* ── Welcome back message ─────────────────────────── */}
          {isReturning ? (
            <Animated.View style={[styles.welcomeBack, { opacity: welcomeFade }]}>
              <MaterialIcons name="waving-hand" size={18} color={Colors.primary} />
              <Text style={styles.welcomeBackText}>
                أهلاً بعودتك، <Text style={styles.welcomeBackName}>{savedVisitor?.name}</Text>
              </Text>
            </Animated.View>
          ) : null}

          {/* ── Login Card ───────────────────────────────────── */}
          <View style={[styles.card, isTablet && styles.cardTablet]}>

            {/* Card header */}
            <View style={styles.cardHeader}>
              <MaterialIcons name="photo-library" size={20} color={Colors.primary} />
              <Text style={styles.cardTitle}>
                {isReturning ? 'تسجيل الدخول' : 'دخول المعرض'}
              </Text>
            </View>
            <Text style={styles.cardSub}>
              {isReturning
                ? 'بياناتك محفوظة — اضغط للدخول مباشرة'
                : 'أدخل بياناتك للوصول إلى المعرض'}
            </Text>

            {/* Name field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>الاسم</Text>
              <View style={[
                styles.inputWrap,
                error && !name.trim() && styles.inputWrapError,
              ]}>
                <TextInput
                  value={name}
                  onChangeText={v => { setName(v); setError(''); }}
                  placeholder="اسمك الكريم"
                  placeholderTextColor={Colors.textMuted}
                  style={styles.input}
                  textAlign="right"
                  returnKeyType="next"
                  autoCapitalize="words"
                  editable={!isReturning || showChangeVisitor}
                />
                <MaterialIcons
                  name="person"
                  size={18}
                  color={isReturning && !showChangeVisitor ? Colors.primary + '80' : Colors.textMuted}
                />
              </View>
            </View>

            {/* Phone field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>رقم الهاتف</Text>
              <View style={[
                styles.inputWrap,
                error && !phone.trim() && styles.inputWrapError,
              ]}>
                <TextInput
                  value={phone}
                  onChangeText={v => { setPhone(v.replace(/[^0-9+\-() ]/g, '')); setError(''); }}
                  placeholder="01XXXXXXXXX"
                  placeholderTextColor={Colors.textMuted}
                  style={styles.input}
                  textAlign="right"
                  keyboardType="phone-pad"
                  returnKeyType="done"
                  onSubmitEditing={handleEnterGallery}
                  editable={!isReturning || showChangeVisitor}
                />
                <MaterialIcons
                  name="phone"
                  size={18}
                  color={isReturning && !showChangeVisitor ? Colors.primary + '80' : Colors.textMuted}
                />
              </View>
            </View>

            {/* Error */}
            {error ? (
              <View style={styles.errorRow}>
                <MaterialIcons name="error-outline" size={14} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Privacy note */}
            <View style={styles.privacyRow}>
              <MaterialIcons name="shield" size={12} color={Colors.textMuted} />
              <Text style={styles.privacyText}>بياناتك محمية ولن تُشارك مع أي طرف</Text>
            </View>

            {/* Enter Gallery button */}
            <Pressable
              onPress={handleEnterGallery}
              disabled={loading}
              style={({ pressed }) => [
                styles.enterBtn,
                pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
                loading && { opacity: 0.75 },
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#0d0d0f" />
              ) : (
                <>
                  <MaterialIcons name="arrow-back" size={20} color="#0d0d0f" />
                  <Text style={styles.enterBtnText}>دخول المعرض</Text>
                </>
              )}
            </Pressable>

            {/* Change visitor link */}
            {isReturning ? (
              <Pressable
                onPress={handleChangeVisitor}
                style={styles.changeVisitorBtn}
                hitSlop={8}
              >
                <MaterialIcons name="swap-horiz" size={14} color={Colors.textMuted} />
                <Text style={styles.changeVisitorText}>تغيير الزائر</Text>
              </Pressable>
            ) : null}
          </View>

          {/* ── Footer decoration ────────────────────────────── */}
          <View style={styles.footer}>
            <MaterialIcons name="star" size={8} color={Colors.primary + '50'} />
            <Text style={styles.footerText}>تجربة فنية راقية</Text>
            <MaterialIcons name="star" size={8} color={Colors.primary + '50'} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Admin Auth Modal */}
      <AdminAuthModal
        visible={showAdminModal}
        onClose={() => setShowAdminModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tiny admin lock — top-left, ultra-subtle
  adminLockBtn: {
    position: 'absolute',
    top: 14,
    left: 14,
    zIndex: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 40,
  },

  // Branding
  brandSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    width: '100%',
  },
  logoCircle: {
    width: isTablet ? 110 : 88,
    height: isTablet ? 110 : 88,
    borderRadius: isTablet ? 55 : 44,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary + '35',
    marginBottom: Spacing.md,
    ...Shadow.gold,
  },
  brandName: {
    fontSize: isTablet ? 40 : 32,
    fontWeight: FontWeight.extrabold,
    color: Colors.primary,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  brandTagline: {
    fontSize: isTablet ? FontSize.lg : FontSize.base,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: Spacing.xl,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '60%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.primary + '30',
  },

  // Welcome back
  welcomeBack: {
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
  welcomeBackText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  welcomeBackName: {
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },

  // Card
  card: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.md,
    marginBottom: Spacing.xl,
  },
  cardTablet: {
    width: '60%',
    minWidth: 380,
    maxWidth: 480,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: isTablet ? FontSize.xxl : FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  cardSub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },

  // Fields
  fieldGroup: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  inputWrapError: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorSurface,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: isTablet ? FontSize.lg : FontSize.base,
    color: Colors.textPrimary,
  },

  // Error
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.errorSurface,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
    justifyContent: 'flex-end',
    borderWidth: 1,
    borderColor: Colors.error + '40',
  },
  errorText: {
    fontSize: FontSize.sm,
    color: Colors.error,
    flex: 1,
    textAlign: 'right',
  },

  // Privacy
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    marginTop: Spacing.xs,
  },
  privacyText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },

  // Enter button — large, dominant
  enterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    paddingVertical: isTablet ? 18 : 16,
    marginBottom: Spacing.md,
    ...Shadow.gold,
  },
  enterBtnText: {
    fontSize: isTablet ? FontSize.xl : FontSize.lg,
    fontWeight: FontWeight.extrabold,
    color: '#0d0d0f',
    letterSpacing: 0.5,
  },

  // Change visitor
  changeVisitorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 6,
  },
  changeVisitorText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted + '80',
    letterSpacing: 1,
  },
});
