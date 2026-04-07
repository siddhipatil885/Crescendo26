import { isResolvedStatus } from './constants';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function toDate(value) {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate();
  if (typeof value?.seconds === 'number') return new Date(value.seconds * 1000);
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getCreatedAt(issue) {
  return toDate(issue?.createdAt);
}

export function getDeadline(issue) {
  const explicit = toDate(issue?.deadline);
  if (explicit) return explicit;
  const created = getCreatedAt(issue);
  if (!created) return null;
  return new Date(created.getTime() + 7 * MS_PER_DAY);
}

export function computeEscalationStatus(issue, now = new Date()) {
  const currentStatus = issue?.status?.toString().toLowerCase();
  if (isResolvedStatus(currentStatus)) {
    return 'Resolved';
  }

  const createdAt = getCreatedAt(issue);
  const deadline = getDeadline(issue);
  if (!createdAt && !deadline) {
    return currentStatus ? normalizeStatus(currentStatus) : 'Pending';
  }

  const base = createdAt || new Date(deadline.getTime() - 7 * MS_PER_DAY);
  const elapsedDays = (now.getTime() - base.getTime()) / MS_PER_DAY;

  if (elapsedDays >= 7) return 'Escalated to MLA';
  if (elapsedDays >= 5) return 'RTI Generated';
  if (elapsedDays >= 2) return 'In Progress';
  return 'Pending';
}

export function formatCountdown(issue, now = new Date()) {
  const deadline = getDeadline(issue);
  if (!deadline) return 'No deadline';
  const diffMs = deadline.getTime() - now.getTime();
  if (diffMs <= 0) return 'Expired';

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) return `${days} day${days === 1 ? '' : 's'} left`;
  if (hours > 0) return `${hours} hour${hours === 1 ? '' : 's'} left`;
  return `${minutes} min${minutes === 1 ? '' : 's'} left`;
}

export function normalizeStatus(status) {
  const normalized = status.replace(/_/g, ' ').trim();
  if (!normalized) return 'Pending';
  return normalized
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function getIssueImage(issue, type) {
  if (!issue) return null;
  if (type === 'before') return issue.beforeImage || issue.beforeImageUrl || null;
  if (type === 'after') return issue.afterImage || issue.afterImageUrl || null;
  return null;
}
