// Powered by OnSpace.AI
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, TextInput,
  Modal, ScrollView, KeyboardAvoidingView, Platform, Dimensions, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { useAlert } from '@/template';
import { isTablet, pagePadding } from '@/constants/responsive';
import { Supplier } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';

const SCREEN_H = Dimensions.get('window').height;

// ──────────────────────────────────────────────
// Supplier Form Modal
// ──────────────────────────────────────────────
function SupplierFormModal({ visible, supplier, onSave, onClose }: {
  visible: boolean; supplier: Supplier | null;
  onSave: (data: Omit<Supplier, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [mobile, setMobile] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    if (supplier) {
      setName(supplier.name || ''); setCompanyName(supplier.companyName || '');
      setContactPerson(supplier.contactPerson || ''); setMobile(supplier.mobile || '');
      setWhatsapp(supplier.whatsapp || ''); setPhone(supplier.phone || '');
      setAddress(supplier.address || ''); setEmail(supplier.email || '');
      setPaymentTerms(supplier.paymentTerms || ''); setDeliveryTime(supplier.deliveryTime || '');
      setNotes(supplier.notes || '');
    } else {
      setName(''); setCompanyName(''); setContactPerson(''); setMobile('');
      setWhatsapp(''); setPhone(''); setAddress(''); setEmail('');
      setPaymentTerms(''); setDeliveryTime(''); setNotes('');
    }
  }, [supplier, visible]);

  function handleSave() {
    if (!name.trim()) { Alert.alert('خطأ', 'يرجى إدخال اسم المورد'); return; }
    onSave({
      name: name.trim(), companyName: companyName.trim(),
      contactPerson: contactPerson.trim(), mobile: mobile.trim(),
      whatsapp: whatsapp.trim(), phone: phone.trim(),
      address: address.trim(), email: email.trim(),
      materialCategories: [], materialIds: [],
      paymentTerms: paymentTerms.trim(), deliveryTime: deliveryTime.trim(),
      notes: notes.trim(),
    });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={sf.overlay}>
          <View style={[sf.sheet, { height: SCREEN_H * 0.92 }]}>
            <View style={sf.handle} />
            <View style={sf.header}>
              <Pressable onPress={onClose} style={sf.backBtn}>
                <MaterialIcons name="arrow-back" size={18} color={Colors.textSecondary} />
                <Text style={sf.backText}>رجوع</Text>
              </Pressable>
              <Text style={sf.title}>{supplier ? 'تعديل المورد' : 'إضافة مورد جديد'}</Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={sf.content}>
              <SField label="اسم المورد *" value={name} onChange={setName} placeholder="الاسم الشخصي" />
              <SField label="اسم الشركة" value={companyName} onChange={setCompanyName} />
              <SField label="الشخص المسؤول" value={contactPerson} onChange={setContactPerson} />

              <Text style={sf.sectionTitle}>بيانات التواصل</Text>
              <View style={sf.row2}>
                <SField label="المحمول" value={mobile} onChange={setMobile} keyboard="phone-pad" containerStyle={{ flex: 1 }} />
                <SField label="واتساب" value={whatsapp} onChange={setWhatsapp} keyboard="phone-pad" containerStyle={{ flex: 1 }} />
              </View>
              <SField label="تليفون" value={phone} onChange={setPhone} keyboard="phone-pad" />
              <SField label="البريد الإلكتروني" value={email} onChange={setEmail} keyboard="email-address" />
              <SField label="العنوان" value={address} onChange={setAddress} multiline />

              <Text style={sf.sectionTitle}>شروط التعامل</Text>
              <SField label="شروط الدفع" value={paymentTerms} onChange={setPaymentTerms} placeholder="مثال: كاش / آجل 30 يوم" />
              <SField label="مدة التوصيل" value={deliveryTime} onChange={setDeliveryTime} placeholder="مثال: 2-3 أيام عمل" />
              <SField label="ملاحظات" value={notes} onChange={setNotes} multiline />

              <View style={sf.btnRow}>
                <Pressable onPress={onClose} style={[sf.btn, { backgroundColor: Colors.surfaceElevated }]}>
                  <Text style={{ color: Colors.textSecondary, fontWeight: FontWeight.semibold }}>إلغاء</Text>
                </Pressable>
                <Pressable onPress={handleSave} style={[sf.btn, { backgroundColor: Colors.primary, flex: 1 }]}>
                  <MaterialIcons name="save" size={18} color={Colors.textOnPrimary} />
                  <Text style={{ color: Colors.textOnPrimary, fontWeight: FontWeight.bold }}>{supplier ? 'حفظ التعديلات' : 'إضافة المورد'}</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function SField({ label, value, onChange, placeholder, multiline, keyboard, containerStyle }: any) {
  return (
    <View style={[{ marginBottom: Spacing.md }, containerStyle]}>
      <Text style={sf.fieldLabel}>{label}</Text>
      <TextInput
        value={value} onChangeText={onChange} multiline={multiline}
        placeholder={placeholder} placeholderTextColor={Colors.textMuted}
        keyboardType={keyboard || 'default'}
        style={[sf.fieldInput, multiline && { height: 80, textAlignVertical: 'top' }]}
        textAlign="right"
      />
    </View>
  );
}

const sf = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginTop: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.surfaceElevated, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 8, borderWidth: 1, borderColor: Colors.border },
  backText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  content: { padding: Spacing.base, paddingBottom: Spacing.xxxl },
  sectionTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary, textAlign: 'right', marginBottom: Spacing.md, marginTop: Spacing.sm, borderRightWidth: 3, borderRightColor: Colors.primary, paddingRight: Spacing.sm },
  fieldLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'right', marginBottom: Spacing.xs, fontWeight: FontWeight.medium },
  fieldInput: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, fontSize: FontSize.base, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },
  row2: { flexDirection: 'row', gap: Spacing.md },
  btnRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xl },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing.base, paddingHorizontal: Spacing.xl, borderRadius: Radius.md },
});

// ──────────────────────────────────────────────
// Supplier Detail Modal
// ──────────────────────────────────────────────
function SupplierDetailModal({ visible, supplier, materials, onEdit, onDelete, onClose }: {
  visible: boolean; supplier: Supplier | null; materials: any[];
  onEdit: () => void; onDelete: () => void; onClose: () => void;
}) {
  if (!supplier) return null;
  const linkedMaterials = materials.filter(m => m.supplierId === supplier.id);

  function call() { if (supplier.mobile) Linking.openURL(`tel:${supplier.mobile}`); }
  function openWhatsApp() { if (supplier.whatsapp) Linking.openURL(`https://wa.me/${supplier.whatsapp.replace(/\D/g, '')}`); }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={sd.overlay}>
        <View style={sd.container}>
          <View style={sd.header}>
            <View style={sd.headerActions}>
              <Pressable onPress={onDelete} style={[sd.headerBtn, { backgroundColor: Colors.errorSurface, borderColor: Colors.error + '60' }]}>
                <MaterialIcons name="delete-outline" size={18} color={Colors.error} />
              </Pressable>
              <Pressable onPress={onEdit} style={[sd.headerBtn, { backgroundColor: Colors.primarySurface, borderColor: Colors.primary }]}>
                <MaterialIcons name="edit" size={18} color={Colors.primary} />
                <Text style={{ fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold }}>تعديل</Text>
              </Pressable>
            </View>
            <Pressable onPress={onClose} style={sd.closeBtn}>
              <MaterialIcons name="close" size={22} color={Colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={sd.content}>
              {/* Avatar & Name */}
              <View style={sd.avatarSection}>
                <View style={sd.avatar}>
                  <Text style={sd.avatarText}>{supplier.name?.[0] || 'م'}</Text>
                </View>
                <Text style={sd.supplierName}>{supplier.name}</Text>
                {supplier.companyName ? <Text style={sd.companyName}>{supplier.companyName}</Text> : null}
                {supplier.contactPerson ? <Text style={sd.contactPerson}>{supplier.contactPerson}</Text> : null}
              </View>

              {/* Contact Buttons */}
              <View style={sd.contactRow}>
                {supplier.mobile ? (
                  <Pressable onPress={call} style={[sd.contactBtn, { backgroundColor: Colors.successSurface }]}>
                    <MaterialIcons name="phone" size={20} color={Colors.success} />
                    <Text style={[sd.contactBtnText, { color: Colors.success }]}>{supplier.mobile}</Text>
                  </Pressable>
                ) : null}
                {supplier.whatsapp ? (
                  <Pressable onPress={openWhatsApp} style={[sd.contactBtn, { backgroundColor: Colors.primarySurface }]}>
                    <MaterialIcons name="chat" size={20} color={Colors.primary} />
                    <Text style={[sd.contactBtnText, { color: Colors.primary }]}>واتساب</Text>
                  </Pressable>
                ) : null}
              </View>

              {/* Details */}
              {supplier.address ? <InfoRow icon="location-on" label="العنوان" value={supplier.address} /> : null}
              {supplier.email ? <InfoRow icon="email" label="البريد" value={supplier.email} /> : null}
              {supplier.paymentTerms ? <InfoRow icon="payment" label="شروط الدفع" value={supplier.paymentTerms} /> : null}
              {supplier.deliveryTime ? <InfoRow icon="local-shipping" label="مدة التوصيل" value={supplier.deliveryTime} /> : null}
              {supplier.notes ? <InfoRow icon="notes" label="ملاحظات" value={supplier.notes} /> : null}

              {/* Linked Materials */}
              {linkedMaterials.length > 0 ? (
                <View style={sd.materialsSection}>
                  <Text style={sd.sectionTitle}>الخامات المرتبطة ({linkedMaterials.length})</Text>
                  {linkedMaterials.map(m => (
                    <View key={m.id} style={sd.materialRow}>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={sd.materialName}>{m.name}</Text>
                        {m.category ? <Text style={sd.materialCat}>{m.category}</Text> : null}
                      </View>
                      <Text style={sd.materialPrice}>{m.unitPrice?.toLocaleString() || 0} ج.م/{m.purchaseUnit || 'وحدة'}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function InfoRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={sd.infoRow}>
      <Text style={sd.infoValue}>{value}</Text>
      <View style={sd.infoLeft}>
        <MaterialIcons name={icon} size={16} color={Colors.primary} />
        <Text style={sd.infoLabel}>{label}</Text>
      </View>
    </View>
  );
}

const sd = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  container: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, maxHeight: '92%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerActions: { flexDirection: 'row', gap: Spacing.sm },
  headerBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.base },
  avatarSection: { alignItems: 'center', marginBottom: Spacing.xl },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primarySurface, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.primary, marginBottom: Spacing.md },
  avatarText: { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold, color: Colors.primary },
  supplierName: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'center' },
  companyName: { fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center', marginTop: 4 },
  contactPerson: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  contactRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  contactBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.md, borderRadius: Radius.md },
  contactBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  infoValue: { fontSize: FontSize.sm, color: Colors.textPrimary, flex: 1, textAlign: 'right' },
  materialsSection: { marginTop: Spacing.xl },
  sectionTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'right', marginBottom: Spacing.md, borderRightWidth: 3, borderRightColor: Colors.primary, paddingRight: Spacing.sm },
  materialRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  materialName: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.semibold },
  materialCat: { fontSize: FontSize.xs, color: Colors.textMuted },
  materialPrice: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.bold },
});

// ──────────────────────────────────────────────
// Supplier Card
// ──────────────────────────────────────────────
function SupplierCard({ supplier, materialsCount, onPress }: {
  supplier: Supplier; materialsCount: number; onPress: () => void;
}) {
  function call(e: any) { e.stopPropagation(); if (supplier.mobile) Linking.openURL(`tel:${supplier.mobile}`); }
  function openWA(e: any) { e.stopPropagation(); if (supplier.whatsapp) Linking.openURL(`https://wa.me/${supplier.whatsapp.replace(/\D/g, '')}`); }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [sc.card, pressed && { opacity: 0.88 }]}>
      <View style={sc.top}>
        <View style={sc.avatar}>
          <Text style={sc.avatarText}>{supplier.name?.[0] || 'م'}</Text>
        </View>
        <View style={sc.info}>
          <Text style={sc.name} numberOfLines={1}>{supplier.name}</Text>
          {supplier.companyName ? <Text style={sc.company} numberOfLines={1}>{supplier.companyName}</Text> : null}
          {supplier.contactPerson ? <Text style={sc.contact}>{supplier.contactPerson}</Text> : null}
        </View>
        <View style={sc.matsBadge}>
          <Text style={sc.matsCount}>{materialsCount}</Text>
          <Text style={sc.matsLabel}>خامة</Text>
        </View>
      </View>
      {(supplier.mobile || supplier.whatsapp) ? (
        <View style={sc.actions}>
          {supplier.mobile ? (
            <Pressable onPress={call} style={[sc.actionBtn, { backgroundColor: Colors.successSurface }]}>
              <MaterialIcons name="phone" size={16} color={Colors.success} />
              <Text style={[sc.actionText, { color: Colors.success }]}>{supplier.mobile}</Text>
            </Pressable>
          ) : null}
          {supplier.whatsapp ? (
            <Pressable onPress={openWA} style={[sc.actionBtn, { backgroundColor: Colors.primarySurface }]}>
              <MaterialIcons name="chat" size={16} color={Colors.primary} />
              <Text style={[sc.actionText, { color: Colors.primary }]}>واتساب</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

const sc = StyleSheet.create({
  card: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.base, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  top: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center', marginBottom: Spacing.md },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.primarySurface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.primary + '60' },
  avatarText: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.primary },
  info: { flex: 1, alignItems: 'flex-end' },
  name: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  company: { fontSize: FontSize.sm, color: Colors.textSecondary },
  contact: { fontSize: FontSize.xs, color: Colors.textMuted },
  matsBadge: { alignItems: 'center', backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  matsCount: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.primary },
  matsLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing.sm, borderRadius: Radius.md },
  actionText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
});

// ──────────────────────────────────────────────
// Main Screen
// ──────────────────────────────────────────────
export default function SuppliersScreen() {
  const { suppliers, fullMaterials, addSupplier, updateSupplier, deleteSupplier } = useApp();
  const { showAlert } = useAlert();
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [detailSupplier, setDetailSupplier] = useState<Supplier | null>(null);

  const filtered = useMemo(() => suppliers.filter(s =>
    !search || s.name.includes(search) || s.companyName?.includes(search) || s.mobile?.includes(search)
  ), [suppliers, search]);

  function getMaterialsCount(supplierId: string) {
    return fullMaterials.filter(m => m.supplierId === supplierId).length;
  }

  function handleDelete(s: Supplier) {
    showAlert('حذف المورد', `هل أنت متأكد من حذف "${s.name}"؟`, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: () => { deleteSupplier(s.id); setDetailSupplier(null); } },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        {isAdmin ? (
          <Pressable onPress={() => { setEditingSupplier(null); setShowForm(true); }} style={styles.addBtn}>
            <MaterialIcons name="add" size={22} color={Colors.textOnPrimary} />
          </Pressable>
        ) : (
          <View style={[styles.addBtn, { backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border }]}>
            <MaterialIcons name="lock" size={18} color={Colors.textMuted} />
          </View>
        )}
        <Text style={styles.title}>سجل الموردين</Text>
      </View>
      {!isAdmin ? (
        <View style={styles.guestBanner}>
          <MaterialIcons name="visibility" size={14} color={Colors.info} />
          <Text style={styles.guestBannerText}>وضع العرض فقط — التعديلات متاحة للمشرف</Text>
        </View>
      ) : null}

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{suppliers.length}</Text>
          <Text style={styles.statLabel}>إجمالي الموردين</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{fullMaterials.length}</Text>
          <Text style={styles.statLabel}>الخامات المسجلة</Text>
        </View>
        <View style={[styles.statCard, { borderColor: Colors.primary + '40' }]}>
          <Text style={[styles.statValue, { color: Colors.primary }]}>
            {suppliers.filter(s => s.mobile || s.whatsapp).length}
          </Text>
          <Text style={styles.statLabel}>لديهم تواصل</Text>
        </View>
      </View>

      <View style={styles.searchBar}>
        <MaterialIcons name="search" size={20} color={Colors.textMuted} />
        <TextInput value={search} onChangeText={setSearch} placeholder="ابحث عن مورد..." placeholderTextColor={Colors.textMuted} style={styles.searchInput} textAlign="right" />
        {search ? <Pressable onPress={() => setSearch('')} hitSlop={8}><MaterialIcons name="close" size={16} color={Colors.textMuted} /></Pressable> : null}
      </View>

      <FlatList
        data={filtered} keyExtractor={s => s.id}
        numColumns={isTablet ? 2 : 1}
        key={isTablet ? 'tablet' : 'phone'}
        columnWrapperStyle={isTablet ? { gap: Spacing.md } : undefined}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', padding: Spacing.xxxl }}>
            <MaterialIcons name="people-outline" size={56} color={Colors.textMuted} />
            <Text style={{ color: Colors.textMuted, marginTop: Spacing.md, fontSize: FontSize.base, textAlign: 'center' }}>
              {search ? 'لا توجد نتائج' : 'اضغط + لإضافة أول مورد'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={isTablet ? { flex: 1 } : undefined}>
            <SupplierCard
              supplier={item}
              materialsCount={getMaterialsCount(item.id)}
              onPress={isAdmin ? () => setDetailSupplier(item) : undefined}
            />
          </View>
        )}
      />

      {isAdmin ? (
        <SupplierFormModal
          visible={showForm} supplier={editingSupplier}
          onSave={data => {
            if (editingSupplier) updateSupplier(editingSupplier.id, data);
            else addSupplier(data);
            setShowForm(false); setEditingSupplier(null);
          }}
          onClose={() => { setShowForm(false); setEditingSupplier(null); }}
        />
      ) : null}

      {isAdmin ? (
        <SupplierDetailModal
          visible={detailSupplier !== null} supplier={detailSupplier}
          materials={fullMaterials}
          onEdit={() => { setEditingSupplier(detailSupplier); setDetailSupplier(null); setShowForm(true); }}
          onDelete={() => detailSupplier && handleDelete(detailSupplier)}
          onClose={() => setDetailSupplier(null)}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: pagePadding, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: isTablet ? FontSize.xxl : FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  addBtn: { width: isTablet ? 48 : 40, height: isTablet ? 48 : 40, borderRadius: isTablet ? 24 : 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, padding: pagePadding, paddingBottom: Spacing.sm },
  statCard: { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  statValue: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2, textAlign: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, paddingHorizontal: Spacing.md, margin: pagePadding, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, paddingVertical: Spacing.md, fontSize: FontSize.base, color: Colors.textPrimary, marginRight: Spacing.sm },
  list: { padding: pagePadding, paddingTop: Spacing.sm },
  guestBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.infoSurface, paddingHorizontal: pagePadding, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.info + '30', justifyContent: 'center' },
  guestBannerText: { fontSize: FontSize.xs, color: Colors.info, fontWeight: FontWeight.medium },
});
