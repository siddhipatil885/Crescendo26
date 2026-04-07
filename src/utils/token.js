// ─────────────────────────────────────────────
// utils/token.js
// Manages the claim token stored in localStorage
// so only the original reporter can verify a fix
// ─────────────────────────────────────────────

export const getMyTokens = () => {
    return JSON.parse(localStorage.getItem("myReports") || "[]");
};

export const saveToken = (claimToken) => {
    const existing = getMyTokens();
    localStorage.setItem("myReports", JSON.stringify([...existing, claimToken]));
};

export const canVerify = (issue) => {
    if (!issue?.claimToken) return false;
    return getMyTokens().includes(issue.claimToken);
};