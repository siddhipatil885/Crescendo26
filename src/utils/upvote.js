const VOTED_ISSUES_KEY = "votedIssues";
const LEGACY_VOTED_ISSUES_KEY = "upvoted";

function readVotedIssues() {
    const current = JSON.parse(localStorage.getItem(VOTED_ISSUES_KEY) || "[]");
    const legacy = JSON.parse(localStorage.getItem(LEGACY_VOTED_ISSUES_KEY) || "[]");
    return Array.from(new Set([...current, ...legacy]));
}

export const hasUpvoted = (issueId) => {
    return readVotedIssues().includes(issueId);
};

export const markUpvoted = (issueId) => {
    const nextVotes = Array.from(new Set([...readVotedIssues(), issueId]));
    localStorage.setItem(VOTED_ISSUES_KEY, JSON.stringify(nextVotes));
    localStorage.setItem(LEGACY_VOTED_ISSUES_KEY, JSON.stringify(nextVotes));
};
