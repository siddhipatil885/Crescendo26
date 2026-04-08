import { useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { CheckCircle2, Loader2, LogOut, MapPin, RefreshCw, ShieldAlert, UploadCloud } from "lucide-react";
import { auth } from "../../services/firebase";
import { getCurrentLocationWithMeta, getDistanceInMeters } from "../../services/geolocation";
import { resolveIssueWithProof, subscribeToAssignedIssues } from "../../services/issues";
import { subscribeToWorkerProfile } from "../../services/workers";

function formatIssueAddress(issue) {
  return issue?.location?.address || issue?.locationLabel || issue?.neighbourhood || "Address unavailable";
}

function issueCoordinates(issue) {
  return {
    lat: issue?.location?.lat ?? issue?.lat ?? null,
    lng: issue?.location?.lng ?? issue?.lng ?? null,
  };
}

export default function WorkerDashboard() {
  const [authUser, setAuthUser] = useState(null);
  const [workerProfile, setWorkerProfile] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIssueId, setActiveIssueId] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState({});
  const [submittingIssueId, setSubmittingIssueId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRefs = useRef({});
  const objectUrlsRef = useRef({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authUser?.uid) {
      setWorkerProfile(null);
      return undefined;
    }

    const unsubscribe = subscribeToWorkerProfile(
      authUser.uid,
      (profile) => setWorkerProfile(profile),
      (profileError) => console.error("Worker profile load failed:", profileError)
    );

    return () => unsubscribe();
  }, [authUser?.uid]);

  const workerDocId = workerProfile?.id || "";
  const workerUid = workerProfile?.uid || authUser?.uid || "";
  const workerName = workerProfile?.name || authUser?.displayName || authUser?.email || "Worker";

  useEffect(() => {
    const workerIdentifiers = [workerDocId, workerUid].filter(Boolean);

    if (workerIdentifiers.length === 0) {
      setIssues([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    const unsubscribe = subscribeToAssignedIssues(
      workerIdentifiers,
      (nextIssues) => {
        setIssues(nextIssues);
        setLoading(false);
      },
      (issuesError) => {
        setError(issuesError.message || "Failed to load assigned issues.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [workerDocId, workerUid]);

  const activeIssue = useMemo(
    () => issues.find((issue) => issue.id === activeIssueId) || issues[0] || null,
    [issues, activeIssueId]
  );

  useEffect(() => {
    if (issues.length && !issues.some((issue) => issue.id === activeIssueId)) {
      setActiveIssueId(issues[0].id);
    }
  }, [activeIssueId, issues]);

  useEffect(() => () => {
    Object.values(objectUrlsRef.current).forEach((objectUrl) => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    });
  }, []);

  const clearObjectUrl = (issueId) => {
    const existingUrl = objectUrlsRef.current[issueId];
    if (existingUrl) {
      URL.revokeObjectURL(existingUrl);
      delete objectUrlsRef.current[issueId];
    }
  };

  const handleFileChange = (issueId, file) => {
    clearObjectUrl(issueId);

    if (file) {
      objectUrlsRef.current[issueId] = URL.createObjectURL(file);
    }

    setSelectedFiles((current) => ({
      ...current,
      [issueId]: file || null,
    }));
    setMessage("");
    setError("");
  };

  const handleResolveIssue = async (issue) => {
    const file = selectedFiles[issue.id];
    if (!file) {
      setError("Upload an after image before submitting proof.");
      return;
    }

    setSubmittingIssueId(issue.id);
    setMessage("");
    setError("");

    try {
      const issuePoint = issueCoordinates(issue);
      const workerLocation = await getCurrentLocationWithMeta();

      if (workerLocation.accuracy && workerLocation.accuracy > 100) {
        throw new Error("GPS is too inaccurate right now. Please retry.");
      }

      const distance = getDistanceInMeters(
        issuePoint.lat,
        issuePoint.lng,
        workerLocation.lat,
        workerLocation.lng
      );

      if (distance > 100) {
        throw new Error("You must be near the issue location");
      }

      const result = await resolveIssueWithProof({
        issueId: issue.id,
        file,
        workerLocation,
        workerId: workerUid,
        workerName,
      });

      setMessage(`Proof submitted successfully. Device verified within ${Math.round(result.distance)} meters.`);
      clearObjectUrl(issue.id);
      setSelectedFiles((current) => ({
        ...current,
        [issue.id]: null,
      }));

      const inputRef = fileInputRefs.current[issue.id];
      if (inputRef) {
        inputRef.value = "";
      }
    } catch (submissionError) {
      setError(submissionError.message || "Failed to submit proof.");
    } finally {
      setSubmittingIssueId(null);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/worker/login";
  };

  return (
    <div style={{ minHeight: "100vh", background: "#E2F3F0", padding: "1.5rem" }}>
      <div style={{ maxWidth: "1180px", margin: "0 auto" }}>
        <div
          style={{
            background: "linear-gradient(135deg, #0F172A 0%, #0B3B39 100%)",
            borderRadius: "24px",
            padding: "1.5rem",
            color: "white",
            marginBottom: "1.5rem",
            display: "flex",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontSize: "0.8rem", color: "#99F6E4", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              CIVIX Worker Console
            </div>
            <h1 style={{ fontSize: "1.9rem", fontWeight: 800, margin: "0.35rem 0" }}>{workerName}</h1>
            <p style={{ color: "#CFFAFE", maxWidth: "540px" }}>
              Resolve assigned issues with location-verified proof. Upload is blocked unless you are within 100 meters of the reported spot.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              alignSelf: "flex-start",
              border: "1px solid rgba(255,255,255,0.16)",
              backgroundColor: "rgba(255,255,255,0.08)",
              color: "white",
              borderRadius: "14px",
              padding: "0.8rem 1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              cursor: "pointer",
            }}
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>

        {message && (
          <div style={{ marginBottom: "1rem", backgroundColor: "#DCFCE7", color: "#166534", padding: "1rem", borderRadius: "16px" }}>
            {message}
          </div>
        )}
        {error && (
          <div style={{ marginBottom: "1rem", backgroundColor: "#FEE2E2", color: "#991B1B", padding: "1rem", borderRadius: "16px" }}>
            {error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 340px) minmax(0, 1fr)", gap: "1.25rem" }}>
          <div style={{ backgroundColor: "white", borderRadius: "20px", padding: "1rem", border: "1px solid #CFE7E1" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#0F172A" }}>Assigned Issues</h2>
              {loading && <Loader2 size={16} className="animate-spin" />}
            </div>

            {loading && <p style={{ color: "#64748B", fontSize: "0.9rem" }}>Loading assignments...</p>}
            {!loading && issues.length === 0 && (
              <div style={{ backgroundColor: "#F8FAFC", padding: "1rem", borderRadius: "16px", color: "#475569" }}>
                No issues are currently assigned to this worker.
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {issues.map((issue) => {
                const active = issue.id === activeIssue?.id;
                const coords = issueCoordinates(issue);
                return (
                  <button
                    key={issue.id}
                    type="button"
                    onClick={() => setActiveIssueId(issue.id)}
                    style={{
                      border: active ? "2px solid #14B8A6" : "1px solid #E2E8F0",
                      backgroundColor: active ? "#F0FDFA" : "#FFFFFF",
                      borderRadius: "16px",
                      padding: "1rem",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontWeight: 700, color: "#0F172A", marginBottom: "0.25rem" }}>
                      {issue.title || issue.category || "Civic issue"}
                    </div>
                    <div style={{ fontSize: "0.84rem", color: "#475569", marginBottom: "0.4rem" }}>
                      {issue.description || "No description provided."}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#0F766E", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <MapPin size={14} />
                      {formatIssueAddress(issue)}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "#64748B", marginTop: "0.45rem" }}>
                      {Number.isFinite(coords.lat) && Number.isFinite(coords.lng)
                        ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
                        : "Coordinates unavailable"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ backgroundColor: "white", borderRadius: "20px", padding: "1.5rem", border: "1px solid #CFE7E1" }}>
            {!activeIssue ? (
              <div style={{ color: "#475569" }}>Select an issue to upload resolution proof.</div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                  <div>
                    <div style={{ fontSize: "0.8rem", color: "#0F766E", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      Field task
                    </div>
                    <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0F172A", marginTop: "0.2rem" }}>
                      {activeIssue.title || activeIssue.category || "Assigned issue"}
                    </h2>
                  </div>
                  <div style={{ backgroundColor: "#CCFBF1", color: "#115E59", padding: "0.65rem 0.9rem", borderRadius: "999px", fontWeight: 700 }}>
                    {String(activeIssue.status || "assigned").replace(/_/g, " ")}
                  </div>
                </div>

                <p style={{ color: "#334155", lineHeight: 1.6 }}>{activeIssue.description || "No description provided."}</p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginTop: "1rem", marginBottom: "1.2rem" }}>
                  <div style={{ backgroundColor: "#F8FAFC", borderRadius: "16px", padding: "1rem" }}>
                    <div style={{ color: "#64748B", fontSize: "0.75rem", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                      Reported Location
                    </div>
                    <div style={{ fontWeight: 700, color: "#0F172A" }}>{formatIssueAddress(activeIssue)}</div>
                  </div>
                  <div style={{ backgroundColor: "#F8FAFC", borderRadius: "16px", padding: "1rem" }}>
                    <div style={{ color: "#64748B", fontSize: "0.75rem", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                      Upload Rule
                    </div>
                    <div style={{ fontWeight: 700, color: "#0F172A" }}>Must be within 100m</div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
                  <div style={{ border: "1px solid #E2E8F0", borderRadius: "18px", overflow: "hidden", backgroundColor: "#F8FAFC" }}>
                    <div style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#0F172A" }}>Before</div>
                    {activeIssue.beforeImageUrl || activeIssue.beforeImage ? (
                      <img
                        src={activeIssue.beforeImageUrl || activeIssue.beforeImage}
                        alt="Before issue state"
                        style={{ width: "100%", height: "240px", objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{ height: "240px", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B" }}>
                        No before image uploaded
                      </div>
                    )}
                  </div>

                  <div style={{ border: "1px solid #E2E8F0", borderRadius: "18px", overflow: "hidden", backgroundColor: "#F8FAFC" }}>
                    <div style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#0F172A" }}>After preview</div>
                    {selectedFiles[activeIssue.id] ? (
                      <img
                        src={objectUrlsRef.current[activeIssue.id]}
                        alt="Selected after proof"
                        style={{ width: "100%", height: "240px", objectFit: "cover" }}
                      />
                    ) : activeIssue.afterImageUrl || activeIssue.afterImage ? (
                      <img
                        src={activeIssue.afterImageUrl || activeIssue.afterImage}
                        alt="After issue state"
                        style={{ width: "100%", height: "240px", objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{ height: "240px", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B" }}>
                        Choose an after image to continue
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ border: "1px dashed #94A3B8", borderRadius: "18px", padding: "1rem", backgroundColor: "#F8FAFC" }}>
                  <label style={{ display: "block", fontWeight: 700, color: "#0F172A", marginBottom: "0.6rem" }}>
                    Upload after image
                  </label>
                  <input
                    ref={(node) => {
                      fileInputRefs.current[activeIssue.id] = node;
                    }}
                    type="file"
                    accept="image/*"
                    onChange={(event) => handleFileChange(activeIssue.id, event.target.files?.[0] || null)}
                    style={{ display: "block", width: "100%" }}
                  />
                  <div style={{ marginTop: "0.75rem", fontSize: "0.82rem", color: "#475569", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <ShieldAlert size={15} />
                    GPS permission is required. If permission is denied or inaccurate, retry before submitting.
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1rem" }}>
                  <button
                    type="button"
                    onClick={() => handleResolveIssue(activeIssue)}
                    disabled={!selectedFiles[activeIssue.id] || submittingIssueId === activeIssue.id}
                    style={{
                      border: "none",
                      borderRadius: "14px",
                      padding: "0.9rem 1.1rem",
                      backgroundColor: !selectedFiles[activeIssue.id] ? "#94A3B8" : "#0F766E",
                      color: "white",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.55rem",
                      cursor: !selectedFiles[activeIssue.id] ? "not-allowed" : "pointer",
                    }}
                  >
                    {submittingIssueId === activeIssue.id ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                    Submit proof
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMessage("");
                      setError("");
                    }}
                    style={{
                      borderRadius: "14px",
                      padding: "0.9rem 1.1rem",
                      backgroundColor: "#E2E8F0",
                      color: "#0F172A",
                      fontWeight: 700,
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.55rem",
                      cursor: "pointer",
                    }}
                  >
                    <RefreshCw size={16} />
                    Clear message
                  </button>
                </div>

                {activeIssue.citizenVerification?.status === "pending" && (
                  <div style={{ marginTop: "1rem", backgroundColor: "#FEF3C7", color: "#92400E", padding: "1rem", borderRadius: "16px" }}>
                    Citizen confirmation will be requested automatically after proof submission.
                  </div>
                )}

                {activeIssue.citizenVerification?.status === "accepted" && (
                  <div style={{ marginTop: "1rem", backgroundColor: "#DCFCE7", color: "#166534", padding: "1rem", borderRadius: "16px", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <CheckCircle2 size={18} />
                    Citizen has already confirmed this resolution.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
