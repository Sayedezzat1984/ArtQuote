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
} from '@/services/storage';

// ─── Artwork ───────────────────────────────────────────────────────────────
export interface Artwork {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  // Separate measurement fields
  height: string;
  width: string;
  depth: string;
  length: string;
  diameter: string;
  thickness: string;
  weight: string;
  weightUnit: 'gram' | 'kg' | 'ton';
  dimensionUnit: 'mm' | 'cm' | 'meter';
  dimensions: string; // auto-generated display string
  quantity: string;
  year: string;
  available: boolean;
  showPriceToCustomer: boolean;
  image: string | null;
  images: string[];
  materialIds: string[];
  createdAt: string;
}

// ─── Material (simple, for artworkCard linking) ────────────────────────────
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

// ─── Artwork Cost ──────────────────────────────────────────────────────────
export interface CostMaterialItem {
  id: string;
  materialId: string;
  materialName: string;
  typeId: string;
  typeName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface ArtworkCostSheet {
  id: string;
  artworkId: string;
  version: number;
  date: string;
  // Material items
  materialItems: CostMaterialItem[];
  // Additional costs
  laborCost: number;
  externalManufacturingCost: number;
  paintingCost: number;
  electricalCost: number;
  transportCost: number;
  packagingCost: number;
  installationCost: number;
  otherCost: number;
  emergencyCost: number;
  // Totals
  totalMaterialCost: number;
  totalProductionCost: number;
  // Pricing
  profitPercentage: number;
  profitAmount: number;
  suggestedPrice: number;
  discountPercentage: number;
  discountAmount: number;
  finalPrice: number;
  taxPercentage: number;
  taxAmount: number;
  deliveryCost: number;
  installationPriceCost: number;
  // Settings
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

// ─── Context Type ──────────────────────────────────────────────────────────
interface AppContextType {
  // Legacy
  artworks: Artwork[];
  customers: Customer[];
  quotes: Quote[];
  materials: Material[];
  loading: boolean;
  artworkCategories: ArtworkCategory[];
  // Admin
  suppliers: Supplier[];
  fullMaterials: FullMaterial[];
  artworkCosts: ArtworkCostSheet[];
  // Artwork CRUD
  addArtwork: (artwork: Omit<Artwork, 'id' | 'createdAt'>) => Promise<void>;
  updateArtwork: (id: string, artwork: Partial<Artwork>) => Promise<void>;
  deleteArtwork: (id: string) => Promise<void>;
  // Customer CRUD
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => Promise<void>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  // Quote CRUD
  addQuote: (quote: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt'>) => Promise<void>;
  updateQuote: (id: string, quote: Partial<Quote>) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
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
  // Full Material CRUD
  addFullMaterial: (m: Omit<FullMaterial, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateFullMaterial: (id: string, m: Partial<FullMaterial>) => Promise<void>;
  deleteFullMaterial: (id: string) => Promise<void>;
  updateMaterialPrice: (id: string, newPrice: number, supplierId: string, supplierName: string, notes: string) => Promise<void>;
  // Artwork Cost CRUD
  addArtworkCost: (cost: Omit<ArtworkCostSheet, 'id' | 'createdAt'>) => Promise<void>;
  updateArtworkCost: (id: string, cost: Partial<ArtworkCostSheet>) => Promise<void>;
  deleteArtworkCost: (id: string) => Promise<void>;
  getArtworkCosts: (artworkId: string) => ArtworkCostSheet[];
  getLatestCost: (artworkId: string) => ArtworkCostSheet | undefined;
  // Backup
  restoreBackup: (data: { artworks: Artwork[]; customers: Customer[]; quotes: Quote[]; materials?: Material[] }) => Promise<void>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [artworkCategories, setArtworkCategories] = useState<ArtworkCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [fullMaterials, setFullMaterials] = useState<FullMaterial[]>([]);
  const [artworkCosts, setArtworkCosts] = useState<ArtworkCostSheet[]>([]);
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
        ] = await Promise.all([
          loadArtworks(), loadCustomers(), loadQuotes(), loadMaterials(),
          loadCategories(), loadSuppliers(), loadFullMaterials(), loadArtworkCosts(),
        ]);
        setArtworks(storedArtworks);
        setCustomers(storedCustomers);
        setQuotes(storedQuotes);
        setMaterials(storedMaterials);
        setSuppliers(storedSuppliers);
        setFullMaterials(storedFullMaterials);
        setArtworkCosts(storedCosts);

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

  const updateMaterialPrice = useCallback(async (id: string, newPrice: number, supplierId: string, supplierName: string, notes: string) => {
    const updated = fullMaterials.map(x => {
      if (x.id !== id) return x;
      const historyEntry: PriceHistoryEntry = {
        id: Date.now().toString(),
        oldPrice: x.unitPrice,
        newPrice,
        supplierId,
        supplierName,
        date: new Date().toISOString(),
        notes,
      };
      return {
        ...x,
        unitPrice: newPrice,
        lastPurchasePrice: newPrice,
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

  // ── Backup ──
  const restoreBackup = useCallback(async (data: { artworks: Artwork[]; customers: Customer[]; quotes: Quote[]; materials?: Material[] }) => {
    setArtworks(data.artworks); setCustomers(data.customers); setQuotes(data.quotes);
    if (data.materials) setMaterials(data.materials);
    await Promise.all([
      saveArtworks(data.artworks), saveCustomers(data.customers),
      saveQuotes(data.quotes), saveMaterials(data.materials || []),
    ]);
  }, []);

  return (
    <AppContext.Provider value={{
      artworks, customers, quotes, materials, loading, artworkCategories,
      suppliers, fullMaterials, artworkCosts,
      addArtwork, updateArtwork, deleteArtwork,
      addCustomer, updateCustomer, deleteCustomer,
      addQuote, updateQuote, deleteQuote,
      addMaterial, updateMaterial, deleteMaterial,
      addArtworkCategory, deleteArtworkCategory,
      addSupplier, updateSupplier, deleteSupplier,
      addFullMaterial, updateFullMaterial, deleteFullMaterial, updateMaterialPrice,
      addArtworkCost, updateArtworkCost, deleteArtworkCost, getArtworkCosts, getLatestCost,
      restoreBackup,
    }}>
      {children}
    </AppContext.Provider>
  );
}
