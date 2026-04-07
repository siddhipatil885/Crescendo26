const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const AI_API_URL = process.env.AI_API_URL || "http://localhost:3000/classify";

exports.classifyIssue = functions.https.onCall((data, context) => {
    const text = data.text.toLowerCase();

    let category = "Other";
    let department = "General";

    if (text.includes("pothole") || text.includes("road broken")) {
        category = "Pothole";
        department = "Roads";
    } else if (text.includes("garbage") || text.includes("trash")) {
        category = "Garbage";
        department = "Sanitation";
    } else if (
        text.includes("dog") ||
        text.includes("cow") ||
        text.includes("animal")
    ) {
        category = "Stray Animal";
        department = "Animal Control";
    } else if (text.includes("light") || text.includes("streetlight")) {
        category = "Streetlight";
        department = "Electrical";
    } else if (text.includes("water") || text.includes("leak")) {
        category = "Water Leakage";
        department = "Water";
    }

    return {
        category,
        department,
    };
});

exports.onIssueCreate = functions.firestore
    .document("issues/{issueId}")
    .onCreate(async (snap, context) => {
        const data = snap.data() || {};
        const text = data.text;

        if (!text || typeof text !== "string") {
            console.warn("Issue text missing or invalid for document:", context.params.issueId);
            return null;
        }

        try {
            const response = await fetch(AI_API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
            });

            if (!response.ok) {
                console.error("AI API returned non-OK status:", response.status);
                return null;
            }

            const result = await response.json();
            const category = result?.category || "Other";
            const department = result?.department || "General";
            const priority = result?.priority || "Medium";
            const confidence = typeof result?.confidence === "number" ? result.confidence : 0.9;

            await snap.ref.update({
                category,
                department,
                priority,
                confidence,
            });

            console.log("Issue classified:", {
                id: context.params.issueId,
                category,
                department,
                priority,
                confidence,
            });
        } catch (error) {
            console.error("Failed to classify issue:", error.message);
        }

        return null;
    });
