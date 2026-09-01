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
// end
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ARTWORKS: 'artworks_v1',
  CUSTOMERS: 'customers_v1',
  QUOTES: 'quotes_v1',
};

export async function loadArtworks(): Promise<any[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.ARTWORKS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveArtworks(artworks: any[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.ARTWORKS, JSON.stringify(artworks));
}

export async function loadCustomers(): Promise<any[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.CUSTOMERS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveCustomers(customers: any[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
}

export async function loadQuotes(): Promise<any[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.QUOTES);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveQuotes(quotes: any[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.QUOTES, JSON.stringify(quotes));
}
