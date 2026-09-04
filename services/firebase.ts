// Powered by OnSpace.AI
// Firebase Web SDK initialization — Sayed Gallery
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  // @ts-ignore
  getReactNativePersistence,
} from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: 'AIzaSyB-yPsJtFlS74KY1T3yZ-4KMQZ8pHsn3iE',
  authDomain: 'sayed-gallery.firebaseapp.com',
  projectId: 'sayed-gallery',
  storageBucket: 'sayed-gallery.firebasestorage.app',
  messagingSenderId: '576249661340',
  appId: '1:576249661340:web:353b8628dfec420ae2ea59',
  measurementId: 'G-0P4LZN4V94',
};

// Initialize Firebase app (singleton)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with AsyncStorage persistence on mobile
let auth: ReturnType<typeof getAuth>;
try {
  if (Platform.OS !== 'web') {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } else {
    auth = getAuth(app);
  }
} catch {
  // Already initialized
  auth = getAuth(app);
}

// Initialize Firestore
const db = getFirestore(app);

// Enable offline persistence (best-effort on web)
if (Platform.OS === 'web') {
  enableIndexedDbPersistence(db).catch(() => {
    // persistence may be unavailable in some environments
  });
}

// ─── Firestore collection names ────────────────────────────────────────────
export const COLLECTIONS = {
  artworks: 'artworks',
  customers: 'customers',
  quotes: 'quotes',
  fullMaterials: 'materials',
  categories: 'categories',
  suppliers: 'suppliers',
  artworkCosts: 'artworkCosts',
  workers: 'workers',
  productionOrders: 'productionOrders',
  internalManufacturing: 'internalManufacturing',
  externalManufacturing: 'externalManufacturing',
  settings: 'settings',
  payments: 'payments',
  expenses: 'expenses',
  packaging: 'packaging',
  transport: 'transport',
  catalog: 'catalog',
} as const;

export const ADMIN_EMAIL = 'engsayedezzat@gmail.com';

export { app, auth, db };
