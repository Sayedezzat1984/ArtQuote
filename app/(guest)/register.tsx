// Powered by OnSpace.AI — Visitor Registration Screen
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { useVisitor } from '@/contexts/VisitorContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { isTablet } from '@/constants/responsive';
import { useAuth } from '@/contexts/AuthContext';

export default function VisitorRegisterScreen() {
  const { registerVisitor, currentVisitor, isLoadingVisitor, checkAccessEnabled } = useVisitor();
  const { signOut } = useAuth();
  const { lang, toggleLang, t } = useLanguage();
  const router = useRouter();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEnter = useCallback(async () => {
    const trimName = name.trim();
    const trimPhone = phone.trim();
    if (!trimName) { setError(lang === 'ar' ? 'يرجى إدخال الاسم' : 'Please enter your name'); return; }
    if (!trimPhone) { setError(lang === 'ar' ? 'يرجى إدخال رقم الهاتف' : 'Please enter your phone'); return; }
    if (trimPhone.length < 8) { setError(lang === 'ar' ? 'رقم الهاتف غير صحيح' : 'Invalid phone number'); return; }
    setError('');
    setLoading(true);
    try {
      const visitor = await registerVisitor(trimName, trimPhone);
      const allowed = await checkAccessEnabled(visitor.id);
      if (allowed) {
        router.replace('/(guest)/welcome');
      } else {
        setError(lang === 'ar' ? 'عذراً، تم تقييد وصولك للمعرض. يرجى التواصل معنا.' : 'Sorry, your gallery access is restricted. Please contact us.');
      }
    } catch {
      setError(lang === 'ar' ? 'حدث خطأ، حاول مجدداً' : 'An error occurred, please try again');
    } finally {
      setLoading(false);
    }
  }, [name, phone, lang, registerVisitor, checkAccessEnabled, router]);

  useEffect(() => {
    if (isLoadingVisitor) return;
    if (!currentVisitor) return;
    checkAccessEnabled(currentVisitor.id).then(allowed => {
      if (allowed) {
        router.replace('/(guest)/welcome');
      } else {
        setError(lang === 'ar' ? 'عذراً، تم تقييد وصولك للمعرض. يرجى التواصل معنا.' : 'Sorry, your gallery access is restricted.');
      }
    });
  }, [isLoadingVisitor, currentVisitor?.id, checkAccessEnabled, router]);

  if (isLoadingVisitor) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
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
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top bar */}
          <View style={styles.topBar}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable onPress={toggleLang} style={styles.langBtn}>
                <Text style={styles.langBtnText}>{lang === 'ar' ? 'EN' : 'عر'}</Text>
              </Pressable>
              <Pressable onPress={signOut} style={styles.exitBtn}>
                <MaterialIcons name="exit-to-app" size={16} color={Colors.textSecondary} />
                <Text style={styles.exitText}>{t('guestExit')}</Text>
              </Pressable>
            </View>
          </View>

          {/* Branding */}
          <View style={styles.brandSection}>
            <View style={styles.logoCircle}>
              <MaterialIcons name="palette" size={isTablet ? 56 : 44} color={Colors.primary} />
            </View>
            <Text style={styles.brandName}>S.E Gallery</Text>
            <Text style={styles.brandSub}>{t('guestGallerySubtitle')}</Text>
          </View>

          {/* Card */}
          <View style={[styles.card, isTablet && styles.cardTablet]}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="person-add" size={22} color={Colors.primary} />
              <Text style={styles.cardTitle}>{t('guestVisitorReg')}</Text>
            </View>
            <Text style={styles.cardSubtitle}>{t('guestVisitorSub')}</Text>

            {/* Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t('guestNameLabel')}</Text>
              <View style={[styles.inputWrap, error && !name.trim() && styles.inputError]}>
                <TextInput
                  value={name}
                  onChangeText={v => { setName(v); setError(''); }}
                  placeholder={t('guestNamePlaceholder')}
                  placeholderTextColor={Colors.textMuted}
                  style={styles.input}
                  textAlign={lang === 'ar' ? 'right' : 'left'}
                  returnKeyType="next"
                  autoCapitalize="words"
                />
                <MaterialIcons name="person" size={18} color={Colors.textMuted} />
              </View>
            </View>

            {/* Phone */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t('guestPhoneLabel')}</Text>
              <View style={[styles.inputWrap, error && !phone.trim() && styles.inputError]}>
                <TextInput
                  value={phone}
                  onChangeText={v => { setPhone(v.replace(/[^0-9+\-() ]/g, '')); setError(''); }}
                  placeholder="01XXXXXXXXX"
                  placeholderTextColor={Colors.textMuted}
                  style={styles.input}
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
              <View style={styles.errorRow}>
                <MaterialIcons name="error-outline" size={14} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Privacy */}
            <View style={styles.privacyNote}>
              <MaterialIcons name="lock" size={13} color={Colors.textMuted} />
              <Text style={styles.privacyText}>{t('guestPrivacy')}</Text>
            </View>

            {/* Enter Button */}
            <Pressable
              onPress={handleEnter}
              disabled={loading}
              style={({ pressed }) => [
                styles.enterBtn,
                pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
                loading && { opacity: 0.7 },
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#0d0d0f" />
              ) : (
                <>
                  <MaterialIcons name="photo-library" size={20} color="#0d0d0f" />
                  <Text style={styles.enterBtnText}>{t('guestEnterGallery')}</Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <MaterialIcons name="star" size={10} color={Colors.primary + '60'} />
            <Text style={styles.footerText}>{lang === 'ar' ? 'تجربة مشاهدة فنية متميزة' : 'An exceptional art viewing experience'}</Text>
            <MaterialIcons name="star" size={10} color={Colors.primary + '60'} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, alignItems: 'center', paddingBottom: 40 },
  topBar: { width: '100%', flexDirection: 'row', justifyContent: 'flex-start', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  langBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primarySurface, borderWidth: 1, borderColor: Colors.primary + '50', alignItems: 'center', justifyContent: 'center' },
  langBtnText: { fontSize: FontSize.xs, fontWeight: FontWeight.extrabold, color: Colors.primary },
  exitBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.surfaceElevated, borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: Colors.border },
  exitText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  brandSection: { alignItems: 'center', marginTop: Spacing.xxl, marginBottom: Spacing.xl },
  logoCircle: {
    width: isTablet ? 100 : 80, height: isTablet ? 100 : 80, borderRadius: isTablet ? 50 : 40,
    backgroundColor: Colors.primarySurface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.primary + '40', marginBottom: Spacing.base, ...Shadow.gold,
  },
  brandName: { fontSize: isTablet ? 36 : 28, fontWeight: FontWeight.extrabold, color: Colors.primary, letterSpacing: 1 },
  brandSub: { fontSize: isTablet ? FontSize.base : FontSize.sm, color: Colors.textSecondary, marginTop: 4 },
  card: { width: '90%', backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.xl, borderWidth: 1, borderColor: Colors.border, ...Shadow.md },
  cardTablet: { width: '55%', minWidth: 360 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, justifyContent: 'flex-end', marginBottom: Spacing.xs },
  cardTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  cardSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'right', marginBottom: Spacing.xl },
  fieldGroup: { marginBottom: Spacing.base },
  fieldLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary, textAlign: 'right', marginBottom: Spacing.xs },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm },
  inputError: { borderColor: Colors.error, backgroundColor: Colors.errorSurface },
  input: { flex: 1, paddingVertical: 14, fontSize: FontSize.base, color: Colors.textPrimary },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.errorSurface, borderRadius: Radius.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, marginBottom: Spacing.sm, justifyContent: 'flex-end' },
  errorText: { fontSize: FontSize.sm, color: Colors.error, fontWeight: FontWeight.medium, flex: 1, textAlign: 'right' },
  privacyNote: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginBottom: Spacing.xl, marginTop: Spacing.xs },
  privacyText: { fontSize: FontSize.xs, color: Colors.textMuted },
  enterBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 16, ...Shadow.gold },
  enterBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#0d0d0f' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: Spacing.xl },
  footerText: { fontSize: FontSize.xs, color: Colors.textMuted },
});
