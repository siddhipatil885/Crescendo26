import { db } from "./firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc,
  serverTimestamp
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
    const newIssue = {
      ...issueData,
      createdAt: serverTimestamp(),
      status: issueData.status || "pending",
    };
    
    const docRef = await addDoc(issuesRef, newIssue);
    return { id: docRef.id, ...newIssue };
  } catch (error) {
    console.error("Error creating issue:", error);
    throw error;
  }
};

/**
 * Retrieves all issues from Firestore
 * @returns {Promise<Array>} Array of issue objects
 */
export const getIssues = async () => {
  try {
    const issuesRef = collection(db, ISSUES_COLLECTION);
    const querySnapshot = await getDocs(issuesRef);
    
    const issues = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return issues;
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
