import {
  type AiBehaviorCoachingSafePayload,
  type AiBehaviorCoachingType,
} from './ai-coaching';

export const AI_REFLECTION_TIMEOUT_MS = 3500;

const ALLOWED_SCHEMA_VERSION = 'coinmirror.aiReflection.v1';
const ALLOWED_OUTPUT_FIELDS = ['observedPattern', 'reduceAction', 'reinforceAction', 'nextQuestion'] as const;
const ALLOWED_COACHING_TYPES: readonly AiBehaviorCoachingType[] = [
  'loss_management',
  'profit_taking_rhythm',
  'late_entry_check',
  'averaging_down_check',
  'reentry_after_loss',
  'trade_frequency_check',
  'late_night_trade_check',
  'asset_concentration_check',
  'break_even_exit_check',
  'balanced_observation',
];
const ALLOWED_SCORE_BANDS = ['stable', 'observe', 'caution', 'measuring'] as const;
const ALLOWED_SCORE_BUCKETS = ['80_100', '55_79', '0_54', 'measuring'] as const;
const ALLOWED_SAMPLE_SIZE_BUCKETS = ['0', '1_9', '10_49', '50_plus'] as const;
const FORBIDDEN_KEY_PATTERN =
  /filename|filepath|pdfpassword|password|email|account|customer|userid|userid|orderid|executionid|raw|symbol|ticker|amount|quantity|price|balance|pnl|profit|lossamount|evidence|stats|fact|when/i;
const FORBIDDEN_VALUE_PATTERN =
  /[A-Z]{2,5}-[A-Z0-9]{2,12}|[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}|\d[\d,]*(?:원|krw|usd|개|수량|가격|금액)/i;

export type AiReflectionValidationResult =
  | { ok: true; payload: AiBehaviorCoachingSafePayload }
  | { ok: false; error: string };

export type AiReflectionPrompt = {
  system: string;
  user: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasForbiddenKey(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(hasForbiddenKey);
  if (!isRecord(value)) return false;
  return Object.entries(value).some(([key, child]) => FORBIDDEN_KEY_PATTERN.test(key) || hasForbiddenKey(child));
}

function hasForbiddenValue(value: unknown): boolean {
  if (typeof value === 'string') return FORBIDDEN_VALUE_PATTERN.test(value);
  if (Array.isArray(value)) return value.some(hasForbiddenValue);
  if (!isRecord(value)) return false;
  return Object.values(value).some(hasForbiddenValue);
}

function isOneOf<T extends readonly string[]>(value: unknown, allowed: T): value is T[number] {
  return typeof value === 'string' && allowed.includes(value as T[number]);
}

export function validateAiReflectionRequest(input: unknown): AiReflectionValidationResult {
  if (!isRecord(input)) return { ok: false, error: 'invalid_request' };
  if (hasForbiddenKey(input)) return { ok: false, error: 'forbidden_sensitive_field' };
  if (hasForbiddenValue(input)) return { ok: false, error: 'forbidden_sensitive_value' };
  if (input.schemaVersion !== ALLOWED_SCHEMA_VERSION) return { ok: false, error: 'invalid_schema_version' };
  if (!isOneOf(input.coachingType, ALLOWED_COACHING_TYPES)) return { ok: false, error: 'invalid_coaching_type' };
  if (input.generalMbti !== undefined && typeof input.generalMbti !== 'string') {
    return { ok: false, error: 'invalid_general_mbti' };
  }
  if (input.comparisonHint !== undefined && input.comparisonHint !== 'self_perception_available') {
    return { ok: false, error: 'invalid_comparison_hint' };
  }
  if (!Array.isArray(input.keySignals) || input.keySignals.length === 0 || input.keySignals.length > 2) {
    return { ok: false, error: 'invalid_key_signals' };
  }

  for (const signal of input.keySignals) {
    if (!isRecord(signal)) return { ok: false, error: 'invalid_key_signal' };
    if (Object.keys(signal).some((key) => !['metricId', 'displayName', 'scoreBand', 'scoreBucket', 'sampleSizeBucket'].includes(key))) {
      return { ok: false, error: 'invalid_key_signal_field' };
    }
    if (typeof signal.metricId !== 'string' || !/^F\d+$/.test(signal.metricId)) return { ok: false, error: 'invalid_metric_id' };
    if (typeof signal.displayName !== 'string' || signal.displayName.length > 40) return { ok: false, error: 'invalid_display_name' };
    if (!isOneOf(signal.scoreBand, ALLOWED_SCORE_BANDS)) return { ok: false, error: 'invalid_score_band' };
    if (!isOneOf(signal.scoreBucket, ALLOWED_SCORE_BUCKETS)) return { ok: false, error: 'invalid_score_bucket' };
    if (!isOneOf(signal.sampleSizeBucket, ALLOWED_SAMPLE_SIZE_BUCKETS)) return { ok: false, error: 'invalid_sample_size_bucket' };
  }

  if (!Array.isArray(input.requestedOutput)) return { ok: false, error: 'invalid_requested_output' };
  if (input.requestedOutput.join('|') !== ALLOWED_OUTPUT_FIELDS.join('|')) {
    return { ok: false, error: 'invalid_requested_output' };
  }

  return { ok: true, payload: input as AiBehaviorCoachingSafePayload };
}

export function buildAiReflectionPrompt(payload: AiBehaviorCoachingSafePayload): AiReflectionPrompt {
  return {
    system:
      '당신은 코인미러의 AI 행동코칭 문장 작성자입니다. 과거 거래 기록에서 산출된 비식별 요약만 보고 행동 회고 문장을 작성합니다. 매수·매도 추천, 특정 종목 판단, 가격 전망, 손익 보장, 포트폴리오 제안은 절대 하지 않습니다. 출력은 반드시 JSON이며 observedPattern, reduceAction, reinforceAction, nextQuestion 네 필드만 포함합니다. 각 문장은 짧고 한국어 존댓말로 작성합니다.',
    user: JSON.stringify(payload),
  };
}
