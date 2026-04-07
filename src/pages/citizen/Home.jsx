/**
 * PAGE: CITIZEN HOME
 * Purpose: Display a feed of recent and user-specific civic issues.
 * 
 * Layout:
 * 1. Header: "CIVIX" title + Profile icon.
 * 2. Tabs: [Recent | My Reports].
 * 3. Content: Scrollable list of <IssueCard /> components.
 * 4. Action: Floating Action Button (FAB) for "Report Issue".
 * 
 * Logic Flow:
 * - On Mount: Fetch initial 20 issues from Firestore (ordered by timestamp).
 * - Real-time: Use `onSnapshot` to update the list when new reports are approved.
 * - Filter: Local state to toggle between 'all' and 'user-only' views.
 */

// export default function Home() { ... };
