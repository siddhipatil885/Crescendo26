/**
 * SERVICE: FIRESTORE (DATA CRUD)
 * Purpose: Centralized data management for issues.
 * 
 * Logic Flow:
 * 1. Define `addIssueReport` (Save AI result, storage URL, coords, initial status).
 * 2. Define `getIssuesFeed` (Query all issues from Firestore).
 * 3. Define `updateIssueStatus` (For Admin Dashboard: Pending -> In-Progress -> Resolved).
 * 4. Define `verifyResolution` (For Citizen: Upload 'after' image).
 * 
 * Returns: Document reference or Success status.
 */

// export const createIssue = async (details, userId) => { ... };
// export const updateStatus = async (issueId, newStatus) => { ... };
