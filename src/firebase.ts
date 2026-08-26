import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  signInWithCredential,
  browserLocalPersistence,
  setPersistence,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  Firestore,
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";
import { JournalEntry, AuthUserProfile } from "./types";

// 1. Initialize Firebase App (Singleton safe)
export const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 2. Initialize Firebase Auth
export const auth = getAuth(app);

// Enable browser local persistence
try {
  setPersistence(auth, browserLocalPersistence).catch(() => {
    // Ignore persistence setup error if in restricted sandbox
  });
} catch {
  // Ignore in restricted environments
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

// 3. Initialize Cloud Firestore with target database ID
export const db: Firestore = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId &&
    firebaseConfig.firestoreDatabaseId.trim() !== ""
    ? firebaseConfig.firestoreDatabaseId
    : undefined
);

// Map Firebase User to our AuthUserProfile
export function mapFirebaseUser(user: User | null): AuthUserProfile | null {
  if (!user) return null;
  return {
    uid: user.uid,
    displayName: user.displayName || user.email?.split("@")[0] || "Authenticated User",
    email: user.email,
    photoURL: user.photoURL,
    isAnonymous: user.isAnonymous,
    providerId: user.providerData[0]?.providerId || "firebase",
  };
}

// Clean undefined fields to prevent Firestore SDK driver errors
export function sanitizeForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof obj === "object") {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

// ==================== FIRESTORE DATA ACCESS LAYER ====================

/**
 * Save or update a journal entry in the owner-bound Firestore subcollection:
 * Path: /users/{userId}/entries/{entryId}
 */
export async function saveJournalEntry(
  userId: string,
  entry: JournalEntry
): Promise<string> {
  if (!userId) {
    throw new Error("Cannot save journal entry: No authenticated userId provided");
  }

  const cleanEntry = sanitizeForFirestore({
    ...entry,
    userId,
    updatedAt: new Date().toISOString(),
  });

  const entryDocRef = doc(db, "users", userId, "entries", entry.id);
  await setDoc(entryDocRef, cleanEntry, { merge: true });
  return entry.id;
}

/**
 * Real-time subscription to a user's isolated journal entries collection
 * Path: /users/{userId}/entries
 */
export function subscribeToUserEntries(
  userId: string,
  onUpdate: (entries: JournalEntry[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const entriesRef = collection(db, "users", userId, "entries");
  const q = query(entriesRef, orderBy("updatedAt", "desc"));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const entries: JournalEntry[] = [];
      snapshot.forEach((docSnap) => {
        entries.push(docSnap.data() as JournalEntry);
      });
      onUpdate(entries);
    },
    (error) => {
      console.warn("[Firestore] Realtime subscription error:", error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
}

/**
 * Fetch all entries once for a given user
 */
export async function fetchUserEntries(userId: string): Promise<JournalEntry[]> {
  if (!userId) return [];
  const entriesRef = collection(db, "users", userId, "entries");
  const q = query(entriesRef, orderBy("updatedAt", "desc"));
  const snapshot = await getDocs(q);
  const entries: JournalEntry[] = [];
  snapshot.forEach((docSnap) => {
    entries.push(docSnap.data() as JournalEntry);
  });
  return entries;
}

/**
 * Delete a specific journal entry
 * Path: /users/{userId}/entries/{entryId}
 */
export async function deleteJournalEntry(
  userId: string,
  entryId: string
): Promise<void> {
  if (!userId || !entryId) return;
  const docRef = doc(db, "users", userId, "entries", entryId);
  await deleteDoc(docRef);
}

/**
 * Sign in using Google Auth Popup
 */
export async function signInWithGoogle(): Promise<AuthUserProfile> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = mapFirebaseUser(result.user);
  if (!user) throw new Error("Google Authentication failed to return user profile");
  return user;
}

/**
 * Sign out current user
 */
export async function logOut(): Promise<void> {
  await signOut(auth);
}
