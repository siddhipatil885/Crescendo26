const AI_SERVER_URL = import.meta.env.VITE_AI_SERVER_URL || 'http://localhost:3000/analyze-image';

const FINAL_FALLBACK_RESULT = {
  issue_type: '',
  category: '',
  subcategory: '',
  description: '',
  severity: '',
  confidence: 0,
};

const toBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result.split(',')[1]);
  reader.onerror = (error) => reject(error);
});

function normalizeResult(result) {
  if (!result || typeof result !== 'object') {
    return FINAL_FALLBACK_RESULT;
  }

  const category = String(result.category || '').trim();
  const subcategory = String(result.subcategory || '').trim();
  const description = String(result.description || '').trim();
  const issueType = String(result.issue_type || '').trim();
  const severity = String(result.severity || '').trim();
  const confidence = Number(result.confidence);

  if (!issueType || !category || !subcategory || !description || !severity) {
    return FINAL_FALLBACK_RESULT;
  }

  return {
    issue_type: issueType,
    category,
    subcategory,
    description,
    severity,
    confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : FINAL_FALLBACK_RESULT.confidence,
  };
}

export async function analyzeIssueImage(file) {
  if (!file) {
    return FINAL_FALLBACK_RESULT;
  }

  try {
    const imageBase64 = await toBase64(file);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let response;
    try {
      response = await fetch(AI_SERVER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64,
          mimeType: file.type || 'image/jpeg',
        }),
        signal: controller.signal,
      });
    } catch (fetchError) {
      if (fetchError.name === 'AbortError') {
        throw new Error('Image analysis request timed out. Please try again.');
      }
      throw fetchError;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.warn('Image analysis request returned a non-OK response:', response.status, errorText);
      return FINAL_FALLBACK_RESULT;
    }

    const normalized = normalizeResult(await response.json());

    if (!normalized.issue_type || !normalized.category || !normalized.subcategory || !normalized.description || !normalized.severity) {
      console.warn('AI analysis returned an incomplete result. Leaving complaint details empty for manual entry.');
      return FINAL_FALLBACK_RESULT;
    }

    return normalized;
  } catch (error) {
    console.warn('analyzeIssueImage failed. Leaving complaint details empty for manual entry.', error);
    return FINAL_FALLBACK_RESULT;
  }
}
