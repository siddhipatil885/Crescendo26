/**
 * PAGE: REPORT ISSUE (WIZARD)
 * Purpose: Multi-step form for capturing civic issues with AI assistance.
 * 
 * Logic Flow:
 * 1. STATE: 'capture'
 *    - Render <ImageUploader />
 *    - Logic: Trigger Capacitor Camera. On success, move to state 'analyzing'.
 * 
 * 2. STATE: 'analyzing'
 *    - Logic: Pass image to `gemini.js`.
 *    - Logic (Parallel): Fetch current location via `capacitor.js`.
 *    - On AI Success: Move to state 'review'.
 * 
 * 3. STATE: 'review'
 *    - UI: Display AI-generated category and description in editable inputs.
 *    - Logic: User clicks "Submit".
 * 
 * 4. STATE: 'submitting'
 *    - Logic: 
 *      a) Upload image to Firebase Storage.
 *      b) Save record to Firestore (ReportData + ImageURL + Coords).
 *      c) On Success: Redirect to Home with a toast notification.
 */

// export default function ReportIssue() { ... };
