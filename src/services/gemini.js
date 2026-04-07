import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_CATEGORY_MAP, getCivixCategoryFromAiClassification } from '../utils/constants';

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

function isValidClassification(category, subcategory) {
  return Boolean(category && subcategory && AI_CATEGORY_MAP[category]?.includes(subcategory));
}

function clampConfidence(value, fallback = 0.5) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(0, Math.min(1, parsed));
}

/**
 * Build the valid categories string for the prompt
 */
function buildCategoryList() {
  return Object.entries(AI_CATEGORY_MAP)
    .map(([category, subcategories]) => `- ${category}: ${subcategories.join(', ')}`)
    .join('\n');
}

/**
 * Analyze an image using Gemini Vision API
 * Makes ONE well-structured API call that returns category, subcategory, and description
 * Only falls back to hardcoded values when the API genuinely fails
 */
export const analyzeIssueImage = async (file, context = {}) => {
  if (!file) {
    console.warn('analyzeIssueImage: No file provided');
    return buildUnclassifiedAnalysis('No image file was provided.');
  }

  if (!genAI) {
    console.error('analyzeIssueImage: Gemini API key is missing or invalid');
    return buildUnclassifiedAnalysis('AI service is not configured. Please check your API key.');
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const base64Str = await toBase64(file);

    const imageParts = [
      {
        inlineData: {
          data: base64Str,
          mimeType: file.type || 'image/jpeg'
        }
      }
    ];

    const prompt = `You are an AI system built into a civic issue reporting app called CIVIX. Your job is to analyze photos of civic/infrastructure problems taken by citizens and classify them accurately.

INSTRUCTIONS:
1. Look at the image carefully and identify the PRIMARY civic issue visible.
2. Choose exactly ONE category and ONE subcategory from the valid list below.
3. Write a description (40-60 words) that describes WHAT is visible in this specific image, the risk or impact it creates, and why it needs attention. Be specific to what you actually see — do NOT use generic template language.
4. Estimate your confidence (0.0 to 1.0) in your classification.

VALID CATEGORIES AND SUBCATEGORIES:
${buildCategoryList()}

CLASSIFICATION RULES:
- Choose the category and subcategory that BEST matches the PRIMARY visible issue.
- If you see road damage, cracks, potholes, or broken road surface → "Roads & Infrastructure" / "Roads & Potholes"
- If you see garbage, waste piles, litter, or trash → "Sanitation & Public Health" / "Garbage & Waste"
- If you see water overflow, clogged drains, sewage → "Sanitation & Public Health" / "Drainage & Sewage"
- If you see broken streetlights or non-functional lights → "Electrical Issues" / "Streetlight Not Working"
- If you see exposed or hanging wires → "Electrical Issues" / "Exposed / Hanging Wires"
- If you see flooding or waterlogged areas → "Water & Utilities" / "Flooding / Waterlogging"
- If you see illegal banners or hoardings → "Illegal Activities & Violations" / "Illegal Banners / Hoardings"
- If you see encroachment on public space → "Illegal Activities & Violations" / "Encroachments"
- Pick the most specific and accurate match based on visual evidence.

DESCRIPTION RULES:
- Describe what you ACTUALLY see in this specific image.
- Mention the visible condition, risk, and impact.
- Do NOT include location names, addresses, or area details.
- Do NOT use filler phrases like "This image shows" or "As seen in the picture".
- Keep it between 40 and 60 words.

Return ONLY valid JSON in this exact format:
{
  "category": "<exact category from the list>",
  "subcategory": "<exact subcategory from the list>",
  "description": "<40-60 word description based on what you see>",
  "confidence": <number between 0 and 1>
}`;

    const result = await model.generateContent([prompt, ...imageParts]);
    const responseText = result.response.text();
    const parsed = safeParseJson(responseText);

    // Validate the response
    if (!isValidClassification(parsed.category, parsed.subcategory)) {
      console.warn('Gemini returned invalid category/subcategory:', parsed.category, '/', parsed.subcategory);
      
      // Try to find the closest valid match
      const corrected = findClosestValidCategory(parsed.category, parsed.subcategory);
      if (corrected) {
        parsed.category = corrected.category;
        parsed.subcategory = corrected.subcategory;
      } else {
        console.error('Could not map Gemini response to valid categories.');
        return buildUnclassifiedAnalysis('AI could not classify this image accurately. Please select the category manually.');
      }
    }

    // Validate description
    const description = parsed.description?.trim();
    if (!description || description.length < 20) {
      console.warn('Gemini returned weak description, keeping classification but requesting description');
      parsed.description = `Civic issue detected: ${parsed.subcategory} under ${parsed.category}. Visible damage or hazard requires inspection and corrective action by the responsible department to prevent further deterioration and ensure public safety in the affected area.`;
    }

    const civixCategory = getCivixCategoryFromAiClassification(
      parsed.category,
      parsed.subcategory
    );

    return {
      category: parsed.category,
      subcategory: parsed.subcategory,
      description: parsed.description,
      confidence: clampConfidence(parsed.confidence, 0.7),
      issue_category: parsed.category,
      issue_subcategory: parsed.subcategory,
      ai_description: parsed.description,
      civixCategory: civixCategory || 'Other',
      status: 'success',
    };
  } catch (error) {
    console.error('Gemini Analysis Error:', error);
    return buildUnclassifiedAnalysis(`AI analysis failed: ${error.message || 'Unknown error'}. Please classify manually.`);
  }
};

/**
 * Try to find the closest valid category/subcategory if Gemini returned something slightly off
 */
function findClosestValidCategory(rawCategory, rawSubcategory) {
  if (!rawCategory || !rawSubcategory) return null;

  const catLower = rawCategory.toLowerCase();
  const subLower = rawSubcategory.toLowerCase();

  // Try exact match first (already handled by isValidClassification, but just in case)
  for (const [category, subcategories] of Object.entries(AI_CATEGORY_MAP)) {
    if (category.toLowerCase() === catLower) {
      const matchedSub = subcategories.find(s => s.toLowerCase() === subLower);
      if (matchedSub) {
        return { category, subcategory: matchedSub };
      }
      // Category matched but subcategory didn't — try fuzzy subcategory
      const fuzzySub = subcategories.find(s =>
        s.toLowerCase().includes(subLower) || subLower.includes(s.toLowerCase())
      );
      if (fuzzySub) {
        return { category, subcategory: fuzzySub };
      }
      // Category matched, just return first subcategory
      return { category, subcategory: subcategories[0] };
    }
  }

  // Try fuzzy category match
  for (const [category, subcategories] of Object.entries(AI_CATEGORY_MAP)) {
    if (category.toLowerCase().includes(catLower) || catLower.includes(category.toLowerCase())) {
      const matchedSub = subcategories.find(s =>
        s.toLowerCase() === subLower ||
        s.toLowerCase().includes(subLower) ||
        subLower.includes(s.toLowerCase())
      );
      return { category, subcategory: matchedSub || subcategories[0] };
    }
  }

  // Try matching subcategory across all categories
  for (const [category, subcategories] of Object.entries(AI_CATEGORY_MAP)) {
    const matchedSub = subcategories.find(s =>
      s.toLowerCase() === subLower ||
      s.toLowerCase().includes(subLower) ||
      subLower.includes(s.toLowerCase())
    );
    if (matchedSub) {
      return { category, subcategory: matchedSub };
    }
  }

  return null;
}

/**
 * Returns a clear signal that manual classification is needed
 */
function buildUnclassifiedAnalysis(reason = '') {
  return {
    category: '',
    subcategory: '',
    description: reason || 'AI analysis was unable to process this image. Please review the category and description, and update them manually if needed.',
    confidence: 0,
    civixCategory: '',
    issue_category: '',
    issue_subcategory: '',
    status: 'unclassified',
  };
}
