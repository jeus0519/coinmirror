import assert from 'node:assert/strict';
import test from 'node:test';
import { requestAiReflection } from '../src/lib/ai-reflection-client.ts';
import { type AiBehaviorCoachingSafePayload } from '../src/lib/ai-coaching.ts';

const dummyPayload: AiBehaviorCoachingSafePayload = {
  schemaVersion: 'coinmirror.aiReflection.v1',
  coachingType: 'loss_management',
  keySignals: [
    {
      metricId: 'F1',
      displayName: '손실 관리',
      scoreBand: 'caution',
      scoreBucket: '0_54',
      sampleSizeBucket: '10_49',
    },
  ],
  requestedOutput: ['observedPattern', 'reduceAction', 'reinforceAction', 'nextQuestion'],
};

const dummyOutput = {
  observedPattern: '이번 기록에서는 손실 확정 뒤 다시 진입한 흐름이 먼저 보였어요.',
  reduceAction: '다음 달에는 재진입 전 대기 시간을 한 번 정해보세요.',
  reinforceAction: '늦은 시간대 거래를 줄인 흐름은 유지해볼 만해요.',
  nextQuestion: '다음 달에는 같은 상황에서 기다린 시간이 늘었을까요?',
};

test('requestAiReflection should succeed and return output when everything is valid', async () => {
  const mockFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        ok: true,
        source: 'ai',
        output: dummyOutput,
      }),
    } as Response;
  };

  const result = await requestAiReflection(dummyPayload, { fetchFn: mockFetch, timeoutMs: 1000 });
  assert.equal(result.success, true);
  if (result.success) {
    assert.deepEqual(result.output, dummyOutput);
  }
});

test('requestAiReflection should fail with fallback when source is fallback', async () => {
  const mockFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        ok: true,
        source: 'fallback',
        output: dummyOutput,
      }),
    } as Response;
  };

  const result = await requestAiReflection(dummyPayload, { fetchFn: mockFetch, timeoutMs: 1000 });
  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.errorType, 'fallback');
  }
});

test('requestAiReflection should fail with status when response.ok is false', async () => {
  const mockFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    return {
      ok: false,
      status: 500,
      json: async () => ({
        ok: false,
        error: 'internal_error',
      }),
    } as Response;
  };

  const result = await requestAiReflection(dummyPayload, { fetchFn: mockFetch, timeoutMs: 1000 });
  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.errorType, 'status');
  }
});

test('requestAiReflection should fail with malformed when JSON is invalid or missing ok/output', async () => {
  const mockFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        ok: false,
      }),
    } as Response;
  };

  const result = await requestAiReflection(dummyPayload, { fetchFn: mockFetch, timeoutMs: 1000 });
  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.errorType, 'malformed');
  }
});

test('requestAiReflection should fail with validation_failed when output validation fails', async () => {
  const mockFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        ok: true,
        source: 'ai',
        output: {
          ...dummyOutput,
          observedPattern: '너무 짧음', // validateAiReflectionOutput limits minimum 8 characters
        },
      }),
    } as Response;
  };

  const result = await requestAiReflection(dummyPayload, { fetchFn: mockFetch, timeoutMs: 1000 });
  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.errorType, 'validation_failed');
  }
});

test('requestAiReflection should fail with timeout when it times out', async () => {
  const mockFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    return new Promise<Response>((resolve, reject) => {
      const signal = init?.signal;
      if (signal?.aborted) {
        reject(new DOMException('The user aborted a request.', 'AbortError'));
        return;
      }
      signal?.addEventListener('abort', () => {
        reject(new DOMException('The user aborted a request.', 'AbortError'));
      });
      // Do not resolve/reject automatically to trigger timeout
    });
  };

  const result = await requestAiReflection(dummyPayload, { fetchFn: mockFetch, timeoutMs: 10 });
  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.errorType, 'timeout');
  }
});

test('requestAiReflection should fail with network when fetch throws generic error', async () => {
  const mockFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    throw new Error('TypeError: Failed to fetch');
  };

  const result = await requestAiReflection(dummyPayload, { fetchFn: mockFetch, timeoutMs: 1000 });
  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.errorType, 'network');
  }
});
