// Powered by OnSpace.AI
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
