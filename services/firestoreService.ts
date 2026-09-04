// Powered by OnSpace.AI
// Firestore service — wraps all read/write operations for Sayed Gallery
// Includes offline queue, sync status, and real-time listeners
import {
  collection, doc, setDoc, deleteDoc, onSnapshot,
  query, orderBy, writeBatch, getDocs, enableIndexedDbPersistence,
  Unsubscribe, DocumentData, QuerySnapshot,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '@/services/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── helpers ──────────────────────────────────────────────────────────────
export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function fromSnap(snap: QuerySnapshot<DocumentData>): any[] {
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
}

// ─── Offline queue ────────────────────────────────────────────────────────
const QUEUE_KEY = 'firestore_offline_queue_v2';

export interface QueuedOperation {
  id: string;
  type: 'upsert' | 'delete';
  collection: string;
  docId: string;
  data?: any;
  timestamp: string;
  retries: number;
}

export async function loadQueue(): Promise<QueuedOperation[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function saveQueue(queue: QueuedOperation[]): Promise<void> {
  try { await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue)); } catch {}
}

export async function enqueueOperation(op: Omit<QueuedOperation, 'id' | 'timestamp' | 'retries'>): Promise<void> {
  const queue = await loadQueue();
  // Replace existing op for same doc to avoid duplicates
  const filtered = queue.filter(q => !(q.collection === op.collection && q.docId === op.docId));
  const newOp: QueuedOperation = { ...op, id: uid(), timestamp: new Date().toISOString(), retries: 0 };
  await saveQueue([...filtered, newOp]);
}

export async function dequeueOperation(opId: string): Promise<void> {
  const queue = await loadQueue();
  await saveQueue(queue.filter(q => q.id !== opId));
}

export async function flushQueue(): Promise<{ success: number; failed: number }> {
  const queue = await loadQueue();
  if (!queue.length) return { success: 0, failed: 0 };

  let success = 0;
  let failed = 0;
  const remaining: QueuedOperation[] = [];

  for (const op of queue) {
    try {
      if (op.type === 'upsert' && op.data) {
        const ref = doc(db, op.collection, op.docId);
        await setDoc(ref, { ...op.data, id: op.docId, _updatedAt: new Date().toISOString() }, { merge: true });
      } else if (op.type === 'delete') {
        await deleteDoc(doc(db, op.collection, op.docId));
      }
      success++;
    } catch {
      failed++;
      if (op.retries < 3) {
        remaining.push({ ...op, retries: op.retries + 1 });
      }
      // Drop ops after 3 retries
    }
  }

  await saveQueue(remaining);
  return { success, failed };
}

// ─── Connectivity state ───────────────────────────────────────────────────
let _isOnline = true;
let _onlineListeners: ((online: boolean) => void)[] = [];

export function getIsOnline(): boolean { return _isOnline; }

export function setOnlineState(online: boolean): void {
  if (_isOnline !== online) {
    _isOnline = online;
    _onlineListeners.forEach(l => l(online));
    if (online) {
      // Flush queue when coming back online
      flushQueue().catch(() => {});
    }
  }
}

export function onConnectivityChange(listener: (online: boolean) => void): () => void {
  _onlineListeners.push(listener);
  return () => { _onlineListeners = _onlineListeners.filter(l => l !== listener); };
}

// ─── Generic listener ─────────────────────────────────────────────────────
export function listenCollection(
  collectionName: string,
  onData: (items: any[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const q = query(collection(db, collectionName));
  return onSnapshot(
    q,
    { includeMetadataChanges: false },
    snap => {
      setOnlineState(true);
      onData(fromSnap(snap));
    },
    err => {
      setOnlineState(false);
      onError?.(err);
    },
  );
}

// ─── Generic upsert (with offline queue) ─────────────────────────────────
export async function upsertDoc(collectionName: string, id: string, data: any): Promise<void> {
  const payload = { ...data, id, _updatedAt: new Date().toISOString() };
  try {
    const ref = doc(db, collectionName, id);
    await setDoc(ref, payload, { merge: true });
    setOnlineState(true);
  } catch (err: any) {
    // Queue for later if offline
    setOnlineState(false);
    await enqueueOperation({ type: 'upsert', collection: collectionName, docId: id, data: payload });
    // Still throw so UI can handle
    throw err;
  }
}

// ─── Generic upsert (silent — doesn't throw, queues on failure) ───────────
export async function upsertDocSilent(collectionName: string, id: string, data: any): Promise<void> {
  const payload = { ...data, id, _updatedAt: new Date().toISOString() };
  try {
    const ref = doc(db, collectionName, id);
    await setDoc(ref, payload, { merge: true });
    setOnlineState(true);
  } catch {
    setOnlineState(false);
    await enqueueOperation({ type: 'upsert', collection: collectionName, docId: id, data: payload });
  }
}

// ─── Generic delete (with offline queue) ─────────────────────────────────
export async function removeDoc(collectionName: string, id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, collectionName, id));
    setOnlineState(true);
  } catch {
    setOnlineState(false);
    await enqueueOperation({ type: 'delete', collection: collectionName, docId: id });
  }
}

// ─── Batch write (for migration/backup restore) ────────────────────────────
export async function batchUpsert(collectionName: string, items: any[]): Promise<void> {
  if (!items.length) return;
  const CHUNK = 500;
  for (let i = 0; i < items.length; i += CHUNK) {
    const chunk = items.slice(i, i + CHUNK);
    const batch = writeBatch(db);
    chunk.forEach(item => {
      const ref = doc(db, collectionName, item.id || uid());
      batch.set(ref, { ...item, _updatedAt: new Date().toISOString() }, { merge: true });
    });
    await batch.commit();
  }
}

// ─── One-time fetch (for migration check / backup) ─────────────────────────
export async function fetchOnce(collectionName: string): Promise<any[]> {
  const snap = await getDocs(collection(db, collectionName));
  return fromSnap(snap);
}

// ─── Full database export (all collections) ───────────────────────────────
export async function exportAllCollections(): Promise<Record<string, any[]>> {
  const results: Record<string, any[]> = {};
  const colNames = Object.values(COLLECTIONS);
  await Promise.all(
    colNames.map(async (col) => {
      try {
        results[col] = await fetchOnce(col);
      } catch {
        results[col] = [];
      }
    })
  );
  return results;
}

// ─── Full database restore (all collections) ──────────────────────────────
export async function restoreAllCollections(data: Record<string, any[]>): Promise<{ restored: number; errors: number }> {
  let restored = 0;
  let errors = 0;
  for (const [col, items] of Object.entries(data)) {
    if (!Array.isArray(items) || !items.length) continue;
    try {
      await batchUpsert(col, items);
      restored += items.length;
    } catch {
      errors++;
    }
  }
  return { restored, errors };
}
