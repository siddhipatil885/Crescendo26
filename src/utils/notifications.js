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
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Failed to persist local storage key "${key}":`, error);
    return false;
  }
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
    return writeJson(TRACKED_ISSUES_KEY, [...trackedIssues, issueId]);
  }

  return true;
}

export function untrackIssue(issueId) {
  return writeJson(
    TRACKED_ISSUES_KEY,
    getTrackedIssues().filter((trackedIssueId) => trackedIssueId !== issueId)
  );
}

export async function enableIssueNotifications(issueId) {
  if (!trackIssue(issueId)) {
    console.warn(`Failed to persist tracked issue "${issueId}" in local storage.`);
  }

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return {
      enabled: false,
      reason: 'unsupported',
      error: 'Notifications are not supported in this browser.',
      message: 'Notifications are not supported in this browser.',
    };
  }

  if (Notification.permission === 'granted') {
    return { enabled: true, reason: 'granted' };
  }

  try {
    const permission = await Notification.requestPermission();
    return {
      enabled: permission === 'granted',
      reason: permission,
      ...(permission === 'granted'
        ? {}
        : {
            error: 'Notification permission was denied.',
            message: 'Notification permission was denied.',
          }),
    };
  } catch (error) {
    console.error('enableIssueNotifications failed:', error);
    return {
      enabled: false,
      reason: 'error',
      error: error?.message || 'Unable to enable notifications.',
      message: error?.message || 'Unable to enable notifications.',
    };
  }
}

export function getIssueStatusCache() {
  return readJson(ISSUE_STATUS_CACHE_KEY, {});
}

export function setIssueStatusCache(cache) {
  return writeJson(ISSUE_STATUS_CACHE_KEY, cache);
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

  try {
    new Notification(title, { body });
    return true;
  } catch (error) {
    console.error('notifyStatusChange failed:', error);
    return false;
  }
}
