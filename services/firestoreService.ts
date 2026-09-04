// Powered by OnSpace.AI
// Firestore service — wraps all read/write operations for Sayed Gallery
import {
  collection, doc, setDoc, deleteDoc, onSnapshot,
  query, orderBy, writeBatch, getDocs, serverTimestamp,
  Unsubscribe, DocumentData, QuerySnapshot,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '@/services/firebase';

// ─── helpers ──────────────────────────────────────────────────────────────
export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function fromSnap(snap: QuerySnapshot<DocumentData>): any[] {
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
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
    snap => onData(fromSnap(snap)),
    err => onError?.(err),
  );
}

// ─── Generic upsert ───────────────────────────────────────────────────────
export async function upsertDoc(collectionName: string, id: string, data: any): Promise<void> {
  const ref = doc(db, collectionName, id);
  await setDoc(ref, { ...data, id, _updatedAt: new Date().toISOString() }, { merge: true });
}

// ─── Generic delete ───────────────────────────────────────────────────────
export async function removeDoc(collectionName: string, id: string): Promise<void> {
  await deleteDoc(doc(db, collectionName, id));
}

// ─── Batch write (for migration) ──────────────────────────────────────────
export async function batchUpsert(collectionName: string, items: any[]): Promise<void> {
  if (!items.length) return;
  // Firestore batch limit is 500 docs
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

// ─── One-time fetch (for migration check) ─────────────────────────────────
export async function fetchOnce(collectionName: string): Promise<any[]> {
  const snap = await getDocs(collection(db, collectionName));
  return fromSnap(snap);
}
