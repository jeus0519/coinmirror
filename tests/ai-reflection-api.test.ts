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

test('AI reflection request validation rejects extra top-level field', () => {
  const payload = buildAiBehaviorCoachingSafePayload({
    generalMbti: 'INTJ',
    metrics: baseMetrics,
  });

  const result = validateAiReflectionRequest({
    ...payload,
    extraField: 'should_be_rejected',
  });

  assert.equal(result.ok, false);
  assert.match(result.error ?? '', /invalid_request|extra_field/i);
});

test('AI reflection request validation rejects unsupported MBTI while valid MBTIs pass', () => {
  const payload = buildAiBehaviorCoachingSafePayload({
    generalMbti: 'INTJ',
    metrics: baseMetrics,
  });

  // Valid MBTI passes
  const resultValid = validateAiReflectionRequest({
    ...payload,
    generalMbti: 'ENFP',
  });
  assert.equal(resultValid.ok, true);

  // Unsupported or unknown/no_input MBTI fails
  const resultUnknown = validateAiReflectionRequest({
    ...payload,
    generalMbti: 'unknown',
  });
  assert.equal(resultUnknown.ok, false);
  assert.match(resultUnknown.error ?? '', /invalid_general_mbti/i);

  const resultNoInput = validateAiReflectionRequest({
    ...payload,
    generalMbti: 'no_input',
  });
  assert.equal(resultNoInput.ok, false);
  assert.match(resultNoInput.error ?? '', /invalid_general_mbti/i);

  const resultInvalidStr = validateAiReflectionRequest({
    ...payload,
    generalMbti: 'XYZ',
  });
  assert.equal(resultInvalidStr.ok, false);
  assert.match(resultInvalidStr.error ?? '', /invalid_general_mbti/i);
});

test('AI reflection request validation rejects metricId outside supported F1-F10', () => {
  const payload = buildAiBehaviorCoachingSafePayload({
    generalMbti: 'INTJ',
    metrics: baseMetrics,
  });

  // Valid F1-F10 passes
  for (let i = 1; i <= 10; i++) {
    const res = validateAiReflectionRequest({
      ...payload,
      keySignals: [
        {
          ...payload.keySignals[0],
          metricId: `F${i}`,
        },
      ],
    });
    assert.equal(res.ok, true, `F${i} should be accepted`);
  }

  // F0 fails
  const resF0 = validateAiReflectionRequest({
    ...payload,
    keySignals: [
      {
        ...payload.keySignals[0],
        metricId: 'F0',
      },
    ],
  });
  assert.equal(resF0.ok, false);
  assert.match(resF0.error ?? '', /invalid_metric_id/i);

  // F11 fails
  const resF11 = validateAiReflectionRequest({
    ...payload,
    keySignals: [
      {
        ...payload.keySignals[0],
        metricId: 'F11',
      },
    ],
  });
  assert.equal(resF11.ok, false);
  assert.match(resF11.error ?? '', /invalid_metric_id/i);
});

test('AI reflection request validation reconstructs displayName from trusted mapping and returns a new object', () => {
  const payload = buildAiBehaviorCoachingSafePayload({
    generalMbti: 'INTJ',
    metrics: baseMetrics,
  });

  // Ensure keySignals[0] is F5 (normally F5 is weakest in baseMetrics)
  assert.equal(payload.keySignals[0].metricId, 'F5');

  const inputPayload = {
    ...payload,
    keySignals: [
      {
        ...payload.keySignals[0],
        displayName: 'Fake Display Name', // different from standard '복구매수'
      },
    ],
  };

  const result = validateAiReflectionRequest(inputPayload);

  assert.equal(result.ok, true);
  assert.notEqual(result.payload, inputPayload); // should be a new object
  assert.equal(result.payload?.keySignals[0].displayName, '복구매수'); // reconstructed
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

test('AI reflection request validation rejects sensitive values even when keys are allowed', () => {
  const payload = buildAiBehaviorCoachingSafePayload({
    generalMbti: 'INTJ',
    metrics: baseMetrics,
  });

  const result = validateAiReflectionRequest({
    ...payload,
    keySignals: [
      {
        ...payload.keySignals[0],
        displayName: 'user@example.com 1,200,000원 KRW-BTC',
      },
    ],
  });

  assert.equal(result.ok, false);
  assert.equal(result.error, 'forbidden_sensitive_value');
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
