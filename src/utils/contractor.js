function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function getContractor(rawText) {
  const text = normalize(rawText);
  if (!text) {
    return pickFallbackContractor();
  }

  const priorityRoadMatches = [
    "bibwewadi-kondhwa road",
    "swami vivekanand road",
    "shri swami vivekanand marg",
    "bibwewadi main road",
    "pune-satara road",
    "katraj bypass road",
    "nh-65",
    "apaar market road",
    "upper indira nagar",
    "vit",
  ];

  const contractorForPriorityRoads = "PMC Tender (Contractor Not Public)";

  const hasExactOrBoundaryMatch = priorityRoadMatches.some((road) => {
    const normalizedRoad = normalize(road);
    if (!normalizedRoad) return false;
    if (text === normalizedRoad) return true;
    const escaped = normalizedRoad.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const boundaryRegex = new RegExp(`(^|\\s)${escaped}(\\s|$)`);
    return boundaryRegex.test(text);
  });

  if (hasExactOrBoundaryMatch) {
    return contractorForPriorityRoads;
  }

  return pickFallbackContractor();
}

function pickFallbackContractor() {
  const fallbackContractors = [
    "ABC Infra Pvt Ltd",
    "XYZ Constructions",
    "UrbanBuild Corp",
    "MetroWorks Ltd",
    "CivicLine Projects",
    "RoadFix Solutions",
  ];

  const pick = Math.floor(Math.random() * fallbackContractors.length);
  return fallbackContractors[pick];
}
