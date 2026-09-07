import assert from 'node:assert/strict';
import test from 'node:test';

import { createOpenAiReflectionGenerator } from '../src/lib/ai-reflection-openai.ts';
import { buildAiBehaviorCoachingSafePayload } from '../src/lib/ai-coaching.ts';
import { baseMetrics } from '../src/lib/mock-metrics.ts';

test('OpenAI reflection generator does not call network when server API key is missing', async () => {
  let fetchCalled = false;
  const generator = createOpenAiReflectionGenerator({
    apiKey: '',
    fetch: async () => {
      fetchCalled = true;
      throw new Error('should not call fetch');
    },
  });

  await assert.rejects(
    () => generator(buildAiBehaviorCoachingSafePayload({ generalMbti: 'INTJ', metrics: baseMetrics })),
    /not_configured/,
  );
  assert.equal(fetchCalled, false);
});

test('OpenAI reflection generator sends compact JSON-mode request and parses JSON output', async () => {
  const payload = buildAiBehaviorCoachingSafePayload({ generalMbti: 'INTJ', metrics: baseMetrics });
  let capturedBody: Record<string, unknown> | undefined;
  const generator = createOpenAiReflectionGenerator({
    apiKey: 'test-key',
    model: 'gpt-4.1-mini',
    fetch: async (_url, init) => {
      capturedBody = JSON.parse(String(init?.body));
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  observedPattern: '이번 기록에서는 손실 확정 뒤 다시 진입한 흐름이 먼저 보였어요.',
                  reduceAction: '다음 달에는 재진입 전 대기 시간을 한 번 정해보세요.',
                  reinforceAction: '늦은 시간대 거래를 줄인 흐름은 유지해볼 만해요.',
                  nextQuestion: '다음 달에는 같은 상황에서 기다린 시간이 늘었을까요?',
                }),
              },
            },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    },
  });

  const output = await generator(payload);

  assert.equal(capturedBody?.model, 'gpt-4.1-mini');
  assert.equal(capturedBody?.temperature, 0.4);
  assert.equal(capturedBody?.max_tokens, 420);
  assert.deepEqual(capturedBody?.response_format, { type: 'json_object' });
  assert.doesNotMatch(JSON.stringify(capturedBody), /ARB|SOL|XRP|120,633|pdfPassword|fileName|email/);
  assert.match(JSON.stringify(capturedBody), /coinmirror.aiReflection.v1/);
  assert.equal((output as { reduceAction: string }).reduceAction, '다음 달에는 재진입 전 대기 시간을 한 번 정해보세요.');
});
