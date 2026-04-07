import { useState, useEffect } from "react";
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp,
    arrayUnion,
    increment,
    getDocs,
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { uploadToCloudinary } from "./storage";
import { saveToken } from "../utils/token";
import { hasUpvoted, markUpvoted } from "../utils/upvote";

// ─────────────────────────────────────────────
// REAL-TIME ISSUES HOOK (used in admin + public map)
// ─────────────────────────────────────────────

export const useIssues = (filters = {}) => {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        let q = collection(db, "issues");
        const constraints = [orderBy("upvotes", "desc")];

        if (filters.status && filters.status !== "all")
            constraints.push(where("status", "==", filters.status));

        if (filters.category && filters.category !== "all")
            constraints.push(where("category", "==", filters.category));

        q = query(q, ...constraints);

        const unsub = onSnapshot(q, (snap) => {
            setIssues(snap.docs.map((d) => {
                const { claimToken, ...data } = d.data();
                return { id: d.id, ...data };
            }));
            setLoading(false);
        }, (err) => {
            console.error("useIssues error:", err);
            setLoading(false);
        });

        return () => unsub();
    }, [filters.status, filters.category]);

    return { issues, loading };
};

// ─────────────────────────────────────────────
// SUBMIT NEW REPORT (citizen)
// ─────────────────────────────────────────────

export const submitReport = async ({ photo, category, aiDescription, location, neighbourhood, urgency }) => {
    const claimToken = crypto.randomUUID();

    // Upload report photo to Cloudinary
    const photoUrl = await uploadToCloudinary(photo);

    await addDoc(collection(db, "issues"), {
        photo_url: photoUrl,
        resolution_photo_url: null,
        verification_photo_url: null,
        verified_by_citizen: false,
        verified_at: null,
        claimToken,
        category,
        ai_description: aiDescription,
        location,
        neighbourhood,
        urgency: urgency || "medium",
        status: "open",
        upvotes: 0,
        admin_note: "",
        reopen_reason: "",
        reported_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        timeline: [
            {
                action: "Issue reported",
                timestamp: new Date().toISOString(),
                note: "",
            },
        ],
    });

    // Save token to localStorage so reporter can verify later
    saveToken(claimToken);
};

// ─────────────────────────────────────────────
// ADMIN: UPDATE STATUS
// ─────────────────────────────────────────────

export const updateIssueStatus = async (issueId, newStatus, adminNote = "") => {
    await updateDoc(doc(db, "issues", issueId), {
        status: newStatus,
        admin_note: adminNote,
        updated_at: serverTimestamp(),
        timeline: arrayUnion({
            action: `Status → ${newStatus}`,
            by: auth.currentUser?.uid || "admin",
            note: adminNote,
            timestamp: new Date().toISOString(),
        }),
    });
};

// ─────────────────────────────────────────────
// ADMIN: RESOLVE WITH PHOTO
// ─────────────────────────────────────────────

export const resolveIssue = async (issueId, resolutionPhoto, adminNote = "") => {
    const url = await uploadToCloudinary(resolutionPhoto);

    await updateDoc(doc(db, "issues", issueId), {
        status: "resolved",
        resolution_photo_url: url,
        admin_note: adminNote,
        updated_at: serverTimestamp(),
        timeline: arrayUnion({
            action: "Resolved",
            by: auth.currentUser?.uid || "admin",
            note: adminNote,
            timestamp: new Date().toISOString(),
        }),
    });
};

// ─────────────────────────────────────────────
// CITIZEN: VERIFY FIX (token holder only)
// ─────────────────────────────────────────────

export const verifyFix = async (issueId, verificationPhoto) => {
    const url = await uploadToCloudinary(verificationPhoto);

    await updateDoc(doc(db, "issues", issueId), {
        verification_photo_url: url,
        verified_by_citizen: true,
        verified_at: serverTimestamp(),
        timeline: arrayUnion({
            action: "Fix verified by original reporter",
            timestamp: new Date().toISOString(),
            note: "",
        }),
    });
};

// ─────────────────────────────────────────────
// CITIZEN: REOPEN ISSUE
// ─────────────────────────────────────────────

export const reopenIssue = async (issueId, reason) => {
    await updateDoc(doc(db, "issues", issueId), {
        status: "open",
        reopen_reason: reason,
        verified_by_citizen: false,
        verification_photo_url: null,
        verified_at: null,
        updated_at: serverTimestamp(),
        timeline: arrayUnion({
            action: "Reopened by citizen",
            timestamp: new Date().toISOString(),
            note: reason,
        }),
    });
};

// ─────────────────────────────────────────────
// CITIZEN: UPVOTE
// ─────────────────────────────────────────────

export const upvoteIssue = async (issueId) => {
    if (hasUpvoted(issueId)) {
        throw new Error("You have already upvoted this issue");
    }
    await updateDoc(doc(db, "issues", issueId), {
        upvotes: increment(1),
    });
    markUpvoted(issueId);
};

// ─────────────────────────────────────────────
// ANALYTICS HELPERS (used in admin analytics panel)
// ─────────────────────────────────────────────

export const getAnalytics = (issues) => {
    const total = issues.length;
    const open = issues.filter((i) => i.status === "open").length;
    const inProgress = issues.filter((i) => i.status === "in_progress").length;
    const resolved = issues.filter((i) => i.status === "resolved").length;
    const verified = issues.filter((i) => i.verified_by_citizen).length;
    const verificationRate = resolved > 0 ? Number(((verified / resolved) * 100).toFixed(1)) : 0;

    const byCategory = issues.reduce((acc, issue) => {
        acc[issue.category] = (acc[issue.category] || 0) + 1;
        return acc;
    }, {});

    return { total, open, inProgress, resolved, verified, verificationRate, byCategory };
};