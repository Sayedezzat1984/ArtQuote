// Powered by OnSpace.AI
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  artworks: 'artworks_v2',
  customers: 'customers_v1',
  quotes: 'quotes_v1',
  materials: 'materials_v1',
  categories: 'artwork_categories_v1',
  suppliers: 'suppliers_v1',
  fullMaterials: 'full_materials_v1',
  artworkCosts: 'artwork_costs_v1',
};

async function load<T>(key: string): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function save<T>(key: string, data: T[]): Promise<void> {
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
