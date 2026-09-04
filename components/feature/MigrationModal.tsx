// Powered by OnSpace.AI
import React, { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ActivityIndicator, Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function MigrationModal({ visible, onClose }: Props) {
  const { migrateLocalToFirestore } = useApp() as any;
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [result, setResult] = useState({ migrated: 0, skipped: 0 });
  const [errMsg, setErrMsg] = useState('');

  async function handleMigrate() {
    setStatus('running');
    setErrMsg('');
    try {
      const res = await migrateLocalToFirestore();
      setResult(res);
      setStatus('done');
    } catch (err: any) {
      setErrMsg(err?.message || 'خطأ أثناء النقل');
      setStatus('error');
    }
  }

  function handleClose() {
    setStatus('idle');
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.handle} />
          <View style={s.header}>
            <Pressable onPress={handleClose} style={s.closeBtn}>
              <MaterialIcons name="close" size={20} color={Colors.textSecondary} />
            </Pressable>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <MaterialIcons name="cloud-upload" size={22} color={Colors.primary} />
              <Text style={s.title}>نقل البيانات إلى Firebase</Text>
            </View>
          </View>

          <View style={s.content}>
            {status === 'idle' ? (
              <>
                <View style={s.infoBox}>
                  <MaterialIcons name="info-outline" size={18} color={Colors.info} />
                  <Text style={s.infoTxt}>
                    هذه العملية تنقل بياناتك المحفوظة محلياً (الأعمال، العملاء، الخامات، الموردين، عروض الأسعار) إلى قاعدة بيانات Firebase لتتزامن عبر جميع الأجهزة.{'\n\n'}
                    لن تُحذف أي بيانات موجودة في Firebase.
                  </Text>
                </View>
                <View style={s.features}>
                  {[
                    'الأعمال الفنية وصورها',
                    'بيانات العملاء',
                    'عروض الأسعار',
                    'الخامات والموردين',
                    'حسابات التكلفة',
                    'أوامر التصنيع والعمال',
                  ].map(f => (
                    <View key={f} style={s.featureRow}>
                      <MaterialIcons name="check-circle" size={16} color={Colors.success} />
                      <Text style={s.featureTxt}>{f}</Text>
                    </View>
                  ))}
                </View>
                <Pressable onPress={handleMigrate} style={s.migrateBtn}>
                  <MaterialIcons name="cloud-upload" size={20} color={Colors.textOnPrimary} />
                  <Text style={s.migrateBtnTxt}>بدء النقل إلى Firebase</Text>
                </Pressable>
                <Pressable onPress={handleClose} style={s.skipBtn}>
                  <Text style={s.skipBtnTxt}>تخطي — لديّ بيانات Firebase بالفعل</Text>
                </Pressable>
              </>
            ) : status === 'running' ? (
              <View style={s.runningBox}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={s.runningTxt}>جارٍ رفع البيانات إلى Firebase...</Text>
                <Text style={s.runningSubTxt}>لا تغلق التطبيق</Text>
              </View>
            ) : status === 'done' ? (
              <View style={s.doneBox}>
                <View style={s.doneIcon}>
                  <MaterialIcons name="cloud-done" size={52} color={Colors.success} />
                </View>
                <Text style={s.doneTxt}>تم النقل بنجاح!</Text>
                <View style={s.resultRow}>
                  <View style={s.resultCard}>
                    <Text style={[s.resultVal, { color: Colors.success }]}>{result.migrated}</Text>
                    <Text style={s.resultLbl}>سجل جديد تم رفعه</Text>
                  </View>
                  <View style={s.resultCard}>
                    <Text style={[s.resultVal, { color: Colors.textMuted }]}>{result.skipped}</Text>
                    <Text style={s.resultLbl}>سجل موجود بالفعل</Text>
                  </View>
                </View>
                <Text style={s.doneSub}>بياناتك الآن متاحة على جميع الأجهزة</Text>
                <Pressable onPress={handleClose} style={s.doneBtn}>
                  <Text style={s.doneBtnTxt}>ممتاز</Text>
                </Pressable>
              </View>
            ) : (
              <View style={s.errorBox}>
                <MaterialIcons name="error-outline" size={48} color={Colors.error} />
                <Text style={s.errorTxt}>حدث خطأ أثناء النقل</Text>
                <Text style={s.errorMsg}>{errMsg}</Text>
                <Pressable onPress={handleMigrate} style={[s.migrateBtn, { marginTop: Spacing.xl }]}>
                  <Text style={s.migrateBtnTxt}>إعادة المحاولة</Text>
                </Pressable>
                <Pressable onPress={handleClose} style={s.skipBtn}>
                  <Text style={s.skipBtnTxt}>إغلاق</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, maxHeight: '90%' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginTop: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.xl },
  infoBox: { flexDirection: 'row', gap: Spacing.sm, backgroundColor: Colors.infoSurface, borderRadius: Radius.md, padding: Spacing.base, marginBottom: Spacing.xl, borderWidth: 1, borderColor: Colors.info + '40', alignItems: 'flex-start' },
  infoTxt: { flex: 1, fontSize: FontSize.sm, color: Colors.info, textAlign: 'right', lineHeight: 20 },
  features: { gap: Spacing.sm, marginBottom: Spacing.xl },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, justifyContent: 'flex-end' },
  featureTxt: { fontSize: FontSize.sm, color: Colors.textSecondary },
  migrateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: Spacing.base, marginBottom: Spacing.md, ...Shadow.gold },
  migrateBtnTxt: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textOnPrimary },
  skipBtn: { alignItems: 'center', paddingVertical: Spacing.md },
  skipBtnTxt: { fontSize: FontSize.sm, color: Colors.textMuted },
  runningBox: { alignItems: 'center', paddingVertical: Spacing.xxxl, gap: Spacing.lg },
  runningTxt: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  runningSubTxt: { fontSize: FontSize.sm, color: Colors.textMuted },
  doneBox: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.md },
  doneIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.successSurface, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.success },
  doneTxt: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  resultRow: { flexDirection: 'row', gap: Spacing.md },
  resultCard: { flex: 1, backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.base, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  resultVal: { fontSize: FontSize.xxxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  resultLbl: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },
  doneSub: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  doneBtn: { backgroundColor: Colors.primarySurface, borderRadius: Radius.md, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xxxl, borderWidth: 1, borderColor: Colors.primary, marginTop: Spacing.sm },
  doneBtnTxt: { color: Colors.primary, fontWeight: FontWeight.bold, fontSize: FontSize.base },
  errorBox: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.md },
  errorTxt: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.error },
  errorMsg: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
});
