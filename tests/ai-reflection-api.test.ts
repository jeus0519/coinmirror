import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AI_REFLECTION_TIMEOUT_MS,
  buildAiReflectionPrompt,
  validateAiReflectionRequest,
} from '../src/lib/ai-reflection-api.ts';
import { buildAiBehaviorCoachingSafePayload } from '../src/lib/ai-coaching.ts';
import { baseMetrics } from '../src/lib/mock-metrics.ts';

test('AI reflection request validation accepts only the safe coaching payload contract', () => {
  const payload = buildAiBehaviorCoachingSafePayload({
    generalMbti: 'INTJ',
    metrics: baseMetrics,
    comparisonCopy: '자기인식과 실제 기록을 비교합니다.',
  });

  const result = validateAiReflectionRequest(payload);

  assert.equal(result.ok, true);
  assert.equal(result.payload?.schemaVersion, 'coinmirror.aiReflection.v1');
  assert.equal(result.payload?.coachingType, 'reentry_after_loss');
});

test('AI reflection request validation rejects raw trade or identity fields', () => {
  const payload = buildAiBehaviorCoachingSafePayload({
    generalMbti: 'INTJ',
    metrics: baseMetrics,
  });

  const result = validateAiReflectionRequest({
    ...payload,
    fileName: 'upbit-history.pdf',
    pdfPassword: 'secret',
    email: 'user@example.com',
    keySignals: [
      {
        ...payload.keySignals[0],
        symbol: 'KRW-BTC',
        amount: '1200000',
      },
    ],
  });

  assert.equal(result.ok, false);
  assert.match(result.error ?? '', /forbidden/i);
});

test('AI reflection prompt is short, behavior-only, and excludes investment advice instructions', () => {
  const payload = buildAiBehaviorCoachingSafePayload({
    generalMbti: 'ENFP',
    metrics: baseMetrics,
  });

  const prompt = buildAiReflectionPrompt(payload);

  assert.match(prompt.system, /행동 회고/);
  assert.match(prompt.system, /JSON/);
  assert.match(prompt.system, /매수·매도 추천/);
  assert.match(prompt.user, /coinmirror.aiReflection.v1/);
  assert.match(prompt.user, /reentry_after_loss/);
  assert.doesNotMatch(prompt.system + prompt.user, /수익 보장|가격 예측|추천 종목|목표가/);
  assert.doesNotMatch(prompt.system + prompt.user, /ARB|SOL|XRP|120,633|pdfPassword|fileName|email/);
});

test('AI reflection timeout budget stays small for cost and UX control', () => {
  assert.ok(AI_REFLECTION_TIMEOUT_MS <= 4000);
});
