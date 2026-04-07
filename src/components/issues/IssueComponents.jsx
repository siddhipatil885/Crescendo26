import { useState } from "react";
import { upvoteIssue, verifyFix, reopenIssue } from "../../services/firestore";
import { hasUpvoted, markUpvoted } from "../../utils/upvote";
import { canVerify } from "../../utils/token";
import { getThumbnailUrl } from "../../services/storage";

// ─────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────

export const StatusBadge = ({ status }) => {
    const map = {
        open: "bg-red-500/20 text-red-400 border-red-500/30",
        in_progress: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        resolved: "bg-green-500/20 text-green-400 border-green-500/30",
    };
    const labels = { open: "Open", in_progress: "In Progress", resolved: "Resolved" };

    return (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${map[status]}`}>
            {labels[status]}
        </span>
    );
};

// ─────────────────────────────────────────────
// BEFORE / AFTER / VERIFY PHOTO VIEWER
// ─────────────────────────────────────────────

export const PhotoViewer = ({ issue }) => {
    const [active, setActive] = useState("before");

    const tabs = [
        { key: "before", label: "Before", url: issue.photo_url },
        { key: "after_admin", label: "Admin Fix", url: issue.resolution_photo_url },
        { key: "after_citizen", label: "Citizen Verify", url: issue.verification_photo_url },
    ].filter((t) => t.url);

    return (
        <div className="rounded-xl overflow-hidden border border-gray-800">
            {/* Tab switcher */}
            <div className="flex bg-gray-900 border-b border-gray-800">
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setActive(t.key)}
                        className={`flex-1 text-xs py-2 font-medium transition ${active === t.key
                                ? "text-orange-400 border-b-2 border-orange-400"
                                : "text-gray-500 hover:text-gray-300"
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Photo */}
            <div className="relative h-52 bg-gray-950">
                {tabs.map((t) => (
                    <img
                        key={t.key}
                        src={t.url}
                        alt={t.label}
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${active === t.key ? "opacity-100" : "opacity-0 pointer-events-none"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────
// UPVOTE BUTTON
// ─────────────────────────────────────────────

export const UpvoteButton = ({ issue }) => {
    const [voted, setVoted] = useState(hasUpvoted(issue.id));
    const [count, setCount] = useState(issue.upvotes || 0);

    const handleUpvote = async () => {
        if (voted) return;
        await upvoteIssue(issue.id);
        markUpvoted(issue.id);
        setVoted(true);
        setCount((c) => c + 1);
    };

    return (
        <button
            onClick={handleUpvote}
            disabled={voted}
            className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border transition ${voted
                    ? "bg-orange-500/20 text-orange-400 border-orange-500/30 cursor-not-allowed"
                    : "bg-gray-800 text-gray-400 border-gray-700 hover:border-orange-500 hover:text-orange-400"
                }`}
        >
            ▲ {count}
        </button>
    );
};

// ─────────────────────────────────────────────
// VERIFY FIX BUTTON (token holder only)
// ─────────────────────────────────────────────

export const VerifyButton = ({ issue, onVerified }) => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    if (!canVerify(issue) || issue.status !== "resolved" || issue.verified_by_citizen) return null;

    const handleVerify = async () => {
        if (!file) return;
        setLoading(true);
        try {
            await verifyFix(issue.id, file);
            onVerified?.();
            setOpen(false);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="text-sm bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1.5 rounded-full hover:bg-green-500/30 transition"
            >
                📸 Verify Fix
            </button>

            {open && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm">
                        <h3 className="text-white font-semibold mb-2">Upload Verification Photo</h3>
                        <p className="text-gray-400 text-sm mb-4">
                            Take a photo showing the issue has been fixed.
                        </p>
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => setFile(e.target.files[0])}
                            className="w-full text-sm text-gray-400 mb-4"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => setOpen(false)}
                                className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleVerify}
                                disabled={!file || loading}
                                className="flex-1 py-2 rounded-lg bg-green-500 text-white text-sm font-medium disabled:opacity-50"
                            >
                                {loading ? "Uploading..." : "Submit"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// ─────────────────────────────────────────────
// REOPEN BUTTON (token holder only)
// ─────────────────────────────────────────────

export const ReopenButton = ({ issue, onReopened }) => {
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);

    if (!canVerify(issue) || issue.status !== "resolved") return null;

    const handleReopen = async () => {
        if (!reason.trim()) return;
        setLoading(true);
        try {
            await reopenIssue(issue.id, reason);
            onReopened?.();
            setOpen(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="text-sm bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-full hover:bg-red-500/20 transition"
            >
                ↩ Reopen
            </button>

            {open && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm">
                        <h3 className="text-white font-semibold mb-2">Reopen Issue</h3>
                        <p className="text-gray-400 text-sm mb-3">Why isn't this fixed?</p>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g. Pothole is back after rain..."
                            rows={3}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none mb-4 focus:outline-none focus:border-orange-500"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => setOpen(false)}
                                className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReopen}
                                disabled={!reason.trim() || loading}
                                className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-medium disabled:opacity-50"
                            >
                                {loading ? "Reopening..." : "Reopen"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// ─────────────────────────────────────────────
// ISSUE CARD (used in public feed + admin list)
// ─────────────────────────────────────────────

export const IssueCard = ({ issue, isAdmin = false, onStatusChange }) => {
    const isEscalated = issue.upvotes >= 10 && issue.status === "open";

    return (
        <div
            className={`bg-gray-900 border rounded-2xl overflow-hidden transition ${isEscalated ? "border-red-500/50 shadow-red-500/10 shadow-lg" : "border-gray-800"
                }`}
        >
            {/* Escalation banner */}
            {isEscalated && (
                <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-1.5 flex items-center gap-2">
                    <span className="text-red-400 text-xs font-semibold">🔴 High Urgency — {issue.upvotes} upvotes</span>
                </div>
            )}

            {/* Reopen reason banner */}
            {issue.reopen_reason && (
                <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-1.5">
                    <span className="text-yellow-400 text-xs">↩ Reopened: "{issue.reopen_reason}"</span>
                </div>
            )}

            {/* Citizen verified banner */}
            {issue.verified_by_citizen && (
                <div className="bg-green-500/10 border-b border-green-500/20 px-4 py-1.5">
                    <span className="text-green-400 text-xs font-medium">✅ Citizen Verified</span>
                </div>
            )}

            <div className="flex gap-3 p-4">
                {/* Thumbnail */}
                <img
                    src={getThumbnailUrl(issue.photo_url, 80, 80)}
                    alt="Issue"
                    className="w-20 h-20 rounded-xl object-cover flex-shrink-0 bg-gray-800"
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-orange-400 text-xs font-semibold uppercase tracking-wide">
                            {issue.category}
                        </span>
                        <StatusBadge status={issue.status} />
                    </div>

                    <p className="text-white text-sm leading-snug mb-1 truncate">
                        {issue.ai_description}
                    </p>

                    <p className="text-gray-500 text-xs mb-3">
                        📍 {issue.neighbourhood} · {issue.reported_at?.toDate?.()?.toLocaleDateString() || "Just now"}
                    </p>

                    <div className="flex items-center gap-2 flex-wrap">
                        <UpvoteButton issue={issue} />
                        <VerifyButton issue={issue} />
                        <ReopenButton issue={issue} />
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────
// TIMELINE COMPONENT (used in issue detail)
// ─────────────────────────────────────────────

export const Timeline = ({ entries = [] }) => {
    const iconMap = {
        "Issue reported": "🔵",
        Resolved: "🟢",
        "Reopened by citizen": "🔴",
        "Fix verified by original reporter": "✅",
    };

    return (
        <div className="space-y-3">
            {entries.map((entry, i) => (
                <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                        <span className="text-base">{iconMap[entry.action] || "🟡"}</span>
                        {i < entries.length - 1 && (
                            <div className="w-px flex-1 bg-gray-800 mt-1" />
                        )}
                    </div>
                    <div className="pb-4">
                        <p className="text-white text-sm font-medium">{entry.action}</p>
                        {entry.note && (
                            <p className="text-gray-400 text-xs mt-0.5">"{entry.note}"</p>
                        )}
                        <p className="text-gray-600 text-xs mt-0.5">
                            {new Date(entry.timestamp).toLocaleString()}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};