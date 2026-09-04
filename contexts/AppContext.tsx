// Powered by OnSpace.AI
import React, { createContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  listenCollection, upsertDocSilent, upsertDoc, removeDoc,
  batchUpsert, fetchOnce, uid, flushQueue, loadQueue,
  onConnectivityChange, getIsOnline,
} from '@/services/firestoreService';
import { COLLECTIONS } from '@/services/firebase';
import {
  loadArtworks, saveArtworks, loadCustomers, saveCustomers,
  loadQuotes, saveQuotes, loadMaterials, saveMaterials,
  loadCategories, saveCategories, loadSuppliers, saveSuppliers,
  loadFullMaterials, saveFullMaterials, loadArtworkCosts, saveArtworkCosts,
  loadWorkers, saveWorkers, loadProductionOrders, saveProductionOrders,
  loadInternalManufacturing, saveInternalManufacturing,
  loadExternalManufacturing, saveExternalManufacturing,
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
  createdAt: string;
  updatedAt?: string;
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

// ─── Cost items ───────────────────────────────────────────────────────────
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
  createdAt: string;
  validUntil: string;
}

// ─── Context type ──────────────────────────────────────────────────────────
interface AppContextType {
  artworks: Artwork[];
  customers: Customer[];
  quotes: Quote[];
  materials: Material[];
  loading: boolean;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'offline' | 'error';
  pendingOpsCount: number;
  isOnline: boolean;
  artworkCategories: ArtworkCategory[];
  suppliers: Supplier[];
  fullMaterials: FullMaterial[];
  artworkCosts: ArtworkCostSheet[];
  workers: Worker[];
  productionOrders: ProductionOrder[];
  internalManufacturing: InternalManufacturing[];
  externalManufacturing: ExternalManufacturing[];
  addArtwork: (a: Omit<Artwork, 'id' | 'createdAt'>) => Promise<void>;
  updateArtwork: (id: string, a: Partial<Artwork>) => Promise<void>;
  deleteArtwork: (id: string) => Promise<void>;
  addCustomer: (c: Omit<Customer, 'id' | 'createdAt'>) => Promise<void>;
  updateCustomer: (id: string, c: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addQuote: (q: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt'>) => Promise<void>;
  updateQuote: (id: string, q: Partial<Quote>) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
  addMaterial: (m: Omit<Material, 'id' | 'createdAt'>) => Promise<void>;
  updateMaterial: (id: string, m: Partial<Material>) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
  addArtworkCategory: (name: string) => Promise<void>;
  deleteArtworkCategory: (id: string) => Promise<void>;
  addSupplier: (s: Omit<Supplier, 'id' | 'createdAt'>) => Promise<void>;
  updateSupplier: (id: string, s: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  addFullMaterial: (m: Omit<FullMaterial, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateFullMaterial: (id: string, m: Partial<FullMaterial>) => Promise<void>;
  deleteFullMaterial: (id: string) => Promise<void>;
  updateMaterialPrice: (id: string, newPrice: number, supplierId: string, supplierName: string, notes: string) => Promise<void>;
  addArtworkCost: (c: Omit<ArtworkCostSheet, 'id' | 'createdAt'>) => Promise<void>;
  updateArtworkCost: (id: string, c: Partial<ArtworkCostSheet>) => Promise<void>;
  deleteArtworkCost: (id: string) => Promise<void>;
  getArtworkCosts: (artworkId: string) => ArtworkCostSheet[];
  getLatestCost: (artworkId: string) => ArtworkCostSheet | undefined;
  addWorker: (w: Omit<Worker, 'id' | 'createdAt'>) => Promise<void>;
  updateWorker: (id: string, w: Partial<Worker>) => Promise<void>;
  deleteWorker: (id: string) => Promise<void>;
  addProductionOrder: (o: Omit<ProductionOrder, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProductionOrder: (id: string, o: Partial<ProductionOrder>) => Promise<void>;
  deleteProductionOrder: (id: string) => Promise<void>;
  getOrdersByArtwork: (artworkId: string) => ProductionOrder[];
  addInternalManufacturing: (m: Omit<InternalManufacturing, 'id' | 'createdAt'>) => Promise<void>;
  updateInternalManufacturing: (id: string, m: Partial<InternalManufacturing>) => Promise<void>;
  deleteInternalManufacturing: (id: string) => Promise<void>;
  addExternalManufacturing: (m: Omit<ExternalManufacturing, 'id' | 'createdAt'>) => Promise<void>;
  updateExternalManufacturing: (id: string, m: Partial<ExternalManufacturing>) => Promise<void>;
  deleteExternalManufacturing: (id: string) => Promise<void>;
  restoreBackup: (data: Record<string, any[]>) => Promise<void>;
  migrateLocalToFirestore: () => Promise<{ migrated: number; skipped: number }>;
  forceSyncNow: () => Promise<void>;
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

const DEFAULT_CATEGORIES: ArtworkCategory[] = [
  { id: '1', name: 'نحت جداريات', createdAt: new Date().toISOString() },
  { id: '2', name: 'نحت حر', createdAt: new Date().toISOString() },
  { id: '3', name: 'وحدات إضاءة', createdAt: new Date().toISOString() },
  { id: '4', name: 'منزلي', createdAt: new Date().toISOString() },
  { id: '5', name: 'أخرى', createdAt: new Date().toISOString() },
];

// ─── Provider ──────────────────────────────────────────────────────────────
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
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'offline' | 'error'>('idle');
  const [pendingOpsCount, setPendingOpsCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);

  const unsubsRef = useRef<(() => void)[]>([]);
  const loadingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Monitor pending ops count ──────────────────────────────────────────
  const refreshPendingCount = useCallback(async () => {
    const queue = await loadQueue();
    setPendingOpsCount(queue.length);
  }, []);

  // ─── Monitor connectivity ────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onConnectivityChange((online) => {
      setIsOnline(online);
      if (online) {
        setSyncStatus('syncing');
        flushQueue().then(() => {
          setSyncStatus('synced');
          refreshPendingCount();
        }).catch(() => setSyncStatus('error'));
      } else {
        setSyncStatus('offline');
        refreshPendingCount();
      }
    });
    return () => unsub();
  }, [refreshPendingCount]);

  useEffect(() => {
    let mounted = true;
    setSyncStatus('syncing');

    // Load local cache first for instant display
    loadFromLocal().then(() => {
      if (mounted) setLoading(false);
    });

    // Subscribe to all Firestore collections in parallel
    const subs: (() => void)[] = [];

    const setupListener = (col: string, setter: (d: any[]) => void) => {
      const unsub = listenCollection(col, d => {
        if (mounted) {
          setter(d);
          setSyncStatus('synced');
        }
      }, () => {
        if (mounted) setSyncStatus('offline');
      });
      return unsub;
    };

    subs.push(setupListener(COLLECTIONS.artworks, setArtworks));
    subs.push(setupListener(COLLECTIONS.customers, setCustomers));
    subs.push(setupListener(COLLECTIONS.quotes, setQuotes));
    subs.push(setupListener(COLLECTIONS.fullMaterials, setFullMaterials));
    subs.push(setupListener(COLLECTIONS.suppliers, setSuppliers));
    subs.push(setupListener(COLLECTIONS.artworkCosts, setArtworkCosts));
    subs.push(setupListener(COLLECTIONS.workers, setWorkers));
    subs.push(setupListener(COLLECTIONS.productionOrders, setProductionOrders));
    subs.push(setupListener(COLLECTIONS.internalManufacturing, setInternalManufacturing));
    subs.push(setupListener(COLLECTIONS.externalManufacturing, setExternalManufacturing));

    // Categories with default seed — ONLY if Firestore has zero categories
    subs.push(listenCollection(COLLECTIONS.categories, d => {
      if (!mounted) return;
      if (d.length > 0) {
        // Firestore has existing categories — use them as-is, never overwrite
        setArtworkCategories(d as ArtworkCategory[]);
      } else {
        // No categories in Firestore at all — seed defaults once
        setArtworkCategories(DEFAULT_CATEGORIES);
        // Only write if absolutely empty (prevents overwriting on reconnect)
        fetchOnce(COLLECTIONS.categories).then(existing => {
          if (existing.length === 0) {
            DEFAULT_CATEGORIES.forEach(c => upsertDocSilent(COLLECTIONS.categories, c.id, c));
          }
        }).catch(() => {});
      }
      setSyncStatus('synced');
    }, () => {
      if (mounted) setSyncStatus('offline');
    }));

    unsubsRef.current = subs;

    // Mark loaded after timeout
    loadingTimer.current = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 2000);

    // Flush any pending ops
    flushQueue().then(() => refreshPendingCount());

    return () => {
      mounted = false;
      subs.forEach(u => u());
      if (loadingTimer.current) clearTimeout(loadingTimer.current);
    };
  }, []);

  // ─── Local fallback loader ────────────────────────────────────────────────
  async function loadFromLocal() {
    try {
      const [a, c, q, m, cats, sup, fm, costs, w, orders, intm, extm] = await Promise.all([
        loadArtworks(), loadCustomers(), loadQuotes(), loadMaterials(),
        loadCategories(), loadSuppliers(), loadFullMaterials(), loadArtworkCosts(),
        loadWorkers(), loadProductionOrders(), loadInternalManufacturing(), loadExternalManufacturing(),
      ]);
      setArtworks(prev => prev.length ? prev : a);
      setCustomers(prev => prev.length ? prev : c);
      setQuotes(prev => prev.length ? prev : q);
      setMaterials(m);
      setSuppliers(prev => prev.length ? prev : sup);
      setFullMaterials(prev => prev.length ? prev : fm);
      setArtworkCosts(prev => prev.length ? prev : costs);
      setWorkers(prev => prev.length ? prev : w);
      setProductionOrders(prev => prev.length ? prev : orders);
      setInternalManufacturing(prev => prev.length ? prev : intm);
      setExternalManufacturing(prev => prev.length ? prev : extm);
      setArtworkCategories(prev => prev.length ? prev : (cats.length > 0 ? cats : DEFAULT_CATEGORIES));
    } catch {}
  }

  // ─── Cache to AsyncStorage when data changes ──────────────────────────────
  useEffect(() => { if (artworks.length) saveArtworks(artworks); }, [artworks]);
  useEffect(() => { if (customers.length) saveCustomers(customers); }, [customers]);
  useEffect(() => { if (quotes.length) saveQuotes(quotes); }, [quotes]);
  useEffect(() => { if (fullMaterials.length) saveFullMaterials(fullMaterials); }, [fullMaterials]);
  useEffect(() => { if (suppliers.length) saveSuppliers(suppliers); }, [suppliers]);
  useEffect(() => { if (artworkCosts.length) saveArtworkCosts(artworkCosts); }, [artworkCosts]);
  useEffect(() => { if (workers.length) saveWorkers(workers); }, [workers]);
  useEffect(() => { if (productionOrders.length) saveProductionOrders(productionOrders); }, [productionOrders]);

  // ─── Force sync ────────────────────────────────────────────────────────────
  const forceSyncNow = useCallback(async () => {
    setSyncStatus('syncing');
    try {
      await flushQueue();
      await refreshPendingCount();
      setSyncStatus('synced');
    } catch {
      setSyncStatus('error');
    }
  }, [refreshPendingCount]);

  // ─── Migration: local AsyncStorage → Firestore ────────────────────────────
  const migrateLocalToFirestore = useCallback(async (): Promise<{ migrated: number; skipped: number }> => {
    let migrated = 0;
    let skipped = 0;

    const migrate = async (col: string, loader: () => Promise<any[]>) => {
      try {
        const local = await loader();
        if (!local.length) return;
        const existing = await fetchOnce(col);
        const existingIds = new Set(existing.map((x: any) => x.id));
        const toMigrate = local.filter((x: any) => !existingIds.has(x.id));
        skipped += local.length - toMigrate.length;
        if (toMigrate.length > 0) {
          await batchUpsert(col, toMigrate);
          migrated += toMigrate.length;
        }
      } catch {}
    };

    await Promise.all([
      migrate(COLLECTIONS.artworks, loadArtworks),
      migrate(COLLECTIONS.customers, loadCustomers),
      migrate(COLLECTIONS.quotes, loadQuotes),
      migrate(COLLECTIONS.fullMaterials, loadFullMaterials),
      migrate(COLLECTIONS.suppliers, loadSuppliers),
      migrate(COLLECTIONS.artworkCosts, loadArtworkCosts),
      migrate(COLLECTIONS.workers, loadWorkers),
      migrate(COLLECTIONS.productionOrders, loadProductionOrders),
      migrate(COLLECTIONS.externalManufacturing, loadExternalManufacturing),
    ]);

    return { migrated, skipped };
  }, []);

  // ─── Helper: mark syncing ─────────────────────────────────────────────────
  function markSyncing() {
    if (getIsOnline()) setSyncStatus('syncing');
    else setSyncStatus('offline');
  }

  // ─── Artwork CRUD ──────────────────────────────────────────────────────────
  const addArtwork = useCallback(async (artwork: Omit<Artwork, 'id' | 'createdAt'>) => {
    const now = new Date().toISOString();
    const newItem: Artwork = { ...artwork, id: uid(), createdAt: now, updatedAt: now };
    markSyncing();
    await upsertDocSilent(COLLECTIONS.artworks, newItem.id, newItem);
    setSyncStatus(getIsOnline() ? 'synced' : 'offline');
    await refreshPendingCount();
  }, [refreshPendingCount]);

  const updateArtwork = useCallback(async (id: string, artwork: Partial<Artwork>) => {
    const existing = artworks.find(a => a.id === id);
    if (!existing) return;
    const updated = { ...existing, ...artwork, updatedAt: new Date().toISOString() };
    markSyncing();
    await upsertDocSilent(COLLECTIONS.artworks, id, updated);
    setSyncStatus(getIsOnline() ? 'synced' : 'offline');
    await refreshPendingCount();
  }, [artworks, refreshPendingCount]);

  const deleteArtwork = useCallback(async (id: string) => {
    markSyncing();
    await removeDoc(COLLECTIONS.artworks, id);
    setSyncStatus(getIsOnline() ? 'synced' : 'offline');
    await refreshPendingCount();
  }, [refreshPendingCount]);

  // ─── Customer CRUD ─────────────────────────────────────────────────────────
  const addCustomer = useCallback(async (customer: Omit<Customer, 'id' | 'createdAt'>) => {
    const newItem: Customer = { ...customer, id: uid(), createdAt: new Date().toISOString() };
    markSyncing();
    await upsertDocSilent(COLLECTIONS.customers, newItem.id, newItem);
    setSyncStatus(getIsOnline() ? 'synced' : 'offline');
    await refreshPendingCount();
  }, [refreshPendingCount]);

  const updateCustomer = useCallback(async (id: string, customer: Partial<Customer>) => {
    const existing = customers.find(c => c.id === id);
    if (!existing) return;
    markSyncing();
    await upsertDocSilent(COLLECTIONS.customers, id, { ...existing, ...customer });
    setSyncStatus(getIsOnline() ? 'synced' : 'offline');
    await refreshPendingCount();
  }, [customers, refreshPendingCount]);

  const deleteCustomer = useCallback(async (id: string) => {
    markSyncing();
    await removeDoc(COLLECTIONS.customers, id);
    setSyncStatus(getIsOnline() ? 'synced' : 'offline');
    await refreshPendingCount();
  }, [refreshPendingCount]);

  // ─── Quote CRUD ────────────────────────────────────────────────────────────
  const addQuote = useCallback(async (quote: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt'>) => {
    const num = (quotes.length + 1).toString().padStart(3, '0');
    const year = new Date().getFullYear();
    const newItem: Quote = {
      ...quote, id: uid(), quoteNumber: `QT-${year}-${num}`,
      createdAt: new Date().toISOString(),
    };
    markSyncing();
    await upsertDocSilent(COLLECTIONS.quotes, newItem.id, newItem);
    setSyncStatus(getIsOnline() ? 'synced' : 'offline');
    await refreshPendingCount();
  }, [quotes, refreshPendingCount]);

  const updateQuote = useCallback(async (id: string, quote: Partial<Quote>) => {
    const existing = quotes.find(q => q.id === id);
    if (!existing) return;
    markSyncing();
    await upsertDocSilent(COLLECTIONS.quotes, id, { ...existing, ...quote });
    setSyncStatus(getIsOnline() ? 'synced' : 'offline');
    await refreshPendingCount();
  }, [quotes, refreshPendingCount]);

  const deleteQuote = useCallback(async (id: string) => {
    markSyncing();
    await removeDoc(COLLECTIONS.quotes, id);
    setSyncStatus(getIsOnline() ? 'synced' : 'offline');
    await refreshPendingCount();
  }, [refreshPendingCount]);

  // ─── Legacy Material CRUD ──────────────────────────────────────────────────
  const addMaterial = useCallback(async (material: Omit<Material, 'id' | 'createdAt'>) => {
    const newItem: Material = { ...material, id: uid(), createdAt: new Date().toISOString() };
    setMaterials(prev => [newItem, ...prev]);
    await saveMaterials([newItem, ...materials]);
  }, [materials]);

  const updateMaterial = useCallback(async (id: string, material: Partial<Material>) => {
    const updated = materials.map(m => m.id === id ? { ...m, ...material } : m);
    setMaterials(updated); await saveMaterials(updated);
  }, [materials]);

  const deleteMaterial = useCallback(async (id: string) => {
    const updated = materials.filter(m => m.id !== id);
    setMaterials(updated); await saveMaterials(updated);
  }, [materials]);

  // ─── Category CRUD ─────────────────────────────────────────────────────────
  const addArtworkCategory = useCallback(async (name: string) => {
    const newCat: ArtworkCategory = { id: uid(), name: name.trim(), createdAt: new Date().toISOString() };
    await upsertDocSilent(COLLECTIONS.categories, newCat.id, newCat);
  }, []);

  const deleteArtworkCategory = useCallback(async (id: string) => {
    await removeDoc(COLLECTIONS.categories, id);
  }, []);

  // ─── Supplier CRUD ─────────────────────────────────────────────────────────
  const addSupplier = useCallback(async (s: Omit<Supplier, 'id' | 'createdAt'>) => {
    const newItem: Supplier = { ...s, id: uid(), createdAt: new Date().toISOString() };
    markSyncing();
    await upsertDocSilent(COLLECTIONS.suppliers, newItem.id, newItem);
    setSyncStatus(getIsOnline() ? 'synced' : 'offline');
    await refreshPendingCount();
  }, [refreshPendingCount]);

  const updateSupplier = useCallback(async (id: string, s: Partial<Supplier>) => {
    const existing = suppliers.find(x => x.id === id);
    if (!existing) return;
    markSyncing();
    await upsertDocSilent(COLLECTIONS.suppliers, id, { ...existing, ...s });
    setSyncStatus(getIsOnline() ? 'synced' : 'offline');
    await refreshPendingCount();
  }, [suppliers, refreshPendingCount]);

  const deleteSupplier = useCallback(async (id: string) => {
    markSyncing();
    await removeDoc(COLLECTIONS.suppliers, id);
    setSyncStatus(getIsOnline() ? 'synced' : 'offline');
    await refreshPendingCount();
  }, [refreshPendingCount]);

  // ─── Full Material CRUD ────────────────────────────────────────────────────
  const addFullMaterial = useCallback(async (m: Omit<FullMaterial, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newItem: FullMaterial = { ...m, id: uid(), createdAt: now, updatedAt: now };
    markSyncing();
    await upsertDocSilent(COLLECTIONS.fullMaterials, newItem.id, newItem);
    setSyncStatus(getIsOnline() ? 'synced' : 'offline');
    await refreshPendingCount();
  }, [refreshPendingCount]);

  const updateFullMaterial = useCallback(async (id: string, m: Partial<FullMaterial>) => {
    const existing = fullMaterials.find(x => x.id === id);
    if (!existing) return;
    markSyncing();
    await upsertDocSilent(COLLECTIONS.fullMaterials, id, { ...existing, ...m, updatedAt: new Date().toISOString() });
    setSyncStatus(getIsOnline() ? 'synced' : 'offline');
    await refreshPendingCount();
  }, [fullMaterials, refreshPendingCount]);

  const deleteFullMaterial = useCallback(async (id: string) => {
    markSyncing();
    await removeDoc(COLLECTIONS.fullMaterials, id);
    setSyncStatus(getIsOnline() ? 'synced' : 'offline');
    await refreshPendingCount();
  }, [refreshPendingCount]);

  const updateMaterialPrice = useCallback(async (id: string, newPrice: number, supplierId: string, supplierName: string, notes: string) => {
    const x = fullMaterials.find(m => m.id === id);
    if (!x) return;
    const historyEntry: PriceHistoryEntry = {
      id: uid(), oldPrice: x.unitPrice, newPrice, supplierId, supplierName,
      date: new Date().toISOString(), notes,
    };
    const updated = {
      ...x, unitPrice: newPrice, lastPurchasePrice: newPrice,
      averagePrice: x.averagePrice ? (x.averagePrice + newPrice) / 2 : newPrice,
      priceHistory: [historyEntry, ...(x.priceHistory || [])],
      updatedAt: new Date().toISOString(),
    };
    markSyncing();
    await upsertDocSilent(COLLECTIONS.fullMaterials, id, updated);
    setSyncStatus(getIsOnline() ? 'synced' : 'offline');
    await refreshPendingCount();
  }, [fullMaterials, refreshPendingCount]);

  // ─── Artwork Cost CRUD ─────────────────────────────────────────────────────
  const addArtworkCost = useCallback(async (cost: Omit<ArtworkCostSheet, 'id' | 'createdAt'>) => {
    const newItem: ArtworkCostSheet = { ...cost, id: uid(), createdAt: new Date().toISOString() };
    markSyncing();
    await upsertDocSilent(COLLECTIONS.artworkCosts, newItem.id, newItem);
    setSyncStatus(getIsOnline() ? 'synced' : 'offline');
    await refreshPendingCount();
  }, [refreshPendingCount]);

  const updateArtworkCost = useCallback(async (id: string, cost: Partial<ArtworkCostSheet>) => {
    const existing = artworkCosts.find(c => c.id === id);
    if (!existing) return;
    markSyncing();
    await upsertDocSilent(COLLECTIONS.artworkCosts, id, { ...existing, ...cost });
    setSyncStatus(getIsOnline() ? 'synced' : 'offline');
    await refreshPendingCount();
  }, [artworkCosts, refreshPendingCount]);

  const deleteArtworkCost = useCallback(async (id: string) => {
    markSyncing();
    await removeDoc(COLLECTIONS.artworkCosts, id);
    setSyncStatus(getIsOnline() ? 'synced' : 'offline');
    await refreshPendingCount();
  }, [refreshPendingCount]);

  const getArtworkCosts = useCallback((artworkId: string) => {
    return artworkCosts.filter(c => c.artworkId === artworkId).sort((a, b) => b.version - a.version);
  }, [artworkCosts]);

  const getLatestCost = useCallback((artworkId: string) => {
    const costs = artworkCosts.filter(c => c.artworkId === artworkId);
    if (!costs.length) return undefined;
    return costs.reduce((latest, c) => c.version > latest.version ? c : latest);
  }, [artworkCosts]);

  // ─── Worker CRUD ───────────────────────────────────────────────────────────
  const addWorker = useCallback(async (w: Omit<Worker, 'id' | 'createdAt'>) => {
    const newItem: Worker = { ...w, id: uid(), createdAt: new Date().toISOString() };
    markSyncing();
    await upsertDocSilent(COLLECTIONS.workers, newItem.id, newItem);
    setSyncStatus(getIsOnline() ? 'synced' : 'offline');
    await refreshPendingCount();
  }, [refreshPendingCount]);

  const updateWorker = useCallback(async (id: string, w: Partial<Worker>) => {
    const existing = workers.find(x => x.id === id);
    if (!existing) return;
    markSyncing();
    await upsertDocSilent(COLLECTIONS.workers, id, { ...existing, ...w });
    setSyncStatus(getIsOnline() ? 'synced' : 'offline');
    await refreshPendingCount();
  }, [workers, refreshPendingCount]);

  const deleteWorker = useCallback(async (id: string) => {
    markSyncing();
    await removeDoc(COLLECTIONS.workers, id);
    setSyncStatus(getIsOnline() ? 'synced' : 'offline');
    await refreshPendingCount();
  }, [refreshPendingCount]);

  // ─── Production Order CRUD ─────────────────────────────────────────────────
  const addProductionOrder = useCallback(async (o: Omit<ProductionOrder, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const num = (productionOrders.length + 1).toString().padStart(4, '0');
    const year = new Date().getFullYear();
    const newItem: ProductionOrder = { ...o, id: uid(), orderNumber: `PO-${year}-${num}`, createdAt: now, updatedAt: now };
    markSyncing();
    await upsertDocSilent(COLLECTIONS.productionOrders, newItem.id, newItem);
    setSyncStatus(getIsOnline() ? 'synced' : 'offline');
    await refreshPendingCount();
  }, [productionOrders, refreshPendingCount]);

  const updateProductionOrder = useCallback(async (id: string, o: Partial<ProductionOrder>) => {
    const existing = productionOrders.find(x => x.id === id);
    if (!existing) return;
    markSyncing();
    await upsertDocSilent(COLLECTIONS.productionOrders, id, { ...existing, ...o, updatedAt: new Date().toISOString() });
    setSyncStatus(getIsOnline() ? 'synced' : 'offline');
    await refreshPendingCount();
  }, [productionOrders, refreshPendingCount]);

  const deleteProductionOrder = useCallback(async (id: string) => {
    markSyncing();
    await removeDoc(COLLECTIONS.productionOrders, id);
    setSyncStatus(getIsOnline() ? 'synced' : 'offline');
    await refreshPendingCount();
  }, [refreshPendingCount]);

  const getOrdersByArtwork = useCallback((artworkId: string) => {
    return productionOrders.filter(o => o.artworkId === artworkId);
  }, [productionOrders]);

  // ─── Internal Manufacturing CRUD ───────────────────────────────────────────
  const addInternalManufacturing = useCallback(async (m: Omit<InternalManufacturing, 'id' | 'createdAt'>) => {
    const newItem: InternalManufacturing = { ...m, id: uid(), createdAt: new Date().toISOString() };
    markSyncing();
    await upsertDocSilent(COLLECTIONS.internalManufacturing, newItem.id, newItem);
    setSyncStatus(getIsOnline() ? 'synced' : 'offline');
    await refreshPendingCount();
  }, [refreshPendingCount]);

  const updateInternalManufacturing = useCallback(async (id: string, m: Partial<InternalManufacturing>) => {
    const existing = internalManufacturing.find(x => x.id === id);
    if (!existing) return;
    markSyncing();
    await upsertDocSilent(COLLECTIONS.internalManufacturing, id, { ...existing, ...m });
    setSyncStatus(getIsOnline() ? 'synced' : 'offline');
    await refreshPendingCount();
  }, [internalManufacturing, refreshPendingCount]);

  const deleteInternalManufacturing = useCallback(async (id: string) => {
    markSyncing();
    await removeDoc(COLLECTIONS.internalManufacturing, id);
    setSyncStatus(getIsOnline() ? 'synced' : 'offline');
    await refreshPendingCount();
  }, [refreshPendingCount]);

  // ─── External Manufacturing CRUD ───────────────────────────────────────────
  const addExternalManufacturing = useCallback(async (m: Omit<ExternalManufacturing, 'id' | 'createdAt'>) => {
    const newItem: ExternalManufacturing = { ...m, id: uid(), createdAt: new Date().toISOString() };
    markSyncing();
    await upsertDocSilent(COLLECTIONS.externalManufacturing, newItem.id, newItem);
    setSyncStatus(getIsOnline() ? 'synced' : 'offline');
    await refreshPendingCount();
  }, [refreshPendingCount]);

  const updateExternalManufacturing = useCallback(async (id: string, m: Partial<ExternalManufacturing>) => {
    const existing = externalManufacturing.find(x => x.id === id);
    if (!existing) return;
    markSyncing();
    await upsertDocSilent(COLLECTIONS.externalManufacturing, id, { ...existing, ...m });
    setSyncStatus(getIsOnline() ? 'synced' : 'offline');
    await refreshPendingCount();
  }, [externalManufacturing, refreshPendingCount]);

  const deleteExternalManufacturing = useCallback(async (id: string) => {
    markSyncing();
    await removeDoc(COLLECTIONS.externalManufacturing, id);
    setSyncStatus(getIsOnline() ? 'synced' : 'offline');
    await refreshPendingCount();
  }, [refreshPendingCount]);

  // ─── Backup restore ────────────────────────────────────────────────────────
  const restoreBackup = useCallback(async (data: Record<string, any[]>) => {
    setSyncStatus('syncing');
    try {
      for (const [col, items] of Object.entries(data)) {
        if (Array.isArray(items) && items.length > 0) {
          await batchUpsert(col, items);
        }
      }
      setSyncStatus('synced');
    } catch {
      setSyncStatus('error');
    }
  }, []);

  return (
    <AppContext.Provider value={{
      artworks, customers, quotes, materials, loading, syncStatus,
      pendingOpsCount, isOnline,
      artworkCategories, suppliers, fullMaterials, artworkCosts,
      workers, productionOrders, internalManufacturing, externalManufacturing,
      addArtwork, updateArtwork, deleteArtwork,
      addCustomer, updateCustomer, deleteCustomer,
      addQuote, updateQuote, deleteQuote,
      addMaterial, updateMaterial, deleteMaterial,
      addArtworkCategory, deleteArtworkCategory,
      addSupplier, updateSupplier, deleteSupplier,
      addFullMaterial, updateFullMaterial, deleteFullMaterial, updateMaterialPrice,
      addArtworkCost, updateArtworkCost, deleteArtworkCost, getArtworkCosts, getLatestCost,
      addWorker, updateWorker, deleteWorker,
      addProductionOrder, updateProductionOrder, deleteProductionOrder, getOrdersByArtwork,
      addInternalManufacturing, updateInternalManufacturing, deleteInternalManufacturing,
      addExternalManufacturing, updateExternalManufacturing, deleteExternalManufacturing,
      restoreBackup, migrateLocalToFirestore, forceSyncNow,
    }}>
      {children}
    </AppContext.Provider>
  );
}
