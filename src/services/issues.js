import { db } from "./firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc, 
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  startAfter,
  onSnapshot
} from "firebase/firestore";

const ISSUES_COLLECTION = "issues";

export const createIssue = async (issueData) => {
  try {
    const issuesRef = collection(db, ISSUES_COLLECTION);
    const createdAtClient = new Date();
    const newIssue = {
      ...issueData,
      createdAt: serverTimestamp(),
      status: issueData.status || "pending",
    };
    
    const docRef = await addDoc(issuesRef, newIssue);
    return { id: docRef.id, ...newIssue, createdAt: createdAtClient };
  } catch (error) {
    console.error("Error creating issue:", error);
    throw error;
  }
};

/**
 * Retrieves issues from Firestore with optional pagination
 * @param {number} pageSize - Number of issues to fetch
 * @param {Object} lastVisible - Optional cursor document to start after
 * @returns {Promise<Object>} Object containing issues and nextCursor
 */
export const getIssues = async (pageSize = 20, lastVisible = null) => {
  try {
    const issuesRef = collection(db, ISSUES_COLLECTION);
    
    let q = query(issuesRef, orderBy("createdAt", "desc"), limit(pageSize));
    if (lastVisible) {
      q = query(issuesRef, orderBy("createdAt", "desc"), startAfter(lastVisible), limit(pageSize));
    }
    
    const querySnapshot = await getDocs(q);
    
    const issues = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const nextCursor = querySnapshot.docs[querySnapshot.docs.length - 1];
    
    return { issues, nextCursor };
  } catch (error) {
    console.error("Error fetching issues:", error);
    throw error;
  }
};

/**
 * Updates an existing issue in Firestore
 * @param {string} id - The ID of the issue to update
 * @param {Object} updates - The fields to update
 * @returns {Promise<Object>} The updated issue data (merging id and updates)
 */
export const updateIssue = async (id, updates) => {
  try {
    const issueRef = doc(db, ISSUES_COLLECTION, id);
    await updateDoc(issueRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    return { id, ...updates };
  } catch (error) {
    console.error(`Error updating issue ${id}:`, error);
    throw error;
  }
};

/**
 * Fetches a single issue by its document ID
 * @param {string} id - The Firestore document ID
 * @returns {Promise<Object>} The issue data with its ID
 */
export const getIssueById = async (id) => {
  try {
    const issueRef = doc(db, ISSUES_COLLECTION, id);
    const docSnap = await getDoc(issueRef);
    
    if (!docSnap.exists()) {
      throw new Error("Issue not found");
    }
    
    return { id: docSnap.id, ...docSnap.data() };
  } catch (error) {
    console.error(`Error fetching issue ${id}:`, error);
    throw error;
  }
};

/**
 * Real-time listener for the issues collection
 * @param {Function} onData - Callback with array of issues
 * @param {Function} onError - Callback on error
 * @param {number} pageSize - Max issues to listen to
 * @returns {Function} Unsubscribe function
 */
export const subscribeToIssues = (onData, onError, pageSize = 20) => {
  const issuesRef = collection(db, ISSUES_COLLECTION);
  const q = query(issuesRef, orderBy("createdAt", "desc"), limit(pageSize));
  
  return onSnapshot(q, 
    (snapshot) => {
      const issues = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      onData(issues);
    },
    (error) => {
      console.error("Issues listener error:", error);
      if (onError) onError(error);
    }
  );
};

/**
 * Real-time listener for a single issue document
 * @param {string} id - Firestore document ID
 * @param {Function} onData - Callback with issue data
 * @param {Function} onError - Callback on error
 * @returns {Function} Unsubscribe function
 */
export const subscribeToIssue = (id, onData, onError) => {
  const issueRef = doc(db, ISSUES_COLLECTION, id);
  
  return onSnapshot(issueRef,
    (docSnap) => {
      if (!docSnap.exists()) {
        if (onError) onError(new Error("Issue not found"));
        return;
      }
      onData({ id: docSnap.id, ...docSnap.data() });
    },
    (error) => {
      console.error(`Issue listener error (${id}):`, error);
      if (onError) onError(error);
    }
  );
};
