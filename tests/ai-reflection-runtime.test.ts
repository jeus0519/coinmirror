import assert from 'node:assert/strict';
import test from 'node:test';

import { buildAiReflectionResult, validateAiReflectionOutput } from '../src/lib/ai-reflection-runtime.ts';
import { buildAiBehaviorCoaching, buildAiBehaviorCoachingSafePayload } from '../src/lib/ai-coaching.ts';
import { baseMetrics } from '../src/lib/mock-metrics.ts';

test('AI reflection output validation accepts only four short coaching fields', () => {
  const result = validateAiReflectionOutput({
    observedPattern: '이번 기록에서는 손실 확정 뒤 다시 진입한 흐름이 먼저 보였어요.',
    reduceAction: '다음 달에는 재진입 전 대기 시간을 한 번 정해보세요.',
    reinforceAction: '늦은 시간대 거래를 줄인 흐름은 유지해볼 만해요.',
    nextQuestion: '다음 달에는 같은 상황에서 기다린 시간이 늘었을까요?',
  });

  assert.equal(result.ok, true);
  assert.match(result.output?.nextQuestion ?? '', /다음 달/);
});

test('AI reflection output validation rejects advice, extra fields, and long text', () => {
  const advice = validateAiReflectionOutput({
    observedPattern: '좋습니다.',
    reduceAction: '지금은 매수하세요.',
    reinforceAction: '보유하세요.',
    nextQuestion: '목표가에 도달할까요?',
  });
  const extra = validateAiReflectionOutput({
    observedPattern: '이번 기록을 봅니다.',
    reduceAction: '다음 달에는 행동을 확인해보세요.',
    reinforceAction: '유지할 행동을 확인해보세요.',
    nextQuestion: '다음 달에도 같은지 확인해볼까요?',
    ticker: 'KRW-BTC',
  });
  const longText = validateAiReflectionOutput({
    observedPattern: '가'.repeat(241),
    reduceAction: '다음 달에는 행동을 확인해보세요.',
    reinforceAction: '유지할 행동을 확인해보세요.',
    nextQuestion: '다음 달에도 같은지 확인해볼까요?',
  });

  assert.equal(advice.ok, false);
  assert.equal(extra.ok, false);
  assert.equal(longText.ok, false);
});

test('buildAiReflectionResult uses model JSON when valid and falls back to rule coaching when invalid', async () => {
  const payload = buildAiBehaviorCoachingSafePayload({ generalMbti: 'INTJ', metrics: baseMetrics });
  const fallback = buildAiBehaviorCoaching({ generalMbti: 'INTJ', metrics: baseMetrics });

  const aiResult = await buildAiReflectionResult({
    payload,
    fallback,
    generate: async () => ({
      observedPattern: '이번 기록에서는 손실 확정 뒤 다시 진입한 흐름이 먼저 보였어요.',
      reduceAction: '다음 달에는 재진입 전 대기 시간을 한 번 정해보세요.',
      reinforceAction: '늦은 시간대 거래를 줄인 흐름은 유지해볼 만해요.',
      nextQuestion: '다음 달에는 같은 상황에서 기다린 시간이 늘었을까요?',
    }),
  });

  const fallbackResult = await buildAiReflectionResult({
    payload,
    fallback,
    generate: async () => ({
      observedPattern: '가격 예측을 바탕으로 판단하세요.',
      reduceAction: '매수하세요.',
      reinforceAction: '보유하세요.',
      nextQuestion: '목표가에 도달할까요?',
    }),
  });

  assert.equal(aiResult.source, 'ai');
  assert.match(aiResult.output.reduceAction, /대기 시간/);
  assert.equal(fallbackResult.source, 'fallback');
  assert.equal(fallbackResult.output.reduceAction, fallback.reduceActions[0]);
});
