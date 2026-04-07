// ─────────────────────────────────────────────
// utils/upvote.js
// Prevents same browser from upvoting twice
// using localStorage — no login needed
// ─────────────────────────────────────────────

export const hasUpvoted = (issueId) => {
    const upvoted = JSON.parse(localStorage.getItem("upvoted") || "[]");
    return upvoted.includes(issueId);
};

export const markUpvoted = (issueId) => {
    const upvoted = JSON.parse(localStorage.getItem("upvoted") || "[]");
    localStorage.setItem("upvoted", JSON.stringify([...upvoted, issueId]));
};