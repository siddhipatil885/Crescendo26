import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * SERVICE: GEMINI AI
 * Purpose: Handle communication with Gemini 1.5 Flash for image analysis.
 */
export const analyzeIssueImage = async (file) => {
  if (!genAI) {
    throw new Error("Gemini API key is not configured in .env as VITE_GEMINI_API_KEY");
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Helper to convert File to Base64
    const toBase64 = (f) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(f);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = error => reject(error);
    });

    const base64Str = await toBase64(file);

    const prompt = "Analyze this image of a civic issue. Return EXACTLY a JSON object with two keys: 'category' (choose from: 'Pavement / Sidewalk Damage', 'Streetlight Issues', 'Graffiti / Vandalism', 'Trash / Illegal Dumping', 'Water Leak / Drainage', or 'Other') and 'description' (a concise 1-2 sentence description of the issue shown in the image). Do not include any HTML formatting, markdown formatting, or code blocks in the response.";

    const imageParts = [
      {
        inlineData: {
          data: base64Str,
          mimeType: file.type || 'image/jpeg'
        }
      }
    ];

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();
    
    try {
      const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(jsonStr);
      return {
        category: parsed.category || 'Other',
        description: parsed.description || '',
        status: 'success'
      };
    } catch (parseError) {
      console.error("Gemini JSON parse failed on string:", text);
      return { category: 'Other', description: text, status: 'success' };
    }

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return { category: 'Other', description: '', status: 'error', error: error.message };
  }
};
