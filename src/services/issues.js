import { db } from "./firebase";
import { 
  collection, 
  getDocs, 
  getDoc,
  doc, 
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  increment,
  arrayUnion,
  query,
  orderBy,
  limit,
  where,
  startAfter,
  onSnapshot
} from "firebase/firestore";
import { saveToken } from "../utils/token";
import { getDepartmentForCategory, ISSUE_STATUS, REPORT_SOURCES } from "../utils/constants";

const ISSUES_COLLECTION = "issues";

function toClientDate(value) {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate();
  if (typeof value?.seconds === 'number') return new Date(value.seconds * 1000);
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export const createIssue = async (issueData) => {
  try {
    const issuesRef = collection(db, ISSUES_COLLECTION);
    const issueRef = doc(issuesRef);
    const createdAtClient = new Date();
    const deadlineClient = new Date(createdAtClient.getTime() + 7 * 24 * 60 * 60 * 1000);
    const claimToken = issueData.claimToken || crypto.randomUUID();
    const category = issueData.category || 'Other';
    const department = issueData.department || getDepartmentForCategory(category);
    const photoUrl = issueData.photo_url || issueData.beforeImage || issueData.beforeImageUrl || null;
    const storedDeadline = issueData.deadline || Timestamp.fromDate(deadlineClient);
    const timeline = issueData.timeline || [
      {
        type: 'reported',
        title: 'Complaint reported',
        status: ISSUE_STATUS.OPEN,
        note: issueData.description || issueData.ai_description || '',
        source: issueData.report_source || REPORT_SOURCES.APP,
        createdAt: createdAtClient.toISOString(),
      },
    ];

    const newIssue = {
      claimToken,
      category,
      subcategory: issueData.subcategory || '',
      issue_type: issueData.issue_type || '',
      issue_category: issueData.issue_category || issueData.category || '',
      issue_subcategory: issueData.issue_subcategory || issueData.subcategory || '',
      severity: issueData.severity || '',
      department,
      description: issueData.description || issueData.ai_description || '',
      ai_description: issueData.ai_description || issueData.description || '',
      lat: issueData.lat ?? null,
      lng: issueData.lng ?? null,
      neighbourhood: issueData.neighbourhood || '',
      location: issueData.location || '',
      report_source: issueData.report_source || REPORT_SOURCES.APP,
      photo_url: photoUrl,
      beforeImage: photoUrl,
      beforeImageUrl: photoUrl,
      afterImage: issueData.afterImage || null,
      afterImageUrl: issueData.afterImage || null,
      verified_by_citizen: false,
      upvotes: 0,
      archived: false,
      timeline,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      reported_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      deadline: storedDeadline,
      status: issueData.status || ISSUE_STATUS.OPEN,
      ...(issueData.reporter_name && { reporter_name: issueData.reporter_name }),
      ...(issueData.reporter_phone && { reporter_phone: issueData.reporter_phone }),
    };
    
    await setDoc(issueRef, newIssue);

    try {
      saveToken(claimToken);
    } catch (error) {
      console.error('saveToken failed after issue creation:', error);
    }

    return {
      id: issueRef.id,
      ...newIssue,
      createdAt: createdAtClient,
      updatedAt: createdAtClient,
      reported_at: createdAtClient,
      updated_at: createdAtClient,
      deadline: toClientDate(storedDeadline) || deadlineClient,
    };
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
    const nextTimelineEvent = updates.timelineEvent;
    const { timelineEvent, id: ignoredId, ...restUpdates } = updates;

    await updateDoc(issueRef, {
      ...restUpdates,
      updatedAt: serverTimestamp(),
      updated_at: serverTimestamp(),
      ...(nextTimelineEvent ? { timeline: arrayUnion(nextTimelineEvent) } : {}),
    });
    
    return { id, ...restUpdates };
  } catch (error) {
    console.error(`Error updating issue ${id}:`, error);
    throw error;
  }
};

export const upvoteIssue = async (issueId) => {
  try {
    const issueRef = doc(db, ISSUES_COLLECTION, issueId);

    await updateDoc(issueRef, {
      upvotes: increment(1),
      updatedAt: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  } catch (error) {
    console.error(`upvoteIssue failed for issueId ${issueId}:`, error);
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
  const q = query(
    issuesRef, 
    where("archived", "==", false),
    orderBy("createdAt", "desc"), 
    limit(pageSize)
  );
  
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
