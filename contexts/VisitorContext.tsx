// Powered by OnSpace.AI — Visitor Registration & Analytics Context
import React, {
  createContext, useContext, useState, useEffect,
  useCallback, ReactNode, useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  upsertDocSilent, listenCollection, fetchOnce, uid,
} from '@/services/firestoreService';
import { COLLECTIONS } from '@/services/firebase';

const SESSION_KEY = 'visitor_session';

// ─── Types ──────────────────────────────────────────────────────────────────
export interface ArtworkViewRecord {
  artworkId: string;
  artworkTitle: string;
  viewCount: number;
  lastViewedAt: string;
}

export interface Visitor {
  id: string;
  name: string;
  phone: string;
  firstVisitDate: string;
  lastVisitDate: string;
  totalVisits: number;
  artworkViews: ArtworkViewRecord[];
  totalArtworkViews: number;
  lastArtworkViewed: string;
  sessionStartedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ArtworkStats {
  artworkId: string;
  artworkTitle: string;
  totalViews: number;
  uniqueVisitors: number;
  lastViewedAt: string;
}

export interface VisitorAnalytics {
  totalVisitors: number;
  totalVisits: number;
  returningVisitors: number;
  totalArtworkViews: number;
  avgArtworksPerVisitor: number;
  mostViewedArtwork: ArtworkStats | null;
  leastViewedArtwork: ArtworkStats | null;
  visitorsToday: number;
  visitorsThisWeek: number;
  visitorsThisMonth: number;
  artworkStats: ArtworkStats[];
}

interface VisitorContextType {
  currentVisitor: Visitor | null;
  visitors: Visitor[];
  analytics: VisitorAnalytics;
  isRegistered: boolean;
  isLoadingVisitor: boolean;
  registerVisitor: (name: string, phone: string) => Promise<Visitor>;
  trackArtworkView: (artworkId: string, artworkTitle: string) => Promise<void>;
  refreshVisitors: () => Promise<void>;
  clearSession: () => Promise<void>;
}

const VisitorContext = createContext<VisitorContextType | undefined>(undefined);

// ─── Helpers ─────────────────────────────────────────────────────────────────
function isSameDay(dateStr: string, ref: Date): boolean {
  const d = new Date(dateStr);
  return d.getFullYear() === ref.getFullYear()
    && d.getMonth() === ref.getMonth()
    && d.getDate() === ref.getDate();
}

function isThisWeek(dateStr: string, now: Date): boolean {
  const d = new Date(dateStr);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return d >= startOfWeek;
}

function isThisMonth(dateStr: string, now: Date): boolean {
  const d = new Date(dateStr);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function computeAnalytics(visitors: Visitor[]): VisitorAnalytics {
  const now = new Date();
  const artworkMap = new Map<string, { title: string; totalViews: number; uniqueVisitors: Set<string>; lastViewedAt: string }>();

  let totalArtworkViews = 0;
  let returningVisitors = 0;
  let visitorsToday = 0;
  let visitorsThisWeek = 0;
  let visitorsThisMonth = 0;

  for (const v of visitors) {
    if (v.totalVisits > 1) returningVisitors++;
    if (isSameDay(v.lastVisitDate, now)) visitorsToday++;
    if (isThisWeek(v.lastVisitDate, now)) visitorsThisWeek++;
    if (isThisMonth(v.lastVisitDate, now)) visitorsThisMonth++;
    totalArtworkViews += v.totalArtworkViews || 0;

    for (const av of v.artworkViews || []) {
      if (!artworkMap.has(av.artworkId)) {
        artworkMap.set(av.artworkId, {
          title: av.artworkTitle,
          totalViews: 0,
          uniqueVisitors: new Set(),
          lastViewedAt: av.lastViewedAt,
        });
      }
      const stat = artworkMap.get(av.artworkId)!;
      stat.totalViews += av.viewCount;
      stat.uniqueVisitors.add(v.id);
      if (av.lastViewedAt > stat.lastViewedAt) stat.lastViewedAt = av.lastViewedAt;
    }
  }

  const artworkStats: ArtworkStats[] = Array.from(artworkMap.entries()).map(([artworkId, s]) => ({
    artworkId,
    artworkTitle: s.title,
    totalViews: s.totalViews,
    uniqueVisitors: s.uniqueVisitors.size,
    lastViewedAt: s.lastViewedAt,
  }));

  artworkStats.sort((a, b) => b.totalViews - a.totalViews);

  return {
    totalVisitors: visitors.length,
    totalVisits: visitors.reduce((s, v) => s + (v.totalVisits || 1), 0),
    returningVisitors,
    totalArtworkViews,
    avgArtworksPerVisitor: visitors.length > 0 ? Math.round((totalArtworkViews / visitors.length) * 10) / 10 : 0,
    mostViewedArtwork: artworkStats[0] || null,
    leastViewedArtwork: artworkStats[artworkStats.length - 1] || null,
    visitorsToday,
    visitorsThisWeek,
    visitorsThisMonth,
    artworkStats,
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function VisitorProvider({ children }: { children: ReactNode }) {
  const [currentVisitor, setCurrentVisitor] = useState<Visitor | null>(null);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [isLoadingVisitor, setIsLoadingVisitor] = useState(true);
  const mounted = useRef(true);

  // Load session on mount
  useEffect(() => {
    mounted.current = true;
    loadSession();
    // Real-time listener for admin analytics
    const unsub = listenCollection(COLLECTIONS.visitors, (data) => {
      if (mounted.current) setVisitors(data as Visitor[]);
    }, () => {});
    return () => { mounted.current = false; unsub(); };
  }, []);

  async function loadSession() {
    try {
      const raw = await AsyncStorage.getItem(SESSION_KEY);
      if (raw) {
        const session = JSON.parse(raw);
        // Refresh from Firestore to get latest data
        const fresh = await fetchOnce(COLLECTIONS.visitors);
        const freshVisitor = fresh.find((v: any) => v.id === session.id);
        if (freshVisitor && mounted.current) {
          setCurrentVisitor(freshVisitor as Visitor);
        } else if (mounted.current) {
          setCurrentVisitor(session);
        }
      }
    } catch {}
    if (mounted.current) setIsLoadingVisitor(false);
  }

  const registerVisitor = useCallback(async (name: string, phone: string): Promise<Visitor> => {
    const now = new Date().toISOString();
    // Check if phone already registered
    const existing = await fetchOnce(COLLECTIONS.visitors);
    const existingVisitor = existing.find((v: any) => v.phone === phone.trim());

    let visitor: Visitor;
    if (existingVisitor) {
      // Returning visitor — update visit info
      visitor = {
        ...existingVisitor,
        name: name.trim(),
        lastVisitDate: now,
        totalVisits: (existingVisitor.totalVisits || 1) + 1,
        sessionStartedAt: now,
        updatedAt: now,
      } as Visitor;
    } else {
      // New visitor
      visitor = {
        id: uid(),
        name: name.trim(),
        phone: phone.trim(),
        firstVisitDate: now,
        lastVisitDate: now,
        totalVisits: 1,
        artworkViews: [],
        totalArtworkViews: 0,
        lastArtworkViewed: '',
        sessionStartedAt: now,
        createdAt: now,
        updatedAt: now,
      };
    }

    await upsertDocSilent(COLLECTIONS.visitors, visitor.id, visitor);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(visitor));
    if (mounted.current) setCurrentVisitor(visitor);
    return visitor;
  }, []);

  const trackArtworkView = useCallback(async (artworkId: string, artworkTitle: string) => {
    if (!currentVisitor) return;
    const now = new Date().toISOString();

    const existingViews = currentVisitor.artworkViews || [];
    const existingIdx = existingViews.findIndex(av => av.artworkId === artworkId);

    let updatedViews: ArtworkViewRecord[];
    if (existingIdx >= 0) {
      updatedViews = existingViews.map((av, i) =>
        i === existingIdx
          ? { ...av, viewCount: av.viewCount + 1, lastViewedAt: now }
          : av
      );
    } else {
      updatedViews = [
        ...existingViews,
        { artworkId, artworkTitle, viewCount: 1, lastViewedAt: now },
      ];
    }

    const updated: Visitor = {
      ...currentVisitor,
      artworkViews: updatedViews,
      totalArtworkViews: updatedViews.reduce((s, av) => s + av.viewCount, 0),
      lastArtworkViewed: artworkTitle,
      updatedAt: now,
    };

    setCurrentVisitor(updated);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(updated));
    await upsertDocSilent(COLLECTIONS.visitors, updated.id, updated);
  }, [currentVisitor]);

  const refreshVisitors = useCallback(async () => {
    const data = await fetchOnce(COLLECTIONS.visitors);
    if (mounted.current) setVisitors(data as Visitor[]);
  }, []);

  const clearSession = useCallback(async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    if (mounted.current) setCurrentVisitor(null);
  }, []);

  const isRegistered = currentVisitor !== null;
  const analytics = computeAnalytics(visitors);

  return (
    <VisitorContext.Provider value={{
      currentVisitor, visitors, analytics, isRegistered, isLoadingVisitor,
      registerVisitor, trackArtworkView, refreshVisitors, clearSession,
    }}>
      {children}
    </VisitorContext.Provider>
  );
}

export function useVisitor() {
  const ctx = useContext(VisitorContext);
  if (!ctx) throw new Error('useVisitor must be used within VisitorProvider');
  return ctx;
}
