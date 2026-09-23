import { checkRateLimit as checkVercelRateLimit } from '@vercel/firewall';

import { validateAiReflectionRequest } from '../src/lib/ai-reflection-api';
import { createOpenAiReflectionGenerator } from '../src/lib/ai-reflection-openai';
import { buildAiReflectionResult, type AiReflectionGenerator } from '../src/lib/ai-reflection-runtime';
import { type AiBehaviorCoaching, type AiBehaviorCoachingSafePayload } from '../src/lib/ai-coaching';

export type AiReflectionRateLimitCheck = (
  request: Request,
) => Promise<{ rateLimited?: boolean }> | { rateLimited?: boolean };

export type AiReflectionRouteDependencies = {
  generate?: AiReflectionGenerator;
  checkRateLimit?: AiReflectionRateLimitCheck;
};

type JsonValue = Record<string, unknown>;

const MAX_AI_REFLECTION_BODY_BYTES = 2048;

function jsonResponse(body: JsonValue, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}


async function checkAiReflectionRateLimit(request: Request, dependencies: AiReflectionRouteDependencies) {
  if (dependencies.checkRateLimit) {
    return dependencies.checkRateLimit(request);
  }

  const rateLimitId = process.env.COINMIRROR_AI_REFLECTION_RATE_LIMIT_ID?.trim();
  if (!rateLimitId) {
    return { rateLimited: false };
  }

  try {
    return await checkVercelRateLimit(rateLimitId, { request });
  } catch {
    // WAF SDK/environment issues should not break local analysis; Vercel dashboard rules remain the primary guard.
    return { rateLimited: false };
  }
}

function fallbackFromPayload(payload: AiBehaviorCoachingSafePayload): AiBehaviorCoaching {
  const primarySignal = payload.keySignals[0];
  const secondarySignal = payload.keySignals[1];
  const displayName = primarySignal?.displayName ?? '주요 행동 지표';

  return {
    coachingType: payload.coachingType,
    title: 'AI 행동코칭',
    eyebrow: '이번 기록을 바탕으로 정리한 AI 회고',
    intro: '이번 분석의 비식별 핵심 지표를 바탕으로 다음 달에 확인할 행동을 짧게 정리했어요.',
    keySignals: [primarySignal, secondarySignal]
      .filter((signal): signal is AiBehaviorCoachingSafePayload['keySignals'][number] => Boolean(signal))
      .map((signal) => `${signal.displayName} · ${signal.scoreBand} · ${signal.scoreBucket}`),
    reduceActions: [`다음 달에는 ${displayName} 지표가 흔들린 상황을 한 번 더 확인해보세요.`],
    reinforceActions: ['이미 안정적으로 유지된 행동은 같은 기준으로 다음 분석에서도 비교해보세요.'],
    nextQuestion: `다음 달에는 “${displayName} 지표가 이번 분석보다 나아졌을까요?”를 다시 확인해보세요.`,
    safetyCopy: '매수·매도 추천이 아니라 과거 거래 기록을 바탕으로 한 행동 회고입니다.',
    patternCard: {
      title: '이번 기록에서 가장 선명했던 패턴',
      headline: {
        title: `기록에서 ${displayName}이 가장 먼저 보였어요`,
        primaryLabel: `${displayName} 관찰 중`,
        summary: 'AI 문장 대신 기본 회고 카드로 같은 패턴을 먼저 보여드려요.',
      },
      patternName: {
        label: '이 패턴의 이름',
        name: '자기인식 갭',
        explanation: '기록은 성격을 단정하지 않고 반복된 행동의 단서만 보여줘요. 나를 탓하기보다 다음에 같은 장면을 알아차리기 위한 이름표로 보면 좋아요.',
      },
      strength: {
        title: '반전: 이미 잘하고 있는 것',
        evidence: '모든 행동을 한 번에 고치기보다 가장 선명한 패턴 하나만 보는 것부터 시작해도 충분해요.',
      },
      experiment: {
        title: '다음 달 실험 1개',
        action: '같은 상황이 다시 오면 바로 행동하기 전에 “지금 감정이 먼저 움직였나, 기준이 먼저 있었나?”를 한 번 적어보세요.',
        nextUploadPromise: '다음 업로드 때 같은 패턴이 줄었는지 비교해 드릴게요.',
      },
      safetyCopy: '매수·매도 추천이 아닌 과거 기록 회고입니다.',
    },
  };
}

export async function POST(request: Request, dependencies: AiReflectionRouteDependencies = {}) {
  const rateLimit = await checkAiReflectionRateLimit(request, dependencies);
  if (rateLimit.rateLimited) {
    return jsonResponse({ ok: false, error: 'rate_limited' }, 429);
  }

  // 1. Inspect Content-Length early when valid
  const contentLength = request.headers.get('content-length');
  if (contentLength !== null) {
    const parsedLength = parseInt(contentLength, 10);
    if (!isNaN(parsedLength) && parsedLength > MAX_AI_REFLECTION_BODY_BYTES) {
      return jsonResponse({ ok: false, error: 'payload_too_large' }, 413);
    }
  }

  // 2. Read text once
  let text = '';
  try {
    text = await request.text();
  } catch {
    return jsonResponse({ ok: false, error: 'invalid_request' }, 400);
  }

  // 3. Count UTF-8 bytes with TextEncoder, reject 413
  const bytes = new TextEncoder().encode(text).length;
  if (bytes > MAX_AI_REFLECTION_BODY_BYTES) {
    return jsonResponse({ ok: false, error: 'payload_too_large' }, 413);
  }

  // 4. Then JSON.parse safely
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return jsonResponse({ ok: false, error: 'invalid_request' }, 400);
  }

  const validation = validateAiReflectionRequest(body);
  if (validation.ok === false) {
    return jsonResponse({ ok: false, error: validation.error }, 400);
  }

  const fallback = fallbackFromPayload(validation.payload);
  const generator =
    dependencies.generate ??
    createOpenAiReflectionGenerator({
      apiKey: process.env.COINMIRROR_AI_REFLECTION_API_KEY,
      model: process.env.COINMIRROR_AI_REFLECTION_MODEL,
    });
  const result = await buildAiReflectionResult({
    payload: validation.payload,
    fallback,
    generate: generator,
  });

  return jsonResponse({
    ok: true,
    source: result.source,
    output: result.output,
    ...(result.errorCode ? { errorCode: result.errorCode } : {}),
  });
}
