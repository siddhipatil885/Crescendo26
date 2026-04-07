import { useState, useEffect } from "react";

// 🔥 Import Firestore functions
import { collection, getDocs } from "firebase/firestore";

// 🔥 Import your db from firebase.js
import { db } from "../../services/firebase";

export default function Home() {
  // Store issues from Firestore
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch issues on mount
  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "issues"));
        const issuesList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log("✅ Fetched issues:", issuesList);
        setIssues(issuesList);
      } catch (error) {
        console.error("❌ Error fetching issues:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, []);

  // Simple rendering
  if (loading) return <p>Loading issues...</p>;

  return (
    <div>
      <h1>CIVIX — Reported Issues</h1>
      {issues.length === 0 ? (
        <p>No issues found.</p>
      ) : (
        <ul>
          {issues.map((issue) => (
            <li key={issue.id}>
              <strong>{issue.category}</strong> — {issue.description} [{issue.status}]
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
