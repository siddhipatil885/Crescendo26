const TRACKED_ISSUES_KEY = 'civixTrackedIssues';
const ISSUE_STATUS_CACHE_KEY = 'civixIssueStatusCache';

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getTrackedIssues() {
  return readJson(TRACKED_ISSUES_KEY, []);
}

export function isTrackingIssue(issueId) {
  return getTrackedIssues().includes(issueId);
}

export function trackIssue(issueId) {
  const trackedIssues = getTrackedIssues();

  if (!trackedIssues.includes(issueId)) {
    writeJson(TRACKED_ISSUES_KEY, [...trackedIssues, issueId]);
  }
}

export function untrackIssue(issueId) {
  writeJson(
    TRACKED_ISSUES_KEY,
    getTrackedIssues().filter((trackedIssueId) => trackedIssueId !== issueId)
  );
}

export async function enableIssueNotifications(issueId) {
  trackIssue(issueId);

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { enabled: false, reason: 'unsupported' };
  }

  if (Notification.permission === 'granted') {
    return { enabled: true, reason: 'granted' };
  }

  const permission = await Notification.requestPermission();
  return {
    enabled: permission === 'granted',
    reason: permission,
  };
}

export function getIssueStatusCache() {
  return readJson(ISSUE_STATUS_CACHE_KEY, {});
}

export function setIssueStatusCache(cache) {
  writeJson(ISSUE_STATUS_CACHE_KEY, cache);
}

export function notifyStatusChange(issue) {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  const title = `Issue ${issue.id} updated`;
  const body = `${issue.category || 'Civic issue'} is now ${String(issue.status || 'updated').replace(/_/g, ' ')}.`;

  new Notification(title, { body });
  return true;
}
