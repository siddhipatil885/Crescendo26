import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Loader2, Search } from "lucide-react";
import { subscribeToIssueByToken } from "../../services/issues";
import { selectNewestIssue } from "../../utils/issueTracking";

export default function TrackIssue({ initialToken = "" }) {
  const navigate = useNavigate();
  const sanitizedInitialToken = initialToken.trim();

  const [tokenInput, setTokenInput] = useState(sanitizedInitialToken);
  const [trackedToken, setTrackedToken] = useState(sanitizedInitialToken);
  const [searchVersion, setSearchVersion] = useState(() =>
    sanitizedInitialToken ? 1 : 0
  );
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(Boolean(sanitizedInitialToken));
  const [error, setError] = useState("");

  useEffect(() => {
    setTokenInput(sanitizedInitialToken);
    setTrackedToken(sanitizedInitialToken);
    setSearchVersion(sanitizedInitialToken ? 1 : 0);
    setIssue(null);
    setError("");
    setLoading(Boolean(sanitizedInitialToken));
  }, [sanitizedInitialToken]);

  useEffect(() => {
    if (!trackedToken || searchVersion === 0) {
      return undefined;
    }

    setLoading(true);
    setError("");
    setIssue(null);

    const unsubscribe = subscribeToIssueByToken(
      trackedToken,
      (matchingIssues) => {
        if (!matchingIssues.length) {
          setIssue(null);
          setError(`No issue found for token ID "${trackedToken}".`);
          setLoading(false);
          return;
        }

        const latestIssue = selectNewestIssue(matchingIssues);
        setIssue(latestIssue);
        setError("");
        setLoading(false);
      },
      (listenerError) => {
        console.error("TrackIssue preview listener error:", listenerError);
        setIssue(null);
        setError(
          "We could not load this issue right now. Please check the token ID and try again."
        );
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [trackedToken, searchVersion]);

  const handleTrackIssue = (event) => {
    event.preventDefault();

    const normalizedToken = tokenInput.trim();

    if (!normalizedToken) {
      setTrackedToken("");
      setIssue(null);
      setLoading(false);
      setError("Enter a valid token ID to start tracking your issue.");
      return;
    }

    setTrackedToken(normalizedToken);
    setSearchVersion((currentVersion) => currentVersion + 1);
  };

  const openTrackedIssue = () => {
    if (!issue?.tokenId) {
      return;
    }

    navigate(`/track/${encodeURIComponent(issue.tokenId)}`);
  };

  const handlePreviewKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openTrackedIssue();
    }
  };

  return (
    <div className="flex-col pb-6">
      <div className="mt-6 mb-6">
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            backgroundColor: "#EEF2FF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "1rem",
          }}
        >
          <Search color="#7C8FF0" size={28} />
        </div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: "700", color: "#1F2937" }}>
          Track Your Issue
        </h1>
        <p className="text-light text-sm mt-2" style={{ lineHeight: "1.5" }}>
          Enter your token ID to see real-time progress.
        </p>
      </div>

      <div
        style={{
          backgroundColor: "white",
          padding: "1.25rem",
          borderRadius: "16px",
          marginBottom: "1rem",
          border: "1px solid #E5E7EB",
        }}
      >
        <div
          style={{
            fontSize: "0.65rem",
            fontWeight: "700",
            color: "#6B7280",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            marginBottom: "0.75rem",
          }}
        >
          Search Complaint
        </div>

        <form className="flex-col gap-3" onSubmit={handleTrackIssue}>
          <label style={{ position: "relative" }}>
            <Search
              size={18}
              color="#9CA3AF"
              style={{
                position: "absolute",
                top: "50%",
                left: "14px",
                transform: "translateY(-50%)",
              }}
            />
            <input
              type="text"
              value={tokenInput}
              onChange={(event) => {
                setTokenInput(event.target.value);
                if (error) {
                  setError("");
                }
              }}
              placeholder="Enter token ID"
              autoComplete="off"
              aria-label="Token ID"
              style={{
                width: "100%",
                padding: "0.95rem 1rem 0.95rem 2.7rem",
                borderRadius: "12px",
                border: "1px solid #E5E7EB",
                fontSize: "0.95rem",
                outline: "none",
                color: "#1F2937",
                backgroundColor: "white",
              }}
            />
          </label>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Tracking...
              </>
            ) : (
              "Track Issue"
            )}
          </button>
        </form>

        {loading && (
          <div
            style={{
              backgroundColor: "white",
              padding: "1.25rem 0 0.25rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
            }}
          >
            <Loader2 size={28} color="#7C8FF0" className="animate-spin" />
            <p style={{ fontSize: "0.9rem", color: "#6B7280" }}>
              Fetching issue preview...
            </p>
          </div>
        )}
      </div>

      {!loading && issue && (
        <div
          onClick={openTrackedIssue}
          onKeyDown={handlePreviewKeyDown}
          role="button"
          tabIndex={0}
          style={{
            backgroundColor: "#EEF2FF",
            color: "#4C5FD5",
            padding: "1.25rem",
            borderRadius: "16px",
            marginBottom: "1rem",
            cursor: "pointer",
            boxShadow: "0 8px 20px rgba(124, 143, 240, 0.12)",
            border: "1px solid rgba(124, 143, 240, 0.1)",
          }}
        >
          <div className="flex-col gap-3">
            <div className="flex-row items-center gap-2" style={{ fontWeight: "600" }}>
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  backgroundColor: "#7C8FF0",
                  boxShadow: "0 0 0 6px rgba(124, 143, 240, 0.12)",
                }}
              />
              <span style={{ fontSize: "0.85rem" }}>Live Updates Enabled</span>
            </div>

            <code
              style={{
                fontSize: "0.95rem",
                fontWeight: "700",
                color: "#1F2937",
                wordBreak: "break-all",
              }}
            >
              {issue.tokenId}
            </code>

            <span style={{ fontSize: "0.8rem" }}>Last updated just now</span>
          </div>
        </div>
      )}

      {!loading && error && (
        <div
          style={{
            backgroundColor: "#FEE2E2",
            padding: "1rem",
            borderRadius: "16px",
            color: "#991B1B",
            marginBottom: "1rem",
            border: "1px solid #FECACA",
          }}
        >
          <div className="flex-row items-center gap-2 mb-2">
            <AlertCircle size={18} />
            <span style={{ fontSize: "0.9rem", fontWeight: "700" }}>
              Issue not found
            </span>
          </div>
          <p style={{ fontSize: "0.85rem", lineHeight: "1.5" }}>{error}</p>
        </div>
      )}
    </div>
  );
}
