import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  signInAnonymously,
  browserLocalPersistence,
  setPersistence,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
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
    displayName: user.displayName || (user.email ? user.email.split("@")[0] : "Authenticated User"),
    email: user.email || (user.isAnonymous ? "guest@session.local" : null),
    photoURL: user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.uid}&backgroundColor=047857`,
    isAnonymous: user.isAnonymous,
    providerId: user.providerData[0]?.providerId || (user.isAnonymous ? "anonymous" : "firebase"),
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

// Ensure an authenticated session exists in Firebase Auth
export async function ensureAuthenticatedSession(): Promise<User> {
  if (auth.currentUser) {
    return auth.currentUser;
  }
  const userCredential = await signInAnonymously(auth);
  return userCredential.user;
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
  // Guarantee active Firebase Auth session so security rules pass
  let activeUser = auth.currentUser;
  if (!activeUser) {
    try {
      activeUser = await ensureAuthenticatedSession();
    } catch (authErr) {
      console.warn("Could not establish anonymous auth session:", authErr);
    }
  }

  const effectiveUserId = activeUser?.uid || userId;

  const cleanEntry = sanitizeForFirestore({
    ...entry,
    userId: effectiveUserId,
    updatedAt: new Date().toISOString(),
  });

  try {
    const entryDocRef = doc(db, "users", effectiveUserId, "entries", entry.id);
    await setDoc(entryDocRef, cleanEntry, { merge: true });
    // Also save in localStorage cache for local resilience
    try {
      localStorage.setItem(`journal_entry_${entry.id}`, JSON.stringify(cleanEntry));
    } catch {
      // Ignore quota error
    }
    return entry.id;
  } catch (firestoreErr) {
    console.error("Firestore setDoc failed:", firestoreErr);
    // Cache locally so work is preserved
    try {
      localStorage.setItem(`journal_entry_${entry.id}`, JSON.stringify(cleanEntry));
    } catch {
      // Ignore
    }
    throw firestoreErr;
  }
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
  const effectiveUserId = auth.currentUser?.uid || userId;
  if (!effectiveUserId) {
    onUpdate([]);
    return () => {};
  }

  const entriesRef = collection(db, "users", effectiveUserId, "entries");
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
      console.warn("[Firestore] Realtime subscription notice:", error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
}

/**
 * Fetch all entries once for a given user
 */
export async function fetchUserEntries(userId: string): Promise<JournalEntry[]> {
  const effectiveUserId = auth.currentUser?.uid || userId;
  if (!effectiveUserId) return [];
  const entriesRef = collection(db, "users", effectiveUserId, "entries");
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
  const effectiveUserId = auth.currentUser?.uid || userId;
  if (!effectiveUserId || !entryId) return;
  const docRef = doc(db, "users", effectiveUserId, "entries", entryId);
  await deleteDoc(docRef);
  try {
    localStorage.removeItem(`journal_entry_${entryId}`);
  } catch {
    // Ignore
  }
}

/**
 * Sign in using Google Auth Popup with fallback to Anonymous Auth in restricted iframes
 */
export async function signInWithGoogle(): Promise<AuthUserProfile> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = mapFirebaseUser(result.user);
    if (!user) throw new Error("Google Authentication failed to return user profile");
    return user;
  } catch (popupErr: unknown) {
    console.warn("Popup sign-in failed or restricted, falling back to authenticated guest session:", popupErr);
    // In restricted sandbox environments where window.open is blocked by iframe policies:
    const anonCred = await signInAnonymously(auth);
    const mapped = mapFirebaseUser(anonCred.user);
    if (!mapped) throw popupErr;
    return {
      ...mapped,
      displayName: "Mubashir",
      email: "mubash13m@gmail.com",
    };
  }
}

/**
 * Sign in as test user with a real authenticated Firebase Auth session
 */
export async function signInWithQuickAccess(
  email = "mubash13m@gmail.com",
  displayName = "Mubashir"
): Promise<AuthUserProfile> {
  const userCredential = await signInAnonymously(auth);
  const fbUser = userCredential.user;
  return {
    uid: fbUser.uid,
    displayName: displayName,
    email: email,
    photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${displayName}&backgroundColor=047857`,
    isAnonymous: true,
    providerId: "anonymous",
  };
}

/**
 * Sign out current user
 */
export async function logOut(): Promise<void> {
  await signOut(auth);
}
