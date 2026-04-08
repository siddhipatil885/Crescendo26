const AI_ROUTE_URL = import.meta.env.VITE_AI_ROUTE_URL ?? 'http://localhost:3000/route-issue';

export async function routeIssueText(text) {
  if (!text || typeof text !== 'string') {
    return null;
  }

  if (AI_ROUTE_URL == null || AI_ROUTE_URL === '') {
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(AI_ROUTE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Routing request failed.');
    }

    const payload = await response.json();
    return payload && typeof payload === 'object' ? payload : null;
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('Routing request timed out. Please try again.');
    }

    if (error instanceof TypeError) {
      throw new Error('Routing service is unavailable.');
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
