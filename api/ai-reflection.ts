import { validateAiReflectionRequest } from '../src/lib/ai-reflection-api';
import { createOpenAiReflectionGenerator } from '../src/lib/ai-reflection-openai';
import { buildAiReflectionResult, type AiReflectionGenerator } from '../src/lib/ai-reflection-runtime';
import { type AiBehaviorCoaching, type AiBehaviorCoachingSafePayload } from '../src/lib/ai-coaching';

export type AiReflectionRouteDependencies = {
  generate?: AiReflectionGenerator;
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
    safetyCopy: '매수·매도 추천이 아니라 과거 거래 기록을 바탕으로 한 행동 회고입니다. 원본 거래내역과 PDF 비밀번호는 AI로 보내지 않아요.',
  };
}

async function parseJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

export async function POST(request: Request, dependencies: AiReflectionRouteDependencies = {}) {
  const body = await parseJson(request);
  if (JSON.stringify(body ?? {}).length > MAX_AI_REFLECTION_BODY_BYTES) {
    return jsonResponse({ ok: false, error: 'payload_too_large' }, 413);
  }
  const validation = validateAiReflectionRequest(body);
  if (!validation.ok) {
    return jsonResponse({ ok: false, error: validation.error }, 400);
  }

  const fallback = fallbackFromPayload(validation.payload);
  const generator =
    dependencies.generate ??
    createOpenAiReflectionGenerator({
      apiKey: process.env.COINMIRROR_AI_REFLECTION_OPENAI_API_KEY,
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
