// Powered by OnSpace.AI
import React, { useState, useEffect } from 'react';
import { View, Text, Modal, ScrollView, StyleSheet, Alert, Pressable, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';
import { Platform } from 'react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { globalStyles } from '@/constants/styles';
import { Customer } from '@/contexts/AppContext';

interface CustomerFormModalProps {
  visible: boolean;
  customer?: Customer | null;
  onSave: (data: Omit<Customer, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

export function CustomerFormModal({ visible, customer, onSave, onClose }: CustomerFormModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [importingContact, setImportingContact] = useState(false);

  useEffect(() => {
    if (customer) {
      setName(customer.name); setPhone(customer.phone);
      setEmail(customer.email); setAddress(customer.address); setNotes(customer.notes);
    } else {
      setName(''); setPhone(''); setEmail(''); setAddress(''); setNotes('');
    }
  }, [customer, visible]);

  async function handleImportContact() {
    if (Platform.OS === 'web') {
      Alert.alert('تنبيه', 'هذه الميزة غير متاحة على الويب');
      return;
    }
    try {
      setImportingContact(true);
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('تنبيه', 'يحتاج التطبيق إذن الوصول لجهات الاتصال');
        return;
      }
      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Emails,
          Contacts.Fields.Addresses,
        ],
      });
      if (data.length === 0) {
        Alert.alert('لا توجد جهات اتصال', 'لم يتم العثور على جهات اتصال في الجهاز');
        return;
      }
      showContactPicker(data);
    } catch {
      Alert.alert('خطأ', 'تعذر الوصول إلى جهات الاتصال');
    } finally {
      setImportingContact(false);
    }
  }

  function showContactPicker(contacts: Contacts.Contact[]) {
    // Build alert options (max 8 contacts for Alert)
    const topContacts = contacts
      .filter(c => c.name)
      .slice(0, 6)
      .map(c => ({
        text: c.name || '',
        onPress: () => fillFromContact(c),
      }));
    topContacts.push({ text: 'إلغاء', onPress: () => {} });
    Alert.alert('اختر جهة اتصال', `عُثر على ${contacts.length} جهة اتصال`, topContacts, { cancelable: true });
  }

  function fillFromContact(contact: Contacts.Contact) {
    if (contact.name) setName(contact.name);
    if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
      const ph = contact.phoneNumbers[0].number || '';
      setPhone(ph.replace(/\s|-/g, ''));
    }
    if (contact.emails && contact.emails.length > 0) {
      setEmail(contact.emails[0].email || '');
    }
    if (contact.addresses && contact.addresses.length > 0) {
      const addr = contact.addresses[0];
      const parts = [addr.street, addr.city, addr.region].filter(Boolean);
      setAddress(parts.join('، '));
    }
  }

  function handleSave() {
    if (!name.trim()) { Alert.alert('خطأ', 'يرجى إدخال اسم العميل'); return; }
    if (!phone.trim()) { Alert.alert('خطأ', 'يرجى إدخال رقم الجوال'); return; }
    setLoading(true);
    setTimeout(() => {
      onSave({ name: name.trim(), phone: phone.trim(), email: email.trim(), address: address.trim(), notes: notes.trim() });
      setLoading(false);
    }, 300);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={globalStyles.overlay}>
        <View style={globalStyles.modalSheet}>
          <View style={globalStyles.modalHandle} />
          <View style={styles.headerRow}>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={20} color={Colors.textSecondary} />
            </Pressable>
            <Text style={globalStyles.modalTitle}>{customer ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}</Text>
          </View>

          {/* Import from Contacts button */}
          <Pressable
            onPress={handleImportContact}
            disabled={importingContact}
            style={({ pressed }) => [styles.importBtn, pressed && { opacity: 0.75 }]}
          >
            <MaterialIcons name="contact-phone" size={20} color={Colors.primary} />
            <Text style={styles.importBtnText}>
              {importingContact ? 'جاري الاستيراد...' : 'استيراد من جهات الاتصال'}
            </Text>
            <MaterialIcons name="chevron-left" size={18} color={Colors.primary} />
          </Pressable>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Input label="الاسم الكامل *" value={name} onChangeText={setName} placeholder="اسم العميل" />
            <Input label="رقم الجوال *" value={phone} onChangeText={setPhone} placeholder="01XXXXXXXXX" keyboardType="phone-pad" />
            <Input label="البريد الإلكتروني" value={email} onChangeText={setEmail} placeholder="example@email.com" keyboardType="email-address" autoCapitalize="none" />
            <Input label="العنوان" value={address} onChangeText={setAddress} placeholder="المدينة، الحي" />
            <Input label="ملاحظات" value={notes} onChangeText={setNotes} placeholder="أي تفاصيل مهمة عن العميل..." multiline numberOfLines={3} />
            <View style={styles.btnRow}>
              <Button title="إلغاء" onPress={onClose} variant="ghost" style={styles.halfBtn} />
              <Button title={customer ? 'حفظ التعديلات' : 'إضافة العميل'} onPress={handleSave} loading={loading} style={styles.halfBtn} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primarySurface,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.primary + '50',
    marginBottom: Spacing.base,
  },
  importBtnText: {
    flex: 1,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
    textAlign: 'right',
    marginRight: Spacing.sm,
  },
  btnRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.base },
  halfBtn: { flex: 1 },
});
