import { auth, db } from "./firebase";
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
import { getDistanceInMeters } from "./geolocation";
import { uploadIssueImage } from "./storage";

const ISSUES_COLLECTION = "issues";

function mapIssueDoc(docSnapshot) {
  return {
    id: docSnapshot.id,
    ...docSnapshot.data(),
  };
}

function toClientDate(value) {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate();
  if (typeof value?.seconds === 'number') return new Date(value.seconds * 1000);
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function buildTimelineEvent({ type, title, status, note, by }) {
  return {
    type,
    title,
    status,
    note: note || "",
    by: by || auth.currentUser?.uid || "system",
    createdAt: new Date().toISOString(),
  };
}

function normalizeIssueLocation(issueData) {
  const locationValue = issueData.location;

  if (locationValue && typeof locationValue === "object" && !Array.isArray(locationValue)) {
    return {
      lat: locationValue.lat ?? issueData.lat ?? null,
      lng: locationValue.lng ?? issueData.lng ?? null,
      address: locationValue.address ?? issueData.address ?? issueData.locationLabel ?? "",
    };
  }

  return {
    lat: issueData.lat ?? null,
    lng: issueData.lng ?? null,
    address: locationValue || issueData.address || "",
  };
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
    let uploadedBeforeImageUrl = null;

    if (issueData.beforeImageFile) {
      try {
        uploadedBeforeImageUrl = await uploadIssueImage(issueRef.id, issueData.beforeImageFile, "before");
      } catch (uploadError) {
        console.warn("Before image upload failed. Continuing without before image.", uploadError);
        uploadedBeforeImageUrl = null;
      }
    }
    const photoUrl =
      uploadedBeforeImageUrl ||
      issueData.photo_url ||
      issueData.beforeImage ||
      issueData.beforeImageUrl ||
      null;
    const normalizedLocation = normalizeIssueLocation(issueData);
    const storedDeadline = issueData.deadline || Timestamp.fromDate(deadlineClient);
    const timeline = issueData.timeline || [
      {
        type: ISSUE_STATUS.REPORTED,
        title: 'Complaint reported',
        status: ISSUE_STATUS.REPORTED,
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
      priority: issueData.priority || '',
      contractor: issueData.contractor || '',
      department,
      description: issueData.description || issueData.ai_description || '',
      ai_description: issueData.ai_description || issueData.description || '',
      createdBy: issueData.createdBy || auth.currentUser?.uid || null,
      assignedTo: issueData.assignedTo || null,
      lat: normalizedLocation.lat,
      lng: normalizedLocation.lng,
      neighbourhood: issueData.neighbourhood || '',
      location: normalizedLocation,
      locationLabel: normalizedLocation.address,
      report_source: issueData.report_source || REPORT_SOURCES.APP,
      photo_url: photoUrl,
      beforeImage: photoUrl,
      beforeImageUrl: photoUrl,
      afterImage: issueData.afterImage || null,
      afterImageUrl: issueData.afterImage || null,
      afterUploadMeta: issueData.afterUploadMeta || null,
      citizenVerification: issueData.citizenVerification || {
        status: "pending",
        verifiedAt: null,
      },
      verified_by_citizen: false,
      upvotes: 0,
      archived: false,
      timeline,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      reported_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      deadline: storedDeadline,
      status: issueData.status || ISSUE_STATUS.REPORTED,
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

export const assignIssueToWorker = async (issueId, worker) => {
  if (!issueId) {
    throw new Error("Issue ID is required");
  }

  if (!worker?.id) {
    throw new Error("Please select a worker to assign");
  }

  const issueRef = doc(db, ISSUES_COLLECTION, issueId);
  const workerDisplayName = worker.name || worker.email || worker.id;

  await updateDoc(issueRef, {
    assignedTo: worker.id,
    assignedWorkerName: workerDisplayName,
    ...(worker.uid ? { assignedWorkerUid: worker.uid } : {}),
    status: ISSUE_STATUS.ASSIGNED,
    citizenVerification: {
      status: "pending",
      verifiedAt: null,
    },
    updatedAt: serverTimestamp(),
    updated_at: serverTimestamp(),
    timeline: arrayUnion(
      buildTimelineEvent({
        type: "assignment",
        title: `Assigned to ${workerDisplayName}`,
        status: ISSUE_STATUS.ASSIGNED,
        note: "Worker assignment created by admin.",
      })
    ),
  });
};

export const resolveIssueWithProof = async ({ issueId, file, workerLocation, workerId, workerName }) => {
  if (!issueId) {
    throw new Error("Issue ID is required");
  }

  if (!file) {
    throw new Error("An after image is required");
  }

  if (!Number.isFinite(workerLocation?.lat) || !Number.isFinite(workerLocation?.lng)) {
    throw new Error("Worker location is required");
  }

  const issue = await getIssueById(issueId);
  const issueLat = issue.location?.lat ?? issue.lat;
  const issueLng = issue.location?.lng ?? issue.lng;
  const distance = getDistanceInMeters(issueLat, issueLng, workerLocation.lat, workerLocation.lng);

  if (!Number.isFinite(distance)) {
    throw new Error("Issue location is missing or invalid");
  }

  if (distance > 100) {
    throw new Error("You must be near the issue location");
  }

  const afterImageUrl = await uploadIssueImage(issueId, file, "after");
  const issueRef = doc(db, ISSUES_COLLECTION, issueId);

  await updateDoc(issueRef, {
    status: ISSUE_STATUS.RESOLVED,
    afterImage: afterImageUrl,
    afterImageUrl,
    afterUploadMeta: {
      lat: workerLocation.lat,
      lng: workerLocation.lng,
      accuracy: workerLocation.accuracy ?? null,
      uploadedBy: workerId || auth.currentUser?.uid || null,
      uploadedByName: workerName || auth.currentUser?.displayName || auth.currentUser?.email || null,
      timestamp: serverTimestamp(),
    },
    citizenVerification: {
      status: "pending",
      verifiedAt: null,
    },
    verified_by_citizen: false,
    updatedAt: serverTimestamp(),
    updated_at: serverTimestamp(),
    timeline: arrayUnion(
      buildTimelineEvent({
        type: "resolution_submitted",
        title: "Worker submitted after proof",
        status: ISSUE_STATUS.RESOLVED,
        note: `Resolution proof uploaded within ${Math.round(distance)}m of the issue.`,
        by: workerId,
      })
    ),
  });

  return {
    afterImageUrl,
    distance,
  };
};

export const verifyIssueResolution = async (issueId, decision) => {
  if (!issueId) {
    throw new Error("Issue ID is required");
  }

  if (!["accepted", "rejected"].includes(decision)) {
    throw new Error("Decision must be accepted or rejected");
  }

  const issueRef = doc(db, ISSUES_COLLECTION, issueId);
  const accepted = decision === "accepted";

  await updateDoc(issueRef, {
    status: accepted ? ISSUE_STATUS.RESOLVED : ISSUE_STATUS.IN_PROGRESS,
    citizenVerification: {
      status: decision,
      verifiedAt: serverTimestamp(),
    },
    verified_by_citizen: accepted,
    updatedAt: serverTimestamp(),
    updated_at: serverTimestamp(),
    timeline: arrayUnion(
      buildTimelineEvent({
        type: "citizen_verification",
        title: accepted ? "Citizen confirmed the fix" : "Citizen rejected the fix",
        status: accepted ? ISSUE_STATUS.RESOLVED : ISSUE_STATUS.IN_PROGRESS,
        note: accepted
          ? "Issue marked fixed by the reporting citizen."
          : "Issue moved back to in-progress after citizen rejection.",
      })
    ),
  });
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

export const subscribeToAssignedIssues = (workerIdentifiers, onData, onError) => {
  const identifiers = Array.isArray(workerIdentifiers)
    ? workerIdentifiers.filter(Boolean)
    : [workerIdentifiers].filter(Boolean);

  if (identifiers.length === 0) {
    onData?.([]);
    return () => {};
  }

  const issuesRef = collection(db, ISSUES_COLLECTION);

  return onSnapshot(
    issuesRef,
    (snapshot) => {
      const assignedIssues = snapshot.docs
        .map(mapIssueDoc)
        .filter((issue) =>
          issue.archived !== true &&
          identifiers.some((identifier) =>
            [issue.assignedTo, issue.assignedWorkerUid].includes(identifier)
          )
        )
        .sort((leftIssue, rightIssue) => {
          const leftTime = toClientDate(leftIssue.updatedAt)?.getTime?.() || 0;
          const rightTime = toClientDate(rightIssue.updatedAt)?.getTime?.() || 0;
          return rightTime - leftTime;
        });

      onData?.(assignedIssues);
    },
    (error) => {
      console.error(`Assigned issue listener error (${identifiers.join(",")}):`, error);
      onError?.(error);
    }
  );
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

/**
 * Real-time listener for finding an issue by either tokenId or claimToken.
 * This keeps tracking compatible with both the old and new schema.
 * @param {string} token - Reporter-facing token string
 * @param {Function} onData - Callback with matching issues
 * @param {Function} onError - Callback on error
 * @returns {Function} Unsubscribe function
 */
export const subscribeToIssueByToken = (token, onData, onError) => {
  const normalizedToken = String(token || '').trim();

  if (!normalizedToken) {
    onData?.([]);
    return () => {};
  }

  const issuesRef = collection(db, ISSUES_COLLECTION);
  const queryStates = {
    claimToken: { ready: false, issues: [] },
    tokenId: { ready: false, issues: [] },
  };

  const emitMergedIssues = () => {
    if (!queryStates.claimToken.ready || !queryStates.tokenId.ready) {
      return;
    }

    const mergedIssues = new Map();

    [...queryStates.claimToken.issues, ...queryStates.tokenId.issues].forEach((issue) => {
      mergedIssues.set(issue.id, issue);
    });

    onData?.(Array.from(mergedIssues.values()));
  };

  const createListener = (fieldName) =>
    onSnapshot(
      query(issuesRef, where(fieldName, "==", normalizedToken)),
      (snapshot) => {
        queryStates[fieldName] = {
          ready: true,
          issues: snapshot.docs.map(mapIssueDoc),
        };
        emitMergedIssues();
      },
      (error) => {
        console.error(`Issue token listener error (${fieldName}:${normalizedToken}):`, error);
        if (onError) onError(error);
      }
    );

  const unsubscribers = [
    createListener("claimToken"),
    createListener("tokenId"),
  ];

  return () => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
  };
};
