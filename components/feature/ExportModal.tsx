// Powered by OnSpace.AI
import React, { useRef, useState } from 'react';
import { View, Text, Modal, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { globalStyles } from '@/constants/styles';
import { Button } from '@/components/ui/Button';
import { Quote } from '@/contexts/AppContext';
import { exportQuoteAsPDF, exportQuoteAsJPG } from '@/services/exportService';
import { useLanguage } from '@/contexts/LanguageContext';

interface ExportModalProps {
  visible: boolean;
  quote: Quote | null;
  onClose: () => void;
}

export function ExportModal({ visible, quote, onClose }: ExportModalProps) {
  const { lang, t, currency } = useLanguage();
  const previewRef = useRef<View>(null);
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [loadingJPG, setLoadingJPG] = useState(false);

  if (!quote) return null;

  async function handlePDF() {
    setLoadingPDF(true);
    await exportQuoteAsPDF(quote!, lang, currency);
    setLoadingPDF(false);
  }

  async function handleJPG() {
    setLoadingJPG(true);
    await exportQuoteAsJPG(previewRef, quote!);
    setLoadingJPG(false);
  }

  const statusLabels: Record<Quote['status'], string> = {
    draft: t('statusDraft'),
    sent: t('statusSent'),
    accepted: t('statusAccepted'),
    rejected: t('statusRejected'),
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={globalStyles.overlay}>
        <View style={globalStyles.modalSheet}>
          <View style={globalStyles.modalHandle} />
          <Text style={globalStyles.modalTitle}>{t('exportQuote')}</Text>

          {/* Quote preview card — captured for JPG */}
          <View ref={previewRef} collapsable={false} style={styles.preview}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewNum}>{quote.quoteNumber}</Text>
              <Text style={styles.previewBrand}>SAYED EZZAT</Text>
            </View>
            <View style={styles.previewDivider} />
            <Text style={styles.previewCustomerLabel}>العميل · Client</Text>
            <Text style={styles.previewCustomer}>{quote.customerName}</Text>
            <View style={styles.previewItems}>
              {quote.items.slice(0, 3).map((item, i) => (
                <View key={i} style={styles.previewItem}>
                  <Text style={styles.previewItemPrice}>
                    {(item.price * item.quantity).toLocaleString()} {currency}
                  </Text>
                  <Text style={styles.previewItemTitle} numberOfLines={1}>{item.title}</Text>
                </View>
              ))}
              {quote.items.length > 3 ? (
                <Text style={styles.previewMore}>+{quote.items.length - 3} {t('moreItems')}</Text>
              ) : null}
            </View>
            <View style={styles.previewTotalRow}>
              <Text style={styles.previewTotalVal}>{quote.total.toLocaleString()} {currency}</Text>
              <Text style={styles.previewTotalLabel}>{t('grandTotal')}</Text>
            </View>
          </View>

          {/* Export Buttons */}
          <View style={styles.exportBtns}>
            <Pressable
              onPress={handlePDF}
              disabled={loadingPDF}
              style={({ pressed }) => [styles.exportBtn, styles.pdfBtn, pressed && styles.btnPressed]}
            >
              {loadingPDF ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <MaterialIcons name="picture-as-pdf" size={28} color="#fff" />
              )}
              <Text style={styles.exportBtnLabel}>{t('savePDF')}</Text>
            </Pressable>

            <Pressable
              onPress={handleJPG}
              disabled={loadingJPG}
              style={({ pressed }) => [styles.exportBtn, styles.jpgBtn, pressed && styles.btnPressed]}
            >
              {loadingJPG ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <MaterialIcons name="image" size={28} color="#fff" />
              )}
              <Text style={styles.exportBtnLabel}>{t('saveJPG')}</Text>
            </Pressable>
          </View>

          <View style={{ height: Spacing.md }} />
          <Button title={t('cancel')} onPress={onClose} variant="ghost" />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  preview: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  previewBrand: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.extrabold,
    color: Colors.primary,
    letterSpacing: 1.5,
  },
  previewNum: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  previewDivider: { height: 1, backgroundColor: Colors.border, marginBottom: Spacing.md },
  previewCustomerLabel: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right', marginBottom: 2 },
  previewCustomer: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'right',
    marginBottom: Spacing.md,
  },
  previewItems: { gap: Spacing.xs, marginBottom: Spacing.md },
  previewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    padding: Spacing.sm,
    borderRadius: Radius.sm,
  },
  previewItemTitle: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'right',
  },
  previewItemPrice: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
  },
  previewMore: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right' },
  previewTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  previewTotalLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  previewTotalVal: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.primary },
  exportBtns: { flexDirection: 'row', gap: Spacing.md },
  exportBtn: {
    flex: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  pdfBtn: { backgroundColor: '#E84444' },
  jpgBtn: { backgroundColor: Colors.info },
  btnPressed: { opacity: 0.8, transform: [{ scale: 0.97 }] },
  exportBtnLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#fff',
  },
});
