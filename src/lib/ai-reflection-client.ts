import { type AiBehaviorCoachingSafePayload } from './ai-coaching';
import { type AiReflectionOutput, validateAiReflectionOutput } from './ai-reflection-runtime';
import { AI_REFLECTION_TIMEOUT_MS } from './ai-reflection-api';

export type AiReflectionClientResult =
  | { success: true; output: AiReflectionOutput }
  | { success: false; errorType: 'timeout' | 'network' | 'status' | 'malformed' | 'fallback' | 'validation_failed'; message?: string };

export async function requestAiReflection(
  payload: AiBehaviorCoachingSafePayload,
  options?: {
    timeoutMs?: number;
    fetchFn?: typeof fetch;
  }
): Promise<AiReflectionClientResult> {
  const timeoutMs = options?.timeoutMs ?? AI_REFLECTION_TIMEOUT_MS;
  const activeFetch = options?.fetchFn ?? fetch;

  const controller = new AbortController();
  const id = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await activeFetch('/api/ai-reflection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      return { success: false, errorType: 'status', message: `HTTP status ${response.status}` };
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      return { success: false, errorType: 'malformed', message: 'Failed to parse JSON response' };
    }

    if (!body || typeof body !== 'object') {
      return { success: false, errorType: 'malformed', message: 'Response format is missing ok/output' };
    }

    const responseBody = body as Record<string, unknown>;
    if (responseBody.ok !== true || !responseBody.output) {
      return { success: false, errorType: 'malformed', message: 'Response format is missing ok/output' };
    }

    if (responseBody.source === 'fallback') {
      return { success: false, errorType: 'fallback', message: 'Response source is fallback' };
    }

    if (responseBody.source !== 'ai') {
      return {
        success: false,
        errorType: 'malformed',
        message: `Unknown source: ${String(responseBody.source)}`,
      };
    }

    const validation = validateAiReflectionOutput(responseBody.output);
    if (!validation.ok) {
      return { success: false, errorType: 'validation_failed', message: validation.error };
    }

    return { success: true, output: validation.output };
  } catch (error: unknown) {
    const errorName = error instanceof Error ? error.name : '';
    const errorMessage = error instanceof Error ? error.message : '';
    if (errorName === 'AbortError' || errorMessage.includes('aborted') || controller.signal.aborted) {
      return { success: false, errorType: 'timeout', message: 'Request timed out' };
    }
    return { success: false, errorType: 'network', message: errorMessage || 'Network error' };
  } finally {
    clearTimeout(id);
  }
}
