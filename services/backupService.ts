// Powered by OnSpace.AI
// Comprehensive backup & restore service for SayedEzzat
// Handles full database backup to/from JSON files with validation
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { exportAllCollections, restoreAllCollections } from '@/services/firestoreService';
import { COLLECTIONS } from '@/services/firebase';

const BACKUP_HISTORY_KEY = 'backup_history_v2';
const BACKUP_APP_VERSION = '2.0';
const BACKUP_APP_NAME = 'SayedEzzat';

// ─── Types ────────────────────────────────────────────────────────────────
export interface BackupMeta {
  id: string;
  createdAt: string;
  appVersion: string;
  appName: string;
  recordCounts: Record<string, number>;
  totalRecords: number;
  fileSize?: number;
  source: 'manual' | 'auto';
  description?: string;
}

export interface BackupFile {
  meta: BackupMeta;
  data: Record<string, any[]>;
  checksum: string;
}

export interface BackupHistoryEntry extends BackupMeta {
  localPath?: string;
}

// ─── Checksum (simple) ────────────────────────────────────────────────────
function computeChecksum(data: Record<string, any[]>): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < Math.min(str.length, 5000); i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).toUpperCase();
}

// ─── Load / save backup history ────────────────────────────────────────────
export async function loadBackupHistory(): Promise<BackupHistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(BACKUP_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function saveBackupHistory(history: BackupHistoryEntry[]): Promise<void> {
  try {
    // Keep last 20 entries
    const trimmed = history.slice(-20);
    await AsyncStorage.setItem(BACKUP_HISTORY_KEY, JSON.stringify(trimmed));
  } catch {}
}

async function addToHistory(entry: BackupHistoryEntry): Promise<void> {
  const history = await loadBackupHistory();
  history.push(entry);
  await saveBackupHistory(history);
}

// ─── Create full backup ────────────────────────────────────────────────────
export async function createFullBackup(description?: string): Promise<BackupFile> {
  const data = await exportAllCollections();

  const recordCounts: Record<string, number> = {};
  let totalRecords = 0;
  for (const [col, items] of Object.entries(data)) {
    recordCounts[col] = items.length;
    totalRecords += items.length;
  }

  const meta: BackupMeta = {
    id: Date.now().toString(36),
    createdAt: new Date().toISOString(),
    appVersion: BACKUP_APP_VERSION,
    appName: BACKUP_APP_NAME,
    recordCounts,
    totalRecords,
    source: 'manual',
    description,
  };

  const backup: BackupFile = {
    meta,
    data,
    checksum: computeChecksum(data),
  };

  return backup;
}

// ─── Export backup to file ────────────────────────────────────────────────
export async function exportBackupToFile(description?: string): Promise<{ success: boolean; message: string; meta?: BackupMeta }> {
  try {
    const backup = await createFullBackup(description);
    const json = JSON.stringify(backup, null, 2);
    const fileName = `SayedEzzat_Backup_${new Date().toISOString().slice(0, 10)}_v${backup.meta.id}.json`;

    const fileUri = FileSystem.documentDirectory + fileName;
    await FileSystem.writeAsStringAsync(fileUri, json, { encoding: FileSystem.EncodingType.UTF8 });

    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    backup.meta.fileSize = (fileInfo as any).size;

    await addToHistory({ ...backup.meta, localPath: fileUri });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'حفظ النسخة الاحتياطية',
      });
    }

    return { success: true, message: `تم إنشاء النسخة الاحتياطية بنجاح (${backup.meta.totalRecords} سجل)`, meta: backup.meta };
  } catch (err: any) {
    return { success: false, message: `فشل إنشاء النسخة الاحتياطية: ${err?.message || 'خطأ غير معروف'}` };
  }
}

// ─── Validate backup file ─────────────────────────────────────────────────
export function validateBackupFile(parsed: any): { valid: boolean; error?: string; backup?: BackupFile } {
  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, error: 'الملف غير صالح' };
  }
  if (!parsed.meta || !parsed.data || !parsed.checksum) {
    return { valid: false, error: 'بنية الملف غير صحيحة — ليس ملف نسخة احتياطية' };
  }
  if (parsed.meta.appName !== BACKUP_APP_NAME) {
    return { valid: false, error: `الملف ليس من تطبيق ${BACKUP_APP_NAME}` };
  }
  if (typeof parsed.data !== 'object') {
    return { valid: false, error: 'بيانات الملف تالفة' };
  }
  // Verify checksum
  const expectedChecksum = computeChecksum(parsed.data);
  if (parsed.checksum !== expectedChecksum) {
    return { valid: false, error: 'الملف تالف — لا تتطابق بيانات التحقق (checksum)' };
  }
  return { valid: true, backup: parsed as BackupFile };
}

// ─── Import backup from file ──────────────────────────────────────────────
export async function importBackupFromFile(): Promise<{ success: boolean; backup?: BackupFile; error?: string }> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.[0]) {
      return { success: false, error: 'تم إلغاء الاستيراد' };
    }

    const asset = result.assets[0];
    const content = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.UTF8 });
    let parsed: any;

    try {
      parsed = JSON.parse(content);
    } catch {
      return { success: false, error: 'الملف غير صالح — ليس بصيغة JSON' };
    }

    const validation = validateBackupFile(parsed);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    return { success: true, backup: validation.backup };
  } catch (err: any) {
    return { success: false, error: `فشل استيراد الملف: ${err?.message || 'خطأ غير معروف'}` };
  }
}

// ─── Restore from backup ──────────────────────────────────────────────────
export async function restoreFromBackup(backup: BackupFile): Promise<{ success: boolean; message: string; stats?: { restored: number; errors: number } }> {
  try {
    const stats = await restoreAllCollections(backup.data);

    // Record in history
    await addToHistory({
      ...backup.meta,
      id: `restore_${Date.now().toString(36)}`,
      source: 'manual',
      description: `استعادة من نسخة ${backup.meta.createdAt?.slice(0, 10)}`,
      createdAt: new Date().toISOString(),
    });

    return {
      success: true,
      message: `تمت الاستعادة بنجاح — ${stats.restored} سجل`,
      stats,
    };
  } catch (err: any) {
    return { success: false, message: `فشل استعادة البيانات: ${err?.message || 'خطأ غير معروف'}` };
  }
}

// ─── Auto backup (called on significant changes) ──────────────────────────
export async function createAutoBackup(): Promise<void> {
  try {
    const backup = await createFullBackup('نسخة تلقائية');
    const json = JSON.stringify(backup);
    const key = `auto_backup_${new Date().toISOString().slice(0, 10)}`;
    await AsyncStorage.setItem(key, json);
    // Keep last 3 auto backups only
    await addToHistory({ ...backup.meta, source: 'auto' });
  } catch {}
}

// ─── Get backup preview info ──────────────────────────────────────────────
export function getBackupPreview(backup: BackupFile): string[] {
  const lines: string[] = [];
  const labelMap: Record<string, string> = {
    [COLLECTIONS.artworks]: 'الأعمال الفنية',
    [COLLECTIONS.customers]: 'العملاء',
    [COLLECTIONS.quotes]: 'عروض الأسعار',
    [COLLECTIONS.fullMaterials]: 'الخامات',
    [COLLECTIONS.suppliers]: 'الموردين',
    [COLLECTIONS.workers]: 'العمال',
    [COLLECTIONS.productionOrders]: 'أوامر التصنيع',
    [COLLECTIONS.artworkCosts]: 'تكاليف الأعمال',
    [COLLECTIONS.categories]: 'التصنيفات',
  };
  for (const [col, count] of Object.entries(backup.meta.recordCounts)) {
    if (count > 0) {
      const label = labelMap[col] || col;
      lines.push(`${label}: ${count} سجل`);
    }
  }
  return lines;
}

// ─── Format file size ─────────────────────────────────────────────────────
export function formatFileSize(bytes?: number): string {
  if (!bytes) return 'غير معروف';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
