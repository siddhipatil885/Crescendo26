const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const admin = require("firebase-admin");
const rateLimit = require("express-rate-limit");
const cors = require("cors");

dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const huggingFaceApiKey = process.env.HUGGINGFACE_API_KEY || process.env.VITE_HUGGINGFACE_API_KEY;
if (!apiKey) {
  console.error("Error: GEMINI_API_KEY is missing. Gemini classification will be skipped.");
}

const modelName = process.env.GEMINI_MODEL || "models/gemini-2.0-flash";
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const model = genAI ? genAI.getGenerativeModel({ model: modelName }) : null;
const huggingFaceModel = process.env.HUGGINGFACE_MODEL || process.env.VITE_HUGGINGFACE_MODEL || "google/vit-base-patch16-224";

const AI_CATEGORY_MAP = {
  "Roads & Infrastructure": [
    "Roads & Potholes",
    "Footpaths & Sidewalks",
    "Traffic Signals & Signs",
    "Road Markings & Speed Breakers",
    "Traffic Obstruction",
  ],
  "Sanitation & Public Health": [
    "Garbage & Waste",
    "Drainage & Sewage",
    "Public Toilets",
    "Dead Animals",
    "Pest Infestation",
    "Open Manholes / Safety Hazards",
  ],
  "Water & Utilities": [
    "Water Supply Issues",
    "Water Leakage / Pipeline Damage",
    "Flooding / Waterlogging",
  ],
  "Electrical Issues": [
    "Power Outage",
    "Streetlight Not Working",
    "Exposed / Hanging Wires",
    "Transformer Issues",
  ],
  "Illegal Activities & Violations": [
    "Illegal Banners / Hoardings",
    "Encroachments",
    "Unauthorized Construction",
    "Illegal Dumping",
  ],
  "Animal & Public Nuisance": [
    "Stray Animals",
  ],
  "General Civic Issues": [
    "Other",
  ],
};

const CIVIC_ISSUE_TYPES = [
  "Garbage / Waste Mismanagement",
  "Road Damage / Potholes",
  "Water Leakage / Drainage Issue",
  "Streetlight Failure",
  "Traffic Signal Issue",
  "Stray Animals",
  "Illegal Dumping",
  "Construction Hazard",
  "Public Safety Hazard",
  "Other",
];

const CIVIC_SEVERITIES = ["LOW", "MEDIUM", "HIGH"];

const CIVIC_ISSUE_TO_AI_CLASSIFICATION = {
  "Garbage / Waste Mismanagement": {
    category: "Sanitation & Public Health",
    subcategory: "Garbage & Waste",
  },
  "Road Damage / Potholes": {
    category: "Roads & Infrastructure",
    subcategory: "Roads & Potholes",
  },
  "Water Leakage / Drainage Issue": {
    category: "Water & Utilities",
    subcategory: "Water Leakage / Pipeline Damage",
  },
  "Streetlight Failure": {
    category: "Electrical Issues",
    subcategory: "Streetlight Not Working",
  },
  "Traffic Signal Issue": {
    category: "Roads & Infrastructure",
    subcategory: "Traffic Signals & Signs",
  },
  "Stray Animals": {
    category: "Animal & Public Nuisance",
    subcategory: "Stray Animals",
  },
  "Illegal Dumping": {
    category: "Illegal Activities & Violations",
    subcategory: "Illegal Dumping",
  },
  "Construction Hazard": {
    category: "Illegal Activities & Violations",
    subcategory: "Unauthorized Construction",
  },
  "Public Safety Hazard": {
    category: "Sanitation & Public Health",
    subcategory: "Open Manholes / Safety Hazards",
  },
  "Other": {
    category: "General Civic Issues",
    subcategory: "Other",
  },
};

const FINAL_FALLBACK_ANALYSIS = {
  issue_type: "",
  category: "",
  subcategory: "",
  description: "",
  severity: "",
  confidence: 0,
};

const IMAGE_KEYWORD_RULES = [
  { category: "Roads & Infrastructure", subcategory: "Roads & Potholes", keywords: ["pothole", "broken road", "damaged road", "road crack", "cracked road", "road surface", "collapsed road", "road damage"] },
  { category: "Roads & Infrastructure", subcategory: "Footpaths & Sidewalks", keywords: ["sidewalk", "footpath", "pavement", "walkway", "curb"] },
  { category: "Roads & Infrastructure", subcategory: "Traffic Signals & Signs", keywords: ["traffic signal", "traffic sign", "signboard", "stop sign", "signal post"] },
  { category: "Roads & Infrastructure", subcategory: "Road Markings & Speed Breakers", keywords: ["speed breaker", "speed bump", "zebra crossing", "road marking", "lane marking"] },
  { category: "Roads & Infrastructure", subcategory: "Traffic Obstruction", keywords: ["blocked road", "obstruction", "barricade", "debris", "fallen tree"] },
  { category: "Sanitation & Public Health", subcategory: "Garbage & Waste", keywords: ["garbage", "trash", "waste", "litter", "dumping", "plastic container", "food container", "discarded container", "trash bag"] },
  { category: "Sanitation & Public Health", subcategory: "Drainage & Sewage", keywords: ["sewage", "drain", "drainage", "overflow", "gutter"] },
  { category: "Sanitation & Public Health", subcategory: "Public Toilets", keywords: ["public toilet", "toilet block", "restroom"] },
  { category: "Sanitation & Public Health", subcategory: "Dead Animals", keywords: ["dead animal", "dead dog", "dead cow", "animal carcass"] },
  { category: "Sanitation & Public Health", subcategory: "Pest Infestation", keywords: ["rats", "rodent", "mosquito", "pest", "infestation"] },
  { category: "Sanitation & Public Health", subcategory: "Open Manholes / Safety Hazards", keywords: ["manhole", "open hole", "open drain", "safety hazard"] },
  { category: "Water & Utilities", subcategory: "Water Supply Issues", keywords: ["water supply", "dry tap", "no water"] },
  { category: "Water & Utilities", subcategory: "Water Leakage / Pipeline Damage", keywords: ["water leak", "pipeline", "burst pipe", "leaking pipe"] },
  { category: "Water & Utilities", subcategory: "Flooding / Waterlogging", keywords: ["flood", "waterlogging", "standing water", "waterlogged", "flooded", "water on road"] },
  { category: "Electrical Issues", subcategory: "Power Outage", keywords: ["power outage", "electricity outage", "power cut"] },
  { category: "Electrical Issues", subcategory: "Streetlight Not Working", keywords: ["streetlight", "street light", "light pole", "broken light", "lamp post"] },
  { category: "Electrical Issues", subcategory: "Exposed / Hanging Wires", keywords: ["wire", "wires", "cable", "hanging wire", "exposed wire"] },
  { category: "Electrical Issues", subcategory: "Transformer Issues", keywords: ["transformer", "electric box", "substation"] },
  { category: "Illegal Activities & Violations", subcategory: "Illegal Banners / Hoardings", keywords: ["banner", "hoarding", "poster"] },
  { category: "Illegal Activities & Violations", subcategory: "Encroachments", keywords: ["encroachment", "encroached", "stall on road", "blocked footpath"] },
  { category: "Illegal Activities & Violations", subcategory: "Unauthorized Construction", keywords: ["construction", "unauthorized construction", "illegal construction"] },
  { category: "Illegal Activities & Violations", subcategory: "Illegal Dumping", keywords: ["illegal dumping", "dumped debris", "construction waste"] },
];

try {
  // Prefer local service account file if present (keeps setup simple).
  // If you want env-based creds instead, replace this block with JSON parsing.
  const serviceAccount = require("./serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} catch (error) {
  console.warn(
    "Warning: serviceAccountKey.json not found or invalid. Falling back to default credentials.",
    error.message
  );
  admin.initializeApp();
}

const db = admin.firestore();

function normalizeSpaces(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function cleanDescription(text) {
  return normalizeSpaces(
    String(text || "")
      .replace(/\b(?:this image shows|the image shows|the uploaded photo appears to show|the uploaded photo shows|visible issue|reported near|please review|appears to show|appears|seems to show|looks like)\b/gi, "")
      .replace(/\b(?:near|at|in|on)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}\b/g, "")
      .replace(/[.]{2,}/g, ".")
      .replace(/\s+([,.])/g, "$1")
  );
}

const NOISY_IMAGE_LABELS = new Set([
  "road",
  "street",
  "highway",
  "outdoor",
  "outdoors",
  "urban area",
  "vehicle",
  "vehicles",
  "car",
  "cars",
  "truck",
  "trucks",
  "wheel",
  "wheels",
  "person",
  "people",
  "pedestrian",
  "pedestrians",
  "building",
  "buildings",
  "sky",
]);

function sanitizeLabelList(text) {
  return Array.from(
    new Set(
      String(text || "")
        .split(",")
        .map((part) => normalizeSpaces(part).toLowerCase())
        .filter(Boolean)
        .filter((label) => !NOISY_IMAGE_LABELS.has(label))
        .filter((label) => ![
          "forklift",
          "trailer truck",
          "tractor trailer",
          "trucking rig",
          "rig",
          "articulated lorry",
          "semi",
        ].includes(label))
    )
  );
}

function safeParseJson(text) {
  const jsonStr = String(text || "").replace(/```json/g, "").replace(/```/g, "").trim();

  try {
    return JSON.parse(jsonStr);
  } catch (error) {
    const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      return JSON.parse(objectMatch[0]);
    }
    throw error;
  }
}

function buildCategoryList() {
  return Object.entries(AI_CATEGORY_MAP)
    .map(([category, subcategories]) => `- ${category}: ${subcategories.join(", ")}`)
    .join("\n");
}

function buildIssueTypeList() {
  return CIVIC_ISSUE_TYPES.map((issueType) => `- ${issueType}`).join("\n");
}

function isValidImageClassification(category, subcategory) {
  return Boolean(category && subcategory && AI_CATEGORY_MAP[category]?.includes(subcategory));
}

function normalizeIssueType(value) {
  const normalized = normalizeSpaces(value).toLowerCase();
  if (!normalized) {
    return "";
  }

  const exactMatch = CIVIC_ISSUE_TYPES.find((issueType) => issueType.toLowerCase() === normalized);
  if (exactMatch) {
    return exactMatch;
  }

  if (normalized.includes("garbage") || normalized.includes("waste")) return "Garbage / Waste Mismanagement";
  if (normalized.includes("pothole") || normalized.includes("road damage")) return "Road Damage / Potholes";
  if (normalized.includes("water") || normalized.includes("drain")) return "Water Leakage / Drainage Issue";
  if (normalized.includes("streetlight") || normalized.includes("street light")) return "Streetlight Failure";
  if (normalized.includes("traffic signal")) return "Traffic Signal Issue";
  if (normalized.includes("animal")) return "Stray Animals";
  if (normalized.includes("illegal dumping")) return "Illegal Dumping";
  if (normalized.includes("construction")) return "Construction Hazard";
  if (normalized.includes("hazard") || normalized.includes("safety")) return "Public Safety Hazard";
  if (normalized.includes("other")) return "Other";

  return "";
}

function normalizeSeverity(value) {
  const normalized = normalizeSpaces(value).toUpperCase();
  return CIVIC_SEVERITIES.includes(normalized) ? normalized : "";
}

function getIssueTypeFromClassification(category, subcategory) {
  const key = `${category}::${subcategory}`;
  const issueTypeMap = {
    "Sanitation & Public Health::Garbage & Waste": "Garbage / Waste Mismanagement",
    "Roads & Infrastructure::Roads & Potholes": "Road Damage / Potholes",
    "Water & Utilities::Water Leakage / Pipeline Damage": "Water Leakage / Drainage Issue",
    "Water & Utilities::Flooding / Waterlogging": "Water Leakage / Drainage Issue",
    "Sanitation & Public Health::Drainage & Sewage": "Water Leakage / Drainage Issue",
    "Electrical Issues::Streetlight Not Working": "Streetlight Failure",
    "Roads & Infrastructure::Traffic Signals & Signs": "Traffic Signal Issue",
    "Animal & Public Nuisance::Stray Animals": "Stray Animals",
    "Illegal Activities & Violations::Illegal Dumping": "Illegal Dumping",
    "Illegal Activities & Violations::Unauthorized Construction": "Construction Hazard",
    "Sanitation & Public Health::Open Manholes / Safety Hazards": "Public Safety Hazard",
    "Electrical Issues::Exposed / Hanging Wires": "Public Safety Hazard",
    "Roads & Infrastructure::Traffic Obstruction": "Public Safety Hazard",
    "General Civic Issues::Other": "Other",
  };

  return issueTypeMap[key] || "Other";
}

function clampConfidence(value, fallback = 0.5) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(0, Math.min(1, parsed));
}

function inferSeverity(issueType, description) {
  const text = normalizeSpaces(description).toLowerCase();
  const highSignals = [
    "blocking road",
    "blocking traffic",
    "blocked road",
    "open manhole",
    "uncovered drain",
    "exposed wire",
    "hanging wire",
    "electrical hazard",
    "shock hazard",
    "flood",
    "waterlogged",
    "overflow",
    "urgent",
    "danger",
    "hazard",
    "unsafe",
    "accident",
    "collapsed",
  ];
  const lowSignals = [
    "minor",
    "small",
    "slight",
    "limited",
    "single streetlight",
  ];

  if (highSignals.some((signal) => text.includes(signal))) {
    return "HIGH";
  }

  if (lowSignals.some((signal) => text.includes(signal))) {
    return "LOW";
  }

  const defaults = {
    "Garbage / Waste Mismanagement": "MEDIUM",
    "Road Damage / Potholes": "MEDIUM",
    "Water Leakage / Drainage Issue": "MEDIUM",
    "Streetlight Failure": "MEDIUM",
    "Traffic Signal Issue": "HIGH",
    "Stray Animals": "MEDIUM",
    "Illegal Dumping": "MEDIUM",
    "Construction Hazard": "HIGH",
    "Public Safety Hazard": "HIGH",
    "Other": "LOW",
  };

  return defaults[issueType] || "MEDIUM";
}

function resolveClassificationForIssueType(issueType, description) {
  const base = CIVIC_ISSUE_TO_AI_CLASSIFICATION[issueType] || CIVIC_ISSUE_TO_AI_CLASSIFICATION.Other;
  const text = normalizeSpaces(description).toLowerCase();

  if (issueType === "Water Leakage / Drainage Issue") {
    if (/(flood|flooding|waterlog|standing water|water on road|waterlogged)/i.test(text)) {
      return {
        category: "Water & Utilities",
        subcategory: "Flooding / Waterlogging",
      };
    }

    if (/(drain|drainage|sewage|gutter|overflow|overflowing|clogged)/i.test(text)) {
      return {
        category: "Sanitation & Public Health",
        subcategory: "Drainage & Sewage",
      };
    }
  }

  if (issueType === "Public Safety Hazard") {
    if (/(wire|wires|cable|electrical|electric)/i.test(text)) {
      return {
        category: "Electrical Issues",
        subcategory: "Exposed / Hanging Wires",
      };
    }

    if (/(blocked road|obstruction|barricade|fallen tree|debris on road)/i.test(text)) {
      return {
        category: "Roads & Infrastructure",
        subcategory: "Traffic Obstruction",
      };
    }
  }

  return base;
}

function countWords(text) {
  return normalizeSpaces(text).split(" ").filter(Boolean).length;
}

function ensureSentence(text) {
  const normalized = normalizeSpaces(text);
  if (!normalized) {
    return "";
  }
  return /[.!?]$/.test(normalized) ? normalized : `${normalized}.`;
}

function isWeakDescription(text) {
  const normalized = normalizeSpaces(text).toLowerCase();
  if (!normalized) {
    return true;
  }

  const vaguePhrases = [
    "needs attention",
    "needs repair",
    "requires attention",
    "requires repair",
    "affected area",
    "surrounding area",
    "safe use of the area",
    "restore safe use",
    "further disruption",
    "public issue",
    "civic issue",
    "visible condition",
  ];

  return vaguePhrases.some((phrase) => normalized.includes(phrase));
}

function looksLikeLabelList(text) {
  const normalized = normalizeSpaces(text);
  return Boolean(normalized) && !/[.!?]/.test(normalized) && normalized.includes(",");
}

function formatLabelPhrase(labels) {
  const items = labels.slice(0, 3);
  if (items.length === 0) {
    return "";
  }
  if (items.length === 1) {
    return items[0];
  }
  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }
  return `${items[0]}, ${items[1]}, and ${items[2]}`;
}

function buildTemplateDescription(category, subcategory, labels = []) {
  const labelPhrase = formatLabelPhrase(labels);
  const withLabels = (sentence, fallbackSentence) => labelPhrase ? sentence : fallbackSentence;

  const templates = {
    "Roads & Infrastructure::Roads & Potholes": withLabels(
      `Road surface damage around ${labelPhrase} is creating an uneven stretch that should be patched quickly to prevent crashes, tyre damage, and further breakup of the carriageway.`,
      "A damaged road surface is creating an uneven stretch that should be patched quickly to prevent crashes, tyre damage, and further breakup of the carriageway."
    ),
    "Roads & Infrastructure::Footpaths & Sidewalks": withLabels(
      `The footpath around ${labelPhrase} appears damaged or obstructed, making pedestrian movement unsafe and requiring repair or clearing so people can pass without stepping into the road.`,
      "The footpath appears damaged or obstructed, making pedestrian movement unsafe and requiring repair or clearing so people can pass without stepping into the road."
    ),
    "Roads & Infrastructure::Traffic Signals & Signs": withLabels(
      `Traffic control equipment around ${labelPhrase} appears damaged or unclear, which can confuse road users and should be repaired promptly to keep junction movement safe.`,
      "Traffic control equipment appears damaged or unclear, which can confuse road users and should be repaired promptly to keep junction movement safe."
    ),
    "Roads & Infrastructure::Road Markings & Speed Breakers": withLabels(
      `Road markings or traffic calming elements around ${labelPhrase} look faded or damaged, reducing guidance for drivers and pedestrians and needing maintenance before safety drops further.`,
      "Road markings or traffic calming elements look faded or damaged, reducing guidance for drivers and pedestrians and needing maintenance before safety drops further."
    ),
    "Roads & Infrastructure::Traffic Obstruction": withLabels(
      `An obstruction involving ${labelPhrase} is blocking normal movement on the road or footpath and should be removed to restore safe public access.`,
      "An obstruction is blocking normal movement on the road or footpath and should be removed to restore safe public access."
    ),
    "Sanitation & Public Health::Garbage & Waste": withLabels(
      `Loose waste such as ${labelPhrase} has accumulated in the public area and should be cleared to prevent foul smell, pests, and repeat dumping.`,
      "Loose waste has accumulated in the public area and should be cleared to prevent foul smell, pests, and repeat dumping."
    ),
    "Sanitation & Public Health::Drainage & Sewage": withLabels(
      `Drainage features around ${labelPhrase} look blocked or overflowing, which can spread dirty water and should be cleaned before the overflow worsens.`,
      "Drainage features look blocked or overflowing, which can spread dirty water and should be cleaned before the overflow worsens."
    ),
    "Sanitation & Public Health::Public Toilets": withLabels(
      `The public toilet facility around ${labelPhrase} appears poorly maintained and should be cleaned or repaired so it remains hygienic and usable.`,
      "The public toilet facility appears poorly maintained and should be cleaned or repaired so it remains hygienic and usable."
    ),
    "Sanitation & Public Health::Dead Animals": withLabels(
      `Animal remains near ${labelPhrase} need urgent removal to prevent foul smell, contamination, and public health risk in the surrounding area.`,
      "Animal remains need urgent removal to prevent foul smell, contamination, and public health risk in the surrounding area."
    ),
    "Sanitation & Public Health::Pest Infestation": withLabels(
      `Signs of pests around ${labelPhrase} suggest an infestation risk that needs sanitation action before it spreads to nearby homes or shops.`,
      "Signs of pests suggest an infestation risk that needs sanitation action before it spreads to nearby homes or shops."
    ),
    "Sanitation & Public Health::Open Manholes / Safety Hazards": withLabels(
      `An open manhole or uncovered drain near ${labelPhrase} creates an immediate fall hazard and needs barricading and a proper cover without delay.`,
      "An open manhole or uncovered drain creates an immediate fall hazard and needs barricading and a proper cover without delay."
    ),
    "Water & Utilities::Water Supply Issues": withLabels(
      `Water service infrastructure around ${labelPhrase} appears affected, and the supply issue should be inspected so nearby residents regain normal access.`,
      "Water service infrastructure appears affected, and the supply issue should be inspected so nearby residents regain normal access."
    ),
    "Water & Utilities::Water Leakage / Pipeline Damage": withLabels(
      `A leak around ${labelPhrase} suggests pipeline damage, and repairs are needed quickly to stop water loss, surface weakening, and repeated seepage.`,
      "A visible leak suggests pipeline damage, and repairs are needed quickly to stop water loss, surface weakening, and repeated seepage."
    ),
    "Water & Utilities::Flooding / Waterlogging": withLabels(
      `Water has collected around ${labelPhrase}, reducing safe movement for pedestrians and vehicles and requiring drainage clearance before the water spreads further.`,
      "Water has collected in the area, reducing safe movement for pedestrians and vehicles and requiring drainage clearance before the water spreads further."
    ),
    "Electrical Issues::Power Outage": withLabels(
      `Electrical infrastructure around ${labelPhrase} appears affected, and the reported outage should be checked urgently to restore safe service.`,
      "Electrical infrastructure appears affected, and the reported outage should be checked urgently to restore safe service."
    ),
    "Electrical Issues::Streetlight Not Working": withLabels(
      `The streetlight infrastructure around ${labelPhrase} looks unlit or faulty, reducing visibility after dark and needing prompt repair for safer movement.`,
      "The streetlight infrastructure looks unlit or faulty, reducing visibility after dark and needing prompt repair for safer movement."
    ),
    "Electrical Issues::Exposed / Hanging Wires": withLabels(
      `Electrical wires near ${labelPhrase} appear exposed or loosely hanging, creating a shock hazard that needs urgent inspection and securing.`,
      "Electrical wires appear exposed or loosely hanging, creating a shock hazard that needs urgent inspection and securing."
    ),
    "Electrical Issues::Transformer Issues": withLabels(
      `The transformer or electrical box near ${labelPhrase} appears unsafe or damaged and needs inspection before it causes a wider electrical hazard.`,
      "The transformer or electrical box appears unsafe or damaged and needs inspection before it causes a wider electrical hazard."
    ),
    "Illegal Activities & Violations::Illegal Banners / Hoardings": withLabels(
      `A banner or hoarding attached around ${labelPhrase} appears to obstruct public space or signage and should be removed if unauthorized.`,
      "A banner or hoarding appears to obstruct public space or signage and should be removed if unauthorized."
    ),
    "Illegal Activities & Violations::Encroachments": withLabels(
      `Structures or stored items around ${labelPhrase} appear to encroach on public access, reducing usable road or footpath space and requiring clearance.`,
      "Structures or stored items appear to encroach on public access, reducing usable road or footpath space and requiring clearance."
    ),
    "Illegal Activities & Violations::Unauthorized Construction": withLabels(
      `Ongoing structural work around ${labelPhrase} appears inconsistent with normal public use and should be inspected for authorization and safety compliance.`,
      "Ongoing structural work appears inconsistent with normal public use and should be inspected for authorization and safety compliance."
    ),
    "Illegal Activities & Violations::Illegal Dumping": withLabels(
      `Discarded debris around ${labelPhrase} suggests illegal dumping, and the material should be cleared to prevent obstruction, smell, and repeat dumping.`,
      "Discarded debris suggests illegal dumping, and the material should be cleared to prevent obstruction, smell, and repeat dumping."
    ),
    "Animal & Public Nuisance::Stray Animals": withLabels(
      `Stray animals near ${labelPhrase} are occupying a public area and may create fear, obstruction, or bite risk for pedestrians and nearby residents.`,
      "Stray animals are occupying a public area and may create fear, obstruction, or bite risk for pedestrians and nearby residents."
    ),
    "General Civic Issues::Other": withLabels(
      `A civic problem involving ${labelPhrase} appears to be affecting normal public use of the area and should be inspected by the municipal team.`,
      "A civic problem appears to be affecting normal public use of the area and should be inspected by the municipal team."
    ),
  };

  return ensureSentence(templates[`${category}::${subcategory}`] || "");
}

function buildDescription(text, category, subcategory, labelHint = "") {
  const cleanedText = cleanDescription(text);
  const labelList = sanitizeLabelList(labelHint || text);
  const cropped = cleanedText.split(" ").filter(Boolean).slice(0, 40).join(" ");

  if (countWords(cropped) >= 8 && !looksLikeLabelList(cropped) && !isWeakDescription(cropped)) {
    return ensureSentence(cropped);
  }

  return buildTemplateDescription(category, subcategory, labelList);
}

function normalizeImageAnalysis(category, subcategory, description, confidence, issueType, severity, labelHint = "") {
  const normalizedIssueType = normalizeIssueType(issueType) || getIssueTypeFromClassification(category, subcategory);
  const normalizedDescription = buildDescription(description, category, subcategory, labelHint);
  const normalizedSeverity = normalizeSeverity(severity) || inferSeverity(normalizedIssueType, normalizedDescription);

  return {
    issue_type: normalizedIssueType,
    category,
    subcategory,
    description: normalizedDescription,
    severity: normalizedSeverity,
    confidence: clampConfidence(confidence, 0.6),
  };
}

function normalizeCivicIssueAnalysis(payload, labels = [], confidence = 0.72) {
  const issueType = normalizeIssueType(payload?.issue_type);
  if (!issueType) {
    throw new Error("AI returned an invalid civic issue type.");
  }

  const classification = resolveClassificationForIssueType(issueType, payload?.description || labels.join(", "));
  if (!isValidImageClassification(classification.category, classification.subcategory)) {
    throw new Error("Resolved AI classification is invalid.");
  }

  return normalizeImageAnalysis(
    classification.category,
    classification.subcategory,
    payload?.description || labels.join(", "),
    confidence,
    issueType,
    payload?.severity,
    labels.join(", ")
  );
}

function classifyCaption(caption) {
  const text = normalizeSpaces(caption).toLowerCase();
  const matchedRule = IMAGE_KEYWORD_RULES.find((rule) => rule.keywords.some((keyword) => text.includes(keyword)));

  if (!matchedRule) {
    return FINAL_FALLBACK_ANALYSIS;
  }

  return normalizeImageAnalysis(matchedRule.category, matchedRule.subcategory, caption, 0.65);
}

function withTimeout(promise, ms, message) {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(message)), ms)
  );
  return Promise.race([promise, timeoutPromise]);
}

async function analyzeImageWithGemini(imageBase64, mimeType) {
  if (!model) {
    throw new Error("Gemini image analysis is not configured.");
  }

  const prompt = `You are an AI Civic Issue Classification Engine for a smart city platform called CIVIX.

Your job is to convert what is visible in a citizen-uploaded image into a SINGLE, clear, real-world civic issue report.

You MUST NOT list objects. You MUST interpret the situation like a human civic inspector.

Return ONLY valid JSON in this exact format:
{
  "issue_type": "",
  "description": "",
  "severity": ""
}

Rules:
- Understand the civic context and focus on the real complaint a citizen would file.
- Classify into exactly one issue type from the approved list.
- Description must be 1 or 2 sentences total.
- Description must state what is wrong, a general public context, and why it matters.
- Do not mention location names, addresses, or landmarks.
- Do not say "image shows", "appears to show", or list objects.
- Be confident and decisive.
- Use "Other" only if no approved issue type fits.

Allowed issue types:
${buildIssueTypeList()}

Allowed severity values:
- LOW
- MEDIUM
- HIGH`;

  const generatePromise = model.generateContent([
    prompt,
    {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType || "image/jpeg",
      },
    },
  ]);

  const result = await withTimeout(generatePromise, 30000, "Gemini image analysis timed out");

  const parsed = safeParseJson(result.response.text());
  return normalizeCivicIssueAnalysis(parsed, [], 0.84);
}

async function interpretDetectedObjectsWithGemini(labels) {
  if (!model) {
    throw new Error("Gemini label interpretation is not configured.");
  }

  const prompt = `You are an AI Civic Issue Classification Engine for a smart city platform called CIVIX.

Your job is to convert raw object detection outputs from images into a SINGLE, clear, real-world civic issue report.

You MUST NOT list objects. You MUST interpret the situation like a human civic inspector.

INPUT:
${JSON.stringify(labels)}

YOUR TASK:
- Identify what is actually happening in the scene.
- Focus on the civic problem, not the objects.
- Think like a citizen complaint and choose one issue type only.
- If many similar objects suggest buildup, assume accumulation.
- If objects seem scattered, assume littering.
- If the condition likely blocks the road or creates immediate danger, use HIGH severity.

OUTPUT FORMAT (STRICT JSON):
{
  "issue_type": "",
  "description": "",
  "severity": ""
}

Allowed issue types:
${buildIssueTypeList()}

Allowed severity values:
- LOW
- MEDIUM
- HIGH

Rules:
- Do not repeat or list the detected objects.
- Do not say "image shows".
- Do not output multiple issues.
- Be decisive and civic-minded.`;

  const result = await model.generateContent(prompt);
  const parsed = safeParseJson(result.response.text());
  return normalizeCivicIssueAnalysis(parsed, labels, 0.74);
}

async function analyzeImageWithHuggingFace(imageBase64, mimeType) {
  if (!huggingFaceApiKey) {
    throw new Error("HuggingFace image analysis is not configured.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  let response;
  try {
    response = await fetch(`https://router.huggingface.co/hf-inference/models/${huggingFaceModel}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${huggingFaceApiKey}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: imageBase64,
        parameters: {
          top_k: 5,
        },
      }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("HuggingFace image classification timed out.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HuggingFace image classification failed: ${errorText || response.status}`);
  }

  const payload = await response.json();
  const labels = Array.isArray(payload)
    ? payload
        .map((item) => item?.label)
        .filter(Boolean)
        .slice(0, 5)
    : [];

  if (labels.length === 0) {
    throw new Error("HuggingFace did not return image classification labels.");
  }

  if (model) {
    try {
      return await interpretDetectedObjectsWithGemini(labels);
    } catch (error) {
      console.error("Gemini label interpretation failed. Using keyword fallback.", error.message);
    }
  }

  return classifyCaption(labels.join(", "));
}

// Middleware: Authenticate Firebase ID Token
async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// Middleware: Authorize user role/scope
function authorizeUser(req, res, next) {
  // For now, allow any authenticated user
  // In production, you might check for specific roles/claims
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// Middleware: Request logging
function requestLogger(req, res, next) {
  const timestamp = new Date().toISOString();
  const userId = req.user?.uid || 'unauthenticated';
  console.log(`[${timestamp}] ${req.method} ${req.path} - User: ${userId} - IP: ${req.ip}`);
  next();
}

// Rate limiting: 100 requests per 15 minutes per user
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: (req) => req.user?.uid || req.ip, // Use user ID if authenticated, otherwise IP
  message: {
    error: 'Too many requests from this user, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

function getDepartmentByCategory(category) {
  const map = {
    Pothole: "Roads",
    Garbage: "Sanitation",
    "Stray Animal": "Animal Control",
    Streetlight: "Electrical",
    "Water Leakage": "Water",
  };

  return map[category] || "General";
}

function getContractor(rawText) {
  const normalize = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .replace(/\s+/g, " ");

  const text = normalize(rawText);

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

  return "Unassigned";
}

function fallbackClassify(rawText) {
  const text = (rawText || "").toLowerCase();

  let category = "Other";
  let priority = "Medium";

  if (text.includes("pothole") || text.includes("road broken")) {
    category = "Pothole";
    priority = "High";
  } else if (text.includes("garbage") || text.includes("trash")) {
    category = "Garbage";
  } else if (
    text.includes("dog") ||
    text.includes("cow") ||
    text.includes("animal")
  ) {
    category = "Stray Animal";
    priority = "High";
  } else if (text.includes("light") || text.includes("streetlight")) {
    category = "Streetlight";
  } else if (text.includes("water") || text.includes("leak")) {
    category = "Water Leakage";
  }

  return {
    category,
    department: getDepartmentByCategory(category),
    priority,
    confidence: 0.9,
  };
}

async function classifyText(text) {
  const fallbackResult = fallbackClassify(text);

  if (!model) {
    return fallbackResult;
  }

  try {
    const prompt = `
You are classifying civic complaints.
Return ONLY valid JSON.
Do not add explanation, markdown, or extra text.
Use this exact format:
{"category":"...","priority":"..."}

Allowed categories: Pothole, Garbage, Stray Animal, Streetlight, Water Leakage, Other.
Priority rules:
- High: dangerous, urgent, accidents
- Medium: normal issues
- Low: minor issues

Complaint: "${text}"
`;

    const result = await model.generateContent(prompt);
    const reply = result.response.text().trim();
    let parsed;

    try {
      const cleaned = reply.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      console.error(
        "Gemini returned invalid JSON. Using parse fallback.",
        parseError.message
      );
      return fallbackResult;
    }

    const allowedCategories = new Set([
      "Pothole",
      "Garbage",
      "Stray Animal",
      "Streetlight",
      "Water Leakage",
      "Other",
    ]);
    const allowedPriorities = new Set(["High", "Medium", "Low"]);

    const category = allowedCategories.has(parsed?.category)
      ? parsed.category
      : fallbackResult.category;
    const priority = allowedPriorities.has(parsed?.priority)
      ? parsed.priority
      : fallbackResult.priority;

    return {
      category,
      department: getDepartmentByCategory(category),
      priority,
      confidence: 0.9,
    };
  } catch (error) {
    console.error("Gemini classification failed. Using fallback.", error.message);
    return fallbackResult;
  }
}

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
}));

app.use(express.json({ limit: "15mb" }));

// Apply rate limiting to all routes
app.use(limiter);

// Apply authentication and logging to protected routes
const protectedRoutes = express.Router();
protectedRoutes.use(authenticateToken);
protectedRoutes.use(authorizeUser);
protectedRoutes.use(requestLogger);

// Stricter rate limiting for AI image analysis
const analyzeImageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.user?.uid || req.ip,
  message: { error: "Too many image analysis requests from this user, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.post("/analyze-image", analyzeImageLimiter, async (req, res) => {
  const imageBase64 = req.body?.imageBase64;
  const mimeType = req.body?.mimeType;

  if (!imageBase64 || typeof imageBase64 !== "string") {
    return res.status(400).json({ error: "Please provide imageBase64 as a string." });
  }

  // Strict payload size enforcement before expensive processing
  // 10MB Base64 string = ~7.5MB raw image data
  if (Buffer.byteLength(imageBase64, "utf8") > 11 * 1024 * 1024) {
    return res.status(413).json({ error: "Image payload exceeds maximum allowed size." });
  }

  try {
    const geminiResult = await analyzeImageWithGemini(imageBase64, mimeType);
    return res.json(geminiResult);
  } catch (error) {
    console.error("Gemini image analysis failed:", error.message);
  }

  try {
    const huggingFaceResult = await analyzeImageWithHuggingFace(imageBase64, mimeType);
    return res.json(huggingFaceResult);
  } catch (error) {
    console.error("HuggingFace image analysis failed:", error.message);
  }

  return res.json(FINAL_FALLBACK_ANALYSIS);
});

// Protected route: /classify
protectedRoutes.post("/classify", async (req, res) => {
  const text = req.body?.text;
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Please provide text as a string." });
  }

  try {
    const result = await classifyText(text);
    return res.json(result);
  } catch (error) {
    console.error("Classification failed.", error.message);
    return res.status(500).json({ error: "Failed to classify text." });
  }
});

// Protected route: /report-issue
protectedRoutes.post("/report-issue", async (req, res) => {
  const text = req.body?.text;
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Please provide text as a string." });
  }

  try {
    const classification = await classifyText(text);
    const contractor = getContractor(text);
    const createdAt = admin.firestore.Timestamp.now();
    const deadline = admin.firestore.Timestamp.fromMillis(
      createdAt.toMillis() + 7 * 24 * 60 * 60 * 1000
    );

    const docRef = await db.collection("issues").add({
      text,
      category: classification.category,
      department: classification.department,
      priority: classification.priority,
      confidence: classification.confidence,
      contractor,
      userId: req.user.uid, // Track which user created the issue
      createdAt,
      deadline,
      status: "Pending",
      beforeImage: null,
      afterImage: null,
    });

    const snap = await docRef.get();
    return res.json({ id: docRef.id, ...snap.data() });
  } catch (error) {
    console.error("Failed to report issue:", error.message);
    return res.status(500).json({ error: "Failed to report issue." });
  }
});

function computeEscalationStatus(createdAt, currentStatus) {
  const resolved = ["resolved", "completed", "verified"];
  if (currentStatus && resolved.includes(currentStatus.toLowerCase())) {
    return "Resolved";
  }

  if (!createdAt) {
    return currentStatus || "Pending";
  }

  const createdDate = createdAt?.toDate ? createdAt.toDate() : new Date(createdAt);
  const elapsedDays = (Date.now() - createdDate.getTime()) / (24 * 60 * 60 * 1000);

  if (elapsedDays >= 7) return "Escalated to MLA";
  if (elapsedDays >= 5) return "RTI Generated";
  if (elapsedDays >= 2) return "In Progress";
  return "Pending";
}

// Protected route: /update-status/:id
protectedRoutes.patch("/update-status/:id", async (req, res) => {
  const issueId = req.params.id;
  const { status, afterImage } = req.body || {};

  if (!issueId) {
    return res.status(400).json({ error: "Issue ID is required." });
  }

  try {
    const issueRef = db.collection("issues").doc(issueId);
    const snap = await issueRef.get();
    if (!snap.exists) {
      return res.status(404).json({ error: "Issue not found." });
    }

    const existing = snap.data();
    const nextStatus = status || computeEscalationStatus(existing?.createdAt, existing?.status);

    const updates = {
      status: nextStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (typeof afterImage !== "undefined") {
      updates.afterImage = afterImage;
    }

    await issueRef.update(updates);
    const updatedSnap = await issueRef.get();
    return res.json({ id: issueId, ...updatedSnap.data() });
  } catch (error) {
    console.error("Failed to update status:", error.message);
    return res.status(500).json({ error: "Failed to update status." });
  }
});

// Mount protected routes
app.use('/api', protectedRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`AI server running on port ${port}`);
});
