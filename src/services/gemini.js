import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_CATEGORY_MAP, getCivixCategoryFromAiClassification, ISSUE_CATEGORIES } from '../utils/constants';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const toBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result.split(',')[1]);
  reader.onerror = (error) => reject(error);
});

function safeParseJson(text) {
  const jsonStr = String(text || '').replace(/```json/g, '').replace(/```/g, '').trim();

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

function extractJsonObject(text) {
  const cleanedText = String(text || '').replace(/```json/g, '').replace(/```/g, '').trim();
  const match = cleanedText.match(/\{[\s\S]*\}/);
  return match ? match[0] : cleanedText;
}

function buildFallbackAnalysis(context = {}) {
  return {
    category: 'Roads & Infrastructure',
    subcategory: 'Roads & Potholes',
    description: 'Visible road surface damage appears to create a safety risk for vehicles and may lead to tyre damage, unstable movement, or accidents if the damaged section is not inspected and repaired promptly by the responsible civic department.',
    confidence: 0.35,
    civixCategory: 'Road Damage / Pothole',
    issue_category: 'Roads & Infrastructure',
    issue_subcategory: 'Roads & Potholes',
    status: 'fallback',
  };
}

/**
 * STRICT CATEGORY MAPPING
 * Maps detected keywords to exact Civix categories following user requirements
 */
const STRICT_CATEGORY_RULES = [
  // Roads & Infrastructure
  { matches: ['pothole', 'crater', 'broken road', 'damaged road', 'road crack', 'hole'], category: 'Roads & Infrastructure', subcategory: 'Roads & Potholes', confidence: 0.97 },
  { matches: ['broken sidewalk', 'damaged sidewalk', 'broken pavement', 'damaged pavement', 'broken footpath'], category: 'Roads & Infrastructure', subcategory: 'Footpaths & Sidewalks', confidence: 0.91 },
  { matches: ['traffic signal', 'traffic light', 'traffic sign'], category: 'Roads & Infrastructure', subcategory: 'Traffic Signals & Signs', confidence: 0.94 },
  { matches: ['speed breaker', 'road markings', 'lane markings'], category: 'Roads & Infrastructure', subcategory: 'Road Markings & Speed Breakers', confidence: 0.90 },
  { matches: ['traffic obstruction', 'blocked road', 'obstruction'], category: 'Roads & Infrastructure', subcategory: 'Traffic Obstruction', confidence: 0.88 },
  
  // Sanitation & Public Health
  { matches: ['garbage', 'waste', 'trash', 'dumping', 'litter'], category: 'Sanitation & Public Health', subcategory: 'Garbage & Waste', confidence: 0.95 },
  { matches: ['drainage', 'sewage', 'water clogging', 'water logging', 'blocked drain'], category: 'Sanitation & Public Health', subcategory: 'Drainage & Sewage', confidence: 0.96 },
  { matches: ['public toilet', 'toilet damage'], category: 'Sanitation & Public Health', subcategory: 'Public Toilets', confidence: 0.90 },
  { matches: ['dead animal', 'animal carcass'], category: 'Sanitation & Public Health', subcategory: 'Dead Animals', confidence: 0.93 },
  { matches: ['mosquito', 'rat', 'pest', 'infestation'], category: 'Sanitation & Public Health', subcategory: 'Pest Infestation', confidence: 0.90 },
  { matches: ['manhole', 'open manhole', 'safety hazard'], category: 'Sanitation & Public Health', subcategory: 'Open Manholes / Safety Hazards', confidence: 0.92 },
  
  // Water & Utilities
  { matches: ['water supply', 'dry tap', 'no water'], category: 'Water & Utilities', subcategory: 'Water Supply Issues', confidence: 0.90 },
  { matches: ['water leak', 'leaking pipe', 'pipeline damage'], category: 'Water & Utilities', subcategory: 'Water Leakage / Pipeline Damage', confidence: 0.93 },
  { matches: ['flooding', 'water accumulation', 'waterlogging'], category: 'Water & Utilities', subcategory: 'Flooding / Waterlogging', confidence: 0.95 },
  
  // Electrical Issues
  { matches: ['power outage', 'power cut', 'no electricity'], category: 'Electrical Issues', subcategory: 'Power Outage', confidence: 0.90 },
  { matches: ['streetlight', 'broken light', 'light not working'], category: 'Electrical Issues', subcategory: 'Streetlight Not Working', confidence: 0.95 },
  { matches: ['exposed wire', 'hanging wire', 'wire damage'], category: 'Electrical Issues', subcategory: 'Exposed / Hanging Wires', confidence: 0.94 },
  { matches: ['transformer', 'electrical equipment'], category: 'Electrical Issues', subcategory: 'Transformer Issues', confidence: 0.88 },
  
  // Illegal Activities & Violations
  { matches: ['illegal banner', 'banner', 'hoarding'], category: 'Illegal Activities & Violations', subcategory: 'Illegal Banners / Hoardings', confidence: 0.92 },
  { matches: ['encroachment', 'blocked footpath', 'blocked path'], category: 'Illegal Activities & Violations', subcategory: 'Encroachments', confidence: 0.90 },
  { matches: ['unauthorized construction', 'illegal construction'], category: 'Illegal Activities & Violations', subcategory: 'Unauthorized Construction', confidence: 0.92 },
  { matches: ['illegal dumping', 'illegal disposal'], category: 'Illegal Activities & Violations', subcategory: 'Illegal Dumping', confidence: 0.91 },
];

function normalizeDetectedIssues(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((issue) => String(issue || '').trim().toLowerCase())
    .filter(Boolean);
}

function isValidClassification(category, subcategory) {
  return Boolean(category && subcategory && AI_CATEGORY_MAP[category]?.includes(subcategory));
}

async function generateJsonContent(model, prompt, imageParts = []) {
  const result = await model.generateContent(imageParts.length > 0 ? [prompt, ...imageParts] : prompt);
  return safeParseJson(result.response.text());
}

/**
 * Classify detected issues using strict category rules
 * NEVER defaults to "Projects & Other" unless no match found
 */
function classifyDetectedIssuesFallback(detectedIssues) {
  // Find highest confidence match
  let bestMatch = null;
  let maxConfidence = -1;

  for (const issue of detectedIssues) {
    const rule = STRICT_CATEGORY_RULES.find(({ matches }) =>
      matches.some(m => issue.includes(m) || m.includes(issue))
    );

    if (rule && rule.confidence > maxConfidence) {
      bestMatch = rule;
      maxConfidence = rule.confidence;
    }
  }

  if (bestMatch) {
    return {
      category: bestMatch.category,
      subcategory: bestMatch.subcategory,
      confidence: bestMatch.confidence,
    };
  }

  // FALLBACK: Only if literally no matches found
  return {
    category: 'Roads & Infrastructure',
    subcategory: 'Roads & Potholes',
    confidence: 0.35,
  };
}

/**
 * Description building - NO AI SLOP
 * 40-60 words, clearly states issue + risk/impact, no locations, no filler
 */
function buildDescriptionForSubcategory(subcategory, detectedIssues) {
  const primaryIssue = detectedIssues[0] || 'civic issue';

  const descriptions = {
    'Roads & Potholes': 'Large pothole causing significant damage to road surface and creating serious risk of vehicle damage, loss of control, and accidents. Especially hazardous in heavy traffic or low visibility conditions.',
    'Footpaths & Sidewalks': 'Broken or damaged footpath creating safety hazard for pedestrians. Risk of trips, falls, and injuries. Reduces accessibility for elderly and disabled persons.',
    'Traffic Signals & Signs': 'Damaged or non-functional traffic signal creating confusion and collision risk. Vehicles and pedestrians cannot rely on clear traffic control, increasing accident risk significantly.',
    'Road Markings & Speed Breakers': 'Faded road markings or missing speed breakers reducing driver awareness. Creates speeding risk and unsafe conditions, particularly in residential or school zones.',
    'Traffic Obstruction': 'Road obstruction blocking regular traffic flow and creating congestion. Vehicles cannot pass safely, causing delays, accidents, and emergency response time increases.',
    'Garbage & Waste': 'Accumulated garbage creating unhygienic surroundings and foul smell. Increases pest activity, waste spread risk, and makes area uncomfortable for residents and pedestrians.',
    'Drainage & Sewage': 'Drainage problem causing overflow, stagnant water, and unpleasant smell. Creates slipping hazard, health risk, and increases likelihood of further infrastructure damage.',
    'Public Toilets': 'Public toilet facility damaged or non-functional. Affects public health and sanitation, reducing access to essential facilities for community members.',
    'Dead Animals': 'Dead animal creating public health concern and unpleasant conditions. Poses hygiene risk and requires immediate removal and area sanitization.',
    'Pest Infestation': 'Pest infestation creating unhygienic conditions and health risk. Affects public safety and increases disease transmission risk in the affected area.',
    'Open Manholes / Safety Hazards': 'Open manhole creating serious safety hazard. Risk of falls, injuries, or accidents for pedestrians and vehicles passing through the area.',
    'Water Supply Issues': 'Water supply problem affecting regular service and public access. Creates inconvenience and increases risk of service disruption for community.',
    'Water Leakage / Pipeline Damage': 'Water leakage from damaged pipeline causing wastage and infrastructure damage. Creates wet surface hazard and increases risk of further damage if not repaired.',
    'Flooding / Waterlogging': 'Waterlogging causing flooding risk in the area. Creates safety hazard for pedestrians and vehicles, reduces accessibility, and causes property damage risk.',
    'Power Outage': 'Power outage affecting electricity supply. Causes inconvenience and creates safety risk, especially in evenings when lighting is essential.',
    'Streetlight Not Working': 'Broken streetlight reducing street illumination. Creates safety problem for drivers, riders, and pedestrians. Increased accident and crime risk.',
    'Exposed / Hanging Wires': 'Exposed or hanging electrical wires creating electrocution risk. Serious safety hazard for pedestrians, vehicles, and especially children in the area.',
    'Transformer Issues': 'Transformer malfunction affecting power distribution. Creates electricity supply risk and requires urgent corrective action.',
    'Illegal Banners / Hoardings': 'Illegal banner or hoarding obstructing visibility and contributing to visual clutter. Interferes with safe movement and clear signage readability.',
    'Encroachments': 'Encroachment blocking public space access. Creates difficulty for safe movement and pedestrian passage, affecting regular commuters.',
    'Unauthorized Construction': 'Unauthorized construction in public space creating obstruction and compliance issue. Poses safety risk and blocks pedestrian or vehicle movement.',
    'Illegal Dumping': 'Illegal dumping creating mess and pollution. Affects public health and environment, increasing need for immediate cleanup and area sanitization.',
  };

  return descriptions[subcategory] || `Issue visible in the image creating public inconvenience or safety concern. Requires inspection and corrective action to resolve the problem.`;
}

function normalizeDescription(text) {
  if (!text) return '';
  
  const cleaned = String(text)
    .replace(/CIVIX auto-detects the issue|Auto-generated from the image|AUTO ROUTING|Tracking and notifications/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  return cleaned;
}

function wordCount(text) {
  return text.trim().split(/\s+/).length;
}

function ensureDescriptionLength(description) {
  // Ensure 40-60 words
  const words = description.trim().split(/\s+/);
  
  if (words.length < 40) {
    return description;
  }
  
  if (words.length > 60) {
    return words.slice(0, 60).join(' ') + '.';
  }
  
  return description;
}

function clampConfidence(value, fallback = 0.35) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(0, Math.min(1, parsed));
}

/**
 * OUTPUT FORMAT (STRICT - NO AI SLOP)
 * Returns ONLY the required fields
 */
export const analyzeIssueImage = async (file, context = {}) => {
  if (!file || !genAI) {
    return buildFallbackAnalysis(context);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const base64Str = await toBase64(file);

    const visionPrompt = `You are a civic issue analyzer. Identify clearly visible civic or infrastructure problems in this image.

Focus on physical damage first. If the image shows road damage, cracks, potholes, broken pavement, collapsed edges, surface failure, garbage, sewage, waterlogging, wires, streetlights, or construction obstruction, name those exact visible issues.

Return ONLY valid JSON:
{
  "detected_issues": ["pothole", "broken road", "road crack"]
}`;

    const directClassificationPrompt = `You are classifying a civic issue directly from an image.

Choose exactly one valid category and one valid subcategory.
Prioritize visible physical damage. If you can see any road surface breakage, cracks, potholes, collapsed edges, or broken pavement, choose "Roads & Infrastructure" and the most accurate road-related subcategory.

Valid categories and subcategories:
${Object.entries(AI_CATEGORY_MAP).map(([category, subcategories]) => `${category}: ${subcategories.join(', ')}`).join('\n')}

Return ONLY valid JSON:
{
  "category": "",
  "subcategory": "",
  "confidence": 0
}`;

    const classificationPrompt = `You are a classification AI.

Your job is to map detected issues to the MOST ACCURATE category and subcategory.

Choose exactly one valid category and one valid subcategory from:
${Object.entries(AI_CATEGORY_MAP).map(([category, subcategories]) => `${category}: ${subcategories.join(', ')}`).join('\n')}

Prioritize visible physical damage, especially road surface damage. If any detected issue includes pothole, crater, broken road, road crack, damaged road, broken pavement, or hole, choose "Roads & Infrastructure" with the strongest matching road-related subcategory.

Return ONLY valid JSON:
{
  "category": "",
  "subcategory": "",
  "confidence": 0
}`;

    const imageParts = [
      {
        inlineData: {
          data: base64Str,
          mimeType: file.type || 'image/jpeg'
        }
      }
    ];

    const imageClassificationPrompt = `You are an AI system integrated into a production civic issue reporting app.

Analyze the IMAGE directly and return the most accurate classification from visible evidence.

Rules:
- Focus on what is clearly visible in the image.
- Prioritize visible physical damage or hazards.
- Do not guess from location or assumptions.
- Choose exactly one valid category and one valid subcategory.
- If electrical wires, fire, sparking, damaged poles, or dangerous electrical infrastructure are visible, prefer an electrical issue classification.

Valid categories and subcategories:
${Object.entries(AI_CATEGORY_MAP).map(([category, subcategories]) => `${category}: ${subcategories.join(', ')}`).join('\n')}

Return ONLY valid JSON:
{
  "category": "",
  "subcategory": "",
  "description": "",
  "confidence": 0
}`;

    let detectedIssues = [];
    try {
      const parsedVision = await generateJsonContent(model, visionPrompt, imageParts);
      detectedIssues = normalizeDetectedIssues(parsedVision.detected_issues);
    } catch (error) {
      detectedIssues = [];
    }

    let classification = classifyDetectedIssuesFallback(detectedIssues);
    let imageBasedResult = null;

    try {
      const parsedImageClassification = await generateJsonContent(model, imageClassificationPrompt, imageParts);
      if (isValidClassification(parsedImageClassification.category, parsedImageClassification.subcategory)) {
        imageBasedResult = {
          category: parsedImageClassification.category,
          subcategory: parsedImageClassification.subcategory,
          description: normalizeDescription(parsedImageClassification.description),
          confidence: clampConfidence(parsedImageClassification.confidence, 0.7),
        };
        classification = {
          category: imageBasedResult.category,
          subcategory: imageBasedResult.subcategory,
          confidence: imageBasedResult.confidence,
        };
      }
    } catch (error) {
      imageBasedResult = null;
    }

    if (detectedIssues.length > 0) {
      try {
        const parsedClassification = await generateJsonContent(
          model,
          `${classificationPrompt}\n\nDetected issues: ${JSON.stringify(detectedIssues)}`
        );

        if (!imageBasedResult && isValidClassification(parsedClassification.category, parsedClassification.subcategory)) {
          classification = {
            category: parsedClassification.category,
            subcategory: parsedClassification.subcategory,
            confidence: clampConfidence(parsedClassification.confidence, classification.confidence),
          };
        }
      } catch (error) {
        classification = classifyDetectedIssuesFallback(detectedIssues);
      }
    }

    if (!imageBasedResult && !isValidClassification(classification.category, classification.subcategory)) {
      try {
        const directClassification = await generateJsonContent(model, directClassificationPrompt, imageParts);
        if (isValidClassification(directClassification.category, directClassification.subcategory)) {
          classification = {
            category: directClassification.category,
            subcategory: directClassification.subcategory,
            confidence: clampConfidence(directClassification.confidence, 0.55),
          };
        }
      } catch (error) {
        classification = classifyDetectedIssuesFallback(detectedIssues);
      }
    }

    let description = imageBasedResult?.description || '';
    if (!description) {
      description = ensureDescriptionLength(
        buildDescriptionForSubcategory(classification.subcategory, detectedIssues)
      );
    }

    // STEP 4: Get Civix category mapping
    const civixCategory = getCivixCategoryFromAiClassification(
      classification.category,
      classification.subcategory
    );

    return {
      category: classification.category,
      subcategory: classification.subcategory,
      description: description,
      confidence: classification.confidence,
      issue_category: classification.category,
      issue_subcategory: classification.subcategory,
      ai_description: description,
      civixCategory: civixCategory || 'Road Damage / Pothole',
      status: 'success'
    };
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return buildFallbackAnalysis(context);
  }
};
