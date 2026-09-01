// Powered by OnSpace.AI
import React, { useState, useEffect } from 'react';
import { View, Text, Modal, ScrollView, StyleSheet, Alert } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
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

  useEffect(() => {
    if (customer) {
      setName(customer.name); setPhone(customer.phone);
      setEmail(customer.email); setAddress(customer.address); setNotes(customer.notes);
    } else {
      setName(''); setPhone(''); setEmail(''); setAddress(''); setNotes('');
    }
  }, [customer, visible]);

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
          <Text style={globalStyles.modalTitle}>{customer ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Input label="الاسم الكامل *" value={name} onChangeText={setName} placeholder="اسم العميل" />
            <Input label="رقم الجوال *" value={phone} onChangeText={setPhone} placeholder="05XXXXXXXX" keyboardType="phone-pad" />
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
  btnRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.base },
  halfBtn: { flex: 1 },
});
