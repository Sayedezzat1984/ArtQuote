// Powered by OnSpace.AI
import React, { createContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  listenCollection, upsertDoc, removeDoc, batchUpsert, fetchOnce, uid,
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
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
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
  restoreBackup: (data: { artworks: Artwork[]; customers: Customer[]; quotes: Quote[]; materials?: Material[] }) => Promise<void>;
  migrateLocalToFirestore: () => Promise<{ migrated: number; skipped: number }>;
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
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');

  // Track Firestore unsubscribers
  const unsubsRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    let mounted = true;
    setSyncStatus('syncing');

    // Subscribe to all Firestore collections in parallel
    const subs: (() => void)[] = [];

    subs.push(listenCollection(COLLECTIONS.artworks, d => { if (mounted) setArtworks(d as Artwork[]); }));
    subs.push(listenCollection(COLLECTIONS.customers, d => { if (mounted) setCustomers(d as Customer[]); }));
    subs.push(listenCollection(COLLECTIONS.quotes, d => { if (mounted) setQuotes(d as Quote[]); }));
    subs.push(listenCollection(COLLECTIONS.fullMaterials, d => { if (mounted) setFullMaterials(d as FullMaterial[]); }));
    subs.push(listenCollection(COLLECTIONS.suppliers, d => { if (mounted) setSuppliers(d as Supplier[]); }));
    subs.push(listenCollection(COLLECTIONS.artworkCosts, d => { if (mounted) setArtworkCosts(d as ArtworkCostSheet[]); }));
    subs.push(listenCollection(COLLECTIONS.workers, d => { if (mounted) setWorkers(d as Worker[]); }));
    subs.push(listenCollection(COLLECTIONS.productionOrders, d => { if (mounted) setProductionOrders(d as ProductionOrder[]); }));
    subs.push(listenCollection(COLLECTIONS.internalManufacturing, d => { if (mounted) setInternalManufacturing(d as InternalManufacturing[]); }));
    subs.push(listenCollection(COLLECTIONS.externalManufacturing, d => { if (mounted) setExternalManufacturing(d as ExternalManufacturing[]); }));

    subs.push(listenCollection(COLLECTIONS.categories, d => {
      if (!mounted) return;
      if (d.length > 0) {
        setArtworkCategories(d as ArtworkCategory[]);
      } else {
        // Initialize default categories in Firestore
        setArtworkCategories(DEFAULT_CATEGORIES);
        DEFAULT_CATEGORIES.forEach(c => upsertDoc(COLLECTIONS.categories, c.id, c).catch(() => {}));
      }
    }, () => {
      if (mounted) {
        setSyncStatus('error');
        // Fallback: load from AsyncStorage
        loadFromLocal();
      }
    }));

    unsubsRef.current = subs;

    // After brief delay, mark as ready
    const timer = setTimeout(() => {
      if (mounted) { setLoading(false); setSyncStatus('synced'); }
    }, 1500);

    return () => {
      mounted = false;
      subs.forEach(u => u());
      clearTimeout(timer);
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
      setArtworks(a); setCustomers(c); setQuotes(q); setMaterials(m);
      setSuppliers(sup); setFullMaterials(fm); setArtworkCosts(costs);
      setWorkers(w); setProductionOrders(orders);
      setInternalManufacturing(intm); setExternalManufacturing(extm);
      setArtworkCategories(cats.length > 0 ? cats : DEFAULT_CATEGORIES);
    } finally {
      setLoading(false);
    }
  }

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
        const alreadyThere = local.length - toMigrate.length;
        if (toMigrate.length > 0) {
          await batchUpsert(col, toMigrate);
          migrated += toMigrate.length;
        }
        skipped += alreadyThere;
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

  // ─── Artwork CRUD ──────────────────────────────────────────────────────────
  const addArtwork = useCallback(async (artwork: Omit<Artwork, 'id' | 'createdAt'>) => {
    const newItem: Artwork = { ...artwork, id: uid(), createdAt: new Date().toISOString() };
    await upsertDoc(COLLECTIONS.artworks, newItem.id, newItem);
  }, []);

  const updateArtwork = useCallback(async (id: string, artwork: Partial<Artwork>) => {
    const existing = artworks.find(a => a.id === id);
    if (!existing) return;
    await upsertDoc(COLLECTIONS.artworks, id, { ...existing, ...artwork });
  }, [artworks]);

  const deleteArtwork = useCallback(async (id: string) => {
    await removeDoc(COLLECTIONS.artworks, id);
  }, []);

  // ─── Customer CRUD ─────────────────────────────────────────────────────────
  const addCustomer = useCallback(async (customer: Omit<Customer, 'id' | 'createdAt'>) => {
    const newItem: Customer = { ...customer, id: uid(), createdAt: new Date().toISOString() };
    await upsertDoc(COLLECTIONS.customers, newItem.id, newItem);
  }, []);

  const updateCustomer = useCallback(async (id: string, customer: Partial<Customer>) => {
    const existing = customers.find(c => c.id === id);
    if (!existing) return;
    await upsertDoc(COLLECTIONS.customers, id, { ...existing, ...customer });
  }, [customers]);

  const deleteCustomer = useCallback(async (id: string) => {
    await removeDoc(COLLECTIONS.customers, id);
  }, []);

  // ─── Quote CRUD ────────────────────────────────────────────────────────────
  const addQuote = useCallback(async (quote: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt'>) => {
    const num = (quotes.length + 1).toString().padStart(3, '0');
    const year = new Date().getFullYear();
    const newItem: Quote = {
      ...quote, id: uid(), quoteNumber: `QT-${year}-${num}`,
      createdAt: new Date().toISOString(),
    };
    await upsertDoc(COLLECTIONS.quotes, newItem.id, newItem);
  }, [quotes]);

  const updateQuote = useCallback(async (id: string, quote: Partial<Quote>) => {
    const existing = quotes.find(q => q.id === id);
    if (!existing) return;
    await upsertDoc(COLLECTIONS.quotes, id, { ...existing, ...quote });
  }, [quotes]);

  const deleteQuote = useCallback(async (id: string) => {
    await removeDoc(COLLECTIONS.quotes, id);
  }, []);

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
    await upsertDoc(COLLECTIONS.categories, newCat.id, newCat);
  }, []);

  const deleteArtworkCategory = useCallback(async (id: string) => {
    await removeDoc(COLLECTIONS.categories, id);
  }, []);

  // ─── Supplier CRUD ─────────────────────────────────────────────────────────
  const addSupplier = useCallback(async (s: Omit<Supplier, 'id' | 'createdAt'>) => {
    const newItem: Supplier = { ...s, id: uid(), createdAt: new Date().toISOString() };
    await upsertDoc(COLLECTIONS.suppliers, newItem.id, newItem);
  }, []);

  const updateSupplier = useCallback(async (id: string, s: Partial<Supplier>) => {
    const existing = suppliers.find(x => x.id === id);
    if (!existing) return;
    await upsertDoc(COLLECTIONS.suppliers, id, { ...existing, ...s });
  }, [suppliers]);

  const deleteSupplier = useCallback(async (id: string) => {
    await removeDoc(COLLECTIONS.suppliers, id);
  }, []);

  // ─── Full Material CRUD ────────────────────────────────────────────────────
  const addFullMaterial = useCallback(async (m: Omit<FullMaterial, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newItem: FullMaterial = { ...m, id: uid(), createdAt: now, updatedAt: now };
    await upsertDoc(COLLECTIONS.fullMaterials, newItem.id, newItem);
  }, []);

  const updateFullMaterial = useCallback(async (id: string, m: Partial<FullMaterial>) => {
    const existing = fullMaterials.find(x => x.id === id);
    if (!existing) return;
    await upsertDoc(COLLECTIONS.fullMaterials, id, { ...existing, ...m, updatedAt: new Date().toISOString() });
  }, [fullMaterials]);

  const deleteFullMaterial = useCallback(async (id: string) => {
    await removeDoc(COLLECTIONS.fullMaterials, id);
  }, []);

  const updateMaterialPrice = useCallback(async (id: string, newPrice: number, supplierId: string, supplierName: string, notes: string) => {
    const x = fullMaterials.find(m => m.id === id);
    if (!x) return;
    const historyEntry: PriceHistoryEntry = {
      id: uid(), oldPrice: x.unitPrice, newPrice, supplierId, supplierName,
      date: new Date().toISOString(), notes,
    };
    const updated = {
      ...x,
      unitPrice: newPrice,
      lastPurchasePrice: newPrice,
      averagePrice: x.averagePrice ? (x.averagePrice + newPrice) / 2 : newPrice,
      priceHistory: [historyEntry, ...(x.priceHistory || [])],
      updatedAt: new Date().toISOString(),
    };
    await upsertDoc(COLLECTIONS.fullMaterials, id, updated);
  }, [fullMaterials]);

  // ─── Artwork Cost CRUD ─────────────────────────────────────────────────────
  const addArtworkCost = useCallback(async (cost: Omit<ArtworkCostSheet, 'id' | 'createdAt'>) => {
    const newItem: ArtworkCostSheet = { ...cost, id: uid(), createdAt: new Date().toISOString() };
    await upsertDoc(COLLECTIONS.artworkCosts, newItem.id, newItem);
  }, []);

  const updateArtworkCost = useCallback(async (id: string, cost: Partial<ArtworkCostSheet>) => {
    const existing = artworkCosts.find(c => c.id === id);
    if (!existing) return;
    await upsertDoc(COLLECTIONS.artworkCosts, id, { ...existing, ...cost });
  }, [artworkCosts]);

  const deleteArtworkCost = useCallback(async (id: string) => {
    await removeDoc(COLLECTIONS.artworkCosts, id);
  }, []);

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
    await upsertDoc(COLLECTIONS.workers, newItem.id, newItem);
  }, []);

  const updateWorker = useCallback(async (id: string, w: Partial<Worker>) => {
    const existing = workers.find(x => x.id === id);
    if (!existing) return;
    await upsertDoc(COLLECTIONS.workers, id, { ...existing, ...w });
  }, [workers]);

  const deleteWorker = useCallback(async (id: string) => {
    await removeDoc(COLLECTIONS.workers, id);
  }, []);

  // ─── Production Order CRUD ─────────────────────────────────────────────────
  const addProductionOrder = useCallback(async (o: Omit<ProductionOrder, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const num = (productionOrders.length + 1).toString().padStart(4, '0');
    const year = new Date().getFullYear();
    const newItem: ProductionOrder = {
      ...o, id: uid(), orderNumber: `PO-${year}-${num}`, createdAt: now, updatedAt: now,
    };
    await upsertDoc(COLLECTIONS.productionOrders, newItem.id, newItem);
  }, [productionOrders]);

  const updateProductionOrder = useCallback(async (id: string, o: Partial<ProductionOrder>) => {
    const existing = productionOrders.find(x => x.id === id);
    if (!existing) return;
    await upsertDoc(COLLECTIONS.productionOrders, id, { ...existing, ...o, updatedAt: new Date().toISOString() });
  }, [productionOrders]);

  const deleteProductionOrder = useCallback(async (id: string) => {
    await removeDoc(COLLECTIONS.productionOrders, id);
  }, []);

  const getOrdersByArtwork = useCallback((artworkId: string) => {
    return productionOrders.filter(o => o.artworkId === artworkId);
  }, [productionOrders]);

  // ─── Internal Manufacturing CRUD ───────────────────────────────────────────
  const addInternalManufacturing = useCallback(async (m: Omit<InternalManufacturing, 'id' | 'createdAt'>) => {
    const newItem: InternalManufacturing = { ...m, id: uid(), createdAt: new Date().toISOString() };
    await upsertDoc(COLLECTIONS.internalManufacturing, newItem.id, newItem);
  }, []);

  const updateInternalManufacturing = useCallback(async (id: string, m: Partial<InternalManufacturing>) => {
    const existing = internalManufacturing.find(x => x.id === id);
    if (!existing) return;
    await upsertDoc(COLLECTIONS.internalManufacturing, id, { ...existing, ...m });
  }, [internalManufacturing]);

  const deleteInternalManufacturing = useCallback(async (id: string) => {
    await removeDoc(COLLECTIONS.internalManufacturing, id);
  }, []);

  // ─── External Manufacturing CRUD ───────────────────────────────────────────
  const addExternalManufacturing = useCallback(async (m: Omit<ExternalManufacturing, 'id' | 'createdAt'>) => {
    const newItem: ExternalManufacturing = { ...m, id: uid(), createdAt: new Date().toISOString() };
    await upsertDoc(COLLECTIONS.externalManufacturing, newItem.id, newItem);
  }, []);

  const updateExternalManufacturing = useCallback(async (id: string, m: Partial<ExternalManufacturing>) => {
    const existing = externalManufacturing.find(x => x.id === id);
    if (!existing) return;
    await upsertDoc(COLLECTIONS.externalManufacturing, id, { ...existing, ...m });
  }, [externalManufacturing]);

  const deleteExternalManufacturing = useCallback(async (id: string) => {
    await removeDoc(COLLECTIONS.externalManufacturing, id);
  }, []);

  // ─── Backup restore ────────────────────────────────────────────────────────
  const restoreBackup = useCallback(async (data: { artworks: Artwork[]; customers: Customer[]; quotes: Quote[]; materials?: Material[] }) => {
    await Promise.all([
      batchUpsert(COLLECTIONS.artworks, data.artworks),
      batchUpsert(COLLECTIONS.customers, data.customers),
      batchUpsert(COLLECTIONS.quotes, data.quotes),
    ]);
    if (data.materials) {
      setMaterials(data.materials);
      await saveMaterials(data.materials);
    }
  }, []);

  return (
    <AppContext.Provider value={{
      artworks, customers, quotes, materials, loading, syncStatus,
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
      restoreBackup, migrateLocalToFirestore,
    }}>
      {children}
    </AppContext.Provider>
  );
}
