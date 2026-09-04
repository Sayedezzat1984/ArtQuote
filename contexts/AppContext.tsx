// Powered by OnSpace.AI
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loadArtworks, saveArtworks, loadCustomers, saveCustomers,
  loadQuotes, saveQuotes, loadMaterials, saveMaterials,
  loadCategories, saveCategories,
  loadSuppliers, saveSuppliers,
  loadFullMaterials, saveFullMaterials,
  loadArtworkCosts, saveArtworkCosts,
  loadWorkers, saveWorkers,
  loadProductionOrders, saveProductionOrders,
  loadInternalManufacturing, saveInternalManufacturing,
  loadExternalManufacturing, saveExternalManufacturing,
  loadTrashArtworks, saveTrashArtworks,
  loadTrashCustomers, saveTrashCustomers,
  loadTrashQuotes, saveTrashQuotes,
  loadTrashMaterials, saveTrashMaterials,
  loadTrashSuppliers, saveTrashSuppliers,
  loadAppSettings, saveAppSettings,
  loadBackupHistory, saveBackupHistory,
  AppSettings, BackupHistoryEntry, DEFAULT_SETTINGS,
} from '@/services/storage';

// ─── Artwork ───────────────────────────────────────────────────────────────
export interface Artwork {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  height: string;
  width: string;
  depth: string;
  length: string;
  diameter: string;
  thickness: string;
  weight: string;
  weightUnit: 'gram' | 'kg' | 'ton';
  dimensionUnit: 'mm' | 'cm' | 'meter';
  dimensions: string;
  quantity: string;
  year: string;
  available: boolean;
  showPriceToCustomer: boolean;
  image: string | null;
  images: string[];
  materialIds: string[];
  deletedAt?: string;
  createdAt: string;
}

// ─── Material (simple) ────────────────────────────────────────────────────
export interface Material {
  id: string;
  name: string;
  description: string;
  color: string;
  supplier: string;
  notes: string;
  unitType?: string;
  unitPrice?: number;
  stock?: number;
  deletedAt?: string;
  createdAt: string;
}

// ─── Full Material (Admin) ─────────────────────────────────────────────────
export interface FullMaterial {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  code: string;
  description: string;
  brand: string;
  supplierId: string;
  supplierName: string;
  purchaseUnit: string;
  unitPrice: number;
  currency: string;
  lastPurchasePrice: number;
  averagePrice: number;
  minStock: number;
  currentStock: number;
  color: string;
  notes: string;
  image: string | null;
  types: MaterialType[];
  priceHistory: PriceHistoryEntry[];
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialType {
  id: string;
  name: string;
  code: string;
  description: string;
  unit: string;
  unitPrice: number;
  supplierId: string;
  brand: string;
  colorCode: string;
  notes: string;
}

export interface PriceHistoryEntry {
  id: string;
  oldPrice: number;
  newPrice: number;
  supplierId: string;
  supplierName: string;
  date: string;
  notes: string;
}

// ─── Supplier ──────────────────────────────────────────────────────────────
export interface Supplier {
  id: string;
  name: string;
  companyName: string;
  contactPerson: string;
  mobile: string;
  whatsapp: string;
  phone: string;
  address: string;
  email: string;
  materialCategories: string[];
  materialIds: string[];
  paymentTerms: string;
  deliveryTime: string;
  notes: string;
  deletedAt?: string;
  createdAt: string;
}

// ─── Worker ────────────────────────────────────────────────────────────────
export interface Worker {
  id: string;
  name: string;
  craft: string;
  dailyWage: number;
  phone: string;
  notes: string;
  createdAt: string;
}

// ─── Manufacturing Stage ───────────────────────────────────────────────────
export interface ManufacturingStage {
  id: string;
  name: string;
  description: string;
  order: number;
}

// ─── Material Item in Cost Sheet ──────────────────────────────────────────
export interface CostMaterialItem {
  id: string;
  materialId: string;
  materialName: string;
  typeId: string;
  typeName: string;
  quantity: number;
  plannedQuantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  plannedTotal: number;
  stageId: string;
  notes: string;
}

// ─── Labor Record ─────────────────────────────────────────────────────────
export interface LaborRecord {
  id: string;
  workerId: string;
  workerName: string;
  craft: string;
  stageId: string;
  stageName: string;
  numWorkers: number;
  numDays: number;
  dailyWage: number;
  isBatchCost: boolean;
  total: number;
  notes: string;
}

// ─── External Labor (مصنعيات) ─────────────────────────────────────────────
export interface ExternalLaborRecord {
  id: string;
  serviceName: string;
  workshopOrPerson: string;
  stageId: string;
  stageName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  total: number;
  notes: string;
}

// ─── Transport Record ─────────────────────────────────────────────────────
export interface TransportRecord {
  id: string;
  description: string;
  from: string;
  to: string;
  numTrips: number;
  costPerTrip: number;
  loadingCost: number;
  unloadingCost: number;
  additionalCost: number;
  total: number;
  assignedTo: string;
  includedInManufacturing: boolean;
  notes: string;
}

// ─── Packaging Record ─────────────────────────────────────────────────────
export interface PackagingRecord {
  id: string;
  packagingType: string;
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  laborCost: number;
  artworkQuantity: number;
  total: number;
  includedInSupplierPrice: boolean;
  notes: string;
}

// ─── Other Expense ────────────────────────────────────────────────────────
export interface OtherExpense {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unitCost: number;
  total: number;
  date: string;
  isBatchCost: boolean;
  notes: string;
}

// ─── External Manufacturing ────────────────────────────────────────────────
export interface ExternalManufacturing {
  id: string;
  workshopName: string;
  supplierId: string;
  supplierName: string;
  artworkId: string;
  stageId: string;
  stageName: string;
  description: string;
  quantity: number;
  pricePerUnit: number;
  externalMaterialsCost: number;
  transportCost: number;
  otherExpenses: number;
  total: number;
  transportIncluded: boolean;
  materialsIncluded: boolean;
  date: string;
  notes: string;
  createdAt: string;
}

// ─── Internal Manufacturing ────────────────────────────────────────────────
export interface InternalManufacturing {
  id: string;
  artworkId: string;
  stageId: string;
  stageName: string;
  description: string;
  productionQuantity: number;
  laborRecords: LaborRecord[];
  externalLaborRecords: ExternalLaborRecord[];
  materialItems: CostMaterialItem[];
  totalLaborCost: number;
  totalExternalLaborCost: number;
  totalMaterialCost: number;
  totalStageCost: number;
  notes: string;
  createdAt: string;
}

// ─── Production Order ─────────────────────────────────────────────────────
export type ProductionOrderStatus =
  | 'new' | 'preparing' | 'in_production' | 'external_manufacturing'
  | 'finishing' | 'packaging' | 'ready' | 'delivered' | 'cancelled';

export interface ProductionOrder {
  id: string;
  orderNumber: string;
  artworkId: string;
  artworkTitle: string;
  customerId: string;
  customerName: string;
  plannedQuantity: number;
  actualQuantity: number;
  startDate: string;
  deliveryDate: string;
  status: ProductionOrderStatus;
  stages: ManufacturingStage[];
  materialItems: CostMaterialItem[];
  laborRecords: LaborRecord[];
  externalLaborRecords: ExternalLaborRecord[];
  transportRecords: TransportRecord[];
  packagingRecords: PackagingRecord[];
  otherExpenses: OtherExpense[];
  externalManufacturingIds: string[];
  totalMaterialCost: number;
  totalLaborCost: number;
  totalExternalLaborCost: number;
  totalExternalManufacturingCost: number;
  totalTransportCost: number;
  totalPackagingCost: number;
  totalOtherExpenses: number;
  productionCostBeforeTax: number;
  applyTax: boolean;
  taxPercentage: number;
  taxAmount: number;
  totalCostAfterTax: number;
  costPerPiece: number;
  profitPercentage: number;
  profitAmount: number;
  suggestedSellingPrice: number;
  discountPercentage: number;
  discountAmount: number;
  finalSellingPrice: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Artwork Cost Sheet ────────────────────────────────────────────────────
export interface ArtworkCostSheet {
  id: string;
  artworkId: string;
  version: number;
  date: string;
  productionQuantity: number;
  materialItems: CostMaterialItem[];
  laborRecords: LaborRecord[];
  externalLaborRecords: ExternalLaborRecord[];
  transportRecords: TransportRecord[];
  packagingRecords: PackagingRecord[];
  otherExpenses: OtherExpense[];
  laborCost: number;
  externalManufacturingCost: number;
  paintingCost: number;
  electricalCost: number;
  transportCost: number;
  packagingCost: number;
  installationCost: number;
  otherCost: number;
  emergencyCost: number;
  totalMaterialCost: number;
  totalLaborCost: number;
  totalExternalLaborCost: number;
  totalTransportCost: number;
  totalPackagingCost: number;
  totalOtherExpensesCost: number;
  totalProductionCost: number;
  costPerPiece: number;
  applyTax: boolean;
  taxPercentage: number;
  taxAmount: number;
  totalCostAfterTax: number;
  profitPercentage: number;
  profitAmount: number;
  suggestedPrice: number;
  discountPercentage: number;
  discountAmount: number;
  finalPrice: number;
  deliveryCost: number;
  installationPriceCost: number;
  showPriceToCustomer: boolean;
  notes: string;
  createdAt: string;
}

// ─── Legacy types ──────────────────────────────────────────────────────────
export interface ArtworkCategory {
  id: string;
  name: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  deletedAt?: string;
  createdAt: string;
}

export interface QuoteItem {
  artworkId: string;
  title: string;
  price: number;
  quantity: number;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  customerId: string;
  customerName: string;
  items: QuoteItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  notes: string;
  paymentTerms: string;
  deliveryPeriod: string;
  deletedAt?: string;
  createdAt: string;
  validUntil: string;
}

// ─── Trash item wrapper ────────────────────────────────────────────────────
export interface TrashItem<T> {
  item: T;
  deletedAt: string;
  type: string;
}

// ─── Context Type ──────────────────────────────────────────────────────────
interface AppContextType {
  artworks: Artwork[];
  customers: Customer[];
  quotes: Quote[];
  materials: Material[];
  loading: boolean;
  artworkCategories: ArtworkCategory[];
  suppliers: Supplier[];
  fullMaterials: FullMaterial[];
  artworkCosts: ArtworkCostSheet[];
  workers: Worker[];
  productionOrders: ProductionOrder[];
  internalManufacturing: InternalManufacturing[];
  externalManufacturing: ExternalManufacturing[];
  // Trash
  trashArtworks: TrashItem<Artwork>[];
  trashCustomers: TrashItem<Customer>[];
  trashQuotes: TrashItem<Quote>[];
  trashMaterials: TrashItem<FullMaterial>[];
  trashSuppliers: TrashItem<Supplier>[];
  // Settings & backup history
  appSettings: AppSettings;
  backupHistory: BackupHistoryEntry[];
  // Artwork CRUD
  addArtwork: (artwork: Omit<Artwork, 'id' | 'createdAt'>) => Promise<void>;
  updateArtwork: (id: string, artwork: Partial<Artwork>) => Promise<void>;
  deleteArtwork: (id: string) => Promise<void>;
  softDeleteArtwork: (id: string) => Promise<void>;
  restoreArtwork: (id: string) => Promise<void>;
  permanentDeleteArtwork: (id: string) => Promise<void>;
  // Customer CRUD
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => Promise<void>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  softDeleteCustomer: (id: string) => Promise<void>;
  restoreCustomer: (id: string) => Promise<void>;
  permanentDeleteCustomer: (id: string) => Promise<void>;
  // Quote CRUD
  addQuote: (quote: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt'>) => Promise<void>;
  updateQuote: (id: string, quote: Partial<Quote>) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
  softDeleteQuote: (id: string) => Promise<void>;
  restoreQuote: (id: string) => Promise<void>;
  permanentDeleteQuote: (id: string) => Promise<void>;
  // Legacy Material CRUD
  addMaterial: (material: Omit<Material, 'id' | 'createdAt'>) => Promise<void>;
  updateMaterial: (id: string, material: Partial<Material>) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
  // Category CRUD
  addArtworkCategory: (name: string) => Promise<void>;
  deleteArtworkCategory: (id: string) => Promise<void>;
  // Supplier CRUD
  addSupplier: (s: Omit<Supplier, 'id' | 'createdAt'>) => Promise<void>;
  updateSupplier: (id: string, s: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  softDeleteSupplier: (id: string) => Promise<void>;
  restoreSupplier: (id: string) => Promise<void>;
  permanentDeleteSupplier: (id: string) => Promise<void>;
  // Full Material CRUD
  addFullMaterial: (m: Omit<FullMaterial, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateFullMaterial: (id: string, m: Partial<FullMaterial>) => Promise<void>;
  deleteFullMaterial: (id: string) => Promise<void>;
  softDeleteFullMaterial: (id: string) => Promise<void>;
  restoreFullMaterial: (id: string) => Promise<void>;
  permanentDeleteFullMaterial: (id: string) => Promise<void>;
  updateMaterialPrice: (id: string, newPrice: number, supplierId: string, supplierName: string, notes: string) => Promise<void>;
  // Artwork Cost CRUD
  addArtworkCost: (cost: Omit<ArtworkCostSheet, 'id' | 'createdAt'>) => Promise<void>;
  updateArtworkCost: (id: string, cost: Partial<ArtworkCostSheet>) => Promise<void>;
  deleteArtworkCost: (id: string) => Promise<void>;
  getArtworkCosts: (artworkId: string) => ArtworkCostSheet[];
  getLatestCost: (artworkId: string) => ArtworkCostSheet | undefined;
  // Worker CRUD
  addWorker: (w: Omit<Worker, 'id' | 'createdAt'>) => Promise<void>;
  updateWorker: (id: string, w: Partial<Worker>) => Promise<void>;
  deleteWorker: (id: string) => Promise<void>;
  // Production Order CRUD
  addProductionOrder: (o: Omit<ProductionOrder, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProductionOrder: (id: string, o: Partial<ProductionOrder>) => Promise<void>;
  deleteProductionOrder: (id: string) => Promise<void>;
  getOrdersByArtwork: (artworkId: string) => ProductionOrder[];
  // Internal Manufacturing CRUD
  addInternalManufacturing: (m: Omit<InternalManufacturing, 'id' | 'createdAt'>) => Promise<void>;
  updateInternalManufacturing: (id: string, m: Partial<InternalManufacturing>) => Promise<void>;
  deleteInternalManufacturing: (id: string) => Promise<void>;
  // External Manufacturing CRUD
  addExternalManufacturing: (m: Omit<ExternalManufacturing, 'id' | 'createdAt'>) => Promise<void>;
  updateExternalManufacturing: (id: string, m: Partial<ExternalManufacturing>) => Promise<void>;
  deleteExternalManufacturing: (id: string) => Promise<void>;
  // Settings
  updateAppSettings: (s: Partial<AppSettings>) => Promise<void>;
  addBackupHistoryEntry: (entry: Omit<BackupHistoryEntry, 'id'>) => Promise<void>;
  clearBackupHistory: () => Promise<void>;
  // Full restore (for backup system)
  restoreBackup: (data: any) => Promise<void>;
  restoreFullBackup: (payload: any, options: RestoreOptions) => Promise<void>;
}

export interface RestoreOptions {
  artworks: boolean;
  customers: boolean;
  quotes: boolean;
  materials: boolean;
  suppliers: boolean;
  workers: boolean;
  productionOrders: boolean;
  artworkCosts: boolean;
  categories: boolean;
  settings: boolean;
  mergeMode: 'replace' | 'merge';
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_STAGES: ManufacturingStage[] = [
  { id: 's1', name: 'عمل القالب', description: '', order: 1 },
  { id: 's2', name: 'صب الفيبر', description: '', order: 2 },
  { id: 's3', name: 'الحدادة', description: '', order: 3 },
  { id: 's4', name: 'التجميع', description: '', order: 4 },
  { id: 's5', name: 'الصنفرة', description: '', order: 5 },
  { id: 's6', name: 'الدهان', description: '', order: 6 },
  { id: 's7', name: 'التشطيب', description: '', order: 7 },
  { id: 's8', name: 'الكهرباء', description: '', order: 8 },
  { id: 's9', name: 'التركيب', description: '', order: 9 },
  { id: 's10', name: 'التغليف', description: '', order: 10 },
];

export const DEFAULT_MANUFACTURING_STAGES = DEFAULT_STAGES;

export function AppProvider({ children }: { children: ReactNode }) {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [artworkCategories, setArtworkCategories] = useState<ArtworkCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [fullMaterials, setFullMaterials] = useState<FullMaterial[]>([]);
  const [artworkCosts, setArtworkCosts] = useState<ArtworkCostSheet[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [internalManufacturing, setInternalManufacturing] = useState<InternalManufacturing[]>([]);
  const [externalManufacturing, setExternalManufacturing] = useState<ExternalManufacturing[]>([]);
  // Trash
  const [trashArtworks, setTrashArtworks] = useState<TrashItem<Artwork>[]>([]);
  const [trashCustomers, setTrashCustomers] = useState<TrashItem<Customer>[]>([]);
  const [trashQuotes, setTrashQuotes] = useState<TrashItem<Quote>[]>([]);
  const [trashMaterials, setTrashMaterials] = useState<TrashItem<FullMaterial>[]>([]);
  const [trashSuppliers, setTrashSuppliers] = useState<TrashItem<Supplier>[]>([]);
  // Settings
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [backupHistory, setBackupHistory] = useState<BackupHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const cleared = await AsyncStorage.getItem('data_cleared_v1');
        if (!cleared) {
          await AsyncStorage.multiRemove(['artworks_v2', 'customers_v1', 'quotes_v1', 'materials_v1']);
          await AsyncStorage.setItem('data_cleared_v1', '1');
        }
        const [
          storedArtworks, storedCustomers, storedQuotes, storedMaterials,
          storedCategories, storedSuppliers, storedFullMaterials, storedCosts,
          storedWorkers, storedOrders, storedInternal, storedExternal,
          storedTrashArtworks, storedTrashCustomers, storedTrashQuotes,
          storedTrashMaterials, storedTrashSuppliers,
          storedSettings, storedBackupHistory,
        ] = await Promise.all([
          loadArtworks(), loadCustomers(), loadQuotes(), loadMaterials(),
          loadCategories(), loadSuppliers(), loadFullMaterials(), loadArtworkCosts(),
          loadWorkers(), loadProductionOrders(), loadInternalManufacturing(), loadExternalManufacturing(),
          loadTrashArtworks(), loadTrashCustomers(), loadTrashQuotes(),
          loadTrashMaterials(), loadTrashSuppliers(),
          loadAppSettings(), loadBackupHistory(),
        ]);
        setArtworks(storedArtworks);
        setCustomers(storedCustomers);
        setQuotes(storedQuotes);
        setMaterials(storedMaterials);
        setSuppliers(storedSuppliers);
        setFullMaterials(storedFullMaterials);
        setArtworkCosts(storedCosts);
        setWorkers(storedWorkers);
        setProductionOrders(storedOrders);
        setInternalManufacturing(storedInternal);
        setExternalManufacturing(storedExternal);
        setTrashArtworks(storedTrashArtworks);
        setTrashCustomers(storedTrashCustomers);
        setTrashQuotes(storedTrashQuotes);
        setTrashMaterials(storedTrashMaterials);
        setTrashSuppliers(storedTrashSuppliers);
        setAppSettings(storedSettings);
        setBackupHistory(storedBackupHistory);

        const defaultCategories: ArtworkCategory[] = [
          { id: '1', name: 'نحت جداريات', createdAt: new Date().toISOString() },
          { id: '2', name: 'نحت حر', createdAt: new Date().toISOString() },
          { id: '3', name: 'وحدات إضاءة', createdAt: new Date().toISOString() },
          { id: '4', name: 'منزلي', createdAt: new Date().toISOString() },
          { id: '5', name: 'أخرى', createdAt: new Date().toISOString() },
        ];
        if (storedCategories.length > 0) {
          setArtworkCategories(storedCategories);
        } else {
          setArtworkCategories(defaultCategories);
          await saveCategories(defaultCategories);
        }
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // ── Artwork ──
  const addArtwork = useCallback(async (artwork: Omit<Artwork, 'id' | 'createdAt'>) => {
    const newArtwork: Artwork = { ...artwork, id: Date.now().toString(), createdAt: new Date().toISOString() };
    const updated = [newArtwork, ...artworks];
    setArtworks(updated); await saveArtworks(updated);
  }, [artworks]);

  const updateArtwork = useCallback(async (id: string, artwork: Partial<Artwork>) => {
    const updated = artworks.map(a => a.id === id ? { ...a, ...artwork } : a);
    setArtworks(updated); await saveArtworks(updated);
  }, [artworks]);

  const deleteArtwork = useCallback(async (id: string) => {
    const updated = artworks.filter(a => a.id !== id);
    setArtworks(updated); await saveArtworks(updated);
  }, [artworks]);

  const softDeleteArtwork = useCallback(async (id: string) => {
    const item = artworks.find(a => a.id === id);
    if (!item) return;
    const newArtworks = artworks.filter(a => a.id !== id);
    const trashEntry: TrashItem<Artwork> = { item, deletedAt: new Date().toISOString(), type: 'artwork' };
    const newTrash = [trashEntry, ...trashArtworks];
    setArtworks(newArtworks); setTrashArtworks(newTrash);
    await Promise.all([saveArtworks(newArtworks), saveTrashArtworks(newTrash)]);
  }, [artworks, trashArtworks]);

  const restoreArtwork = useCallback(async (id: string) => {
    const entry = trashArtworks.find(t => t.item.id === id);
    if (!entry) return;
    const restored = { ...entry.item, deletedAt: undefined };
    const newArtworks = [restored, ...artworks];
    const newTrash = trashArtworks.filter(t => t.item.id !== id);
    setArtworks(newArtworks); setTrashArtworks(newTrash);
    await Promise.all([saveArtworks(newArtworks), saveTrashArtworks(newTrash)]);
  }, [artworks, trashArtworks]);

  const permanentDeleteArtwork = useCallback(async (id: string) => {
    const newTrash = trashArtworks.filter(t => t.item.id !== id);
    setTrashArtworks(newTrash); await saveTrashArtworks(newTrash);
  }, [trashArtworks]);

  // ── Customer ──
  const addCustomer = useCallback(async (customer: Omit<Customer, 'id' | 'createdAt'>) => {
    const newCustomer: Customer = { ...customer, id: Date.now().toString(), createdAt: new Date().toISOString() };
    const updated = [newCustomer, ...customers];
    setCustomers(updated); await saveCustomers(updated);
  }, [customers]);

  const updateCustomer = useCallback(async (id: string, customer: Partial<Customer>) => {
    const updated = customers.map(c => c.id === id ? { ...c, ...customer } : c);
    setCustomers(updated); await saveCustomers(updated);
  }, [customers]);

  const deleteCustomer = useCallback(async (id: string) => {
    const updated = customers.filter(c => c.id !== id);
    setCustomers(updated); await saveCustomers(updated);
  }, [customers]);

  const softDeleteCustomer = useCallback(async (id: string) => {
    const item = customers.find(c => c.id === id);
    if (!item) return;
    const newList = customers.filter(c => c.id !== id);
    const trashEntry: TrashItem<Customer> = { item, deletedAt: new Date().toISOString(), type: 'customer' };
    const newTrash = [trashEntry, ...trashCustomers];
    setCustomers(newList); setTrashCustomers(newTrash);
    await Promise.all([saveCustomers(newList), saveTrashCustomers(newTrash)]);
  }, [customers, trashCustomers]);

  const restoreCustomer = useCallback(async (id: string) => {
    const entry = trashCustomers.find(t => t.item.id === id);
    if (!entry) return;
    const newList = [entry.item, ...customers];
    const newTrash = trashCustomers.filter(t => t.item.id !== id);
    setCustomers(newList); setTrashCustomers(newTrash);
    await Promise.all([saveCustomers(newList), saveTrashCustomers(newTrash)]);
  }, [customers, trashCustomers]);

  const permanentDeleteCustomer = useCallback(async (id: string) => {
    const newTrash = trashCustomers.filter(t => t.item.id !== id);
    setTrashCustomers(newTrash); await saveTrashCustomers(newTrash);
  }, [trashCustomers]);

  // ── Quote ──
  const addQuote = useCallback(async (quote: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt'>) => {
    const num = (quotes.length + 1).toString().padStart(3, '0');
    const year = new Date().getFullYear();
    const newQuote: Quote = { ...quote, id: Date.now().toString(), quoteNumber: `QT-${year}-${num}`, createdAt: new Date().toISOString() };
    const updated = [newQuote, ...quotes];
    setQuotes(updated); await saveQuotes(updated);
  }, [quotes]);

  const updateQuote = useCallback(async (id: string, quote: Partial<Quote>) => {
    const updated = quotes.map(q => q.id === id ? { ...q, ...quote } : q);
    setQuotes(updated); await saveQuotes(updated);
  }, [quotes]);

  const deleteQuote = useCallback(async (id: string) => {
    const updated = quotes.filter(q => q.id !== id);
    setQuotes(updated); await saveQuotes(updated);
  }, [quotes]);

  const softDeleteQuote = useCallback(async (id: string) => {
    const item = quotes.find(q => q.id === id);
    if (!item) return;
    const newList = quotes.filter(q => q.id !== id);
    const trashEntry: TrashItem<Quote> = { item, deletedAt: new Date().toISOString(), type: 'quote' };
    const newTrash = [trashEntry, ...trashQuotes];
    setQuotes(newList); setTrashQuotes(newTrash);
    await Promise.all([saveQuotes(newList), saveTrashQuotes(newTrash)]);
  }, [quotes, trashQuotes]);

  const restoreQuote = useCallback(async (id: string) => {
    const entry = trashQuotes.find(t => t.item.id === id);
    if (!entry) return;
    const newList = [entry.item, ...quotes];
    const newTrash = trashQuotes.filter(t => t.item.id !== id);
    setQuotes(newList); setTrashQuotes(newTrash);
    await Promise.all([saveQuotes(newList), saveTrashQuotes(newTrash)]);
  }, [quotes, trashQuotes]);

  const permanentDeleteQuote = useCallback(async (id: string) => {
    const newTrash = trashQuotes.filter(t => t.item.id !== id);
    setTrashQuotes(newTrash); await saveTrashQuotes(newTrash);
  }, [trashQuotes]);

  // ── Legacy Material ──
  const addMaterial = useCallback(async (material: Omit<Material, 'id' | 'createdAt'>) => {
    const newMaterial: Material = { ...material, id: Date.now().toString(), createdAt: new Date().toISOString() };
    const updated = [newMaterial, ...materials];
    setMaterials(updated); await saveMaterials(updated);
  }, [materials]);

  const updateMaterial = useCallback(async (id: string, material: Partial<Material>) => {
    const updated = materials.map(m => m.id === id ? { ...m, ...material } : m);
    setMaterials(updated); await saveMaterials(updated);
  }, [materials]);

  const deleteMaterial = useCallback(async (id: string) => {
    const updated = materials.filter(m => m.id !== id);
    setMaterials(updated); await saveMaterials(updated);
  }, [materials]);

  // ── Category ──
  const addArtworkCategory = useCallback(async (name: string) => {
    const newCat: ArtworkCategory = { id: Date.now().toString(), name: name.trim(), createdAt: new Date().toISOString() };
    const updated = [...artworkCategories, newCat];
    setArtworkCategories(updated); await saveCategories(updated);
  }, [artworkCategories]);

  const deleteArtworkCategory = useCallback(async (id: string) => {
    const updated = artworkCategories.filter(c => c.id !== id);
    setArtworkCategories(updated); await saveCategories(updated);
  }, [artworkCategories]);

  // ── Supplier ──
  const addSupplier = useCallback(async (s: Omit<Supplier, 'id' | 'createdAt'>) => {
    const newS: Supplier = { ...s, id: Date.now().toString(), createdAt: new Date().toISOString() };
    const updated = [newS, ...suppliers];
    setSuppliers(updated); await saveSuppliers(updated);
  }, [suppliers]);

  const updateSupplier = useCallback(async (id: string, s: Partial<Supplier>) => {
    const updated = suppliers.map(x => x.id === id ? { ...x, ...s } : x);
    setSuppliers(updated); await saveSuppliers(updated);
  }, [suppliers]);

  const deleteSupplier = useCallback(async (id: string) => {
    const updated = suppliers.filter(x => x.id !== id);
    setSuppliers(updated); await saveSuppliers(updated);
  }, [suppliers]);

  const softDeleteSupplier = useCallback(async (id: string) => {
    const item = suppliers.find(s => s.id === id);
    if (!item) return;
    const newList = suppliers.filter(s => s.id !== id);
    const trashEntry: TrashItem<Supplier> = { item, deletedAt: new Date().toISOString(), type: 'supplier' };
    const newTrash = [trashEntry, ...trashSuppliers];
    setSuppliers(newList); setTrashSuppliers(newTrash);
    await Promise.all([saveSuppliers(newList), saveTrashSuppliers(newTrash)]);
  }, [suppliers, trashSuppliers]);

  const restoreSupplier = useCallback(async (id: string) => {
    const entry = trashSuppliers.find(t => t.item.id === id);
    if (!entry) return;
    const newList = [entry.item, ...suppliers];
    const newTrash = trashSuppliers.filter(t => t.item.id !== id);
    setSuppliers(newList); setTrashSuppliers(newTrash);
    await Promise.all([saveSuppliers(newList), saveTrashSuppliers(newTrash)]);
  }, [suppliers, trashSuppliers]);

  const permanentDeleteSupplier = useCallback(async (id: string) => {
    const newTrash = trashSuppliers.filter(t => t.item.id !== id);
    setTrashSuppliers(newTrash); await saveTrashSuppliers(newTrash);
  }, [trashSuppliers]);

  // ── Full Material ──
  const addFullMaterial = useCallback(async (m: Omit<FullMaterial, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newM: FullMaterial = { ...m, id: Date.now().toString(), createdAt: now, updatedAt: now };
    const updated = [newM, ...fullMaterials];
    setFullMaterials(updated); await saveFullMaterials(updated);
  }, [fullMaterials]);

  const updateFullMaterial = useCallback(async (id: string, m: Partial<FullMaterial>) => {
    const updated = fullMaterials.map(x => x.id === id ? { ...x, ...m, updatedAt: new Date().toISOString() } : x);
    setFullMaterials(updated); await saveFullMaterials(updated);
  }, [fullMaterials]);

  const deleteFullMaterial = useCallback(async (id: string) => {
    const updated = fullMaterials.filter(x => x.id !== id);
    setFullMaterials(updated); await saveFullMaterials(updated);
  }, [fullMaterials]);

  const softDeleteFullMaterial = useCallback(async (id: string) => {
    const item = fullMaterials.find(m => m.id === id);
    if (!item) return;
    const newList = fullMaterials.filter(m => m.id !== id);
    const trashEntry: TrashItem<FullMaterial> = { item, deletedAt: new Date().toISOString(), type: 'material' };
    const newTrash = [trashEntry, ...trashMaterials];
    setFullMaterials(newList); setTrashMaterials(newTrash);
    await Promise.all([saveFullMaterials(newList), saveTrashMaterials(newTrash)]);
  }, [fullMaterials, trashMaterials]);

  const restoreFullMaterial = useCallback(async (id: string) => {
    const entry = trashMaterials.find(t => t.item.id === id);
    if (!entry) return;
    const newList = [entry.item, ...fullMaterials];
    const newTrash = trashMaterials.filter(t => t.item.id !== id);
    setFullMaterials(newList); setTrashMaterials(newTrash);
    await Promise.all([saveFullMaterials(newList), saveTrashMaterials(newTrash)]);
  }, [fullMaterials, trashMaterials]);

  const permanentDeleteFullMaterial = useCallback(async (id: string) => {
    const newTrash = trashMaterials.filter(t => t.item.id !== id);
    setTrashMaterials(newTrash); await saveTrashMaterials(newTrash);
  }, [trashMaterials]);

  const updateMaterialPrice = useCallback(async (id: string, newPrice: number, supplierId: string, supplierName: string, notes: string) => {
    const updated = fullMaterials.map(x => {
      if (x.id !== id) return x;
      const historyEntry: PriceHistoryEntry = {
        id: Date.now().toString(), oldPrice: x.unitPrice, newPrice, supplierId, supplierName,
        date: new Date().toISOString(), notes,
      };
      return {
        ...x, unitPrice: newPrice, lastPurchasePrice: newPrice,
        averagePrice: x.averagePrice ? (x.averagePrice + newPrice) / 2 : newPrice,
        priceHistory: [historyEntry, ...(x.priceHistory || [])],
        updatedAt: new Date().toISOString(),
      };
    });
    setFullMaterials(updated); await saveFullMaterials(updated);
  }, [fullMaterials]);

  // ── Artwork Cost ──
  const addArtworkCost = useCallback(async (cost: Omit<ArtworkCostSheet, 'id' | 'createdAt'>) => {
    const newCost: ArtworkCostSheet = { ...cost, id: Date.now().toString(), createdAt: new Date().toISOString() };
    const updated = [newCost, ...artworkCosts];
    setArtworkCosts(updated); await saveArtworkCosts(updated);
  }, [artworkCosts]);

  const updateArtworkCost = useCallback(async (id: string, cost: Partial<ArtworkCostSheet>) => {
    const updated = artworkCosts.map(c => c.id === id ? { ...c, ...cost } : c);
    setArtworkCosts(updated); await saveArtworkCosts(updated);
  }, [artworkCosts]);

  const deleteArtworkCost = useCallback(async (id: string) => {
    const updated = artworkCosts.filter(c => c.id !== id);
    setArtworkCosts(updated); await saveArtworkCosts(updated);
  }, [artworkCosts]);

  const getArtworkCosts = useCallback((artworkId: string) => {
    return artworkCosts.filter(c => c.artworkId === artworkId).sort((a, b) => b.version - a.version);
  }, [artworkCosts]);

  const getLatestCost = useCallback((artworkId: string) => {
    const costs = artworkCosts.filter(c => c.artworkId === artworkId);
    if (!costs.length) return undefined;
    return costs.reduce((latest, c) => c.version > latest.version ? c : latest);
  }, [artworkCosts]);

  // ── Worker ──
  const addWorker = useCallback(async (w: Omit<Worker, 'id' | 'createdAt'>) => {
    const newW: Worker = { ...w, id: Date.now().toString(), createdAt: new Date().toISOString() };
    const updated = [newW, ...workers];
    setWorkers(updated); await saveWorkers(updated);
  }, [workers]);

  const updateWorker = useCallback(async (id: string, w: Partial<Worker>) => {
    const updated = workers.map(x => x.id === id ? { ...x, ...w } : x);
    setWorkers(updated); await saveWorkers(updated);
  }, [workers]);

  const deleteWorker = useCallback(async (id: string) => {
    const updated = workers.filter(x => x.id !== id);
    setWorkers(updated); await saveWorkers(updated);
  }, [workers]);

  // ── Production Order ──
  const addProductionOrder = useCallback(async (o: Omit<ProductionOrder, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const num = (productionOrders.length + 1).toString().padStart(4, '0');
    const year = new Date().getFullYear();
    const newO: ProductionOrder = {
      ...o, id: Date.now().toString(), orderNumber: `PO-${year}-${num}`,
      createdAt: now, updatedAt: now,
    };
    const updated = [newO, ...productionOrders];
    setProductionOrders(updated); await saveProductionOrders(updated);
  }, [productionOrders]);

  const updateProductionOrder = useCallback(async (id: string, o: Partial<ProductionOrder>) => {
    const updated = productionOrders.map(x => x.id === id ? { ...x, ...o, updatedAt: new Date().toISOString() } : x);
    setProductionOrders(updated); await saveProductionOrders(updated);
  }, [productionOrders]);

  const deleteProductionOrder = useCallback(async (id: string) => {
    const updated = productionOrders.filter(x => x.id !== id);
    setProductionOrders(updated); await saveProductionOrders(updated);
  }, [productionOrders]);

  const getOrdersByArtwork = useCallback((artworkId: string) => {
    return productionOrders.filter(o => o.artworkId === artworkId);
  }, [productionOrders]);

  // ── Internal Manufacturing ──
  const addInternalManufacturing = useCallback(async (m: Omit<InternalManufacturing, 'id' | 'createdAt'>) => {
    const newM: InternalManufacturing = { ...m, id: Date.now().toString(), createdAt: new Date().toISOString() };
    const updated = [newM, ...internalManufacturing];
    setInternalManufacturing(updated); await saveInternalManufacturing(updated);
  }, [internalManufacturing]);

  const updateInternalManufacturing = useCallback(async (id: string, m: Partial<InternalManufacturing>) => {
    const updated = internalManufacturing.map(x => x.id === id ? { ...x, ...m } : x);
    setInternalManufacturing(updated); await saveInternalManufacturing(updated);
  }, [internalManufacturing]);

  const deleteInternalManufacturing = useCallback(async (id: string) => {
    const updated = internalManufacturing.filter(x => x.id !== id);
    setInternalManufacturing(updated); await saveInternalManufacturing(updated);
  }, [internalManufacturing]);

  // ── External Manufacturing ──
  const addExternalManufacturing = useCallback(async (m: Omit<ExternalManufacturing, 'id' | 'createdAt'>) => {
    const newM: ExternalManufacturing = { ...m, id: Date.now().toString(), createdAt: new Date().toISOString() };
    const updated = [newM, ...externalManufacturing];
    setExternalManufacturing(updated); await saveExternalManufacturing(updated);
  }, [externalManufacturing]);

  const updateExternalManufacturing = useCallback(async (id: string, m: Partial<ExternalManufacturing>) => {
    const updated = externalManufacturing.map(x => x.id === id ? { ...x, ...m } : x);
    setExternalManufacturing(updated); await saveExternalManufacturing(updated);
  }, [externalManufacturing]);

  const deleteExternalManufacturing = useCallback(async (id: string) => {
    const updated = externalManufacturing.filter(x => x.id !== id);
    setExternalManufacturing(updated); await saveExternalManufacturing(updated);
  }, [externalManufacturing]);

  // ── Settings ──
  const updateAppSettings = useCallback(async (s: Partial<AppSettings>) => {
    const updated = { ...appSettings, ...s };
    setAppSettings(updated); await saveAppSettings(updated);
  }, [appSettings]);

  const addBackupHistoryEntry = useCallback(async (entry: Omit<BackupHistoryEntry, 'id'>) => {
    const newEntry: BackupHistoryEntry = { ...entry, id: Date.now().toString() };
    const updated = [newEntry, ...backupHistory].slice(0, appSettings.maxBackupVersions || 50);
    setBackupHistory(updated); await saveBackupHistory(updated);
  }, [backupHistory, appSettings.maxBackupVersions]);

  const clearBackupHistory = useCallback(async () => {
    setBackupHistory([]); await saveBackupHistory([]);
  }, []);

  // ── Full Restore ──
  const restoreBackup = useCallback(async (data: { artworks: Artwork[]; customers: Customer[]; quotes: Quote[]; materials?: Material[] }) => {
    setArtworks(data.artworks); setCustomers(data.customers); setQuotes(data.quotes);
    if (data.materials) setMaterials(data.materials);
    await Promise.all([
      saveArtworks(data.artworks), saveCustomers(data.customers),
      saveQuotes(data.quotes), saveMaterials(data.materials || []),
    ]);
  }, []);

  const restoreFullBackup = useCallback(async (payload: any, options: RestoreOptions) => {
    const d = payload.data || payload;
    const saves: Promise<void>[] = [];

    if (options.artworks && d.artworks) {
      const merged = options.mergeMode === 'merge'
        ? [...artworks.filter(a => !d.artworks.find((x: any) => x.id === a.id)), ...d.artworks]
        : d.artworks;
      setArtworks(merged); saves.push(saveArtworks(merged));
    }
    if (options.customers && d.customers) {
      const merged = options.mergeMode === 'merge'
        ? [...customers.filter(c => !d.customers.find((x: any) => x.id === c.id)), ...d.customers]
        : d.customers;
      setCustomers(merged); saves.push(saveCustomers(merged));
    }
    if (options.quotes && d.quotes) {
      const merged = options.mergeMode === 'merge'
        ? [...quotes.filter(q => !d.quotes.find((x: any) => x.id === q.id)), ...d.quotes]
        : d.quotes;
      setQuotes(merged); saves.push(saveQuotes(merged));
    }
    if (options.materials && d.fullMaterials) {
      const merged = options.mergeMode === 'merge'
        ? [...fullMaterials.filter(m => !d.fullMaterials.find((x: any) => x.id === m.id)), ...d.fullMaterials]
        : d.fullMaterials;
      setFullMaterials(merged); saves.push(saveFullMaterials(merged));
    }
    if (options.suppliers && d.suppliers) {
      const merged = options.mergeMode === 'merge'
        ? [...suppliers.filter(s => !d.suppliers.find((x: any) => x.id === s.id)), ...d.suppliers]
        : d.suppliers;
      setSuppliers(merged); saves.push(saveSuppliers(merged));
    }
    if (options.workers && d.workers) {
      const merged = options.mergeMode === 'merge'
        ? [...workers.filter(w => !d.workers.find((x: any) => x.id === w.id)), ...d.workers]
        : d.workers;
      setWorkers(merged); saves.push(saveWorkers(merged));
    }
    if (options.productionOrders && d.productionOrders) {
      const merged = options.mergeMode === 'merge'
        ? [...productionOrders.filter(o => !d.productionOrders.find((x: any) => x.id === o.id)), ...d.productionOrders]
        : d.productionOrders;
      setProductionOrders(merged); saves.push(saveProductionOrders(merged));
    }
    if (options.artworkCosts && d.artworkCosts) {
      const merged = options.mergeMode === 'merge'
        ? [...artworkCosts.filter(c => !d.artworkCosts.find((x: any) => x.id === c.id)), ...d.artworkCosts]
        : d.artworkCosts;
      setArtworkCosts(merged); saves.push(saveArtworkCosts(merged));
    }
    if (options.categories && d.categories) {
      setArtworkCategories(d.categories); saves.push(saveCategories(d.categories));
    }
    if (options.settings && d.settings) {
      setAppSettings(d.settings); saves.push(saveAppSettings(d.settings));
    }
    if (d.externalManufacturing) {
      setExternalManufacturing(d.externalManufacturing);
      saves.push(saveExternalManufacturing(d.externalManufacturing));
    }
    if (d.internalManufacturing) {
      setInternalManufacturing(d.internalManufacturing);
      saves.push(saveInternalManufacturing(d.internalManufacturing));
    }
    await Promise.all(saves);
  }, [
    artworks, customers, quotes, fullMaterials, suppliers, workers,
    productionOrders, artworkCosts,
  ]);

  return (
    <AppContext.Provider value={{
      artworks, customers, quotes, materials, loading, artworkCategories,
      suppliers, fullMaterials, artworkCosts,
      workers, productionOrders, internalManufacturing, externalManufacturing,
      trashArtworks, trashCustomers, trashQuotes, trashMaterials, trashSuppliers,
      appSettings, backupHistory,
      addArtwork, updateArtwork, deleteArtwork, softDeleteArtwork, restoreArtwork, permanentDeleteArtwork,
      addCustomer, updateCustomer, deleteCustomer, softDeleteCustomer, restoreCustomer, permanentDeleteCustomer,
      addQuote, updateQuote, deleteQuote, softDeleteQuote, restoreQuote, permanentDeleteQuote,
      addMaterial, updateMaterial, deleteMaterial,
      addArtworkCategory, deleteArtworkCategory,
      addSupplier, updateSupplier, deleteSupplier, softDeleteSupplier, restoreSupplier, permanentDeleteSupplier,
      addFullMaterial, updateFullMaterial, deleteFullMaterial, softDeleteFullMaterial, restoreFullMaterial, permanentDeleteFullMaterial, updateMaterialPrice,
      addArtworkCost, updateArtworkCost, deleteArtworkCost, getArtworkCosts, getLatestCost,
      addWorker, updateWorker, deleteWorker,
      addProductionOrder, updateProductionOrder, deleteProductionOrder, getOrdersByArtwork,
      addInternalManufacturing, updateInternalManufacturing, deleteInternalManufacturing,
      addExternalManufacturing, updateExternalManufacturing, deleteExternalManufacturing,
      updateAppSettings, addBackupHistoryEntry, clearBackupHistory,
      restoreBackup, restoreFullBackup,
    }}>
      {children}
    </AppContext.Provider>
  );
}
