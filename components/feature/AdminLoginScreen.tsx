// Powered by OnSpace.AI
import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { ADMIN_EMAIL } from '@/services/firebase';

const { width: SW, height: SH } = Dimensions.get('window');

export function AdminLoginScreen() {
  const { signIn, enterClientMode, authError, authLoading, clearError } = useAuth();
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showReset, setShowReset] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) return;
    await signIn(email, password);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Logo / Brand */}
          <View style={s.brand}>
            <View style={s.logoCircle}>
              <MaterialIcons name="palette" size={40} color={Colors.primary} />
            </View>
            <Text style={s.appName}>Sayed Ezzat</Text>
            <Text style={s.appSub}>فنان تشكيلي</Text>
          </View>

          {/* Admin Login Card */}
          <View style={s.card}>
            <View style={s.cardHeader}>
              <MaterialIcons name="admin-panel-settings" size={20} color={Colors.primary} />
              <Text style={s.cardTitle}>دخول المشرف</Text>
            </View>

            {authError ? (
              <View style={s.errorBox}>
                <MaterialIcons name="error-outline" size={16} color={Colors.error} />
                <Text style={s.errorTxt}>{authError}</Text>
                <Pressable onPress={clearError} hitSlop={8}>
                  <MaterialIcons name="close" size={14} color={Colors.error} />
                </Pressable>
              </View>
            ) : null}

            {/* Email */}
            <View style={s.field}>
              <Text style={s.fieldLabel}>البريد الإلكتروني</Text>
              <View style={s.inputRow}>
                <MaterialIcons name="email" size={18} color={Colors.textMuted} style={s.inputIcon} />
                <TextInput
                  value={email}
                  onChangeText={v => { setEmail(v); clearError(); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={s.input}
                  textAlign="right"
                  placeholder="your@email.com"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </View>

            {/* Password */}
            <View style={s.field}>
              <Text style={s.fieldLabel}>كلمة المرور</Text>
              <View style={s.inputRow}>
                <Pressable onPress={() => setShowPwd(!showPwd)} hitSlop={8} style={s.inputIcon}>
                  <MaterialIcons name={showPwd ? 'visibility-off' : 'visibility'} size={18} color={Colors.textMuted} />
                </Pressable>
                <TextInput
                  value={password}
                  onChangeText={v => { setPassword(v); clearError(); }}
                  secureTextEntry={!showPwd}
                  style={s.input}
                  textAlign="right"
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textMuted}
                  onSubmitEditing={handleLogin}
                  returnKeyType="go"
                />
              </View>
            </View>

            {/* Forgot password */}
            <Pressable onPress={() => setShowReset(true)} style={s.forgotRow}>
              <Text style={s.forgotTxt}>نسيت كلمة المرور؟</Text>
            </Pressable>

            {/* Login button */}
            <Pressable
              onPress={handleLogin}
              disabled={authLoading || !password}
              style={[s.loginBtn, (authLoading || !password) && s.loginBtnDisabled]}
            >
              {authLoading ? (
                <ActivityIndicator size="small" color={Colors.textOnPrimary} />
              ) : (
                <>
                  <MaterialIcons name="login" size={20} color={Colors.textOnPrimary} />
                  <Text style={s.loginBtnTxt}>دخول كمشرف</Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Divider */}
          <View style={s.dividerRow}>
            <View style={s.dividerLine} />
            <Text style={s.dividerTxt}>أو</Text>
            <View style={s.dividerLine} />
          </View>

          {/* Client Mode */}
          <Pressable onPress={enterClientMode} style={s.clientBtn}>
            <MaterialIcons name="visibility" size={18} color={Colors.textSecondary} />
            <Text style={s.clientBtnTxt}>متابعة كزائر (عرض فقط)</Text>
          </Pressable>

          <Text style={s.footerTxt}>بيانات الأعمال الفنية والأسعار والتكاليف للمشرف فقط</Text>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Reset Password Sheet */}
      {showReset ? (
        <ResetPasswordSheet onClose={() => setShowReset(false)} />
      ) : null}
    </SafeAreaView>
  );
}

// ─── Reset Password ──────────────────────────────────────────────────────────
function ResetPasswordSheet({ onClose }: { onClose: () => void }) {
  const { resetPassword, authLoading } = useAuth();
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [sent, setSent] = useState(false);

  async function handleReset() {
    if (!email.trim()) return;
    await resetPassword(email);
    setSent(true);
  }

  return (
    <View style={rs.overlay}>
      <View style={rs.sheet}>
        <View style={rs.handle} />
        <View style={rs.header}>
          <Pressable onPress={onClose} style={rs.closeBtn}>
            <MaterialIcons name="close" size={20} color={Colors.textSecondary} />
          </Pressable>
          <Text style={rs.title}>استعادة كلمة المرور</Text>
        </View>
        {sent ? (
          <View style={rs.sentBox}>
            <MaterialIcons name="check-circle" size={48} color={Colors.success} />
            <Text style={rs.sentTxt}>تم إرسال رابط الاستعادة على بريدك الإلكتروني</Text>
            <Pressable onPress={onClose} style={rs.doneBtn}>
              <Text style={rs.doneBtnTxt}>تم</Text>
            </Pressable>
          </View>
        ) : (
          <View style={rs.content}>
            <Text style={rs.label}>أدخل بريدك الإلكتروني</Text>
            <TextInput
              value={email} onChangeText={setEmail}
              keyboardType="email-address" autoCapitalize="none"
              style={rs.input} textAlign="right"
              placeholder="your@email.com"
              placeholderTextColor={Colors.textMuted}
            />
            <Pressable onPress={handleReset} disabled={authLoading} style={rs.sendBtn}>
              {authLoading ? <ActivityIndicator size="small" color={Colors.textOnPrimary} /> : <Text style={rs.sendBtnTxt}>إرسال رابط الاستعادة</Text>}
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const rs = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, paddingBottom: 40 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginTop: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.base },
  label: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'right', marginBottom: Spacing.sm },
  input: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.md, fontSize: FontSize.base, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.base },
  sendBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, padding: Spacing.base, alignItems: 'center' },
  sendBtnTxt: { color: Colors.textOnPrimary, fontWeight: FontWeight.bold },
  sentBox: { alignItems: 'center', padding: Spacing.xxxl, gap: Spacing.md },
  sentTxt: { fontSize: FontSize.base, color: Colors.textPrimary, textAlign: 'center' },
  doneBtn: { backgroundColor: Colors.primarySurface, borderRadius: Radius.md, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xxxl, borderWidth: 1, borderColor: Colors.primary },
  doneBtnTxt: { color: Colors.primary, fontWeight: FontWeight.bold },
});

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, padding: Spacing.xl, alignItems: 'center', justifyContent: 'center', minHeight: SH * 0.9 },
  brand: { alignItems: 'center', marginBottom: Spacing.xxxl },
  logoCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.primarySurface,
    borderWidth: 2, borderColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.base,
    ...Shadow.gold,
  },
  appName: { fontSize: FontSize.xxxl, fontWeight: FontWeight.extrabold, color: Colors.primary, letterSpacing: 1 },
  appSub: { fontSize: FontSize.base, color: Colors.textSecondary, marginTop: 4 },
  card: {
    width: '100%', maxWidth: 400,
    backgroundColor: Colors.card,
    borderRadius: Radius.xl, padding: Spacing.xl,
    borderWidth: 1, borderColor: Colors.border,
    ...Shadow.md,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, justifyContent: 'flex-end', marginBottom: Spacing.xl },
  cardTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.errorSurface, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.error + '40' },
  errorTxt: { flex: 1, fontSize: FontSize.sm, color: Colors.error, textAlign: 'right' },
  field: { marginBottom: Spacing.base },
  fieldLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'right', marginBottom: Spacing.xs, fontWeight: FontWeight.medium },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  inputIcon: { paddingHorizontal: Spacing.md },
  input: { flex: 1, paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm, fontSize: FontSize.base, color: Colors.textPrimary },
  forgotRow: { alignItems: 'flex-end', marginBottom: Spacing.base },
  forgotTxt: { fontSize: FontSize.xs, color: Colors.primary },
  loginBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: Spacing.base + 2, ...Shadow.gold },
  loginBtnDisabled: { opacity: 0.5 },
  loginBtnTxt: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textOnPrimary },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginVertical: Spacing.xl, width: '100%', maxWidth: 400 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerTxt: { fontSize: FontSize.sm, color: Colors.textMuted },
  clientBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surfaceElevated, borderRadius: Radius.lg, paddingVertical: Spacing.base, paddingHorizontal: Spacing.xl, borderWidth: 1, borderColor: Colors.border, width: '100%', maxWidth: 400, justifyContent: 'center' },
  clientBtnTxt: { fontSize: FontSize.base, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  footerTxt: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.xl, maxWidth: 300 },
});
