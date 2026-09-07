import assert from 'node:assert/strict';
import test from 'node:test';

import { POST } from '../api/ai-reflection.ts';
import { buildAiBehaviorCoachingSafePayload } from '../src/lib/ai-coaching.ts';
import { baseMetrics } from '../src/lib/mock-metrics.ts';

function request(body: unknown, method = 'POST') {
  return new Request('https://coinmirror.test/api/ai-reflection', {
    method,
    headers: { 'content-type': 'application/json' },
    body: method === 'POST' ? JSON.stringify(body) : undefined,
  });
}

test('/api/ai-reflection rejects invalid or sensitive payloads before any model call', async () => {
  let called = false;
  const response = await POST(
    request({ schemaVersion: 'coinmirror.aiReflection.v1', pdfPassword: 'secret' }),
    {
      generate: async () => {
        called = true;
        return {};
      },
    },
  );
  const json = await response.json();

  assert.equal(response.status, 400);
  assert.equal(called, false);
  assert.equal(json.ok, false);
  assert.match(json.error, /forbidden/i);
});

test('/api/ai-reflection returns AI JSON when payload and model output are valid', async () => {
  const payload = buildAiBehaviorCoachingSafePayload({ generalMbti: 'INTJ', metrics: baseMetrics });
  const response = await POST(request(payload), {
    generate: async () => ({
      observedPattern: '이번 기록에서는 손실 확정 뒤 다시 진입한 흐름이 먼저 보였어요.',
      reduceAction: '다음 달에는 재진입 전 대기 시간을 한 번 정해보세요.',
      reinforceAction: '늦은 시간대 거래를 줄인 흐름은 유지해볼 만해요.',
      nextQuestion: '다음 달에는 같은 상황에서 기다린 시간이 늘었을까요?',
    }),
  });
  const json = await response.json();

  assert.equal(response.status, 200);
  assert.equal(json.ok, true);
  assert.equal(json.source, 'ai');
  assert.match(json.output.reduceAction, /대기 시간/);
});

test('/api/ai-reflection falls back to deterministic rule output when no model is configured', async () => {
  const payload = buildAiBehaviorCoachingSafePayload({ generalMbti: 'INTJ', metrics: baseMetrics });
  const response = await POST(request(payload));
  const json = await response.json();

  assert.equal(response.status, 200);
  assert.equal(json.ok, true);
  assert.equal(json.source, 'fallback');
  assert.match(json.output.nextQuestion, /다음 달/);
});

test('/api/ai-reflection falls back when model output violates guardrails', async () => {
  const payload = buildAiBehaviorCoachingSafePayload({ generalMbti: 'INTJ', metrics: baseMetrics });
  const response = await POST(request(payload), {
    generate: async () => ({
      observedPattern: '가격 예측을 보세요.',
      reduceAction: '지금 매수하세요.',
      reinforceAction: '보유하세요.',
      nextQuestion: '목표가에 도달할까요?',
    }),
  });
  const json = await response.json();

  assert.equal(response.status, 200);
  assert.equal(json.ok, true);
  assert.equal(json.source, 'fallback');
  assert.doesNotMatch(JSON.stringify(json), /매수하세요|목표가/);
});
