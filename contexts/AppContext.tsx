// Powered by OnSpace.AI
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { loadArtworks, saveArtworks, loadCustomers, saveCustomers, loadQuotes, saveQuotes, loadMaterials, saveMaterials, loadCategories, saveCategories } from '@/services/storage';
import { mockArtworks, mockCustomers, mockQuotes } from '@/services/mockData';

export interface Artwork {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  width: string;
  height: string;
  depth: string;
  dimensionUnit: 'cm' | 'mm';
  dimensions: string;
  year: string;
  available: boolean;
  image: string | null;
  images: string[];
  materialIds: string[];
  createdAt: string;
}

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
  createdAt: string;
  validUntil: string;
}

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
  artworkCategories: ArtworkCategory[];
  addArtworkCategory: (name: string) => Promise<void>;
  deleteArtworkCategory: (id: string) => Promise<void>;
  restoreBackup: (data: { artworks: Artwork[]; customers: Customer[]; quotes: Quote[]; materials?: Material[] }) => Promise<void>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [artworkCategories, setArtworkCategories] = useState<ArtworkCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const [storedArtworks, storedCustomers, storedQuotes, storedMaterials, storedCategories] = await Promise.all([
          loadArtworks(),
          loadCustomers(),
          loadQuotes(),
          loadMaterials(),
          loadCategories(),
        ]);
        setArtworks(storedArtworks.length > 0 ? storedArtworks : mockArtworks);
        setCustomers(storedCustomers.length > 0 ? storedCustomers : mockCustomers);
        setQuotes(storedQuotes.length > 0 ? storedQuotes : mockQuotes);
        setMaterials(storedMaterials.length > 0 ? storedMaterials : []);
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
        if (storedArtworks.length === 0) await saveArtworks(mockArtworks);
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
    const newMaterial: Material = { ...material, id: Date.now().toString(), createdAt: new Date().toISOString() };
    const updated = [newMaterial, ...materials];
    setMaterials(updated);
    await saveMaterials(updated);
  }, [materials]);

  const updateMaterial = useCallback(async (id: string, material: Partial<Material>) => {
    const updated = materials.map(m => m.id === id ? { ...m, ...material } : m);
    setMaterials(updated);
    await saveMaterials(updated);
  }, [materials]);

  const deleteMaterial = useCallback(async (id: string) => {
    const updated = materials.filter(m => m.id !== id);
    setMaterials(updated);
    await saveMaterials(updated);
  }, [materials]);

  const addArtworkCategory = useCallback(async (name: string) => {
    const newCat: ArtworkCategory = { id: Date.now().toString(), name: name.trim(), createdAt: new Date().toISOString() };
    const updated = [...artworkCategories, newCat];
    setArtworkCategories(updated);
    await saveCategories(updated);
  }, [artworkCategories]);

  const deleteArtworkCategory = useCallback(async (id: string) => {
    const updated = artworkCategories.filter(c => c.id !== id);
    setArtworkCategories(updated);
    await saveCategories(updated);
  }, [artworkCategories]);

  const restoreBackup = useCallback(async (data: { artworks: Artwork[]; customers: Customer[]; quotes: Quote[]; materials?: Material[] }) => {
    setArtworks(data.artworks);
    setCustomers(data.customers);
    setQuotes(data.quotes);
    if (data.materials) setMaterials(data.materials);
    await Promise.all([
      saveArtworks(data.artworks),
      saveCustomers(data.customers),
      saveQuotes(data.quotes),
      saveMaterials(data.materials || []),
    ]);
  }, []);

  return (
    <AppContext.Provider value={{
      artworks, customers, quotes, materials, loading,
      addArtwork, updateArtwork, deleteArtwork,
      addCustomer, updateCustomer, deleteCustomer,
      addQuote, updateQuote, deleteQuote,
      addMaterial, updateMaterial, deleteMaterial,
      artworkCategories, addArtworkCategory, deleteArtworkCategory,
      restoreBackup,
    }}>
      {children}
    </AppContext.Provider>
  );
}
