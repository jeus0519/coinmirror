import { type AiBehaviorCoaching, type AiBehaviorCoachingSafePayload } from './ai-coaching';

export type AiReflectionOutput = {
  observedPattern: string;
  reduceAction: string;
  reinforceAction: string;
  nextQuestion: string;
};

export type AiReflectionRuntimeResult = {
  source: 'ai' | 'fallback';
  output: AiReflectionOutput;
  errorCode?: string;
};

export type AiReflectionGenerator = (payload: AiBehaviorCoachingSafePayload) => Promise<unknown>;

const OUTPUT_FIELDS = ['observedPattern', 'reduceAction', 'reinforceAction', 'nextQuestion'] as const;
const FORBIDDEN_OUTPUT_PATTERN = /매수하|매도하|사세요|파세요|보유하세요|비중을\s*(늘|줄)|손절|익절|목표가|가격 예측|수익 보장|추천 종목|포트폴리오 비중/i;
const MAX_FIELD_LENGTH = 240;
export const DEFAULT_AI_REFLECTION_RUNTIME_TIMEOUT_MS = 8000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function fallbackOutput(fallback: AiBehaviorCoaching): AiReflectionOutput {
  return {
    observedPattern: fallback.keySignals[0] ?? fallback.intro,
    reduceAction: fallback.reduceActions[0],
    reinforceAction: fallback.reinforceActions[0],
    nextQuestion: fallback.nextQuestion,
  };
}

export function validateAiReflectionOutput(input: unknown):
  | { ok: true; output: AiReflectionOutput }
  | { ok: false; error: string } {
  if (!isRecord(input)) return { ok: false, error: 'invalid_output' };
  const keys = Object.keys(input);
  if (keys.length !== OUTPUT_FIELDS.length || keys.some((key) => !OUTPUT_FIELDS.includes(key as (typeof OUTPUT_FIELDS)[number]))) {
    return { ok: false, error: 'invalid_output_fields' };
  }

  const output = {} as AiReflectionOutput;
  for (const field of OUTPUT_FIELDS) {
    const value = input[field];
    if (typeof value !== 'string') return { ok: false, error: `invalid_${field}` };
    const trimmed = value.trim();
    if (trimmed.length < 8 || trimmed.length > MAX_FIELD_LENGTH) return { ok: false, error: `invalid_${field}_length` };
    if (FORBIDDEN_OUTPUT_PATTERN.test(trimmed)) return { ok: false, error: `forbidden_${field}` };
    output[field] = trimmed;
  }

  return { ok: true, output };
}

export async function buildAiReflectionResult(options: {
  payload: AiBehaviorCoachingSafePayload;
  fallback: AiBehaviorCoaching;
  generate: AiReflectionGenerator;
  timeoutMs?: number;
}): Promise<AiReflectionRuntimeResult> {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  try {
    const raw = await Promise.race([
      options.generate(options.payload),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error('timeout')),
          options.timeoutMs ?? DEFAULT_AI_REFLECTION_RUNTIME_TIMEOUT_MS
        );
      }),
    ]);
    const validation = validateAiReflectionOutput(raw);
    if (validation.ok) return { source: 'ai', output: validation.output };
    return { source: 'fallback', output: fallbackOutput(options.fallback), errorCode: validation.error };
  } catch (error) {
    return {
      source: 'fallback',
      output: fallbackOutput(options.fallback),
      errorCode: error instanceof Error && error.message === 'timeout' ? 'timeout' : 'generation_failed',
    };
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
