import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MapPin,
  Ticket,
} from "lucide-react";
import MapView from "../../components/map/MapView";
import { subscribeToIssueByToken } from "../../services/issues";
import {
  mapIssue as mapTrackedIssue,
  resolveDateValue,
  selectNewestIssue,
} from "../../utils/issueTracking";
import { ISSUE_STATUS } from "../../utils/constants";

const STATUS_STEPS = [
  {
    key: ISSUE_STATUS.REPORTED,
    label: "Reported",
    caption: "Complaint logged",
    background: "#FFE4B5",
    color: "#B45309",
  },
  {
    key: "in_progress",
    label: "In Progress",
    caption: "Team assigned",
    background: "#BBC6FF",
    color: "#1E3A8A",
  },
  {
    key: "resolved",
    label: "Resolved",
    caption: "Fix completed",
    background: "#9EF0C2",
    color: "#047857",
  },
  {
    key: "verified",
    label: "Verified",
    caption: "Citizen confirmed",
    background: "#9EF0C2",
    color: "#047857",
  },
];

export default function TrackIssueDetails() {
  const { tokenId = "" } = useParams();
  const normalizedToken = tokenId.trim();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(Boolean(normalizedToken));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!normalizedToken) {
      setIssue(null);
      setLoading(false);
      setError("No token ID provided.");
      return undefined;
    }

    setLoading(true);
    setError("");
    setIssue(null);

    const unsubscribe = subscribeToIssueByToken(
      normalizedToken,
      (matchingIssues) => {
        if (!matchingIssues.length) {
          setIssue(null);
          setError(`No issue found for token ID "${normalizedToken}".`);
          setLoading(false);
          return;
        }

        const latestIssue = selectNewestIssue(matchingIssues, mapIssueDetails);
        setIssue(latestIssue);
        setError("");
        setLoading(false);
      },
      (listenerError) => {
        console.error("TrackIssueDetails listener error:", listenerError);
        setIssue(null);
        setError(
          "We could not load this issue right now. Please check the token ID and try again."
        );
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [normalizedToken]);

  if (loading) {
    return (
      <div className="flex-col items-center justify-center" style={{ height: "60vh" }}>
        <Loader2 size={32} color="#7C8FF0" className="animate-spin" />
        <p style={{ marginTop: "1rem", color: "#6B7280" }}>Loading issue details...</p>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div
        style={{
          backgroundColor: "#FEE2E2",
          padding: "1rem",
          borderRadius: "16px",
          color: "#991B1B",
          marginTop: "1.5rem",
          border: "1px solid #FECACA",
        }}
      >
        <div className="flex-row items-center gap-2 mb-2">
          <AlertCircle size={18} />
          <span style={{ fontSize: "0.9rem", fontWeight: "700" }}>
            Issue not found
          </span>
        </div>
        <p style={{ fontSize: "0.85rem", lineHeight: "1.5" }}>
          {error || "Issue not found"}
        </p>
      </div>
    );
  }

  const normalizedStatus = normalizeStatus(issue.status);
  const currentStepIndex = Math.max(
    STATUS_STEPS.findIndex((step) => step.key === normalizedStatus),
    0
  );
  const shouldShowAfterImage =
    Boolean(issue.imageAfter) &&
    (normalizedStatus === "resolved" || normalizedStatus === "verified");

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
          <Ticket color="#7C8FF0" size={28} />
        </div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: "700", color: "#1F2937" }}>
          Issue Workflow
        </h1>
        <p className="text-light text-sm mt-2" style={{ lineHeight: "1.5" }}>
          Live details for your tracked complaint.
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
        <div className="flex-row justify-between items-center mb-4">
          <div>
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
              Complaint Details
            </div>
            <div className="flex-row items-center gap-2">
              <Ticket size={18} color="#7C8FF0" />
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
            </div>
          </div>

          <span
            className={getStatusBadgeClass(normalizedStatus)}
            style={getStatusBadgeStyle(normalizedStatus)}
          >
            {formatStatusLabel(normalizedStatus).toUpperCase()}
          </span>
        </div>

        <div className="flex-col gap-4">
          <DetailRow label="Issue Type" value={issue.issueType} />
          <DetailRow label="Description" value={issue.description} />
          <DetailRow label="Location" value={issue.location} />
          <DetailRow label="Submitted Date" value={formatSubmittedDate(issue.timestamp)} />
        </div>

        <div
          style={{
            backgroundColor: "#EEF2FF",
            padding: "0.85rem 1rem",
            borderRadius: "14px",
            marginTop: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <CheckCircle2 size={18} color="#7C8FF0" />
          <div>
            <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "#1E3A8A" }}>
              Live Updates Enabled
            </div>
            <div style={{ fontSize: "0.75rem", color: "#4C5FD5" }}>
              Last updated just now
            </div>
          </div>
        </div>
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
            marginBottom: "1rem",
          }}
        >
          Status Timeline
        </div>

        <div style={{ overflowX: "auto", paddingBottom: "0.25rem" }}>
          <div className="flex-row items-start" style={{ minWidth: "320px" }}>
            {STATUS_STEPS.map((step, index) => {
              const isComplete = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;

              return (
                <div key={step.key} className="flex-row items-start" style={{ flex: 1 }}>
                  <div
                    className="flex-col items-center"
                    style={{ minWidth: "74px", textAlign: "center" }}
                  >
                    <div
                      style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: isComplete ? step.background : "white",
                        border: `2px solid ${isComplete ? step.color : "#E5E7EB"}`,
                        color: isComplete ? step.color : "#9CA3AF",
                        fontSize: "0.85rem",
                        fontWeight: "700",
                        transform: isCurrent ? "scale(1.08)" : "scale(1)",
                        boxShadow: isCurrent
                          ? "0 10px 18px rgba(124, 143, 240, 0.18)"
                          : "none",
                        transition: "all 0.25s ease",
                      }}
                    >
                      {index + 1}
                    </div>
                    <div
                      style={{
                        marginTop: "0.75rem",
                        fontSize: "0.7rem",
                        fontWeight: "700",
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        color: isComplete ? "#1F2937" : "#9CA3AF",
                        transition: "color 0.25s ease",
                      }}
                    >
                      {step.label}
                    </div>
                    <div
                      style={{
                        fontSize: "0.72rem",
                        color: isComplete ? "#6B7280" : "#9CA3AF",
                        marginTop: "0.3rem",
                        lineHeight: "1.35",
                        transition: "color 0.25s ease",
                      }}
                    >
                      {step.caption}
                    </div>
                  </div>

                  {index < STATUS_STEPS.length - 1 && (
                    <div
                      style={{
                        flex: 1,
                        height: "2px",
                        backgroundColor: index < currentStepIndex ? step.color : "#E5E7EB",
                        marginTop: "17px",
                        marginLeft: "0.5rem",
                        marginRight: "0.5rem",
                        transition: "background-color 0.25s ease",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
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
            marginBottom: "1rem",
          }}
        >
          Images
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <ImageCard
            title="Before Image"
            imageUrl={issue.imageBefore}
            badgeBackground="#991B1B"
          />

          {shouldShowAfterImage && (
            <ImageCard
              title="After Image"
              imageUrl={issue.imageAfter}
              badgeBackground="#047857"
            />
          )}
        </div>

        {!shouldShowAfterImage && (
          <p
            style={{
              marginTop: "0.9rem",
              fontSize: "0.8rem",
              color: "#6B7280",
              lineHeight: "1.45",
            }}
          >
            The after photo will appear here once the issue is resolved.
          </p>
        )}
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
            marginBottom: "1rem",
          }}
        >
          Location
        </div>
        <div style={{ height: "200px", backgroundColor: "#EEF2FF", borderRadius: "12px", overflow: "hidden", position: "relative" }}>
          {issue.lat != null && issue.lng != null ? (
            <MapView
              issues={[issue]}
              center={[issue.lat, issue.lng]}
              zoom={15}
              variant="compact"
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", height: "100%", alignItems: "center", justifyContent: "center", color: "#6B7280" }}>
              <MapPin size={28} color="#7C8FF0" style={{ marginBottom: "0.5rem" }} />
              <p style={{ fontSize: "0.8rem" }}>Location unmapped</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div
      style={{
        backgroundColor: "#F9FAFB",
        padding: "0.95rem 1rem",
        borderRadius: "14px",
      }}
    >
      <div
        style={{
          fontSize: "0.7rem",
          fontWeight: "700",
          color: "#6B7280",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          marginBottom: "0.35rem",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: "0.9rem", color: "#1F2937", lineHeight: "1.5" }}>
        {value}
      </div>
    </div>
  );
}

function ImageCard({ title, imageUrl, badgeBackground }) {
  return (
    <div
      style={{
        flex: 1,
        backgroundColor: "#EEF2F6",
        borderRadius: "16px",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "relative", height: "180px" }}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            className="flex-col items-center justify-center"
            style={{ height: "100%", color: "#6B7280" }}
          >
            <MapPin size={28} color="#7C8FF0" />
            <p style={{ marginTop: "0.5rem", fontSize: "0.8rem" }}>Image unavailable</p>
          </div>
        )}

        <div
          style={{
            position: "absolute",
            top: "12px",
            left: "12px",
            backgroundColor: badgeBackground,
            color: "white",
            padding: "4px 8px",
            borderRadius: "8px",
            fontSize: "0.65rem",
            fontWeight: "700",
            textTransform: "uppercase",
          }}
        >
          {title}
        </div>
      </div>
    </div>
  );
}

function mapIssueDetails(data) {
  const normalizedIssue = mapTrackedIssue(data);
  const normalizedStatus = String(data.status || "").trim().toLowerCase().replace(/\s+/g, "_");
  const locationLat = Number(data.location?.lat ?? data.lat);
  const locationLng = Number(data.location?.lng ?? data.lng);
  const statusSource =
    data.citizenVerification?.status === "accepted" || data.verified_by_citizen || data.verified_at
      ? "verified"
      : data.citizenVerification?.status === "rejected" || normalizedStatus === ISSUE_STATUS.ASSIGNED
        ? "in_progress"
        : data.status;

  return {
    ...normalizedIssue,
    status: normalizeStatus(statusSource),
    issueType: data.issue_type ?? data.category ?? "General Civic Issue",
    description:
      data.description ??
      data.ai_description ??
      "No description was provided for this issue.",
    location: data.location?.address ?? data.locationLabel ?? data.neighbourhood ?? "Location not provided",
    lat: Number.isFinite(locationLat) ? locationLat : null,
    lng: Number.isFinite(locationLng) ? locationLng : null,
    imageBefore:
      data.imageBefore ??
      data.beforeImage ??
      data.beforeImageUrl ??
      data.photo_url ??
      "",
    imageAfter:
      data.imageAfter ??
      data.afterImage ??
      data.afterImageUrl ??
      data.resolution_photo_url ??
      data.verification_photo_url ??
      "",
  };
}

function normalizeStatus(status) {
  if (!status) {
    return ISSUE_STATUS.REPORTED;
  }

  const normalizedStatus = String(status).trim().toLowerCase().replace(/\s+/g, "_");

  if (normalizedStatus === "open" || normalizedStatus === "pending") {
    return ISSUE_STATUS.REPORTED;
  }

  if (normalizedStatus === "review") {
    return "in_progress";
  }

  if (normalizedStatus === ISSUE_STATUS.ASSIGNED) {
    return "in_progress";
  }

  if (normalizedStatus === "completed") {
    return "resolved";
  }

  return normalizedStatus;
}

function formatStatusLabel(status) {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getStatusBadgeClass(status) {
  if (status === ISSUE_STATUS.REPORTED) {
    return "badge badge-pending";
  }

  if (status === "in_progress") {
    return "badge badge-review";
  }

  if (status === "resolved") {
    return "badge badge-resolved";
  }

  return "badge";
}

function getStatusBadgeStyle(status) {
  if (status === "verified") {
    return {
      backgroundColor: "#047857",
      color: "white",
    };
  }

  return undefined;
}

function formatSubmittedDate(timestamp) {
  const date = resolveDateValue(timestamp);

  if (!date) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
