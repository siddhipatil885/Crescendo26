import { db } from './firebase';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';

const CONTRACTORS_COLLECTION = 'contractors';

/**
 * Fetches a contractor by their name (case-insensitive friendly match).
 * Falls back to the first doc if no name match found.
 * @param {string} contractorName – The contractor name stored on the issue.
 * @returns {Promise<Object|null>} Contractor data or null.
 */
export async function fetchContractorByName(contractorName) {
  try {
    const colRef = collection(db, CONTRACTORS_COLLECTION);
    const snapshot = await getDocs(colRef);

    if (snapshot.empty) return null;

    const normalize = (s) => String(s || '').trim().toLowerCase();
    const target = normalize(contractorName);

    // Try exact match first
    let matched = snapshot.docs.find(
      (d) => normalize(d.data().name) === target
    );

    // Fall back to partial match
    if (!matched && target) {
      matched = snapshot.docs.find((d) =>
        normalize(d.data().name).includes(target) ||
        target.includes(normalize(d.data().name))
      );
    }

    const doc = matched || snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (err) {
    console.error('fetchContractorByName failed:', err);
    throw err;
  }
}

/**
 * Real-time listener for all contractors.
 * @param {Function} onData – Called with array of contractor objects.
 * @param {Function} onError – Called on error.
 * @returns {Function} Unsubscribe function.
 */
export function subscribeToContractors(onData, onError) {
  const colRef = collection(db, CONTRACTORS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      onData(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    },
    (err) => {
      console.error('subscribeToContractors error:', err);
      if (onError) onError(err);
    }
  );
}
