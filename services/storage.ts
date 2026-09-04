// Powered by OnSpace.AI
import AsyncStorage from '@react-native-async-storage/async-storage';

export const BACKUP_VERSION = '2.0';
export const APP_VERSION = '2.0.0';

export const KEYS = {
  artworks: 'artworks_v2',
  customers: 'customers_v1',
  quotes: 'quotes_v1',
  materials: 'materials_v1',
  categories: 'artwork_categories_v1',
  suppliers: 'suppliers_v1',
  fullMaterials: 'full_materials_v1',
  artworkCosts: 'artwork_costs_v1',
  // Manufacturing system
  workers: 'workers_v1',
  productionOrders: 'production_orders_v1',
  internalManufacturing: 'internal_manufacturing_v1',
  externalManufacturing: 'external_manufacturing_v1',
  // Trash (soft delete)
  trashArtworks: 'trash_artworks_v1',
  trashCustomers: 'trash_customers_v1',
  trashQuotes: 'trash_quotes_v1',
  trashMaterials: 'trash_full_materials_v1',
  trashSuppliers: 'trash_suppliers_v1',
  // Settings & backup history
  appSettings: 'app_settings_v1',
  backupHistory: 'backup_history_v1',
};

async function load<T>(key: string): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function loadObj<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

async function save<T>(key: string, data: T[]): Promise<void> {
  try { await AsyncStorage.setItem(key, JSON.stringify(data)); } catch {}
}

async function saveObj<T>(key: string, data: T): Promise<void> {
  try { await AsyncStorage.setItem(key, JSON.stringify(data)); } catch {}
}

export const loadArtworks = () => load<any>(KEYS.artworks);
export const saveArtworks = (d: any[]) => save(KEYS.artworks, d);
export const loadCustomers = () => load<any>(KEYS.customers);
export const saveCustomers = (d: any[]) => save(KEYS.customers, d);
export const loadQuotes = () => load<any>(KEYS.quotes);
export const saveQuotes = (d: any[]) => save(KEYS.quotes, d);
export const loadMaterials = () => load<any>(KEYS.materials);
export const saveMaterials = (d: any[]) => save(KEYS.materials, d);
export const loadCategories = () => load<any>(KEYS.categories);
export const saveCategories = (d: any[]) => save(KEYS.categories, d);
export const loadSuppliers = () => load<any>(KEYS.suppliers);
export const saveSuppliers = (d: any[]) => save(KEYS.suppliers, d);
export const loadFullMaterials = () => load<any>(KEYS.fullMaterials);
export const saveFullMaterials = (d: any[]) => save(KEYS.fullMaterials, d);
export const loadArtworkCosts = () => load<any>(KEYS.artworkCosts);
export const saveArtworkCosts = (d: any[]) => save(KEYS.artworkCosts, d);
// Manufacturing
export const loadWorkers = () => load<any>(KEYS.workers);
export const saveWorkers = (d: any[]) => save(KEYS.workers, d);
export const loadProductionOrders = () => load<any>(KEYS.productionOrders);
export const saveProductionOrders = (d: any[]) => save(KEYS.productionOrders, d);
export const loadInternalManufacturing = () => load<any>(KEYS.internalManufacturing);
export const saveInternalManufacturing = (d: any[]) => save(KEYS.internalManufacturing, d);
export const loadExternalManufacturing = () => load<any>(KEYS.externalManufacturing);
export const saveExternalManufacturing = (d: any[]) => save(KEYS.externalManufacturing, d);
// Trash
export const loadTrashArtworks = () => load<any>(KEYS.trashArtworks);
export const saveTrashArtworks = (d: any[]) => save(KEYS.trashArtworks, d);
export const loadTrashCustomers = () => load<any>(KEYS.trashCustomers);
export const saveTrashCustomers = (d: any[]) => save(KEYS.trashCustomers, d);
export const loadTrashQuotes = () => load<any>(KEYS.trashQuotes);
export const saveTrashQuotes = (d: any[]) => save(KEYS.trashQuotes, d);
export const loadTrashMaterials = () => load<any>(KEYS.trashMaterials);
export const saveTrashMaterials = (d: any[]) => save(KEYS.trashMaterials, d);
export const loadTrashSuppliers = () => load<any>(KEYS.trashSuppliers);
export const saveTrashSuppliers = (d: any[]) => save(KEYS.trashSuppliers, d);
// Settings & backup history
export const DEFAULT_SETTINGS: AppSettings = {
  autoBackup: 'off',
  maxBackupVersions: 10,
  lastAutoBackupDate: '',
  showPriceToCustomerDefault: false,
};
export interface AppSettings {
  autoBackup: 'off' | 'daily' | 'weekly' | 'monthly';
  maxBackupVersions: number;
  lastAutoBackupDate: string;
  showPriceToCustomerDefault: boolean;
}
export const loadAppSettings = () => loadObj<AppSettings>(KEYS.appSettings, DEFAULT_SETTINGS);
export const saveAppSettings = (d: AppSettings) => saveObj(KEYS.appSettings, d);

export interface BackupHistoryEntry {
  id: string;
  name: string;
  date: string;
  artworksCount: number;
  customersCount: number;
  quotesCount: number;
  materialsCount: number;
  suppliersCount: number;
  workersCount: number;
  ordersCount: number;
  type: 'manual' | 'auto';
  size: string;
}
export const loadBackupHistory = () => load<BackupHistoryEntry>(KEYS.backupHistory);
export const saveBackupHistory = (d: BackupHistoryEntry[]) => save(KEYS.backupHistory, d);

// ─── Full backup payload ────────────────────────────────────────────────────
export interface FullBackupPayload {
  meta: {
    backupVersion: string;
    appVersion: string;
    createdAt: string;
    name: string;
    counts: {
      artworks: number;
      customers: number;
      quotes: number;
      materials: number;
      fullMaterials: number;
      suppliers: number;
      workers: number;
      productionOrders: number;
      artworkCosts: number;
      externalManufacturing: number;
      categories: number;
    };
  };
  data: {
    artworks: any[];
    customers: any[];
    quotes: any[];
    materials: any[];
    fullMaterials: any[];
    categories: any[];
    suppliers: any[];
    artworkCosts: any[];
    workers: any[];
    productionOrders: any[];
    internalManufacturing: any[];
    externalManufacturing: any[];
    settings?: any;
  };
}

export function generateBackupName(index = 0): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  if (index === 0) return `SayedEzzat_Backup_${date}`;
  const pad = index.toString().padStart(2, '0');
  return `SayedEzzat_Backup_${date}_${pad}`;
}

export function estimateSize(obj: any): string {
  try {
    const bytes = new TextEncoder().encode(JSON.stringify(obj)).length;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  } catch {
    return 'N/A';
  }
}
