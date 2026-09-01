// Powered by OnSpace.AI
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { loadArtworks, saveArtworks, loadCustomers, saveCustomers, loadQuotes, saveQuotes } from '@/services/storage';
import { mockArtworks, mockCustomers, mockQuotes } from '@/services/mockData';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ArtworkDimensions {
  length: string;
  width: string;
  height: string;
  unit: 'cm' | 'mm';
}

export interface Artwork {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  dimensions: ArtworkDimensions;
  year: string;
  available: boolean;
  image: string | null;
  images: string[];
  materials: string[];
  createdAt: string;
}

export interface Material {
  id: string;
  name: string;
  description: string;
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
  createdAt: string;
  validUntil: string;
}

const MATERIALS_KEY = 'sayed_ezzat_materials';

const defaultMaterials: Material[] = [
  { id: '1', name: 'الجرانيت', description: 'حجر طبيعي صلب عالي الجودة', createdAt: new Date().toISOString() },
  { id: '2', name: 'الرخام', description: 'حجر كلسي متحول أبيض أو ملون', createdAt: new Date().toISOString() },
  { id: '3', name: 'الحجر الجيري', description: 'حجر رسوبي سهل النحت', createdAt: new Date().toISOString() },
  { id: '4', name: 'البرونز', description: 'سبيكة نحاس وقصدير مناسبة للمجسمات', createdAt: new Date().toISOString() },
  { id: '5', name: 'الفولاذ المقاوم للصدأ', description: 'معدن مقاوم للعوامل الجوية', createdAt: new Date().toISOString() },
  { id: '6', name: 'الألومنيوم', description: 'معدن خفيف الوزن متعدد الاستخدام', createdAt: new Date().toISOString() },
  { id: '7', name: 'الخشب', description: 'خشب طبيعي للنحت والتشكيل', createdAt: new Date().toISOString() },
  { id: '8', name: 'الجبس', description: 'مادة بيضاء سهلة التشكيل', createdAt: new Date().toISOString() },
  { id: '9', name: 'الفايبرجلاس', description: 'مادة خفيفة ومقاومة ومتعددة الألوان', createdAt: new Date().toISOString() },
  { id: '10', name: 'الطين الحراري', description: 'طين مناسب للتشكيل والحرق', createdAt: new Date().toISOString() },
];

interface AppContextType {
  artworks: Artwork[];
  customers: Customer[];
  quotes: Quote[];
  materials: Material[];
  loading: boolean;
  addArtwork: (artwork: Omit<Artwork, 'id' | 'createdAt'>) => Promise<void>;
  updateArtwork: (id: string, artwork: Partial<Artwork>) => Promise<void>;
  deleteArtwork: (id: string) => Promise<void>;
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => Promise<void>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addQuote: (quote: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt'>) => Promise<void>;
  updateQuote: (id: string, quote: Partial<Quote>) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
  addMaterial: (material: Omit<Material, 'id' | 'createdAt'>) => Promise<void>;
  updateMaterial: (id: string, material: Partial<Material>) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
  restoreBackup: (data: { artworks: Artwork[]; customers: Customer[]; quotes: Quote[] }) => Promise<void>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const [storedArtworks, storedCustomers, storedQuotes, storedMatsRaw] = await Promise.all([
          loadArtworks(),
          loadCustomers(),
          loadQuotes(),
          AsyncStorage.getItem(MATERIALS_KEY),
        ]);

        // Migrate old artworks that have string dimensions
        const migratedArtworks = (storedArtworks.length > 0 ? storedArtworks : mockArtworks).map((a: any) => {
          if (typeof a.dimensions === 'string') {
            return { ...a, dimensions: { length: '', width: '', height: '', unit: 'cm' as const }, images: a.images || [], materials: a.materials || [] };
          }
          return { ...a, images: a.images || [], materials: a.materials || [] };
        });

        setArtworks(migratedArtworks);
        setCustomers(storedCustomers.length > 0 ? storedCustomers : mockCustomers);
        setQuotes(storedQuotes.length > 0 ? storedQuotes : mockQuotes);

        const storedMats: Material[] = storedMatsRaw ? JSON.parse(storedMatsRaw) : [];
        setMaterials(storedMats.length > 0 ? storedMats : defaultMaterials);
        if (storedMats.length === 0) await AsyncStorage.setItem(MATERIALS_KEY, JSON.stringify(defaultMaterials));

        if (storedArtworks.length === 0) await saveArtworks(migratedArtworks);
        if (storedCustomers.length === 0) await saveCustomers(mockCustomers);
        if (storedQuotes.length === 0) await saveQuotes(mockQuotes);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const addArtwork = useCallback(async (artwork: Omit<Artwork, 'id' | 'createdAt'>) => {
    const newArtwork: Artwork = { ...artwork, id: Date.now().toString(), createdAt: new Date().toISOString() };
    const updated = [newArtwork, ...artworks];
    setArtworks(updated);
    await saveArtworks(updated);
  }, [artworks]);

  const updateArtwork = useCallback(async (id: string, artwork: Partial<Artwork>) => {
    const updated = artworks.map(a => a.id === id ? { ...a, ...artwork } : a);
    setArtworks(updated);
    await saveArtworks(updated);
  }, [artworks]);

  const deleteArtwork = useCallback(async (id: string) => {
    const updated = artworks.filter(a => a.id !== id);
    setArtworks(updated);
    await saveArtworks(updated);
  }, [artworks]);

  const addCustomer = useCallback(async (customer: Omit<Customer, 'id' | 'createdAt'>) => {
    const newCustomer: Customer = { ...customer, id: Date.now().toString(), createdAt: new Date().toISOString() };
    const updated = [newCustomer, ...customers];
    setCustomers(updated);
    await saveCustomers(updated);
  }, [customers]);

  const updateCustomer = useCallback(async (id: string, customer: Partial<Customer>) => {
    const updated = customers.map(c => c.id === id ? { ...c, ...customer } : c);
    setCustomers(updated);
    await saveCustomers(updated);
  }, [customers]);

  const deleteCustomer = useCallback(async (id: string) => {
    const updated = customers.filter(c => c.id !== id);
    setCustomers(updated);
    await saveCustomers(updated);
  }, [customers]);

  const addQuote = useCallback(async (quote: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt'>) => {
    const num = (quotes.length + 1).toString().padStart(3, '0');
    const year = new Date().getFullYear();
    const newQuote: Quote = {
      ...quote,
      id: Date.now().toString(),
      quoteNumber: `QT-${year}-${num}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newQuote, ...quotes];
    setQuotes(updated);
    await saveQuotes(updated);
  }, [quotes]);

  const updateQuote = useCallback(async (id: string, quote: Partial<Quote>) => {
    const updated = quotes.map(q => q.id === id ? { ...q, ...quote } : q);
    setQuotes(updated);
    await saveQuotes(updated);
  }, [quotes]);

  const deleteQuote = useCallback(async (id: string) => {
    const updated = quotes.filter(q => q.id !== id);
    setQuotes(updated);
    await saveQuotes(updated);
  }, [quotes]);

  const addMaterial = useCallback(async (material: Omit<Material, 'id' | 'createdAt'>) => {
    const newMat: Material = { ...material, id: Date.now().toString(), createdAt: new Date().toISOString() };
    const updated = [...materials, newMat];
    setMaterials(updated);
    await AsyncStorage.setItem(MATERIALS_KEY, JSON.stringify(updated));
  }, [materials]);

  const updateMaterial = useCallback(async (id: string, material: Partial<Material>) => {
    const updated = materials.map(m => m.id === id ? { ...m, ...material } : m);
    setMaterials(updated);
    await AsyncStorage.setItem(MATERIALS_KEY, JSON.stringify(updated));
  }, [materials]);

  const deleteMaterial = useCallback(async (id: string) => {
    const updated = materials.filter(m => m.id !== id);
    setMaterials(updated);
    await AsyncStorage.setItem(MATERIALS_KEY, JSON.stringify(updated));
  }, [materials]);

  const restoreBackup = useCallback(async (data: { artworks: Artwork[]; customers: Customer[]; quotes: Quote[] }) => {
    setArtworks(data.artworks);
    setCustomers(data.customers);
    setQuotes(data.quotes);
    await Promise.all([
      saveArtworks(data.artworks),
      saveCustomers(data.customers),
      saveQuotes(data.quotes),
    ]);
  }, []);

  return (
    <AppContext.Provider value={{
      artworks, customers, quotes, materials, loading,
      addArtwork, updateArtwork, deleteArtwork,
      addCustomer, updateCustomer, deleteCustomer,
      addQuote, updateQuote, deleteQuote,
      addMaterial, updateMaterial, deleteMaterial,
      restoreBackup,
    }}>
      {children}
    </AppContext.Provider>
  );
}
