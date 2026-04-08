import { useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../services/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export async function isWorkerAuthorized(user, tokenResult) {
  if (!user || !tokenResult) {
    return false;
  }

  if (Boolean(tokenResult.claims?.worker)) {
    return true;
  }

  const devWorkerEmails = import.meta.env.VITE_DEV_WORKER_EMAILS;
  const isDevWorker = Boolean(
    devWorkerEmails &&
      devWorkerEmails
        .split(",")
        .map((email) => email.trim())
        .filter(Boolean)
        .includes(user.email)
  );

  if (isDevWorker) {
    return true;
  }

  try {
    const workerQuery = query(collection(db, "workers"), where("email", "==", user.email));
    const workerSnapshot = await getDocs(workerQuery);
    return !workerSnapshot.empty;
  } catch (firestoreError) {
    console.warn("Firestore worker check failed, falling back to claims/env checks", firestoreError.message);
    return false;
  }
}

export const useWorkerAuth = () => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async (email, password, onSuccess) => {
    setLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const tokenResult = await user.getIdTokenResult();

      if (await isWorkerAuthorized(user, tokenResult)) {
        onSuccess?.();
      } else {
        await signOut(auth);
        setError("Insufficient permissions. Worker access required.");
      }
    } catch (loginError) {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return { login, error, loading };
};

export default function WorkerAuth() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, error, loading } = useWorkerAuth();

  const handleLogin = (event) => {
    event.preventDefault();
    login(email, password, () => navigate("/worker/dashboard"));
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #082F49 0%, #0F172A 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          backgroundColor: "rgba(15, 23, 42, 0.92)",
          border: "1px solid rgba(148, 163, 184, 0.18)",
          borderRadius: "20px",
          padding: "2rem",
          boxShadow: "0 24px 60px rgba(2, 6, 23, 0.45)",
        }}
      >
        <h1 style={{ color: "white", fontSize: "1.6rem", fontWeight: 700, marginBottom: "0.35rem" }}>
          Worker Login
        </h1>
        <p style={{ color: "#CBD5E1", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
          CIVIX field resolution console
        </p>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", color: "#94A3B8", fontSize: "0.75rem", marginBottom: "0.35rem" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="worker@civix.app"
              autoComplete="email"
              style={{
                width: "100%",
                backgroundColor: "#0F172A",
                color: "white",
                border: "1px solid #334155",
                borderRadius: "10px",
                padding: "0.75rem 0.9rem",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", color: "#94A3B8", fontSize: "0.75rem", marginBottom: "0.35rem" }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              style={{
                width: "100%",
                backgroundColor: "#0F172A",
                color: "white",
                border: "1px solid #334155",
                borderRadius: "10px",
                padding: "0.75rem 0.9rem",
                boxSizing: "border-box",
              }}
            />
          </div>

          {error && <p style={{ color: "#FCA5A5", fontSize: "0.875rem" }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{
              border: "none",
              borderRadius: "10px",
              padding: "0.8rem 1rem",
              backgroundColor: "#14B8A6",
              color: "#042F2E",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Signing in..." : "Enter worker dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}
