// Powered by OnSpace.AI
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  artworks: 'artworks_v2',
  customers: 'customers_v1',
  quotes: 'quotes_v1',
  materials: 'materials_v1',
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
