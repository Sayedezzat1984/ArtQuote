// Powered by OnSpace.AI
// PublicGalleryContext — completely independent from Admin/Auth
// Reads ONLY from the `published_artworks` Firestore collection.
// No admin login, no AppContext dependency, no auth required.
import React, {
  createContext, useContext, useState, useEffect,
  useCallback, useRef, ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import { listenCollection, fetchOnce } from '@/services/firestoreService';
import { COLLECTIONS } from '@/services/firebase';

// ─── Public Artwork type ──────────────────────────────────────────────────────
// Contains ONLY public-safe fields. No costs, profits, suppliers, internal notes.
export interface PublicArtwork {
  id: string;
  artworkId: string;
  title: string;
  description: string;
  category: string;
  mainImage: string | null;
  images: string[];
  height: string;
  width: string;
  depth: string;
  length: string;
  diameter: string;
  thickness: string;
  weight: string;
  weightUnit: string;
  dimensionUnit: string;
  dimensions: string;
  quantity: string;
  year: string;
  available: boolean;
  isPublished: boolean;
  materialNames: string[];
  createdAt: string;
  updatedAt: string;
}

const CACHE_KEY = 'public_gallery_cache_v1';

// ─── Context type ─────────────────────────────────────────────────────────────
interface PublicGalleryContextType {
  publicArtworks: PublicArtwork[];
  isReady: boolean;
  isOnline: boolean;
  isSyncing: boolean;
  syncPublicGallery: () => Promise<void>;
  getPublicArtwork: (id: string) => PublicArtwork | undefined;
}

const PublicGalleryContext = createContext<PublicGalleryContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function PublicGalleryProvider({ children }: { children: ReactNode }) {
  const [publicArtworks, setPublicArtworks] = useState<PublicArtwork[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const mountedRef = useRef(true);

  // ── Step 1: Load cache immediately for instant display ─────────────────────
  useEffect(() => {
    AsyncStorage.getItem(CACHE_KEY).then(raw => {
      if (raw && mountedRef.current) {
        try {
          const cached = JSON.parse(raw) as PublicArtwork[];
          if (cached.length > 0) {
            setPublicArtworks(cached);
            setIsReady(true);
          }
        } catch {}
      }
    }).catch(() => {});
  }, []);

  // ── Step 2: Set up real-time Firestore listener ────────────────────────────
  useEffect(() => {
    mountedRef.current = true;

    const unsub = listenCollection(
      COLLECTIONS.publishedArtworks,
      (data) => {
        if (!mountedRef.current) return;
        const artworks = (data as PublicArtwork[]).filter(a => a.isPublished);
        setPublicArtworks(artworks);
        setIsReady(true);
        setIsOnline(true);
        setIsSyncing(false);
        // Update cache
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify(artworks)).catch(() => {});
      },
      () => {
        if (!mountedRef.current) return;
        setIsOnline(false);
        setIsSyncing(false);
        // Keep showing cached data — isReady stays true if we had cached data
      },
    );

    return () => {
      mountedRef.current = false;
      unsub();
    };
  }, []);

  // ── App foreground: re-sync ────────────────────────────────────────────────
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const syncPublicGallery = useCallback(async () => {
    if (!mountedRef.current) return;
    setIsSyncing(true);
    try {
      const data = await fetchOnce(COLLECTIONS.publishedArtworks);
      if (!mountedRef.current) return;
      const artworks = (data as PublicArtwork[]).filter(a => a.isPublished);
      setPublicArtworks(artworks);
      setIsReady(true);
      setIsOnline(true);
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(artworks)).catch(() => {});
    } catch {
      if (mountedRef.current) setIsOnline(false);
    } finally {
      if (mountedRef.current) setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = next;
      if (prev.match(/inactive|background/) && next === 'active') {
        syncPublicGallery().catch(() => {});
      }
    });
    return () => sub.remove();
  }, [syncPublicGallery]);

  // ── Reconnect after offline ────────────────────────────────────────────────
  const wasOffline = useRef(false);
  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
    } else if (wasOffline.current) {
      wasOffline.current = false;
      syncPublicGallery().catch(() => {});
    }
  }, [isOnline, syncPublicGallery]);

  const getPublicArtwork = useCallback((id: string) => {
    return publicArtworks.find(a => a.id === id || a.artworkId === id);
  }, [publicArtworks]);

  return (
    <PublicGalleryContext.Provider value={{
      publicArtworks,
      isReady,
      isOnline,
      isSyncing,
      syncPublicGallery,
      getPublicArtwork,
    }}>
      {children}
    </PublicGalleryContext.Provider>
  );
}

export function usePublicGallery() {
  const ctx = useContext(PublicGalleryContext);
  if (!ctx) throw new Error('usePublicGallery must be used within PublicGalleryProvider');
  return ctx;
}
