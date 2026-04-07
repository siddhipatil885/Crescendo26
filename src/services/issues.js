import { db } from "./firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  startAfter
} from "firebase/firestore";

const ISSUES_COLLECTION = "issues";

/**
 * Creates a new issue in Firestore
 * @param {Object} issueData - The data for the new issue
 * @returns {Promise<Object>} The created issue with its new ID
 */
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
