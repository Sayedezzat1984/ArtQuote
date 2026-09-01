// Powered by OnSpace.AI
import React, { useRef, useState } from 'react';
import { View, Text, Modal, ScrollView, StyleSheet, Pressable, Linking, Alert, ActivityIndicator, Share } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { Badge } from '@/components/ui/Badge';
import { Quote, Artwork, Customer } from '@/contexts/AppContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { exportQuoteAsPDF, exportQuoteAsJPG } from '@/services/exportService';

interface QuoteDetailModalProps {
  visible: boolean;
  quote: Quote | null;
  artworks: Artwork[];
  customers: Customer[];
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const statusConfig: Record<Quote['status'], { label: string; color: string; variant: any }> = {
  draft: { label: 'مسودة', color: Colors.textMuted, variant: 'default' },
  sent: { label: 'مُرسل', color: Colors.primary, variant: 'primary' },
  accepted: { label: 'مقبول', color: Colors.success, variant: 'success' },
  rejected: { label: 'مرفوض', color: Colors.error, variant: 'error' },
};

export function QuoteDetailModal({ visible, quote, artworks, customers, onClose, onEdit, onDelete }: QuoteDetailModalProps) {
  const { currency, lang } = useLanguage();
  const captureRef = useRef<View>(null);
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [loadingJPG, setLoadingJPG] = useState(false);

  if (!quote) return null;

  const status = statusConfig[quote.status];
  const customer = customers.find(c => c.id === quote.customerId);
  const createdDate = new Date(quote.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  const validDate = quote.validUntil ? new Date(quote.validUntil).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : null;

  function buildShareText() {
    const lines = [
      `🎨 *Sayed Ezzat* - فنان تشكيلي`,
      ``,
      `📋 *عرض سعر: ${quote.quoteNumber}*`,
      `👤 العميل: ${quote.customerName}`,
      `📅 التاريخ: ${createdDate}`,
      validDate ? `⏰ صالح حتى: ${validDate}` : '',
      ``,
      `🖼️ *الأعمال والمنتجات:*`,
      ...quote.items.map(item => {
        const art = artworks.find(a => a.id === item.artworkId);
        const dims = art?.dimensions ? ` (${art.dimensions})` : '';
        return `• ${item.title}${dims}\n  ${item.quantity} × ${item.price.toLocaleString()} = ${(item.price * item.quantity).toLocaleString()} ${currency}`;
      }),
      ``,
      `💰 *المجموع الفرعي:* ${quote.subtotal.toLocaleString()} ${currency}`,
      quote.discount > 0 ? `🏷️ *الخصم:* ${quote.discount.toLocaleString()} ${currency}` : '',
      `✅ *الإجمالي النهائي: ${quote.total.toLocaleString()} ${currency}*`,
      quote.paymentTerms ? `\n💳 *شروط الدفع:* ${quote.paymentTerms}` : '',
      quote.deliveryPeriod ? `🚚 *مدة التسليم:* ${quote.deliveryPeriod}` : '',
      quote.notes ? `\n📝 *ملاحظات:* ${quote.notes}` : '',
    ].filter(Boolean).join('\n');
    return lines;
  }

  function handleWhatsApp() {
    const phone = customer?.phone?.replace(/[^0-9]/g, '') || '';
    const text = encodeURIComponent(buildShareText());
    const url = phone
      ? `whatsapp://send?phone=${phone.startsWith('0') ? '2' + phone : phone}&text=${text}`
      : `whatsapp://send?text=${text}`;
    Linking.openURL(url).catch(() => Alert.alert('خطأ', 'تأكد من تثبيت WhatsApp'));
  }

  function handleTelegram() {
    const text = encodeURIComponent(buildShareText());
    const phone = customer?.phone?.replace(/[^0-9]/g, '') || '';
    const url = phone
      ? `tg://resolve?phone=${phone.startsWith('0') ? '+2' + phone : '+' + phone}&text=${text}`
      : `https://t.me/share/url?url=&text=${text}`;
    Linking.openURL(url).catch(() => Alert.alert('خطأ', 'تأكد من تثبيت Telegram'));
  }

  function handleShare() {
    Share.share({ message: buildShareText(), title: quote.quoteNumber });
  }

  async function handlePDF() {
    setLoadingPDF(true);
    await exportQuoteAsPDF(quote, lang, currency);
    setLoadingPDF(false);
  }

  async function handleJPG() {
    setLoadingJPG(true);
    await exportQuoteAsJPG(captureRef, quote);
    setLoadingJPG(false);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Top Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {onDelete ? (
                <Pressable onPress={onDelete} style={[styles.headerBtn, styles.deleteBtn]}>
                  <MaterialIcons name="delete-outline" size={16} color={Colors.error} />
                </Pressable>
              ) : null}
              {onEdit ? (
                <Pressable onPress={onEdit} style={[styles.headerBtn, styles.editBtn]}>
                  <MaterialIcons name="edit" size={16} color={Colors.primary} />
                  <Text style={styles.editBtnText}>تعديل</Text>
                </Pressable>
              ) : null}
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={22} color={Colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Capturable Quote Card */}
            <View ref={captureRef} collapsable={false}>
              {/* Brand Header */}
              <View style={styles.brandHeader}>
                <View style={styles.brandLogoWrap}>
                  <MaterialIcons name="palette" size={28} color={Colors.primary} />
                </View>
                <View style={styles.brandInfo}>
                  <Text style={styles.brandName}>Sayed Ezzat</Text>
                  <Text style={styles.brandTitle}>فنان تشكيلي</Text>
                </View>
                <Badge label={status.label} variant={status.variant} />
              </View>

              {/* Quote Number & Dates */}
              <View style={styles.quoteMetaCard}>
                <View style={styles.metaRow}>
                  <Text style={styles.metaValue}>{createdDate}</Text>
                  <Text style={styles.metaLabel}>تاريخ الإصدار</Text>
                </View>
                {validDate ? (
                  <View style={[styles.metaRow, styles.metaBorder]}>
                    <Text style={styles.metaValue}>{validDate}</Text>
                    <Text style={styles.metaLabel}>صالح حتى</Text>
                  </View>
                ) : null}
                <View style={[styles.metaRow, styles.metaBorder]}>
                  <Text style={[styles.metaValue, { color: Colors.primary }]}>{quote.quoteNumber}</Text>
                  <Text style={styles.metaLabel}>رقم العرض</Text>
                </View>
              </View>

              {/* Customer Info */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>بيانات العميل</Text>
                <View style={styles.customerCard}>
                  <View style={styles.customerAvatar}>
                    <Text style={styles.customerAvatarText}>{quote.customerName.charAt(0)}</Text>
                  </View>
                  <View style={styles.customerInfo}>
                    <Text style={styles.customerName}>{quote.customerName}</Text>
                    {customer?.phone ? (
                      <View style={styles.customerDetail}>
                        <MaterialIcons name="phone" size={13} color={Colors.textMuted} />
                        <Text style={styles.customerDetailText}>{customer.phone}</Text>
                      </View>
                    ) : null}
                    {customer?.email ? (
                      <View style={styles.customerDetail}>
                        <MaterialIcons name="email" size={13} color={Colors.textMuted} />
                        <Text style={styles.customerDetailText}>{customer.email}</Text>
                      </View>
                    ) : null}
                    {customer?.address ? (
                      <View style={styles.customerDetail}>
                        <MaterialIcons name="location-on" size={13} color={Colors.textMuted} />
                        <Text style={styles.customerDetailText}>{customer.address}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>

              {/* Items */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>الأعمال والمنتجات ({quote.items.length})</Text>
                {quote.items.map((item, idx) => {
                  const artwork = artworks.find(a => a.id === item.artworkId);
                  const coverImg = artwork?.images?.[0] || artwork?.image;
                  return (
                    <View key={idx} style={styles.itemCard}>
                      {coverImg ? (
                        <Image source={{ uri: coverImg }} style={styles.itemImage} contentFit="cover" transition={200} />
                      ) : (
                        <View style={styles.itemImagePlaceholder}>
                          <MaterialIcons name="palette" size={22} color={Colors.textMuted} />
                        </View>
                      )}
                      <View style={styles.itemContent}>
                        <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
                        {artwork ? (
                          <View style={styles.itemMeta}>
                            <Text style={styles.itemCategory}>{artwork.category} · {artwork.year}</Text>
                            {artwork.dimensions ? (
                              <View style={styles.itemDimRow}>
                                <MaterialIcons name="straighten" size={11} color={Colors.textMuted} />
                                <Text style={styles.itemDim}>{artwork.dimensions}</Text>
                              </View>
                            ) : null}
                            {artwork.description ? (
                              <Text style={styles.itemDesc} numberOfLines={2}>{artwork.description}</Text>
                            ) : null}
                          </View>
                        ) : null}
                        <View style={styles.itemPriceRow}>
                          <Text style={styles.itemSubtotal}>{(item.price * item.quantity).toLocaleString()} {currency}</Text>
                          <Text style={styles.itemQtyPrice}>× {item.quantity} | {item.price.toLocaleString()} {currency}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Totals */}
              <View style={styles.totalsCard}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalValue}>{quote.subtotal.toLocaleString()} {currency}</Text>
                  <Text style={styles.totalLabel}>المجموع الفرعي</Text>
                </View>
                {quote.discount > 0 ? (
                  <View style={[styles.totalRow, styles.totalBorder]}>
                    <Text style={[styles.totalValue, { color: Colors.error }]}>- {quote.discount.toLocaleString()} {currency}</Text>
                    <Text style={styles.totalLabel}>الخصم</Text>
                  </View>
                ) : null}
                <View style={[styles.totalRow, styles.totalBorder, styles.grandTotalRow]}>
                  <Text style={styles.grandTotalValue}>{quote.total.toLocaleString()} {currency}</Text>
                  <Text style={styles.grandTotalLabel}>الإجمالي النهائي</Text>
                </View>
              </View>

              {/* Payment Terms & Delivery */}
              {(quote.paymentTerms || quote.deliveryPeriod) ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>شروط التعاقد</Text>
                  <View style={styles.termsCard}>
                    {quote.paymentTerms ? (
                      <View style={styles.termRow}>
                        <Text style={styles.termValue}>{quote.paymentTerms}</Text>
                        <View style={styles.termLabelRow}>
                          <MaterialIcons name="payment" size={14} color={Colors.primary} />
                          <Text style={styles.termLabel}>شروط الدفع</Text>
                        </View>
                      </View>
                    ) : null}
                    {quote.deliveryPeriod ? (
                      <View style={[styles.termRow, quote.paymentTerms ? styles.termBorder : null]}>
                        <Text style={styles.termValue}>{quote.deliveryPeriod}</Text>
                        <View style={styles.termLabelRow}>
                          <MaterialIcons name="schedule" size={14} color={Colors.primary} />
                          <Text style={styles.termLabel}>مدة التسليم</Text>
                        </View>
                      </View>
                    ) : null}
                  </View>
                </View>
              ) : null}

              {/* Notes */}
              {quote.notes ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>ملاحظات</Text>
                  <View style={styles.notesCard}>
                    <Text style={styles.notesText}>{quote.notes}</Text>
                  </View>
                </View>
              ) : null}

              {/* Footer */}
              <View style={styles.footerBrand}>
                <Text style={styles.footerText}>Sayed Ezzat · فنان تشكيلي</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsSection}>
              <Text style={styles.actionsSectionTitle}>إرسال وتصدير</Text>

              {/* Send Row */}
              <View style={styles.sendRow}>
                <Pressable
                  onPress={handleWhatsApp}
                  style={({ pressed }) => [styles.sendBtn, styles.whatsappBtn, pressed && { opacity: 0.8 }]}
                >
                  <MaterialIcons name="chat" size={20} color="#fff" />
                  <Text style={styles.sendBtnText}>واتساب</Text>
                </Pressable>
                <Pressable
                  onPress={handleTelegram}
                  style={({ pressed }) => [styles.sendBtn, styles.telegramBtn, pressed && { opacity: 0.8 }]}
                >
                  <MaterialIcons name="send" size={20} color="#fff" />
                  <Text style={styles.sendBtnText}>تلجرام</Text>
                </Pressable>
                <Pressable
                  onPress={handleShare}
                  style={({ pressed }) => [styles.sendBtn, styles.shareBtn, pressed && { opacity: 0.8 }]}
                >
                  <MaterialIcons name="share" size={20} color="#fff" />
                  <Text style={styles.sendBtnText}>مشاركة</Text>
                </Pressable>
              </View>

              {/* Export Row */}
              <View style={styles.exportRow}>
                <Pressable
                  onPress={handlePDF}
                  disabled={loadingPDF}
                  style={({ pressed }) => [styles.exportBtn, styles.pdfBtn, pressed && { opacity: 0.8 }]}
                >
                  {loadingPDF ? <ActivityIndicator size="small" color="#fff" /> : <MaterialIcons name="picture-as-pdf" size={22} color="#fff" />}
                  <Text style={styles.exportBtnText}>حفظ PDF</Text>
                </Pressable>
                <Pressable
                  onPress={handleJPG}
                  disabled={loadingJPG}
                  style={({ pressed }) => [styles.exportBtn, styles.jpgBtn, pressed && { opacity: 0.8 }]}
                >
                  {loadingJPG ? <ActivityIndicator size="small" color="#fff" /> : <MaterialIcons name="image" size={22} color="#fff" />}
                  <Text style={styles.exportBtnText}>حفظ صورة</Text>
                </Pressable>
              </View>
            </View>

            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  container: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl,
    maxHeight: '96%', overflow: 'hidden',
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.base, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerLeft: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  headerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderWidth: 1,
  },
  editBtn: { backgroundColor: Colors.primarySurface, borderColor: Colors.primary },
  editBtnText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },
  deleteBtn: { backgroundColor: Colors.errorSurface, borderColor: Colors.error },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center',
  },
  scrollContent: { padding: Spacing.base },

  brandHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.card, borderRadius: Radius.xl,
    padding: Spacing.base, marginBottom: Spacing.base,
    borderWidth: 1, borderColor: Colors.primary + '40', ...Shadow.gold,
  },
  brandLogoWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.primarySurface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.primary + '60',
  },
  brandInfo: { flex: 1, alignItems: 'flex-end' },
  brandName: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.primary },
  brandTitle: { fontSize: FontSize.xs, color: Colors.textSecondary },

  quoteMetaCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.base, marginBottom: Spacing.base,
    borderWidth: 1, borderColor: Colors.border,
  },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  metaBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  metaLabel: { fontSize: FontSize.sm, color: Colors.textMuted },
  metaValue: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },

  section: { marginBottom: Spacing.base },
  sectionTitle: {
    fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary,
    textAlign: 'right', marginBottom: Spacing.md,
    borderRightWidth: 3, borderRightColor: Colors.primary, paddingRight: Spacing.sm,
  },

  customerCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.base, borderWidth: 1, borderColor: Colors.border,
  },
  customerAvatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: Colors.primarySurface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.primary + '60',
  },
  customerAvatarText: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.primary },
  customerInfo: { flex: 1, alignItems: 'flex-end' },
  customerName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: 6 },
  customerDetail: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  customerDetailText: { fontSize: FontSize.xs, color: Colors.textSecondary },

  itemCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  itemImage: { width: 80, height: 80, borderRadius: Radius.md },
  itemImagePlaceholder: {
    width: 80, height: 80, borderRadius: Radius.md,
    backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center',
  },
  itemContent: { flex: 1, alignItems: 'flex-end' },
  itemTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'right', marginBottom: 4 },
  itemMeta: { marginBottom: 6, alignItems: 'flex-end' },
  itemCategory: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.medium, textAlign: 'right' },
  itemDimRow: { flexDirection: 'row', alignItems: 'center', gap: 3, justifyContent: 'flex-end', marginTop: 2 },
  itemDim: { fontSize: FontSize.xs, color: Colors.textMuted },
  itemDesc: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right', marginTop: 3, lineHeight: 18 },
  itemPriceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, justifyContent: 'flex-end', flexWrap: 'wrap' },
  itemQtyPrice: { fontSize: FontSize.xs, color: Colors.textMuted },
  itemSubtotal: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.primary },

  totalsCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.base, marginBottom: Spacing.base,
    borderWidth: 1, borderColor: Colors.border, ...Shadow.sm,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm },
  totalBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  totalLabel: { fontSize: FontSize.sm, color: Colors.textMuted },
  totalValue: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  grandTotalRow: { paddingTop: Spacing.md },
  grandTotalLabel: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  grandTotalValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.primary },

  termsCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.base, borderWidth: 1, borderColor: Colors.border,
  },
  termRow: { paddingVertical: Spacing.sm },
  termBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  termLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginBottom: 4 },
  termLabel: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.semibold },
  termValue: { fontSize: FontSize.base, color: Colors.textPrimary, textAlign: 'right', lineHeight: 22 },

  notesCard: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.base, borderWidth: 1, borderColor: Colors.border,
    borderRightWidth: 3, borderRightColor: Colors.warning,
  },
  notesText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'right', lineHeight: 22 },

  footerBrand: {
    alignItems: 'center', paddingVertical: Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.border, marginTop: Spacing.sm,
  },
  footerText: { fontSize: FontSize.xs, color: Colors.textMuted },

  // Actions
  actionsSection: {
    marginTop: Spacing.base,
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionsSectionTitle: {
    fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary,
    textAlign: 'right', marginBottom: Spacing.md,
  },
  sendRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  sendBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: Spacing.md, borderRadius: Radius.lg,
  },
  whatsappBtn: { backgroundColor: '#25D366' },
  telegramBtn: { backgroundColor: '#2AABEE' },
  shareBtn: { backgroundColor: Colors.info },
  sendBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#fff' },
  exportRow: { flexDirection: 'row', gap: Spacing.sm },
  exportBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: Spacing.md, borderRadius: Radius.lg,
  },
  pdfBtn: { backgroundColor: '#E84444' },
  jpgBtn: { backgroundColor: Colors.primary },
  exportBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#fff' },
});
