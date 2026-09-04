// Powered by OnSpace.AI
import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { globalStyles } from '@/constants/styles';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/hooks/useApp';
import { useLanguage } from '@/contexts/LanguageContext';
import { exportBackup, importBackup } from '@/services/exportService';

interface BackupModalProps {
  visible: boolean;
  onClose: () => void;
}

export function BackupModal({ visible, onClose }: BackupModalProps) {
  const { artworks, customers, quotes, restoreBackup } = useApp();
  const { t } = useLanguage();
  const [loadingExport, setLoadingExport] = useState(false);
  const [loadingImport, setLoadingImport] = useState(false);

  async function handleExport() {
    setLoadingExport(true);
    await exportBackup(artworks, customers, quotes);
    setLoadingExport(false);
  }

  async function handleImport() {
    setLoadingImport(true);
    const data = await importBackup();
    setLoadingImport(false);
    if (data) {
      Alert.alert(t('restoreConfirmTitle'), t('restoreConfirmMsg'), [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('restore'),
          style: 'destructive',
          onPress: async () => {
            await restoreBackup(data);
            onClose();
          },
        },
      ]);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={globalStyles.overlay}>
        <View style={globalStyles.modalSheet}>
          <View style={globalStyles.modalHandle} />
          <Text style={globalStyles.modalTitle}>{t('backupTitle')}</Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statVal}>{artworks.length}</Text>
              <Text style={styles.statLabel}>{t('artworks')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statVal}>{customers.length}</Text>
              <Text style={styles.statLabel}>{t('customers')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statVal}>{quotes.length}</Text>
              <Text style={styles.statLabel}>{t('tabQuotes')}</Text>
            </View>
          </View>

          {/* Export */}
          <View style={styles.item}>
            <View style={[styles.itemIcon, { backgroundColor: Colors.successSurface }]}>
              <MaterialIcons name="cloud-upload" size={22} color={Colors.success} />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemTitle}>{t('exportBackup')}</Text>
              <Text style={styles.itemSub}>JSON · SayedEzzat</Text>
            </View>
            <Button
              title={t('export')}
              onPress={handleExport}
              loading={loadingExport}
              size="sm"
              variant="success"
            />
          </View>

          <View style={styles.divider} />

          {/* Import */}
          <View style={styles.item}>
            <View style={[styles.itemIcon, { backgroundColor: Colors.warningSurface }]}>
              <MaterialIcons name="cloud-download" size={22} color={Colors.warning} />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemTitle}>{t('importBackup')}</Text>
              <Text style={styles.itemSub}>{t('importBackupSub')}</Text>
            </View>
            <Button
              title={t('import')}
              onPress={handleImport}
              loading={loadingImport}
              size="sm"
              variant="ghost"
            />
          </View>

          <View style={{ height: Spacing.xl }} />
          <Button title={t('close')} onPress={onClose} variant="ghost" />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.primary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2, textAlign: 'center' },
  statDivider: { width: 1, backgroundColor: Colors.border, marginVertical: Spacing.xs },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  itemIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: { flex: 1, alignItems: 'flex-end' },
  itemTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  itemSub: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right', marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
});
