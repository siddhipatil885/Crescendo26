import { useEffect } from 'react';
import { subscribeToIssues } from '../services/issues';
import {
  getIssueStatusCache,
  getTrackedIssues,
  notifyStatusChange,
  setIssueStatusCache,
} from '../utils/notifications';

export default function useIssueNotifications() {
  useEffect(() => {
    const initialCache = getIssueStatusCache();

    const unsubscribe = subscribeToIssues(
      (issues) => {
        const latestCache = { ...initialCache, ...getIssueStatusCache() };
        const trackedIssues = getTrackedIssues();

        if (trackedIssues.length === 0) {
          return;
        }

        issues
          .filter((issue) => trackedIssues.includes(issue.id))
          .forEach((issue) => {
            const nextStatus = issue.status || 'open';
            const previousStatus = latestCache[issue.id];

            if (previousStatus && previousStatus !== nextStatus) {
              notifyStatusChange(issue);
            }

            latestCache[issue.id] = nextStatus;
          });

        setIssueStatusCache(latestCache);
      },
      () => {},
      200
    );

    return () => unsubscribe();
  }, []);
}
